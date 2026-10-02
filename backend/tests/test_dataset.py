"""
Unit Tests for GESTURA Dataset Pipeline
Tests validation rules, CRUD operations, deduplication, stats calculation, and export.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.services.dataset_service import dataset_service


def generate_mock_landmarks(offset: float = 0.0):
    return [{"x": round(0.1 * (i % 5) + offset, 4), "y": round(0.1 * (i // 5) + offset, 4), "z": 0.0} for i in range(21)]


@pytest.fixture(autouse=True)
def clean_test_dataset():
    # Clean database before tests
    with dataset_service._get_connection() as conn:
        conn.execute("DELETE FROM samples")
        conn.commit()
    dataset_service._rewrite_jsonl()
    yield
    with dataset_service._get_connection() as conn:
        conn.execute("DELETE FROM samples")
        conn.commit()
    dataset_service._rewrite_jsonl()


@pytest.mark.asyncio
async def test_create_valid_sample():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "label": "A",
            "hand": "right",
            "landmarks": generate_mock_landmarks(),
            "handedness_score": 0.98,
            "source": "collected",
            "session_id": "test_session_1",
        }
        response = await ac.post("/api/dataset/samples", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["label"] == "A"
        assert data["hand"] == "right"
        assert len(data["landmarks"]) == 21
        assert "id" in data
        assert "created_at" in data


@pytest.mark.asyncio
async def test_create_invalid_sample_landmarks_count():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Only 20 landmarks instead of 21
        payload = {
            "label": "A",
            "hand": "right",
            "landmarks": generate_mock_landmarks()[:20],
            "handedness_score": 0.98,
            "source": "collected",
            "session_id": "test_session_1",
        }
        response = await ac.post("/api/dataset/samples", json=payload)
        assert response.status_code == 422  # Unprocessable Entity from Pydantic


@pytest.mark.asyncio
async def test_batch_create_and_stats():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create 5 samples for A and 2 samples for B
        samples_a = [
            {
                "label": "A",
                "hand": "right",
                "landmarks": generate_mock_landmarks(offset=i * 0.01),
                "handedness_score": 0.95,
                "session_id": "sess_a",
            }
            for i in range(5)
        ]
        samples_b = [
            {
                "label": "B",
                "hand": "left",
                "landmarks": generate_mock_landmarks(offset=i * 0.01),
                "handedness_score": 0.92,
                "session_id": "sess_b",
            }
            for i in range(2)
        ]

        batch_payload = {"samples": samples_a + samples_b}
        batch_res = await ac.post("/api/dataset/samples/batch", json=batch_payload)
        assert batch_res.status_code == 201
        assert len(batch_res.json()) == 7

        # Check stats endpoint
        stats_res = await ac.get("/api/dataset/stats")
        assert stats_res.status_code == 200
        stats = stats_res.json()
        assert stats["total_samples"] == 7
        assert stats["class_counts"]["A"] == 5
        assert stats["class_counts"]["B"] == 2
        assert stats["hand_counts"]["right"] == 5
        assert stats["hand_counts"]["left"] == 2
        assert stats["session_count"] == 2


@pytest.mark.asyncio
async def test_filter_and_delete_sample():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create sample
        res = await ac.post(
            "/api/dataset/samples",
            json={
                "label": "HELLO",
                "hand": "right",
                "landmarks": generate_mock_landmarks(),
                "handedness_score": 0.99,
                "session_id": "sess_hello",
            },
        )
        sample_id = res.json()["id"]

        # Filter by label
        list_res = await ac.get("/api/dataset/samples?label=HELLO")
        assert list_res.status_code == 200
        assert list_res.json()["total"] == 1

        # Delete single sample
        del_res = await ac.delete(f"/api/dataset/samples/{sample_id}")
        assert del_res.status_code == 200
        assert del_res.json()["success"] is True

        # Verify list is empty
        list_res2 = await ac.get("/api/dataset/samples?label=HELLO")
        assert list_res2.json()["total"] == 0


@pytest.mark.asyncio
async def test_export_json_and_csv():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Add sample
        await ac.post(
            "/api/dataset/samples",
            json={
                "label": "C",
                "hand": "right",
                "landmarks": generate_mock_landmarks(),
                "handedness_score": 0.97,
                "session_id": "sess_export",
            },
        )

        # Export JSON
        export_json = await ac.get("/api/dataset/export?format=json")
        assert export_json.status_code == 200
        assert "application/json" in export_json.headers["content-type"]
        assert len(export_json.json()) == 1
        assert export_json.json()[0]["label"] == "C"

        # Export CSV
        export_csv = await ac.get("/api/dataset/export?format=csv")
        assert export_csv.status_code == 200
        assert "text/csv" in export_csv.headers["content-type"]
        lines = export_csv.text.strip().split("\n")
        assert len(lines) == 2  # Header + 1 row
        assert "x_0,y_0,z_0" in lines[0]
        assert "C" in lines[1]
