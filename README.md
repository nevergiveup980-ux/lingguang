# LINGGUANG Health OS — Voice AI Build 010.3 Login Restore

## Critical fix
The iPhone recording showed the login button invoking the password/autofill form flow and reloading the page instead of creating a LINGGUANG session.

This build:
- removes dependency on HTML form submission
- uses a direct login button
- sets the Professional / Patient / Admin session explicitly
- navigates directly to the correct portal
- disables browser password autofill interference in this development build
- adds click, touch and document-level fallbacks
- preserves the Voice Conversation route fixes

## Test
1. Open Professional Login.
2. Leave the provided development credentials unchanged.
3. Tap Enter Healthcare Professional.
4. Confirm the Dashboard opens without a splash reload.
5. Repeat for Admin.
6. Patient Portal requires an existing patient profile.

## Upload
Replace all files in the GitHub repository root.
