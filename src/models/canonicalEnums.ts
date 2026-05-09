import type {
  ConfidenceLevel,
  DealSide,
  EvidenceType,
  KnowledgeLevel,
  ReliabilityFlag,
  RespondentRoleCode,
  RiskCategory,
} from './canonicalDataModel'

export interface EnumOption<TValue extends string> {
  value: TValue
  label: string
  description?: string
}

export interface WeightedEnumOption<TValue extends string>
  extends EnumOption<TValue> {
  weight: number
}

export const DEAL_SIDE_OPTIONS = [
  {
    value: 'acquirer',
    label: 'Acquirer',
    description: 'Buy-side principal organisation.',
  },
  {
    value: 'target',
    label: 'Target',
    description: 'Sell-side principal organisation.',
  },
  {
    value: 'advisor',
    label: 'Advisor',
    description: 'External professional advisor.',
  },
  {
    value: 'board',
    label: 'Board',
    description: 'Board sponsor, board observer, or investment committee role.',
  },
  {
    value: 'external',
    label: 'External',
    description: 'External party with structural visibility.',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Any role not covered by the standard side taxonomy.',
  },
] as const satisfies readonly EnumOption<DealSide>[]

export const RESPONDENT_ROLE_OPTIONS = [
  {
    value: 'deal_lead',
    label: 'Deal Lead / Originator',
    side: 'acquirer',
  },
  {
    value: 'integration_lead',
    label: 'Integration Lead',
    side: 'acquirer',
  },
  {
    value: 'people_lead',
    label: 'HR / People / Talent Lead',
    side: 'acquirer',
  },
  {
    value: 'commercial_lead',
    label: 'Commercial / Strategy Lead',
    side: 'acquirer',
  },
  {
    value: 'finance_lead',
    label: 'Finance / Diligence Lead',
    side: 'acquirer',
  },
  {
    value: 'legal_lead',
    label: 'Legal / Compliance Lead',
    side: 'acquirer',
  },
  {
    value: 'board_observer',
    label: 'Board Observer / Operating Partner',
    side: 'acquirer',
  },
  {
    value: 'ceo_founder',
    label: 'CEO / Founder / Managing Director',
    side: 'target',
  },
  {
    value: 'senior_leader',
    label: 'Senior Leadership Team Member',
    side: 'target',
  },
  {
    value: 'key_talent',
    label: 'Key Talent / Pivotal Operator',
    side: 'target',
  },
  {
    value: 'people_function',
    label: 'Target HR / People Lead',
    side: 'target',
  },
  {
    value: 'finance_function',
    label: 'Target Finance Lead',
    side: 'target',
  },
  {
    value: 'lead_banker',
    label: 'Lead Investment Banker',
    side: 'advisor',
  },
  {
    value: 'legal_counsel',
    label: 'Lead Legal Counsel',
    side: 'advisor',
  },
  {
    value: 'consultant',
    label: 'Diligence Consultant',
    side: 'advisor',
  },
  {
    value: 'unspecified',
    label: 'Other / Specify',
    side: 'other',
  },
] as const satisfies readonly (EnumOption<RespondentRoleCode> & {
  side: DealSide
})[]

export const EVIDENCE_TYPE_OPTIONS = [
  {
    value: 'direct_observation',
    label: 'Direct Observation',
    description:
      'Respondent personally observed the event in their role and timeframe.',
    weight: 1,
    confidenceCeiling: 'high',
  },
  {
    value: 'document_supported',
    label: 'Document-Supported',
    description:
      'Answer is corroborated by a specific named evidence item.',
    weight: 1,
    confidenceCeiling: 'high',
  },
  {
    value: 'reported_by_others',
    label: 'Reported by Others',
    description:
      'Respondent learned the information from another person rather than observing it directly.',
    weight: 0.55,
    confidenceCeiling: 'medium',
  },
  {
    value: 'inference',
    label: 'Inference',
    description:
      'Respondent reasons from related facts without observing the underlying event.',
    weight: 0.35,
    confidenceCeiling: 'medium',
  },
  {
    value: 'hypothetical',
    label: 'Hypothetical',
    description:
      'No actual case is known; respondent describes what they expect would happen.',
    weight: 0.2,
    confidenceCeiling: 'low',
  },
  {
    value: 'unknown',
    label: 'Unknown / Cannot Answer',
    description:
      'Respondent has no direct, documentary, reported, or inferential basis.',
    weight: 0,
    confidenceCeiling: 'cannot_determine',
  },
] as const satisfies readonly (WeightedEnumOption<EvidenceType> & {
  confidenceCeiling: ConfidenceLevel
})[]

export const KNOWLEDGE_LEVEL_OPTIONS = [
  {
    value: 'first_hand',
    label: 'First-Hand',
    description:
      'Respondent was a participant or direct decision-maker in the event.',
    weight: 1,
  },
  {
    value: 'second_hand',
    label: 'Second-Hand',
    description:
      'Respondent was near the context but did not participate in the specific decision.',
    weight: 0.7,
  },
  {
    value: 'document_based',
    label: 'Document-Based',
    description:
      'Respondent did not witness the event but has authoritative documentation.',
    weight: 0.85,
  },
  {
    value: 'pattern_based',
    label: 'Pattern-Based',
    description:
      'Respondent generalises from repeated similar events.',
    weight: 0.5,
  },
  {
    value: 'speculative',
    label: 'Speculative',
    description:
      'Respondent reasons about what might have happened or might happen.',
    weight: 0.2,
  },
  {
    value: 'not_known',
    label: 'Not Known',
    description: 'Respondent has no basis for the answer.',
    weight: 0,
  },
] as const satisfies readonly WeightedEnumOption<KnowledgeLevel>[]

