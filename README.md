# LINGGUANG Health OS — Build 014 Multi-AI Voice + Scan

Inspired by the latest RUNLU Warehouse OS intelligent voice + intelligent scan architecture.

## Multi-AI Gateway
- Voice AI and AI Scan choose providers independently.
- Auto = Gemini → GPT.
- DeepSeek, Kimi K3 and Grok are reserved provider slots.
- Secure gateway endpoint only.

## Voice AI
Preserves:
- iPhone multi-turn fixes
- Auto language detection
- Medical term correction
- Low-confidence confirmation
- Voice command / clinical-content separation
- Local / Hybrid / GPT Assist

## AI Scan
- Camera / photo picker
- Text testing area
- Structured extraction:
  document type, patient, date, medications, conditions, symptoms, provider, notes
- Local fallback
- Review before save
- Send to Application or Clinical Draft
- Scan history

## AI Usage Ledger
Tracks provider, task, status and latency.

Image-to-text cloud vision requires the secure gateway. Without it, pasted text can still be tested locally.
