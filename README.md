# LINGGUANG Health OS — Voice AI Build 010.1 Route Fix

## Fixed
- Voice Conversation card now uses a direct iPhone-safe click handler.
- Added a prominent Start Voice Conversation button at the top of Voice AI.
- Header microphone now opens the conversation directly.
- Added safe ID generation for older iOS/PWA environments.
- Added visible route-error reporting instead of silent failure.
- Delegated routing now includes an explicit Voice Conversation fallback.

## Test
1. Open Voice AI.
2. Tap Start Voice Conversation or the Voice Conversation card.
3. The conversation page should open immediately.
4. Type a response first to verify the conversation flow.
5. Then test the microphone.

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
