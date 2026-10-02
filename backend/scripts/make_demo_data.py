import json
import os
import random
from pathlib import Path

def generate_demo_data():
    project_root = Path(__file__).resolve().parent.parent.parent
    dataset_path = project_root / "backend" / "data" / "dataset.json"
    demo_output = project_root / "frontend" / "public" / "data" / "demo_sequences.json"
    
    if not dataset_path.exists():
        print(f"Dataset not found at {dataset_path}. Using fallback mock data.")
        # Fallback to empty mock structure if dataset missing
        demo_output.parent.mkdir(parents=True, exist_ok=True)
        demo_output.write_text(json.dumps({
            "A": [], "B": []
        }))
        return

    with open(dataset_path, "r") as f:
        data = json.load(f)

    # Group by label
    grouped = {}
    for sample in data.get("samples", []):
        label = sample["label"]
        if label not in grouped:
            grouped[label] = []
        grouped[label].append(sample["landmarks"])

    # Pick 10 random samples per class to form a "sequence"
    demo_sequences = {}
    for label, landmarks_list in grouped.items():
        if len(landmarks_list) >= 10:
            demo_sequences[label] = random.sample(landmarks_list, 10)
        else:
            demo_sequences[label] = landmarks_list

    demo_output.parent.mkdir(parents=True, exist_ok=True)
    with open(demo_output, "w") as f:
        json.dump(demo_sequences, f)
    
    print(f"Demo data successfully generated at {demo_output}")

if __name__ == "__main__":
    generate_demo_data()
