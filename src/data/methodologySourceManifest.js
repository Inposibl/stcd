export const METHODOLOGY_SOURCE_PACKAGE = {
  id: 'newlogic-2026-05-03',
  name: 'NewLogic 03.05.2026',
  path: 'NewLogic 03.05.2026',
  activatedAt: '2026-05-06',
  status: 'source-of-truth',
  rule:
    'Rebuilt methodology, questionnaire, scoring, contradiction, triage, reporting, and analyst-workflow logic must be derived from this workbook package.',
}

export const METHODOLOGY_WORKBOOKS = [
  {
    file: 'ST_Canonical_Schema.xlsx',
    role: 'Canonical records, enums, confidence gates, role coverage, analyst gates',
  },
  {
    file: 'ST_Analyst_Methodology.xlsx',
    role: 'Three-layer architecture, analyst mandate, contradiction triage, approval workflow',
  },
  {
    file: 'ST_Acquirer_Environment_Module.xlsx',
    role: 'Acquirer-side respondent questionnaire source',
  },
  {
    file: 'ST_Target_Observed_Environment_Diagnostic.xlsx',
    role: 'Acquirer-side observed target diagnostic source',
  },
  {
    file: 'ST_Target_Self_Assessment_Module.xlsx',
    role: 'Target-side self-assessment questionnaire source',
  },
  {
    file: 'ST_Environment_Diagnostic_v2.xlsx',
    role: 'General environment diagnostic and deepening questions',
  },
  {
    file: 'ST_Dual_Respondent_Axis_Comparison_v1.xlsx',
    role: 'Cross-respondent comparison and contradiction logic',
  },
  {
    file: 'ST_Triage_Framework.xlsx',
    role: 'Weak-result, reliability, contradiction, and escalation routing',
  },
  {
    file: 'ST_B_Single_Output_Template_v1.xlsx',
    role: 'Final 19-section client report structure',
  },
  {
    file: 'ST_Step3_Output_Screens_Spec.xlsx',
    role: 'Step 3 frontend output screens and copy structure',
  },
  {
    file: 'ST_Form_Binding_Prompt.xlsx',
    role: 'Cell-coordinate implementation binding for questionnaire rendering',
  },
  {
    file: 'ST_Friction_Point_Lookup_updated.xlsx',
    role: 'Pair-level friction, ECS matrix, and risk-category tagging',
  },
  {
    file: 'ST_Free_Tier_Output_Narratives_updated.xlsx',
    role: 'Free-tier narrative lookup and confidence-gated CTA tone',
  },
  {
    file: 'ST_Prediction_Ledger_v1.xlsx',
    role: 'Sealed prediction, verification, calibration, and accuracy workflow',
  },
  {
    file: 'ST_Client_Journey_v5.xlsx',
    role: 'End-to-end product journey and dependency register',
  },
]

export const LEGACY_RUNTIME_DATA_NOTICE = {
  path: 'src/data',
  status: 'legacy-runtime-data',
  rule:
    'Use existing generated data only for migration, comparison, and regression checks until the NewLogic export pipeline replaces it.',
}

