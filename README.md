# LINGGUANG Health OS — Voice AI Build 010.4 Route Restore

## Critical fixes
- Restored the missing `openVoiceConversation()` function.
- Restored `window.LINGGUANG_OPEN_VOICE`.
- Start Voice Conversation button now opens the real route.
- Voice Conversation card now opens the real route.
- Header microphone now opens the real route.
- Corrected broken `#/route` URLs to this app's `#route` format.
- Professional, Patient and Admin login navigation now uses the existing router.
- Added a visible Build 010.4 badge for deployment verification.

## Test
1. Confirm Voice AI shows Build 010.4.
2. Tap Start Voice Conversation.
3. Test the Voice Conversation card.
4. Sign out and test all three portal entries.
5. Test Professional and Admin login.

## Upload
Replace all files from this package in the GitHub repository root.
