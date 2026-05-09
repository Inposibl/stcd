# ST UI Track Spec Run - G-2

Source spec: `ST_UI_Track_Coder_Agent_Specification_v1.xlsx`

Status: `G-2_PASS`

Completed:
- Scaffolded the public Framer/Vercel project shell under `framer-vercel-public`.
- Added route registry for the public funnel screens.
- Wired Screen 2 role routing:
  - Acquirer -> Track 1 -> `/screen-3-deal-context`
  - Target -> Track 2 code gate -> `/screen-9a-target-code-gate`
  - Advisor / Other -> consultation only -> `/screen-12-consultation-request`
- Added Vercel API contract stubs required by the architecture decision.

Gate condition:
`G-2` requires Track 1 and Track 2 routing to be separate, and Track 3 to route to consultation only.

Validation:
- `node .\framer-vercel-public\scripts\validate-g2.mjs` passed.
- `node --check` passed for `src/flow/roleRouting.js`, `src/screenRegistry.js`, and `scripts/validate-g2.mjs`.
