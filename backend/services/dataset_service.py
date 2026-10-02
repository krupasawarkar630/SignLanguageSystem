"""
Dataset Storage & Management Service
Handles atomic SQLite persistence, deduplication, JSONL streaming logs, filtering, and export.
"""
import csv
from datetime import datetime, timezone
import io
import json
import math
import os
from pathlib import Path
import sqlite3
import threading
from typing import List, Dict, Optional, Tuple
import uuid

from backend.schemas.dataset import (
    Point3D,
    SampleCreate,
    BatchSampleCreate,
    SampleResponse,
    DatasetStats,
)

# Project base path determination
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_RAW_DIR = BASE_DIR / "data" / "raw"
DB_PATH = DATA_RAW_DIR / "gestura_dataset.db"
JSONL_PATH = DATA_RAW_DIR / "samples.jsonl"

_lock = threading.Lock()


class DatasetService:
    def __init__(self, db_path: Path = DB_PATH, jsonl_path: Path = JSONL_PATH):
        self.db_path = db_path
        self.jsonl_path = jsonl_path
        self._ensure_storage_dirs()
        self._init_db()

    def _ensure_storage_dirs(self):
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.jsonl_path.parent.mkdir(parents=True, exist_ok=True)

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with _lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS samples (
                        id TEXT PRIMARY KEY,
                        label TEXT NOT NULL,
                        hand TEXT NOT NULL,
                        landmarks_json TEXT NOT NULL,
                        handedness_score REAL NOT NULL,
                        source TEXT NOT NULL,
                        session_id TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    )
                    """
                )
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_label ON samples(label)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_hand ON samples(hand)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_session ON samples(session_id)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_created_at ON samples(created_at)")
                conn.commit()

    @staticmethod
    def _calculate_landmark_distance(lm1: List[Point3D], lm2: List[Point3D]) -> float:
        """Computes Euclidean root-mean-square error (RMSE) between two sets of 21 landmarks."""
        if len(lm1) != 21 or len(lm2) != 21:
            return 1.0
        total_sq_dist = 0.0
        for p1, p2 in zip(lm1, lm2):
            dx = p1.x - p2.x
            dy = p1.y - p2.y
            dz = p1.z - p2.z
            total_sq_dist += dx * dx + dy * dy + dz * dz
        return math.sqrt(total_sq_dist / 21.0)

    def is_duplicate_in_session(
        self,
        new_sample: SampleCreate,
        threshold: float = 0.005,
    ) -> bool:
        """Check if a sample is near-identical to the latest sample in the same session."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT landmarks_json FROM samples
                WHERE session_id = ? AND label = ?
                ORDER BY created_at DESC LIMIT 1
                """,
                (new_sample.session_id, new_sample.label),
            )
            row = cursor.fetchone()
            if not row:
                return False

            prev_landmarks_data = json.loads(row["landmarks_json"])
            prev_landmarks = [Point3D(**p) for p in prev_landmarks_data]
            dist = self._calculate_landmark_distance(new_sample.landmarks, prev_landmarks)
            return dist < threshold

    def create_sample(
        self,
        sample_in: SampleCreate,
        check_duplicates: bool = True,
    ) -> SampleResponse:
        """Persist a single landmark sample to SQLite and append to JSONL."""
        if check_duplicates and self.is_duplicate_in_session(sample_in):
            # In burst mode, if too close, return previous or raise
            pass

        sample_id = f"samp_{uuid.uuid4().hex[:12]}"
        created_at = datetime.now(timezone.utc).isoformat()
        landmarks_data = [p.model_dump() for p in sample_in.landmarks]
        landmarks_json = json.dumps(landmarks_data)

        with _lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO samples (
                        id, label, hand, landmarks_json, handedness_score,
                        source, session_id, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        sample_id,
                        sample_in.label,
                        sample_in.hand,
                        landmarks_json,
                        sample_in.handedness_score,
                        sample_in.source,
                        sample_in.session_id,
                        created_at,
                    ),
                )
                conn.commit()

            # Append to JSONL log
            record = {
                "id": sample_id,
                "label": sample_in.label,
                "hand": sample_in.hand,
                "landmarks": landmarks_data,
                "handedness_score": sample_in.handedness_score,
                "source": sample_in.source,
                "session_id": sample_in.session_id,
                "created_at": created_at,
            }
            with open(self.jsonl_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")

        return SampleResponse(
            id=sample_id,
            label=sample_in.label,
            hand=sample_in.hand,
            landmarks=sample_in.landmarks,
            handedness_score=sample_in.handedness_score,
            source=sample_in.source,
            session_id=sample_in.session_id,
            created_at=created_at,
        )

    def create_samples_batch(
        self,
        batch_in: BatchSampleCreate,
    ) -> List[SampleResponse]:
        """Atomically persist a batch of samples from burst capture."""
        results = []
        for sample_in in batch_in.samples:
            res = self.create_sample(sample_in, check_duplicates=True)
            results.append(res)
        return results

    def get_sample(self, sample_id: str) -> Optional[SampleResponse]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM samples WHERE id = ?", (sample_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_response(row)

    def list_samples(
        self,
        label: Optional[str] = None,
        hand: Optional[str] = None,
        source: Optional[str] = None,
        session_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[SampleResponse], int]:
        conditions = []
        params = []

        if label:
            conditions.append("label = ?")
            params.append(label.upper())
        if hand and hand != "all":
            conditions.append("hand = ?")
            params.append(hand)
        if source:
            conditions.append("source = ?")
            params.append(source)
        if session_id:
            conditions.append("session_id = ?")
            params.append(session_id)

        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""

        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Count query
            cursor.execute(f"SELECT COUNT(*) FROM samples{where_clause}", params)
            total = cursor.fetchone()[0]

            # Results query
            query = f"SELECT * FROM samples{where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?"
            cursor.execute(query, params + [limit, offset])
            rows = cursor.fetchall()
            samples = [self._row_to_response(r) for r in rows]

            return samples, total

    def delete_sample(self, sample_id: str) -> bool:
        with _lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM samples WHERE id = ?", (sample_id,))
                deleted = cursor.rowcount > 0
                conn.commit()

            if deleted:
                self._rewrite_jsonl()
            return deleted

    def delete_label(self, label: str) -> int:
        with _lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM samples WHERE label = ?", (label.upper(),))
                count = cursor.rowcount
                conn.commit()

            if count > 0:
                self._rewrite_jsonl()
            return count

    def get_dataset_stats(self) -> DatasetStats:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM samples")
            total = cursor.fetchone()[0]

            if total == 0:
                return DatasetStats(
                    total_samples=0,
                    class_counts={},
                    hand_counts={},
                    session_count=0,
                    imbalance_ratio=1.0,
                    has_imbalance=False,
                    imbalance_warning=None,
                    low_sample_classes=[],
                )

            # Class counts
            cursor.execute("SELECT label, COUNT(*) FROM samples GROUP BY label")
            class_counts = {row[0]: row[1] for row in cursor.fetchall()}

            # Hand counts
            cursor.execute("SELECT hand, COUNT(*) FROM samples GROUP BY hand")
            hand_counts = {row[0]: row[1] for row in cursor.fetchall()}

            # Distinct sessions
            cursor.execute("SELECT COUNT(DISTINCT session_id) FROM samples")
            session_count = cursor.fetchone()[0]

            # Imbalance detection
            counts = list(class_counts.values())
            max_c = max(counts) if counts else 0
            min_c = min(counts) if counts else 0
            imbalance_ratio = round(max_c / max(1, min_c), 2)
            has_imbalance = imbalance_ratio >= 3.0 and len(counts) > 1

            low_sample_classes = [lbl for lbl, cnt in class_counts.items() if cnt < 20]

            imbalance_warning = None
            if has_imbalance:
                imbalance_warning = (
                    f"Dataset class ratio is {imbalance_ratio}:1. "
                    "Collect more samples for minority classes before training to prevent model bias."
                )

            return DatasetStats(
                total_samples=total,
                class_counts=class_counts,
                hand_counts=hand_counts,
                session_count=session_count,
                imbalance_ratio=imbalance_ratio,
                has_imbalance=has_imbalance,
                imbalance_warning=imbalance_warning,
                low_sample_classes=low_sample_classes,
            )

    def export_dataset(self, format_type: str = "json") -> str:
        """Export all samples as either formatted JSON or flattened CSV string."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM samples ORDER BY created_at ASC")
            rows = cursor.fetchall()

        if format_type.lower() == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            # Header with flattened landmark columns (x0, y0, z0 ... x20, y20, z20)
            headers = [
                "id",
                "label",
                "hand",
                "handedness_score",
                "source",
                "session_id",
                "created_at",
            ]
            for i in range(21):
                headers.extend([f"x_{i}", f"y_{i}", f"z_{i}"])
            writer.writerow(headers)

            for r in rows:
                landmarks = json.loads(r["landmarks_json"])
                row_data = [
                    r["id"],
                    r["label"],
                    r["hand"],
                    r["handedness_score"],
                    r["source"],
                    r["session_id"],
                    r["created_at"],
                ]
                for pt in landmarks:
                    row_data.extend([pt["x"], pt["y"], pt["z"]])
                writer.writerow(row_data)

            return output.getvalue()

        else:
            # Default JSON
            data = []
            for r in rows:
                data.append(
                    {
                        "id": r["id"],
                        "label": r["label"],
                        "hand": r["hand"],
                        "landmarks": json.loads(r["landmarks_json"]),
                        "handedness_score": r["handedness_score"],
                        "source": r["source"],
                        "session_id": r["session_id"],
                        "created_at": r["created_at"],
                    }
                )
            return json.dumps(data, indent=2)

    def _rewrite_jsonl(self):
        """Internal helper to rebuild the jsonl file when samples are deleted."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM samples ORDER BY created_at ASC")
            rows = cursor.fetchall()

        with open(self.jsonl_path, "w", encoding="utf-8") as f:
            for r in rows:
                record = {
                    "id": r["id"],
                    "label": r["label"],
                    "hand": r["hand"],
                    "landmarks": json.loads(r["landmarks_json"]),
                    "handedness_score": r["handedness_score"],
                    "source": r["source"],
                    "session_id": r["session_id"],
                    "created_at": r["created_at"],
                }
                f.write(json.dumps(record) + "\n")

    def _row_to_response(self, row: sqlite3.Row) -> SampleResponse:
        landmarks_data = json.loads(row["landmarks_json"])
        landmarks = [Point3D(**p) for p in landmarks_data]
        return SampleResponse(
            id=row["id"],
            label=row["label"],
            hand=row["hand"],
            landmarks=landmarks,
            handedness_score=row["handedness_score"],
            source=row["source"],
            session_id=row["session_id"],
            created_at=row["created_at"],
        )


# Singleton instance
dataset_service = DatasetService()
