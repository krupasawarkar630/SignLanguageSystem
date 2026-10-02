"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Alert,
} from "@/components/ui";
import { Activity, Brain, ShieldAlert, Cpu } from "lucide-react";

interface Metadata {
  version: string;
  created_at: string;
  selected_model: string;
  feature_dimensions: number;
  classes: string[];
  total_samples: number;
  split_counts: {
    train: number;
    validation: number;
    test: number;
  };
  unknown_threshold: {
    optimal_threshold: number;
  };
  dataset_hash: string;
}

interface Metrics {
  model_name: string;
  test_metrics: {
    accuracy: number;
    macro_f1: number;
    macro_precision: number;
    macro_recall: number;
  };
  validation_metrics: {
    accuracy: number;
  };
  latency_benchmark: {
    median_ms: number;
  };
  model_size_bytes: number;
}

interface ConfusionMatrix {
  labels: string[];
  matrix: number[][];
}

export default function ModelPage() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [confusion, setConfusion] = useState<ConfusionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [metaRes, metricsRes, confRes] = await Promise.all([
          fetch("/models/metadata.json"),
          fetch("/models/metrics.json"),
          fetch("/models/confusion_matrix.json")
        ]);

        if (!metaRes.ok || !metricsRes.ok || !confRes.ok) {
          throw new Error("Failed to load model artifacts. Ensure a model is trained.");
        }

        const meta = await metaRes.json();
        const mets = await metricsRes.json();
        const conf = await confRes.json();

        setMetadata(meta);
        setMetrics(mets);
        setConfusion(conf);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-ink-muted">Loading model artifacts...</div>;
  }

  if (error || !metadata || !metrics || !confusion) {
    return (
      <div className="p-8">
        <Alert variant="danger" title="Model Unavailable">
          {error || "Metrics missing. Please train a model in Phase 5."}
        </Alert>
      </div>
    );
  }

  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;
  const formatBytes = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-gestura-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              PHASE 11
            </Badge>
            <span className="text-xs font-mono font-bold text-ink-muted">
              MODEL TRANSPARENCY
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-ink font-display">
            Model Metrics & Evaluation
          </h1>
        </div>
      </div>

      {/* Honest Caveats */}
      <Alert variant="warning" title="HONEST CAVEATS (TEST SET UNCERTAINTY & SIGNER-INDEPENDENT EVALUATION)">
        This model was evaluated using a strict <strong>Signer-Independent Split</strong>. This means no user in the training set appears in the test set. 
        If the metrics seem low, it is because random-frame splits artificially inflate accuracy to ~99% due to data leakage.
        <br /><br />
        This is an extremely small test set ({metadata.split_counts.test} samples total). 
        The metrics below are computed directly from this set, but you should expect wide variance and single-user bias. 
        More robust data collection is required for production reliability.
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="white" shadowSize="sm">
          <CardContent className="p-4">
            <span className="text-[10px] text-ink-muted uppercase block font-bold mb-1">
              TEST ACCURACY (n={metadata.split_counts.test})
            </span>
            <span className="text-3xl font-black text-primary">
              {formatPercent(metrics.test_metrics.accuracy)}
            </span>
          </CardContent>
        </Card>
        
        <Card variant="white" shadowSize="sm">
          <CardContent className="p-4">
            <span className="text-[10px] text-ink-muted uppercase block font-bold mb-1">
              MACRO F1 SCORE
            </span>
            <span className="text-3xl font-black text-ink">
              {formatPercent(metrics.test_metrics.macro_f1)}
            </span>
          </CardContent>
        </Card>

        <Card variant="white" shadowSize="sm">
          <CardContent className="p-4">
            <span className="text-[10px] text-ink-muted uppercase block font-bold mb-1">
              MODEL SIZE
            </span>
            <span className="text-3xl font-black text-ink">
              {formatBytes(metrics.model_size_bytes)}
            </span>
          </CardContent>
        </Card>

        <Card variant="white" shadowSize="sm">
          <CardContent className="p-4">
            <span className="text-[10px] text-ink-muted uppercase block font-bold mb-1">
              OFFLINE LATENCY
            </span>
            <span className="text-3xl font-black text-ink">
              {metrics.latency_benchmark.median_ms.toFixed(1)} ms
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Overview */}
        <div className="lg:col-span-1 space-y-6">
          <Card variant="white" shadowSize="md">
            <CardHeader>
              <CardTitle>Architecture Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-mono text-sm">
              <div className="flex justify-between border-b border-gestura-border pb-2">
                <span className="text-ink-muted">Algorithm</span>
                <span className="font-bold text-ink">{metadata.selected_model} {(metadata as any).is_temporal ? "(Sequence)" : "(Static)"}</span>
              </div>
              <div className="flex justify-between border-b border-gestura-border pb-2">
                <span className="text-ink-muted">Input Shape</span>
                <span className="font-bold text-ink">
                  {(metadata as any).is_temporal 
                    ? `[${(metadata as any).sequence_length} frames × ${metadata.feature_dimensions}D]` 
                    : `${metadata.feature_dimensions}D Array`
                  }
                </span>
              </div>
              <div className="flex justify-between border-b border-gestura-border pb-2">
                <span className="text-ink-muted">Classes Supported</span>
                <span className="font-bold text-ink">{metadata.classes.length}</span>
              </div>
              <div className="flex justify-between border-b border-gestura-border pb-2">
                <span className="text-ink-muted">UNKNOWN Threshold</span>
                <span className="font-bold text-ink">{formatPercent(metadata.unknown_threshold.optimal_threshold)}</span>
              </div>
              <div className="flex justify-between border-b border-gestura-border pb-2">
                <span className="text-ink-muted">Trained At</span>
                <span className="font-bold text-ink">{new Date(metadata.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-ink-muted">Dataset Hash</span>
                <span className="font-bold text-ink text-xs truncate max-w-[120px]" title={metadata.dataset_hash}>
                  {metadata.dataset_hash}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card variant="white" shadowSize="md">
            <CardHeader>
              <CardTitle>Dataset Splits</CardTitle>
              <CardDescription>Total samples: {metadata.total_samples}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Train</span>
                    <span>{metadata.split_counts.train} samples</span>
                  </div>
                  <div className="h-2 bg-gestura-bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(metadata.split_counts.train / metadata.total_samples) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Validation</span>
                    <span>{metadata.split_counts.validation} samples</span>
                  </div>
                  <div className="h-2 bg-gestura-bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${(metadata.split_counts.validation / metadata.total_samples) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Test</span>
                    <span>{metadata.split_counts.test} samples</span>
                  </div>
                  <div className="h-2 bg-gestura-bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-danger" style={{ width: `${(metadata.split_counts.test / metadata.total_samples) * 100}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Confusion Matrix & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="white" shadowSize="md">
            <CardHeader>
              <CardTitle>Test Set Confusion Matrix</CardTitle>
              <CardDescription>
                True labels (rows) vs Predicted labels (columns) on {metadata.split_counts.test} test samples.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto pb-4">
                <table className="w-full font-mono text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 border border-gestura-border bg-gestura-bg-secondary text-ink-muted text-xs">True \ Pred</th>
                      {confusion.labels.map(label => (
                        <th key={label} className="p-2 border border-gestura-border bg-gestura-bg-secondary font-bold text-ink text-center">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {confusion.labels.map((trueLabel, rowIndex) => {
                      // calculate row total for heat mapping
                      const rowTotal = confusion.matrix[rowIndex].reduce((a, b) => a + b, 0);
                      
                      return (
                        <tr key={trueLabel}>
                          <th className="p-2 border border-gestura-border bg-gestura-bg-secondary font-bold text-ink text-left">
                            {trueLabel} <span className="text-ink-muted text-xs font-normal">({rowTotal})</span>
                          </th>
                          {confusion.matrix[rowIndex].map((count, colIndex) => {
                            const isCorrect = rowIndex === colIndex;
                            const intensity = rowTotal > 0 ? (count / rowTotal) : 0;
                            // Heatmap color logic
                            const bgColor = isCorrect 
                              ? `rgba(34, 197, 94, ${intensity * 0.8})` // Greenish for correct
                              : `rgba(239, 68, 68, ${intensity * 0.8})`; // Reddish for mistakes

                            return (
                              <td 
                                key={colIndex} 
                                className="p-3 border border-gestura-border text-center font-bold relative group cursor-default transition-colors"
                                style={{ backgroundColor: count > 0 ? bgColor : undefined }}
                                title={`True: ${trueLabel}\nPredicted: ${confusion.labels[colIndex]}\nCount: ${count}`}
                              >
                                {count > 0 ? count : "-"}
                                {count > 0 && !isCorrect && (
                                  <div className="absolute inset-0 border-2 border-danger/50 pointer-events-none" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-4 text-xs font-bold text-ink-muted">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500/50 rounded-sm" /> Correct Predictions
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500/50 rounded-sm" /> Mistakes
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
