# ST UI Track Spec Run - G-4b Target Link / Code Gate

Source spec: `ST_UI_Track_Coder_Agent_Specification_v1.xlsx`

Status: `G-4B_PASS`

Completed:
- Exported `ST_Target_Self_Assessment_Module.xlsx` into `src/data/targetSelfAssessmentData.js`.
- Implemented Step 2-C Target self-assessment scoring and receipt record creation.
- Implemented Preliminary Assessment creation after Track 1 completion.
- Implemented Screen 9a Link and Unique Digital Code block.
- Generated one Target survey link active for 72 hours plus one 6-digit code.
- Added Target-only code entry, Target-only Step 2-C survey, and receipt/close page.
- Hid public app navigation from Target survey and receipt views.
- Hid the Link and Unique Digital Code block after Target completion.
- Added reset invalidation logic so old codes fail after reset.
- Replaced `/api/create-target-session`, `/api/verify-target-code`, and `/api/submit-target-2c` contract stubs with server-side session handlers.

Validation:
- `node .\framer-vercel-public\scripts\validate-g4b.mjs` passed.
- `node .\framer-vercel-public\scripts\validate-step2b.mjs` passed.
- `node .\framer-vercel-public\scripts\validate-track1.mjs` passed.
- `node .\framer-vercel-public\scripts\validate-g2b.mjs` passed.
- `node .\framer-vercel-public\scripts\validate-g2.mjs` passed.
- `node --check` passed for `src/flow/targetInviteFlow.js`, `src/flow/targetSelfAssessmentFlow.js`, `src/data/targetSelfAssessmentData.js`, and `scripts/validate-g4b.mjs`.
- `python -m py_compile .\framer-vercel-public\scripts\export_target_self_data.py` passed.
- `npm run build` passed with Vite.
- Local HTTP checks returned `200` for `/screen-9a-target-code-gate` and `/screen-9a-target-code-gate?targetSessionId=tgt-demo`.

Next build step:
Implement G-4c / backend append-only prediction ledger storage and audit export boundary.
