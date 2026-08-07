# LINGGUANG Health OS — Voice AI Build 010.5 Stable Fix

## Root cause
The original Build 010 Voice Conversation code called two missing definitions:

- `VOICE_CONVO_KEY`
- `voiceConversationInitial()`

Opening Voice Conversation therefore caused an immediate JavaScript ReferenceError.
The page remained unchanged, which looked like an unresponsive button.

## This build
- Rebuilt from the original Build 010, where all three login portals still worked.
- Added the missing conversation storage key.
- Added the missing conversation initialization function.
- Added an iPhone-safe conversation ID fallback.
- Added a local error card for Voice Conversation only.
- Did not modify login logic.
- Did not modify the global router.
- Did not modify the three portal entry buttons.
- Added a visible `Build 010.5 Stable` badge.

## Test order
1. Confirm the Voice AI page shows `Build 010.5 Stable`.
2. Tap the Voice Conversation card.
3. The conversation page should show the first LINGGUANG question.
4. Type a reply and press Send.
5. Confirm the next question appears.
6. Then test the microphone.
7. Sign out and verify Professional, Patient and Admin portal entries still work.

## Upload
Replace all files from this package in the GitHub repository root.
