# Methodology Source Of Truth

## Active Package

The active methodology package for the rebuild is:

`NewLogic 03.05.2026`

The workbook package was added to the project on 2026-05-06 and supersedes the older generated questionnaire and scoring data currently under `src/data`.

## Rebuild Rule

During the rebuild, do not treat existing `src/data` files as the methodology authority. Existing app data is legacy runtime material and may be used only for comparison, migration, or regression checks.

All rebuilt questionnaire, scoring, contradiction, triage, reporting, and analyst-workflow logic must be derived from the `NewLogic 03.05.2026` workbooks.

## Workbook Roles

| Workbook | Rebuild Role |
| --- | --- |
| `ST_Canonical_Schema.xlsx` | Canonical records, enums, confidence gates, role coverage, analyst gates |
| `ST_Analyst_Methodology.xlsx` | Three-layer architecture, analyst mandate, contradiction triage, approval workflow |
| `ST_Acquirer_Environment_Module.xlsx` | Acquirer-side respondent questionnaire source |
| `ST_Target_Observed_Environment_Diagnostic.xlsx` | Acquirer-side observed target diagnostic source |
| `ST_Target_Self_Assessment_Module.xlsx` | Target-side self-assessment questionnaire source |
| `ST_Environment_Diagnostic_v2.xlsx` | General environment diagnostic and deepening questions |
| `ST_Dual_Respondent_Axis_Comparison_v1.xlsx` | Cross-respondent comparison and contradiction logic |
| `ST_Triage_Framework.xlsx` | Weak-result, reliability, contradiction, and escalation routing |
| `ST_B_Single_Output_Template_v1.xlsx` | Final 19-section client report structure |
| `ST_Step3_Output_Screens_Spec.xlsx` | Step 3 frontend output screens and copy structure |
| `ST_Form_Binding_Prompt.xlsx` | Cell-coordinate implementation binding for questionnaire rendering |
| `ST_Friction_Point_Lookup_updated.xlsx` | Pair-level friction, ECS matrix, and risk-category tagging |
| `ST_Free_Tier_Output_Narratives_updated.xlsx` | Free-tier narrative lookup and confidence-gated CTA tone |
| `ST_Prediction_Ledger_v1.xlsx` | Sealed prediction, verification, calibration, and accuracy workflow |
| `ST_Client_Journey_v5.xlsx` | End-to-end product journey and dependency register |

## Methodological Boundary

The rebuilt product must not calculate final conclusions from raw respondent answers alone.

The runtime architecture must preserve:

- respondent role and side
- evidence type
- knowledge level
- confidence
- reliability flags
- missing evidence
- respondent divergence
- contradiction records
- analyst assessment and approval state

Internal environment codes may remain in data pipelines, but public/client UI must use client-facing aliases only.

Public rendering must route methodology strings through `publicText`, `publicReportText`, `environmentAlias`, or `publicSafeText`. Internal codes such as `NT/STJ` may remain in scoring data and generated JSON, but they must not be shown as client-facing labels.

## Runtime Scoring Boundary

As of rebuild point 6, questionnaire runtime scoring must go through `src/flow/layeredEvidenceScoring.js`.

Raw respondent options are not treated as final facts. The scoring layer produces a weighted signal pattern, requires analyst review, and keeps `finalEnvironmentLabel` unset. Legacy option-only answers are treated as low-confidence evidence with a `no_direct_knowledge` reliability flag until the rebuilt questionnaire UI captures evidence type, knowledge level, confidence, and reliability flags directly.
