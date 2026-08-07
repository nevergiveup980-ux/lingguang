# LINGGUANG Health OS — Voice AI Build 010.2 Login Fix

## Fixed
- Restored all three Portal entry buttons:
  - Healthcare Professional
  - Patient Portal
  - Clinic Administration
- Role cards now use direct iPhone-safe handlers.
- Added touch-event fallback for PWA use.
- Added document-level emergency routing fallback.
- Added three small direct login links below the cards.
- Hardened login form mounting and submit handling.
- Preserved Voice Conversation Build 010.1 fixes.

## Test order
1. Open Portal Selection.
2. Tap Healthcare Professional.
3. Return and test Patient Portal.
4. Return and test Clinic Administration.
5. Enter Professional Portal and test Voice AI.
6. Tap Start Voice Conversation.

## Upload
Replace all files from this package in the GitHub repository root.
