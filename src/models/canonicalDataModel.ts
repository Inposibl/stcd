export type ISODate = string
export type ISODateTime = string
export type UUID = string

export type DealSide =
  | 'acquirer'
  | 'target'
  | 'advisor'
  | 'board'
  | 'external'
  | 'other'

export type RespondentRoleCode =
  | 'deal_lead'
  | 'integration_lead'
  | 'people_lead'
  | 'commercial_lead'
  | 'finance_lead'
  | 'legal_lead'
  | 'board_observer'
  | 'ceo_founder'
  | 'senior_leader'
  | 'key_talent'
  | 'people_function'
  | 'finance_function'
  | 'lead_banker'
  | 'legal_counsel'
  | 'consultant'
  | 'unspecified'

export type EvidenceType =
  | 'direct_observation'
  | 'document_supported'
  | 'reported_by_others'
  | 'inference'
  | 'hypothetical'
  | 'unknown'

export type KnowledgeLevel =
  | 'first_hand'
  | 'second_hand'
  | 'document_based'
  | 'pattern_based'
  | 'speculative'
  | 'not_known'

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'cannot_determine'

export type ReliabilityFlag =
  | 'contradicted_by_respondent'
  | 'contradicted_by_document'
  | 'socially_desirable'
  | 'evasive'
  | 'overgeneralized'
  | 'speaks_for_group_without_access'
  | 'hypothetical'
  | 'structurally_unlikely'
  | 'no_direct_knowledge'

export type DirectObservationGate = 'yes' | 'no' | 'document_supported'

export type SeniorityLevel =
  | 'c_suite'
  | 'vp'
  | 'director'
  | 'manager'
  | 'ic'
  | 'external'

export type AccessLevel = 'full' | 'functional' | 'limited' | 'external_only'

export type EngagementDepth =
  | 'deal_team_member'
  | 'interview_only'
  | 'written_only'

export type RelationshipToOtherSide =
  | 'none'
  | 'professional'
  | 'personal'
  | 'family'
  | 'financial'

export type DiagnosticLayer =
  | 'respondent_questionnaire'
  | 'evidence_capture'
  | 'analyst_scoring'
  | 'risk_output'

export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'free_text'
  | 'evidence_calibration'
  | 'analyst_assessment'

export type EvidenceItemType =
  | 'document'
  | 'interview'
  | 'dataroom_extract'
  | 'public_record'
  | 'other'

export type EvidenceReviewStatus =
  | 'unreviewed'
  | 'under_review'
  | 'verified'
  | 'disputed'

export type EvidenceLabel =
  | 'directly_observed'
  | 'document_supported'
  | 'inferred'
  | 'unknown'
  | 'contradicted'
  | 'follow_up_required'

export type RiskCategory =
  | 'integration_fracture'
  | 'leadership_accountability'
  | 'key_person_retention'
  | 'founder_dependency'
  | 'decision_rights_conflict'
  | 'governance_risk'
  | 'political_protection'
  | 'talent_flight'
  | 'management_performance_drop'
  | 'months_6_18_failure'

export type Severity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational'

export type ApprovalStatus = 'draft' | 'under_review' | 'approved' | 'rejected'

export type ContradictionType =
  | 'cross_respondent_same_side'
  | 'cross_side'
  | 'answer_vs_document'
  | 'answer_vs_pattern'
  | 'self_contradiction'

export type ContradictionDetectionSource =
  | 'engine'
  | 'analyst'
  | 'respondent_self_report'

export type ContradictionReviewStatus =
  | 'open'
  | 'under_review'
  | 'resolved'
  | 'escalated_to_finding'

export type MonthsFailureProbability =
  | 'very_high'
  | 'high'
  | 'medium'
  | 'low'
  | 'very_low'
  | 'cannot_determine'

export type DealSizeTier = 'tier_1' | 'tier_2' | 'tier_3' | 'unknown'

export type DealStatus =
  | 'draft'
  | 'in_diligence'
  | 'analysis'
  | 'report_ready'
  | 'sealed'
  | 'archived'

export type QuestionOptionValue = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export interface Deal {
  id: UUID
  name: string
  acquirerName: string
  targetName: string
  dealType: string
  dealSizeTier: DealSizeTier
  status: DealStatus
  createdAt: ISODateTime
  updatedAt?: ISODateTime | null
}

