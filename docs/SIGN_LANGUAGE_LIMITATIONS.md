# Sign Language Limitations & Community Validation

Gestura is a technological proof-of-concept for real-time edge AI inference, NOT a comprehensive communication tool.

## 1. Technological Limitations
- **Isolated Signs Only:** This application only recognizes individual, isolated ASL word signs and fingerspelling. It does NOT understand or translate continuous sign language.
- **No Syntax or Grammar:** Sign language has its own complex spatial grammar and syntax that is entirely different from English. Gestura does not understand this grammar; it merely strings recognized glosses together.
- **No Non-Manual Markers:** Facial expressions, head tilts, and shoulder movements are critical linguistic features in ASL. Gestura's models currently ignore facial features entirely.
- **Regional Variants:** Signs vary heavily by region and dialect. A small dataset cannot capture this variance.
- **Lighting & Anatomy:** The underlying MediaPipe tracking degrades in poor lighting or high backlight, and may struggle with varying skin tones or hand anatomies not represented in the training data.

## 2. Deaf Community Validation
Before deploying or claiming success for any assistive technology, **it must be validated by and designed with the Deaf community.** Technology built "for" a community without their active participation often solves the wrong problems or creates new ones. We strongly recommend partnering with native ASL signers to evaluate the real-world utility of any translation application.

## 3. Dataset Attribution
The models powering Gestura are dependent on open-source datasets. 
*If you use WLASL or MSASL via our pipeline scripts, you must adhere to their specific academic and non-commercial licenses. We thank the researchers and the Deaf signers who contributed to these datasets.*
