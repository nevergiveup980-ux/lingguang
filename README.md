# LINGGUANG Health OS — Build 011.1 iPhone Voice Loop Fix

## Fix
First-turn speech recognition worked, but the second answer could fail with:
`Speech recognition: aborted`

This build removes the simultaneous microphone conflict between:
- Safari SpeechRecognition
- getUserMedia / live audio meter

## Changes
- SpeechRecognition gets exclusive microphone ownership.
- Live audio meter is disabled while Safari recognition is active.
- `aborted` retries once after a 900 ms release delay.
- Recognition objects are discarded between turns.
- MediaRecorder is used only as a fallback.
- Existing Hands-Free, Auto-listen and Patient Intake features remain.

## Test
1. Leave Auto-listen OFF.
2. Say: "I'm feeling a bit of stomach pain."
3. After the next question, tap the mic again.
4. Say: "One week or so."
5. Confirm Duration updates.
6. Then test Auto-listen.
