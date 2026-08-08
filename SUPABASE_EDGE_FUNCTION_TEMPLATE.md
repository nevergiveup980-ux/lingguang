# LINGGUANG GPT Backend Contract

The browser sends POST JSON to a secure backend:

```json
{
  "mode": "voice_medical_intake",
  "language": "en-CA",
  "role": "patient",
  "stage": "duration",
  "user_text": "It started maybe a week ago after lifting a box...",
  "known_facts": {},
  "conversation": []
}
```

Expected response:

```json
{
  "reply": "About one week. Where exactly do you feel it?",
  "facts": {"duration": "about one week"},
  "next_stage": "location",
  "completed": false
}
```

Store the OpenAI API key only as a server-side secret. Never expose it in `app.js`.
