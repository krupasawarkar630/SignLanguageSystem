"""
GESTURA ML Training CLI
Command-line interface for reproducible ML model training, benchmarking, and export.

Usage:
    python scripts/train.py --data-dir data --output-dir models --seed 42 --models all
"""
import argparse
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.trainer import train_and_evaluate_models


def parse_args():
    parser = argparse.ArgumentParser(
        description="GESTURA Machine Learning Training & ONNX Export Pipeline",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=PROJECT_ROOT / "data",
        help="Directory containing raw or split dataset files (JSONL)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=PROJECT_ROOT / "models",
        help="Directory where trained artifacts (pkl, onnx, json) are saved",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for deterministic reproducibility",
    )
    parser.add_argument(
        "--models",
        type=str,
        default="all",
        help="Comma-separated list of models to train (RandomForest,SVM,KNN,MLP,all)",
    )
    parser.add_argument(
        "--min-samples-per-class",
        type=int,
        default=5,
        help="Minimum required samples per gesture class before training is permitted",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    models_list = [m.strip() for m in args.models.split(",") if m.strip()]

    print("=" * 72)
    print(" GESTURA ML TRAINING & EVALUATION PIPELINE ")
    print("=" * 72)
    print(f" Dataset Directory       : {args.data_dir}")
    print(f" Output Directory        : {args.output_dir}")
    print(f" Random Seed             : {args.seed}")
    print(f" Candidate Models        : {', '.join(models_list)}")
    print(f" Min Samples Per Class   : {args.min_samples_per_class}")
    print("-" * 72)

    try:
        results = train_and_evaluate_models(
            data_dir=args.data_dir,
            output_dir=args.output_dir,
            models_to_train=models_list,
            seed=args.seed,
            min_samples_per_class=args.min_samples_per_class,
        )

        best_model = results["best_model"]
        metrics = results["metrics"]
        metadata = results["metadata"]

        print("\n" + "=" * 72)
        print(" TRAINING & EVALUATION SUMMARY ")
        print("=" * 72)
        print(f" Best Selected Model     : {best_model}")
        print(f" Test Set Accuracy       : {metrics['test_metrics']['accuracy'] * 100:.2f}%")
        print(f" Test Set Macro F1       : {metrics['test_metrics']['macro_f1']:.4f}")
        print(f" Median Inference Latency: {metrics['latency_benchmark']['median_ms']:.3f} ms")
        print(f" Model Binary Size       : {metrics['model_size_bytes'] / 1024:.1f} KB")
        print(f" Unknown Reject Threshold: {metadata['unknown_threshold']['optimal_threshold']}")
        print(f" ONNX Parity Status      : {metadata['onnx_parity_verification']['status']} (Diff: {metadata['onnx_parity_verification']['max_prob_difference']})")
        print("=" * 72)
        print(f"[SUCCESS] All 8 artifacts successfully written to '{args.output_dir}/'")
        sys.exit(0)

    except ValueError as ve:
        print("\n[GUARD RAIL ERROR - TRAINING ABORTED]")
        print("-" * 72)
        print(f"{str(ve)}")
        print("-" * 72)
        print("Tip: Collect samples using the GESTURA Studio at http://localhost:3001/dataset.")
        print("We recommend capturing 50-100+ high-quality samples per gesture across multiple sessions.\n")
        sys.exit(1)

    except Exception as e:
        print(f"\n[FATAL ERROR] ML training failed unexpectedly: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(2)


if __name__ == "__main__":
    main()
