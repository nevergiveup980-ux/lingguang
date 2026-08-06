# LINGGUANG Health OS — Platform Build 004

## Implemented
- Three portal entry:
  - Healthcare Professional
  - Patient
  - Clinic Administration
- Role-aware local portal routing.
- Patient Portal only shows the selected patient's applications, appointments, assessments, journey, messages and profile.
- Booking split into:
  - Applications
  - Appointments
- Application workflow:
  - patient submits request
  - Local AI pre-assessment
  - professional review
  - approve / request more information / reject
  - approved application converts into a confirmed calendar appointment
- Clinic Administration portal with active menu placeholders.
- Existing Month / Week / Day calendar, Local AI, branding, clinical and patient modules remain.

## Security limitation
This build separates interfaces and local records for product testing. It is not real secure authentication or database-level access control. Production isolation requires cloud authentication, database row-level security, audit logs, encryption and secure file storage.

## Mobile GitHub upload
Upload or replace:
- index.html
- app.js
- local-ai.js
- styles.css
- README.md
- lingguang-logo.png
- favicon.png
