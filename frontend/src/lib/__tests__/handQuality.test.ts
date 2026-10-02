import assert from "node:assert";
import { evaluateHandQuality, computeBoundingBox, computeVelocity } from "../quality/handQuality";
import { HandLandmarks } from "@/types/hand";

console.log("=== RUNNING HAND QUALITY MODULE UNIT TESTS ===");

// Test 1: Null/Empty Landmarks Detection
const emptyResult = evaluateHandQuality(null, 1000);
assert.strictEqual(emptyResult.handVisible, false, "Empty hand should not be visible");
assert.strictEqual(emptyResult.message, "No hand detected");
assert.strictEqual(emptyResult.isValid, false);
console.log("[PASS] Empty landmarks returns 'No hand detected'");

// Test 2: Standard Valid Hand Pose
const validHand: HandLandmarks = Array.from({ length: 21 }, (_, i) => ({
  x: 0.3 + (i % 5) * 0.08,
  y: 0.3 + Math.floor(i / 5) * 0.08,
  z: 0.0,
}));
const validResult = evaluateHandQuality(validHand, 1000);
assert.strictEqual(validResult.handVisible, true);
assert.strictEqual(validResult.isTooSmall, false);
assert.strictEqual(validResult.isPartiallyOutside, false);
assert.strictEqual(validResult.isFastMotion, false);
assert.strictEqual(validResult.isValid, true);
assert.strictEqual(validResult.message, "Hand pose clear & ready");
console.log("[PASS] Valid hand detected as clear & ready");

// Test 3: Hand Too Small (Far away)
const tinyHand: HandLandmarks = Array.from({ length: 21 }, (_, i) => ({
  x: 0.50 + (i % 5) * 0.01,
  y: 0.50 + Math.floor(i / 5) * 0.01,
  z: 0.0,
}));
const smallResult = evaluateHandQuality(tinyHand, 1000);
assert.strictEqual(smallResult.isTooSmall, true);
assert.strictEqual(smallResult.message, "Move closer");
assert.strictEqual(smallResult.isValid, false);
console.log("[PASS] Small bounding box returns 'Move closer'");

// Test 4: Partially Outside Frame (Clipping edge)
const clippedHand: HandLandmarks = Array.from({ length: 21 }, (_, i) => ({
  x: i === 4 ? 0.99 : 0.4 + (i % 5) * 0.05,
  y: 0.4 + Math.floor(i / 5) * 0.05,
  z: 0.0,
}));
const clippedResult = evaluateHandQuality(clippedHand, 1000);
assert.strictEqual(clippedResult.isPartiallyOutside, true);
assert.strictEqual(clippedResult.message, "Move your hand into the frame");
assert.strictEqual(clippedResult.isValid, false);
console.log("[PASS] Clipped landmarks returns 'Move your hand into the frame'");

// Test 5: Fast Motion Detection
const prevFrame = {
  landmarks: validHand,
  timestamp: 1000,
};
const movedHand: HandLandmarks = validHand.map((pt) => ({
  x: pt.x + 0.25, // Rapid shift in 50ms
  y: pt.y + 0.25,
  z: pt.z,
}));
const motionResult = evaluateHandQuality(movedHand, 1050, prevFrame);
assert.strictEqual(motionResult.isFastMotion, true);
assert.strictEqual(motionResult.message, "Hold your hand steadier");
assert.strictEqual(motionResult.isValid, false);
console.log("[PASS] Rapid displacement returns 'Hold your hand steadier'");

console.log("=== ALL HAND QUALITY TESTS PASSED ===\n");