export const CONFIDENCE_LEVEL_OPTIONS = [
  {
    value: 'high',
    label: 'High',
    description:
      'Respondent is confident the answer reflects the underlying reality.',
  },
  {
    value: 'medium',
    label: 'Medium',
    description:
      'Respondent is reasonably confident but acknowledges uncertainty.',
  },
  {
    value: 'low',
    label: 'Low',
    description: 'Respondent is uncertain; answer is best available only.',
  },
  {
    value: 'cannot_determine',
    label: 'Cannot Determine',
    description:
      'Respondent has insufficient basis to assign confidence.',
  },
] as const satisfies readonly EnumOption<ConfidenceLevel>[]

export const RELIABILITY_FLAG_OPTIONS = [
  {
    value: 'contradicted_by_respondent',
    label: 'Contradicted by another respondent',
  },
  {
    value: 'contradicted_by_document',
    label: 'Contradicted by document',
  },
  {
    value: 'socially_desirable',
    label: 'Socially desirable response',
  },
  {
    value: 'evasive',
    label: 'Evasive / non-answer',
  },
  {
    value: 'overgeneralized',
    label: 'Overgeneralised',
  },
  {
    value: 'speaks_for_group_without_access',
    label: 'Speaks for group without access',
  },
  {
    value: 'hypothetical',
    label: 'Hypothetical answer',
  },
  {
    value: 'structurally_unlikely',
    label: 'Structurally unlikely event',
  },
  {
    value: 'no_direct_knowledge',
    label: 'No direct knowledge',
  },
] as const satisfies readonly EnumOption<ReliabilityFlag>[]

export const RISK_CATEGORY_OPTIONS = [
  {
    value: 'integration_fracture',
    label: 'Integration Fracture Risk',
  },
  {
    value: 'leadership_accountability',
    label: 'Leadership Accountability Risk',
  },
  {
    value: 'key_person_retention',
    label: 'Key-Person Retention Risk',
  },
  {
    value: 'founder_dependency',
    label: 'Founder / CEO Dependency Risk',
  },
  {
    value: 'decision_rights_conflict',
    label: 'Decision-Rights Conflict Risk',
  },
  {
    value: 'governance_risk',
    label: 'Post-Close Governance Risk',
  },
  {
    value: 'political_protection',
    label: 'Political Protection / Loyalty-System Risk',
  },
  {
    value: 'talent_flight',
    label: 'Talent Flight Risk',
  },
  {
    value: 'management_performance_drop',
    label: 'Management-Team Performance Drop Risk',
  },
  {
    value: 'months_6_18_failure',
    label: 'Months 6-18 Failure Risk',
  },
] as const satisfies readonly EnumOption<RiskCategory>[]

export const DEAL_SIDES = DEAL_SIDE_OPTIONS.map((option) => option.value)
export const RESPONDENT_ROLE_CODES = RESPONDENT_ROLE_OPTIONS.map(
  (option) => option.value,
)
export const EVIDENCE_TYPES = EVIDENCE_TYPE_OPTIONS.map(
  (option) => option.value,
)
export const KNOWLEDGE_LEVELS = KNOWLEDGE_LEVEL_OPTIONS.map(
  (option) => option.value,
)
export const CONFIDENCE_LEVELS = CONFIDENCE_LEVEL_OPTIONS.map(
  (option) => option.value,
)
export const RELIABILITY_FLAGS = RELIABILITY_FLAG_OPTIONS.map(
  (option) => option.value,
)
export const RISK_CATEGORIES = RISK_CATEGORY_OPTIONS.map(
  (option) => option.value,
)

export function isDealSide(value: string): value is DealSide {
  return DEAL_SIDES.includes(value as DealSide)
}

export function isRespondentRoleCode(
  value: string,
): value is RespondentRoleCode {
  return RESPONDENT_ROLE_CODES.includes(value as RespondentRoleCode)
}

export function isEvidenceType(value: string): value is EvidenceType {
  return EVIDENCE_TYPES.includes(value as EvidenceType)
}

export function isKnowledgeLevel(value: string): value is KnowledgeLevel {
  return KNOWLEDGE_LEVELS.includes(value as KnowledgeLevel)
}

export function isConfidenceLevel(value: string): value is ConfidenceLevel {
  return CONFIDENCE_LEVELS.includes(value as ConfidenceLevel)
}

export function isReliabilityFlag(value: string): value is ReliabilityFlag {
  return RELIABILITY_FLAGS.includes(value as ReliabilityFlag)
}

export function isRiskCategory(value: string): value is RiskCategory {
  return RISK_CATEGORIES.includes(value as RiskCategory)
}

