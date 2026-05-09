# G-5 Validation Gate Run

Status: PASSED.

Implemented in this pass:
- Added `scripts/validate-g5.mjs` and `npm run validate:g5`.
- Fixed public navigation rerendering, removed visible Back/Return controls, and added browser-back warning text: `Progress will be lost if you go back. Continue?`
- Added the Advisor / Other consultation-only path validation to the G-5 gate.
- Removed public `corpus` leakage from generated final-deliverable data and export regeneration.
- Removed the legacy `SP/SJ` literal from runtime public code/data while preserving canonical `SFP/SFJ`.
- Added a Vite production-bundle sanitizer so exact environment-code strings are emitted with escaped slashes in built assets.
- Added Lighthouse as a dev dependency and wired V-11 to launch headless Chrome once, then audit all registered public routes.
- Raised the dark landing eyebrow contrast so the root route passes Lighthouse accessibility.

Latest G-5 result:
- PASS: V-01, V-02, V-03, V-04, V-05, V-06, V-07, V-08, V-09, V-10, V-11, V-12, V-13, V-14, V-15, V-16, V-17, V-18
- `npm run validate:g5` -> 18/18 pass, 0 fail, 0 blocked

Supporting commands run:
- `npm run build`
- `npm run validate:g5` -> 18/18 pass, 0 fail, 0 blocked
- `npm run validate:g4c`
- `npm run validate:g4b`
- `npm run validate:step2b`
- `npm run validate:track1`
- `npm run validate:g2b`
- `npm run validate:g2`
- `npm run validate:g3`
- `npm run validate:screen12`
- `npm run validate:consultation`
- `npx tsc --noEmit`
- `node --check scripts/validate-g5.mjs`
- `node --check vite.config.js`
- Python AST syntax check for `scripts/export_final_deliverable_data.py`

Build note:
- Vite still warns that the generated narrative dataset makes the main JS chunk exceed 500 kB. This is not a build failure.
