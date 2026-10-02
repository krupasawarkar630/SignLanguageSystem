import os
import cv2
import json
import glob
import numpy as np
import mediapipe as mp
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

mp_holistic = mp.solutions.holistic

def process_video(video_path, output_dir, label, signer_id, source_dataset):
    vid_path = Path(video_path)
    output_path = Path(output_dir) / f"{label}_{signer_id}_{vid_path.stem}.npz"
    
    if output_path.exists():
        return {"status": "skipped", "path": str(vid_path)}

    cap = cv2.VideoCapture(str(vid_path))
    if not cap.isOpened():
        return {"status": "error", "path": str(vid_path), "error": "Could not open video"}
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    frames_data = []
    masks = []
    
    with mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        enable_segmentation=False,
        refine_face_landmarks=False
    ) as holistic:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = holistic.process(frame_rgb)
            
            # Extract Pose (Upper body only ideally, but we'll take all 33 pose landmarks for now)
            pose = np.zeros((33, 3))
            if results.pose_landmarks:
                for i, lm in enumerate(results.pose_landmarks.landmark):
                    pose[i] = [lm.x, lm.y, lm.z]
                    
            # Extract Left Hand
            left_hand = np.zeros((21, 3))
            lh_mask = 1.0 # 1 means missing
            if results.left_hand_landmarks:
                lh_mask = 0.0
                for i, lm in enumerate(results.left_hand_landmarks.landmark):
                    left_hand[i] = [lm.x, lm.y, lm.z]
                    
            # Extract Right Hand
            right_hand = np.zeros((21, 3))
            rh_mask = 1.0
            if results.right_hand_landmarks:
                rh_mask = 0.0
                for i, lm in enumerate(results.right_hand_landmarks.landmark):
                    right_hand[i] = [lm.x, lm.y, lm.z]
            
            frame_features = np.concatenate([pose.flatten(), left_hand.flatten(), right_hand.flatten()])
            frames_data.append(frame_features)
            masks.append([lh_mask, rh_mask])
            
    cap.release()
    
    if len(frames_data) == 0:
        return {"status": "error", "path": str(vid_path), "error": "No frames processed"}
        
    np.savez_compressed(
        output_path,
        features=np.array(frames_data, dtype=np.float32),
        masks=np.array(masks, dtype=np.float32),
        fps=fps,
        label=label,
        signer_id=signer_id,
        source=source_dataset
    )
    
    return {"status": "success", "path": str(vid_path), "frames": len(frames_data)}

def run_pipeline(input_dir, output_dir, metadata_file, max_workers=4):
    """
    metadata_file should be a JSON listing:
    [{"video_path": "path", "label": "HELLO", "signer_id": "S1", "source": "WLASL"}, ...]
    """
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    if not os.path.exists(metadata_file):
        logging.warning(f"Metadata file {metadata_file} not found. Exiting.")
        return
        
    with open(metadata_file, "r") as f:
        videos = json.load(f)
        
    logging.info(f"Found {len(videos)} videos to process.")
    
    success = 0
    skipped = 0
    errors = []
    
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = []
        for v in videos:
            full_path = os.path.join(input_dir, v["video_path"])
            futures.append(
                executor.submit(
                    process_video, full_path, output_dir, v["label"], v["signer_id"], v["source"]
                )
            )
            
        for future in as_completed(futures):
            res = future.result()
            if res["status"] == "success":
                success += 1
            elif res["status"] == "skipped":
                skipped += 1
            else:
                errors.append(res)
                logging.error(f"Failed {res['path']}: {res['error']}")
                
    logging.info(f"Processing complete. Success: {success}, Skipped: {skipped}, Errors: {len(errors)}")
    
    report_path = Path(output_dir) / "extraction_report.json"
    with open(report_path, "w") as f:
        json.dump({"success": success, "skipped": skipped, "errors": errors}, f, indent=2)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, default="data/raw_videos")
    parser.add_argument("--output", type=str, default="data/processed_landmarks")
    parser.add_argument("--meta", type=str, default="data/video_metadata.json")
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()
    
    run_pipeline(args.input, args.output, args.meta, args.workers)
