# ST UI Track Spec Run - G-4c Prediction Ledger Boundary

Source spec: `ST_UI_Track_Coder_Agent_Specification_v1.xlsx`

Status: `G-4C_PASS`

Implemented:
- Added backend append-only sealed prediction ledger storage in `api/_predictionLedger.ts`.
- Replaced `/api/seal-prediction` contract stub with server-side SHA-256 sealing.
- Captured seal timestamp on the server at submission time.
- Hashed canonical `(acq_env, tgt_env, anchors[], timestamp)` payloads with SHA-256.
- Added `/api/export-prediction-ledger` as an explicit audit export boundary.
- Kept `ST_Prediction_Ledger_v1.xlsx` as a read-only audit/export artifact; runtime workbook mutation is not used.
- Added `npm run validate:g4c` for V-08/V-17-style smoke coverage.

Validation:
- `npm run validate:g4c` passed.
- `npm run validate:g4b` passed.
- `npm run validate:step2b` passed.
- `npm run validate:track1` passed.
- `npm run validate:g2b` passed.
- `npm run validate:g2` passed.
- `npx tsc --noEmit` passed.
- `npm run build` passed with Vite.
- Runtime `api/` and `src/` code scan found no direct workbook/filesystem write path or browser storage API usage.

Next build step:
Implement G-3 / Screen 10 and Screen 10b final deliverable rendering, then wire the UI submit moment into `/api/seal-prediction`.
