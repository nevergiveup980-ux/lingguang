# LINGGUANG Health OS — Build 011 Hands-Free Voice

## Voice AI improvements
- Explicit microphone permission request using getUserMedia.
- Live microphone level meter: confirms that the iPhone is actually receiving sound.
- Improved state machine:
  - LINGGUANG speaking
  - Your turn
  - Listening
  - Processing
  - Ready
- Optional Auto-listen after reply.
- Prevents microphone capture while LINGGUANG is speaking.
- Waits briefly after AI speech before reopening the microphone.
- Web Speech recognition remains the first transcription path.
- MediaRecorder fallback verifies/captures real microphone audio when browser speech recognition fails.
- Captured fallback audio can be played back directly in the Voice Conversation page.
- Clear permission / microphone / recognition error messages.
- Stop Voice control immediately cancels speech and microphone activity.
- Existing Patient Intake expansion from Build 010.6 is preserved.

## Important limitation
MediaRecorder fallback proves the microphone is working and captures audio, but converting that fallback recording into text still requires a cloud speech-to-text endpoint. Build 011 does not expose or hard-code an API key in GitHub.

## Recommended test
1. Open Voice Conversation in Safari.
2. Allow microphone access.
3. Watch the audio meter while speaking.
4. If browser recognition succeeds, text is submitted automatically.
5. If recognition fails but recording works, the page will show an audio preview.
6. Test Auto-listen after reply only after manual Speak works reliably.

## Upload
Replace all files in the GitHub repository root.
