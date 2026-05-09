# ST UI Track Spec Run - Screen 12 Email Capture

Source spec: `ST_UI_Track_Coder_Agent_Specification_v1.xlsx`

Status: `SCREEN_12_PASS`

Implemented:
- Exported Screen 12 email-capture copy from `APPENDIX_B SCREEN_SPEC`.
- Added `src/flow/emailCaptureFlow.js` for source copy parsing, input validation, React session storage, and PDF-delivery record creation.
- Implemented `/screen-12-email-capture` with Email and First name fields.
- Added confirmation state after successful capture.
- Added `npm run validate:screen12` for the email capture smoke test.

Validation:
- `npm run validate:screen12` passed.
- Existing validation suite passed: `validate:g3`, `validate:g4c`, `validate:g4b`, `validate:step2b`, `validate:track1`, `validate:g2b`, `validate:g2`.
- `npx tsc --noEmit` passed.
- `npm run build` passed with the existing Vite chunk-size warning.
- Headless Edge rendered `/screen-12-email-capture` with the source-bound form content.

Next build step:
Run all 14 `VALIDATION_CHECKLIST` items for Sequence Gate `G-5`.
