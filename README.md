# LINGGUANG Health OS — Voice AI Build 010

## What now works
- Real turn-by-turn conversation flow.
- Microphone speech input when the browser supports Web Speech.
- Typed-input fallback.
- Spoken AI follow-up questions through device speech synthesis.
- English, Mandarin, Cantonese and French voice-language selectors.
- Conversation context retained across the intake.
- Structured extraction:
  - main concern
  - duration
  - location/side
  - severity
  - better/worse factors
  - sleep/activity impact
  - prior treatment/testing
  - visit goal
- Live summary panel.
- Patient role can create an Application draft.
- Professional role can create a reviewed Clinical draft.
- Header microphone opens the working conversation directly.

## Current limitation
The conversation engine in this package is local and rule-guided, so it works without an API key. A professional cloud speech provider and cloud language model are not yet connected. Do not use this development build as a production medical record system.

## Mobile GitHub upload
Replace:
- index.html
- app.js
- local-ai.js
- styles.css
- README.md
- lingguang-logo.png
- lingguang-logo-full.png
- favicon.png
- apple-touch-icon.png