export interface Respondent {
  id: UUID
  dealId: UUID
  side: DealSide
  roleCode: RespondentRoleCode
  roleFreeText?: string | null
  seniorityLevel: SeniorityLevel
  function?: string | null
  organization?: string | null
  accessLevel: AccessLevel
  observationTenureMonths: number
  engagementDepth: EngagementDepth
  priorRelationshipToOtherSide: RelationshipToOtherSide
  createdAt: ISODateTime
  completedAt?: ISODateTime | null
  analystVerified: boolean
}

export interface QuestionOption {
  value: QuestionOptionValue
  label: string
  environmentSignal?: string | null
  riskCategorySignals?: RiskCategory[]
  reliabilityFlags?: ReliabilityFlag[]
  allowsUnknown?: boolean
}

export interface Question {
  id: string
  sourceWorkbook: string
  sourceSheet: string
  diagnosticLayer: DiagnosticLayer
  questionType: QuestionType
  roleApplicability: RespondentRoleCode[]
  sideApplicability: DealSide[]
  prompt: string
  options: QuestionOption[]
  requiresEvidenceClassification: boolean
  allowsUnknown: boolean
  allowsMultipleRoles: boolean
  mapsToRiskCategories: RiskCategory[]
  mapsToEnvironmentSignals: string[]
  createdAt?: ISODateTime
}

export interface Answer {
  id: UUID
  dealId: UUID
  questionId: string
  respondentId: UUID
  selectedOption?: QuestionOptionValue | null
  selectedOptions?: QuestionOptionValue[] | null
  freeText?: string | null
  directObservationGate: DirectObservationGate
  evidenceType: EvidenceType
  knowledgeLevel: KnowledgeLevel
  confidence: ConfidenceLevel
  reliabilityFlags: ReliabilityFlag[]
  observedRoles?: RespondentRoleCode[] | string[] | null
  evidenceItemIds?: UUID[] | null
  createdAt: ISODateTime
  updatedAt?: ISODateTime | null
}

export interface EvidenceItem {
  id: UUID
  dealId: UUID
  itemType: EvidenceItemType
  title: string
  sourceParty: DealSide
  producedDate?: ISODate | null
  relevantQuestionIds: string[]
  relevantRiskCategories: RiskCategory[]
  storageReference: string
  analystExtract?: string | null
  contradictsAnswerIds?: UUID[] | null
  corroboratesAnswerIds?: UUID[] | null
  reviewStatus: EvidenceReviewStatus
  createdAt: ISODateTime
}

export interface AnalystAssessment {
  id: UUID
  dealId: UUID
  analystId: UUID
  riskCategory: RiskCategory
  findingTitle: string
  findingNarrative: string
  supportingAnswerIds: UUID[]
  supportingEvidenceItemIds: UUID[]
  contradictionIds: UUID[]
  evidenceLabel: EvidenceLabel
  severity: Severity
  confidenceLevel: Exclude<ConfidenceLevel, 'cannot_determine'>
  preCloseAction?: string | null
  postCloseAction?: string | null
  approvalStatus: ApprovalStatus
  createdAt: ISODateTime
  updatedAt?: ISODateTime | null
}

export interface Contradiction {
  id: UUID
  dealId: UUID
  questionId?: string | null
  contradictionType: ContradictionType
  answerIds: UUID[]
  evidenceItemIds?: UUID[] | null
  detectionSource: ContradictionDetectionSource
  severity: Severity
  reviewStatus: ContradictionReviewStatus
  explanation: string
  analystResolution?: string | null
  escalatedToAssessmentId?: UUID | null
  createdAt: ISODateTime
  resolvedAt?: ISODateTime | null
}

export interface RiskOutput {
  id: UUID
  dealId: UUID
  riskCategory: RiskCategory
  overallSeverity: Severity
  overallConfidence: ConfidenceLevel
  compositeAssessmentIds: UUID[]
  coverageNote: string
  evidenceSummary: string
  divergenceSummary: string
  recommendations: string[]
  preCloseActions: string[]
  postCloseActions: string[]
  months_6_18_failureProbability: MonthsFailureProbability
  createdAt: ISODateTime
  finalReportSection: string
}

export interface CanonicalDiagnosticRecordSet {
  deals: Deal[]
  respondents: Respondent[]
  questions: Question[]
  answers: Answer[]
  evidenceItems: EvidenceItem[]
  analystAssessments: AnalystAssessment[]
  contradictions: Contradiction[]
  riskOutputs: RiskOutput[]
}

