# Gestura Dataset Collection Guide

Machine learning models are only as good as the data they are trained on. The current bundled model was trained on a highly biased, microscopic dataset of ~20 samples, causing it to overfit heavily to a single user and environment.

To make Gestura robust for production, follow this guide when capturing new custom datasets via the **Phase 10: Teach Gestura** wizard.

## 1. Environmental Variance (The Most Important Factor)
Your model must learn the *shape of the hand*, not the background of your room.
- **Lighting:** Record samples in direct sunlight, harsh overhead office lighting, dim shadows, and strong backlighting (standing in front of a window).
- **Backgrounds:** Record samples against clean walls, cluttered rooms, and while wearing differently colored long-sleeve shirts.
- **Distance:** Record samples very close to the lens (hand taking up 50% of the frame) and far away (hand taking up 10% of the frame). Our `preprocessor.ts` handles geometric scaling, but MediaPipe's raw accuracy fluctuates with distance.

## 2. Anatomical Variance
A model trained only on your hands will perform poorly for others.
- **Multiple Users:** Ideally, source dataset recordings from at least 3-5 different people with varying skin tones, hand sizes, and finger proportions.
- **Left vs Right:** Gestura normalizes left and right hands, but capturing data using both hands provides healthier noise for the Random Forest to learn from.

## 3. Pose Perturbation (Noise Injection)
Do not hold your hand completely rigid like a statue while recording a 50-frame burst.
- **Wiggle:** Slightly shift your wrist angle up, down, left, and right (± 15 degrees).
- **Rotation:** Slightly rotate your palm toward and away from the camera.
- **Natural Variance:** Slightly bend your fingers the way you naturally would when signing tired versus energetic.

## 4. Minimum Sample Counts
- **Bare Minimum:** 150 frames per gesture class (spread across 3 environments).
- **Robust:** 1,000+ frames per gesture class (spread across 5+ people and varying environments).
- **Balance:** Try to keep the number of samples roughly equal across all classes to prevent the model from defaulting to the most common class.

## 5. Capturing the "UNKNOWN" Class (Negative Samples)
If your model only knows "A", "B", and "C", it will aggressively force any random hand movement into one of those three buckets. 
- You must collect a robust "UNKNOWN" or "GARBAGE" dataset containing random hand shapes, scratching your nose, adjusting your glasses, etc., and map them to a null class, OR rely heavily on the probability thresholding rejection documented in `PERFORMANCE.md`.
