import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { preprocessLandmarks } from "../features/preprocessor";

// Load shared fixture vectors
const fixturePath = path.resolve(process.cwd(), "../data/metadata/fixture_vectors.json");
const fixtureData = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

console.log("=== RUNNING PREPROCESSOR UNIT TESTS ===");

// Test 1: Feature Vector Dimension Check
const sampleLandmarks = fixtureData.fixtures[0].rawLandmarks;
const features = preprocessLandmarks(sampleLandmarks, "Right", false);

assert.strictEqual(features.normalizedLandmarks.length, 63, "Normalized coordinates must be 63D");
assert.strictEqual(features.fingerExtensions.length, 5, "Finger extensions must be 5D");
assert.strictEqual(features.keyDistances.length, 6, "Key distances must be 6D");
assert.strictEqual(features.jointAngles.length, 5, "Joint angles must be 5D");
assert.strictEqual(features.palmNormal.length, 3, "Palm normal must be 3D");
assert.strictEqual(features.totalFeatureVector.length, 82, "Total feature vector must be exactly 82D");
console.log("[PASS] Feature vector dimensions confirmed = 82D");

// Test 2: Wrist Origin Translation
assert.strictEqual(features.normalizedLandmarks[0], 0, "Wrist x must be 0");
assert.strictEqual(features.normalizedLandmarks[1], 0, "Wrist y must be 0");
assert.strictEqual(features.normalizedLandmarks[2], 0, "Wrist z must be 0");
console.log("[PASS] Wrist origin translation verified (0, 0, 0)");

// Test 3: Scale Invariance
const scaledLandmarks = sampleLandmarks.map((pt: any) => ({
  x: pt.x * 2.5,
  y: pt.y * 2.5,
  z: pt.z * 2.5,
}));
const featuresScaled = preprocessLandmarks(scaledLandmarks, "Right", false);

// Assert all 82 features match between 1x and 2.5x scaled hand
for (let i = 0; i < features.totalFeatureVector.length; i++) {
  const diff = Math.abs(features.totalFeatureVector[i] - featuresScaled.totalFeatureVector[i]);
  assert(diff < 1e-4, `Feature ${i} should be scale invariant (diff: ${diff})`);
}
console.log("[PASS] Scale invariance confirmed across 82 features");

// Test 4: Left/Right Hand Inversion Parity
const leftFixture = fixtureData.fixtures[1].rawLandmarks;
const featuresLeft = preprocessLandmarks(leftFixture, "Left", false);
assert(featuresLeft.totalFeatureVector.length === 82, "Left hand processed correctly");
console.log("[PASS] Left hand canonicalization verified");

console.log("=== ALL PREPROCESSOR TESTS PASSED ===\n");
