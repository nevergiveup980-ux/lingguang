# LINGGUANG Build 014 Multi-AI Gateway Contract

Browser request:
```json
{
  "product": "lingguang-health-os",
  "task": "voice | scan",
  "provider": "gemini | gpt | deepseek | kimi | grok",
  "payload": {}
}
```

Auto policy: Gemini first, GPT second.

Voice response:
```json
{
  "provider": "gemini",
  "reply": "How long has this been present?",
  "facts": {"duration": "about one week"},
  "next_stage": "location",
  "completed": false
}
```

Scan response:
```json
{
  "provider": "gpt",
  "confidence": 91,
  "fields": {
    "documentType": "Lab / Diagnostic Report",
    "patientName": "",
    "date": "",
    "medications": [],
    "conditions": [],
    "symptoms": [],
    "provider": "",
    "notes": ""
  }
}
```

API keys stay server-side only.
