import { ACQUIRER_TRACK_DATA } from "../data/acquirerTrackData.js";
import {
  scoreLayeredEvidenceQuestionSet,
  scoreLayeredEvidenceQuestionSets,
} from "./layeredEvidenceScoring.js";
import { validateEvidenceClassifiedAnswers } from "./evidenceClassification.js";

export const ACQUIRER_ENVIRONMENT_CODES = Object.freeze([
  "NT/STJ",
  "NT/STP",
  "NF/NT",
  "NF/SFJ",
  "NF/SFP",
  "SFJ/SFP",
  "STJ/STP",
  "STP/STJ",
  "SFP/SFJ",
]);

export const COMPETITOR_MOTIVE_VALUE = "platform_acquisition";
export const ACQUIRER_VERIFICATION_INVITE_TTL_HOURS = 72;
export const ACQUIRER_VERIFICATION_DIGITAL_CODE_DIGITS = 6;

export const ACQUISITION_MOTIVE_OPTIONS = Object.freeze([
  Object.freeze({
    label: "MOTIVE 1",
    title: "Acquire a Team",
    demand: "ECS demand: 10/10",
    description: "People, R&D groups, acqui-hires, founder-led startups, and professional practices where the team is the asset.",
    value: "management_buyout",
  }),
  Object.freeze({
    label: "MOTIVE 2",
    title: "Enter a New Market",
    demand: "ECS demand: 8-9/10",
    description: "Cross-border M&A, local market leaders, family businesses, relationship-led customer bases, or local operating networks.",
    value: "cross_border_integration",
  }),
  Object.freeze({
    label: "MOTIVE 3",
    title: "KPI-Driven M&A",
    demand: "ECS demand: 5-8/10",
    description: "Board, investment committee, PE sponsor, operating partner, CHRO, or post-merger integration view.",
    value: "operational_roll_up",
  }),
  Object.freeze({
    label: "MOTIVE 4",
    title: "Kill a Competitor",
    demand: "ECS demand: 2-4/10",
    description: "Competitor neutralization, product shutdown, customer-base absorption, or price-war termination.",
    value: COMPETITOR_MOTIVE_VALUE,
  }),
]);

export const COMPETITOR_PRESERVATION_OPTIONS = Object.freeze([
  Object.freeze({
    title: "Partial integration required",
    description: "Some team, customers, technology, know-how, or relationships must survive after close. Proceed with ECS as a partial-integration case.",
    value: "partial_integration_required",
  }),
  Object.freeze({
    title: "No preservation goal",
    description: "The target social system will be neutralized rather than preserved. ECS is optional / low relevance for this transaction.",
    value: "no_preservation_goal",
  }),
]);

export const DEAL_TYPE_OPTIONS = Object.freeze([
  Object.freeze({
    title: "Acquire or retain a team",
    description: "The transaction depends on keeping a team, founder group, expert bench, R&D capability, or key people productive after close.",
    value: "team_acquisition",
  }),
  Object.freeze({
    title: "Enter a new market",
    description: "The transaction depends on preserving local relationships, commercial trust, operating knowledge, or market access.",
    value: "market_entry",
  }),
  Object.freeze({
    title: "Protect KPI-driven deal value",
    description: "The transaction depends on hitting board, sponsor, synergy, margin, growth, or transformation commitments.",
    value: "kpi_driven_ma",
  }),
  Object.freeze({
    title: "Absorb or neutralize a competitor",
    description: "The transaction depends on customer absorption, product consolidation, price-war termination, or competitor removal.",
    value: "competitor_absorption",
  }),
  Object.freeze({
    title: "Other integration-sensitive deal",
    description: "The deal has another integration rationale, but post-close value still depends on how the organizations operate together.",
    value: "other_integration_sensitive",
  }),
]);

export const DEAL_TYPE_ACQUISITION_MOTIVE_MAP = Object.freeze({
  team_acquisition: "management_buyout",
  market_entry: "cross_border_integration",
  kpi_driven_ma: "operational_roll_up",
  competitor_absorption: COMPETITOR_MOTIVE_VALUE,
  other_integration_sensitive: COMPETITOR_MOTIVE_VALUE,
});

export const RESPONDENT_SIDE_OPTIONS = Object.freeze([
  Object.freeze({ title: "Acquirer", value: "acquirer" }),
  Object.freeze({ title: "Target", value: "target" }),
  Object.freeze({ title: "Advisor", value: "advisor" }),
  Object.freeze({ title: "Board / Investment Committee", value: "board" }),
  Object.freeze({ title: "Other", value: "other" }),
]);

export const RESPONDENT_ROLE_OPTIONS = Object.freeze([
  Object.freeze({ title: "Deal Lead", value: "deal_lead", sides: Object.freeze(["acquirer"]) }),
  Object.freeze({ title: "Integration Lead", value: "integration_lead", sides: Object.freeze(["acquirer"]) }),
  Object.freeze({ title: "Operating Partner", value: "operating_partner", sides: Object.freeze(["acquirer", "board", "advisor"]) }),
  Object.freeze({ title: "HR / People / Talent Lead", value: "people_talent_lead", sides: Object.freeze(["acquirer", "target"]) }),
  Object.freeze({ title: "Finance Lead", value: "finance_lead", sides: Object.freeze(["acquirer", "target"]) }),
  Object.freeze({ title: "Legal / Governance Lead", value: "legal_governance_lead", sides: Object.freeze(["acquirer", "target", "advisor"]) }),
  Object.freeze({ title: "Board Sponsor / Investment Committee", value: "board_sponsor", sides: Object.freeze(["board", "acquirer"]) }),
  Object.freeze({ title: "CEO / Founder / Managing Director", value: "ceo_founder_md", sides: Object.freeze(["target"]) }),
  Object.freeze({ title: "Commercial Leader", value: "commercial_leader", sides: Object.freeze(["target"]) }),
  Object.freeze({ title: "Operations Leader", value: "operations_leader", sides: Object.freeze(["target"]) }),
  Object.freeze({ title: "Product / Technology Leader", value: "product_technology_leader", sides: Object.freeze(["target"]) }),
  Object.freeze({ title: "Senior Individual Contributor / Key Person", value: "senior_ic_key_person", sides: Object.freeze(["target"]) }),
  Object.freeze({ title: "Recently Promoted Leader", value: "recently_promoted_leader", sides: Object.freeze(["target"]) }),
  Object.freeze({ title: "Leader at Risk of Departure", value: "leader_at_risk", sides: Object.freeze(["target"]) }),
  Object.freeze({ title: "Advisor", value: "advisor", sides: Object.freeze(["advisor", "other"]) }),
  Object.freeze({ title: "Consultant", value: "consultant", sides: Object.freeze(["advisor", "other"]) }),
  Object.freeze({ title: "Board Observer", value: "board_observer", sides: Object.freeze(["board", "advisor"]) }),
  Object.freeze({ title: "Former Executive", value: "former_executive", sides: Object.freeze(["advisor", "other"]) }),
  Object.freeze({ title: "Integration Consultant", value: "integration_consultant", sides: Object.freeze(["advisor", "acquirer", "other"]) }),
  Object.freeze({ title: "Other role", value: "other_role", sides: Object.freeze(["acquirer", "target", "advisor", "board", "other"]) }),
]);

export const RESPONDENT_SENIORITY_OPTIONS = Object.freeze([
  Object.freeze({ title: "Board / Investment Committee", value: "board_investment_committee" }),
  Object.freeze({ title: "C-suite / Founder", value: "c_suite_founder" }),
  Object.freeze({ title: "Executive / Partner / Managing Director", value: "executive_partner_md" }),
  Object.freeze({ title: "VP / Director / Senior Leader", value: "vp_director_senior_leader" }),
  Object.freeze({ title: "Manager / Functional Lead", value: "manager_functional_lead" }),
  Object.freeze({ title: "Senior Individual Contributor / Key Person", value: "senior_ic_key_person" }),
  Object.freeze({ title: "External Advisor", value: "external_advisor" }),
]);

export const RESPONDENT_FUNCTION_OPTIONS = Object.freeze([
  Object.freeze({ title: "M&A / Deal Team", value: "ma_deal_team" }),
  Object.freeze({ title: "Integration / PMI", value: "integration_pmi" }),
  Object.freeze({ title: "HR / People / Talent", value: "people_talent" }),
  Object.freeze({ title: "Finance", value: "finance" }),
  Object.freeze({ title: "Legal / Governance", value: "legal_governance" }),
  Object.freeze({ title: "Operations", value: "operations" }),
  Object.freeze({ title: "Commercial / Sales", value: "commercial_sales" }),
  Object.freeze({ title: "Product / Technology", value: "product_technology" }),
  Object.freeze({ title: "Strategy / Corporate Development", value: "strategy_corpdev" }),
  Object.freeze({ title: "Board / Investment Committee", value: "board_investment_committee" }),
  Object.freeze({ title: "External Advisory", value: "external_advisory" }),
  Object.freeze({ title: "Other / Specify Later", value: "other_function" }),
]);

export const RESPONDENT_ACCESS_LEVEL_OPTIONS = Object.freeze([
  Object.freeze({ title: "Full deal-room / leadership access", value: "full_deal_room_leadership_access" }),
  Object.freeze({ title: "Functional evidence access", value: "functional_evidence_access" }),
  Object.freeze({ title: "Interview and meeting access only", value: "interview_meeting_access" }),
  Object.freeze({ title: "Limited or partial access", value: "limited_partial_access" }),
  Object.freeze({ title: "External advisor access", value: "external_advisor_access" }),
]);

export const RESPONDENT_SIDE_NEXT_ROUTES = Object.freeze({
  acquirer: "/start-diagnostic/deal-context/details",
  board: "/start-diagnostic/deal-context/details",
  target: "/screen-2c-target-self-assessment",
  advisor: "/screen-7-step-2b-level-1",
  other: "/screen-12-consultation-request",
});

export const TRANSACTION_DETAIL_SECTIONS = Object.freeze([
  Object.freeze({
    id: "transactionRole",
    label: "TRANSACTION RESPONSIBILITY LEVEL",
    options: Object.freeze([
      Object.freeze({ title: "Partner or MD", value: "partner_md" }),
      Object.freeze({ title: "Manager or Director", value: "manager_director" }),
      Object.freeze({ title: "Analyst or Consultant", value: "analyst_consultant" }),
    ]),
  }),
  Object.freeze({
    id: "firmTenure",
    label: "YOUR TENURE AT THE FIRM",
    options: Object.freeze([
      Object.freeze({ title: "Less than 18 months", value: "less_than_18_months" }),
      Object.freeze({ title: "18 months to 3 years", value: "18_months_to_3_years" }),
      Object.freeze({ title: "More than 3 years", value: "more_than_3_years" }),
    ]),
  }),
  Object.freeze({
    id: "integrationTimeline",
    label: "PLANNED INTEGRATION PACE",
    options: Object.freeze([
      Object.freeze({ title: "Accelerated", description: "0-90 days to full integration", value: "accelerated" }),
      Object.freeze({ title: "Standard", description: "90-180 days", value: "standard" }),
      Object.freeze({ title: "Extended", description: "180+ days, phased integration", value: "extended" }),
      Object.freeze({ title: "Preserve and protect", description: "Minimal integration - target environment preserved", value: "preserve_and_protect" }),
    ]),
  }),
]);

export const DEAL_ECONOMICS_CURRENCY_OPTIONS = Object.freeze(["USD", "EUR"]);
export const DEAL_ECONOMICS_SINGLE_CURRENCY_ERROR = "Deal Economics must use one currency for enterprise value and compensation. No FX conversion is applied.";
export const DEAL_ECONOMICS_SINGLE_CURRENCY_MISSING_FIELD = "dealEconomicsCurrencyMismatch";

export const DEAL_ECONOMICS_STATUS_OPTIONS = Object.freeze([
  Object.freeze({ title: "Confirmed", value: "confirmed" }),
  Object.freeze({ title: "Estimated", value: "estimated" }),
  Object.freeze({ title: "Not available yet", value: "not_available" }),
]);

export const CANONICAL_DEAL_CONTEXT_FIELD_IDS = Object.freeze([
  "acquirerName",
  "targetName",
  "dealType",
  "respondentSide",
  "respondentRole",
  "respondentSeniority",
  "respondentFunction",
  "respondentAccessLevel",
]);

export const DEAL_CONTEXT_FIELD_IDS = Object.freeze([
  ...CANONICAL_DEAL_CONTEXT_FIELD_IDS,
  "acquisitionMotive",
  "competitorPreservation",
  ...TRANSACTION_DETAIL_SECTIONS.map((section) => section.id),
  "enterpriseValue",
  "enterpriseValueCurrency",
  "enterpriseValueStatus",
  "keyPersonnelAtRisk",
  "compensationAssumptions",
  "compensationCurrency",
  "compensationStatus",
]);

const ACQUISITION_MOTIVE_VALUES = new Set(ACQUISITION_MOTIVE_OPTIONS.map((option) => option.value));
const COMPETITOR_PRESERVATION_VALUES = new Set(COMPETITOR_PRESERVATION_OPTIONS.map((option) => option.value));
const DEAL_TYPE_VALUES = new Set(DEAL_TYPE_OPTIONS.map((option) => option.value));
const RESPONDENT_SIDE_VALUES = new Set(RESPONDENT_SIDE_OPTIONS.map((option) => option.value));
const RESPONDENT_ROLE_VALUES = new Set(RESPONDENT_ROLE_OPTIONS.map((option) => option.value));
const RESPONDENT_SENIORITY_VALUES = new Set(RESPONDENT_SENIORITY_OPTIONS.map((option) => option.value));
const RESPONDENT_FUNCTION_VALUES = new Set(RESPONDENT_FUNCTION_OPTIONS.map((option) => option.value));
const RESPONDENT_ACCESS_LEVEL_VALUES = new Set(RESPONDENT_ACCESS_LEVEL_OPTIONS.map((option) => option.value));
const TRANSACTION_DETAIL_VALUES = Object.freeze(Object.fromEntries(
  TRANSACTION_DETAIL_SECTIONS.map((section) => [section.id, new Set(section.options.map((option) => option.value))]),
));
const DEAL_ECONOMICS_CURRENCY_VALUES = new Set(DEAL_ECONOMICS_CURRENCY_OPTIONS);
const DEAL_ECONOMICS_STATUS_VALUES = new Set(DEAL_ECONOMICS_STATUS_OPTIONS.map((option) => option.value));

const DEAL_IDENTITY_TEXT_FIELDS = Object.freeze(["acquirerName", "targetName"]);
const DEAL_IDENTITY_OPTION_FIELDS = Object.freeze([
  Object.freeze({ id: "dealType", values: DEAL_TYPE_VALUES }),
  Object.freeze({ id: "respondentSide", values: RESPONDENT_SIDE_VALUES }),
  Object.freeze({ id: "respondentRole", values: RESPONDENT_ROLE_VALUES }),
  Object.freeze({ id: "respondentSeniority", values: RESPONDENT_SENIORITY_VALUES }),
  Object.freeze({ id: "respondentFunction", values: RESPONDENT_FUNCTION_VALUES }),
  Object.freeze({ id: "respondentAccessLevel", values: RESPONDENT_ACCESS_LEVEL_VALUES }),
]);
const DEAL_IDENTITY_TEXT_FIELD_SET = new Set(DEAL_IDENTITY_TEXT_FIELDS);
const DEAL_IDENTITY_OPTION_FIELD_BY_ID = Object.freeze(Object.fromEntries(
  DEAL_IDENTITY_OPTION_FIELDS.map((field) => [field.id, field]),
));
const ACQUIRER_SIDE_RESPONDENT_SIDES = new Set(["acquirer", "board", ""]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function acquisitionMotiveForDealType(dealType) {
  return DEAL_TYPE_ACQUISITION_MOTIVE_MAP[normalizeString(dealType)] ?? "";
}

export function acquisitionMotiveOptionForDealType(dealType) {
  const motiveValue = acquisitionMotiveForDealType(dealType);
  return ACQUISITION_MOTIVE_OPTIONS.find((option) => option.value === motiveValue) ?? null;
}

export function isAcquirerSideRespondent(respondentSide) {
  return ACQUIRER_SIDE_RESPONDENT_SIDES.has(normalizeString(respondentSide));
}

export function requiresAcquirerTransactionDetails(input = {}) {
  return isAcquirerSideRespondent(input.respondentSide);
}

export function nextRouteForDealStart(input = {}) {
  const respondentSide = normalizeString(input.respondentSide);
  return RESPONDENT_SIDE_NEXT_ROUTES[respondentSide] ?? RESPONDENT_SIDE_NEXT_ROUTES.other;
}

function pickDealIdentity(input = {}) {
  const normalized = {};

  for (const fieldId of DEAL_IDENTITY_TEXT_FIELDS) {
    const value = normalizeString(input[fieldId]);
    if (value) {
      normalized[fieldId] = value;
    }
  }

  for (const field of DEAL_IDENTITY_OPTION_FIELDS) {
    const value = normalizeString(input[field.id]);
    if (field.values.has(value)) {
      normalized[field.id] = value;
    }
  }

  return Object.freeze(normalized);
}

function pickTransactionDetails(input = {}) {
  return Object.freeze(Object.fromEntries(
    TRANSACTION_DETAIL_SECTIONS
      .map((section) => [section.id, normalizeString(input[section.id])])
      .filter(([fieldId, value]) => TRANSACTION_DETAIL_VALUES[fieldId].has(value)),
  ));
}

function normalizeDealEconomicsStatus(value) {
  const status = normalizeString(value);
  return DEAL_ECONOMICS_STATUS_VALUES.has(status) ? status : "not_available";
}

function normalizeDealEconomicsCurrency(value) {
  const currency = normalizeString(value);
  return DEAL_ECONOMICS_CURRENCY_VALUES.has(currency) ? currency : "";
}

function parseNonNegativeNumber(value) {
  const text = value == null ? "" : String(value).trim();
  if (!text) return { provided: false, valid: true, value: null };
  const number = Number(text);
  return {
    provided: true,
    valid: Number.isFinite(number) && number >= 0,
    value: Number.isFinite(number) && number >= 0 ? number : null,
  };
}

function parseNonNegativeInteger(value) {
  const text = value == null ? "" : String(value).trim();
  if (!text) return { provided: false, valid: true, value: null };
  if (!/^\d+$/.test(text)) return { provided: true, valid: false, value: null };
  const number = Number(text);
  const valid = Number.isSafeInteger(number) && number >= 0;
  return {
    provided: true,
    valid,
    value: valid ? number : null,
  };
}

function normalizeDealEconomicsInput(input, config, missing) {
  const status = normalizeDealEconomicsStatus(input[config.statusKey]);
  const currency = normalizeDealEconomicsCurrency(input[config.currencyKey]);
  const parsedValue = parseNonNegativeNumber(input[config.valueKey]);
  const requiresValue = status === "confirmed" || status === "estimated";

  const normalized = {
    [config.valueKey]: requiresValue ? parsedValue.value : null,
    [config.currencyKey]: requiresValue ? currency : "",
    [config.statusKey]: status,
  };

  if (parsedValue.provided && !parsedValue.valid) {
    missing.push(config.valueKey);
  }

  if (requiresValue) {
    if (!parsedValue.provided || !parsedValue.valid) {
      if (!missing.includes(config.valueKey)) missing.push(config.valueKey);
    }
    if (!currency) {
      missing.push(config.currencyKey);
    }
  }

  return normalized;
}

function normalizeKeyPersonnelAtRisk(input, missing) {
  const parsedValue = parseNonNegativeInteger(input.keyPersonnelAtRisk);
  if (parsedValue.provided && !parsedValue.valid) {
    missing.push("keyPersonnelAtRisk");
  }
  return { keyPersonnelAtRisk: parsedValue.provided && parsedValue.valid ? parsedValue.value : null };
}

export function validateDealEconomics(input = {}) {
  const missing = [];
  const inputEnterpriseCurrency = normalizeDealEconomicsCurrency(input.enterpriseValueCurrency);
  const inputCompensationCurrency = normalizeDealEconomicsCurrency(input.compensationCurrency);
  const enterpriseValue = normalizeDealEconomicsInput(input, {
    valueKey: "enterpriseValue",
    currencyKey: "enterpriseValueCurrency",
    statusKey: "enterpriseValueStatus",
  }, missing);
  const compensation = normalizeDealEconomicsInput(input, {
    valueKey: "compensationAssumptions",
    currencyKey: "compensationCurrency",
    statusKey: "compensationStatus",
  }, missing);
  const keyPersonnel = normalizeKeyPersonnelAtRisk(input, missing);
  if (
    inputEnterpriseCurrency
    && inputCompensationCurrency
    && inputEnterpriseCurrency !== inputCompensationCurrency
  ) {
    missing.push(DEAL_ECONOMICS_SINGLE_CURRENCY_MISSING_FIELD);
  }

  return Object.freeze({
    valid: missing.length === 0,
    missing: Object.freeze(missing),
    normalized: Object.freeze({
      ...enterpriseValue,
      ...keyPersonnel,
      ...compensation,
    }),
  });
}

function pickDealEconomics(input = {}) {
  return validateDealEconomics(input).normalized;
}

export function validateDealIdentity(input = {}) {
  const normalized = {};
  const missing = [];

  for (const fieldId of CANONICAL_DEAL_CONTEXT_FIELD_IDS) {
    const value = normalizeString(input[fieldId]);
    if (DEAL_IDENTITY_TEXT_FIELD_SET.has(fieldId)) {
      if (!value) {
        missing.push(fieldId);
        continue;
      }
      normalized[fieldId] = value;
      continue;
    }

    const field = DEAL_IDENTITY_OPTION_FIELD_BY_ID[fieldId];
    if (!field?.values.has(value)) {
      missing.push(fieldId);
      continue;
    }
    normalized[fieldId] = value;
  }

  return Object.freeze({
    valid: missing.length === 0,
    missing: Object.freeze(missing),
    normalized: Object.freeze(normalized),
  });
}

export function validateAcquisitionMotive(input = {}) {
  const normalized = {};
  const missing = [];
  const acquisitionMotive = acquisitionMotiveForDealType(input.dealType) || normalizeString(input.acquisitionMotive);

  if (!ACQUISITION_MOTIVE_VALUES.has(acquisitionMotive)) {
    missing.push("acquisitionMotive");
  } else {
    normalized.acquisitionMotive = acquisitionMotive;
  }

  const competitorPreservation = normalizeString(input.competitorPreservation);
  if (COMPETITOR_PRESERVATION_VALUES.has(competitorPreservation)) {
    normalized.competitorPreservation = competitorPreservation;
  }

  return Object.freeze({
    valid: missing.length === 0,
    missing: Object.freeze(missing),
    normalized: Object.freeze(normalized),
  });
}

export function validateDealStartContext(input = {}) {
  const identityValidation = validateDealIdentity(input);
  const motiveValidation = identityValidation.normalized.dealType
    ? validateAcquisitionMotive({ ...input, dealType: identityValidation.normalized.dealType })
    : Object.freeze({ valid: true, missing: Object.freeze([]), normalized: Object.freeze({}) });
  const missing = [...identityValidation.missing, ...motiveValidation.missing];

  return Object.freeze({
    valid: missing.length === 0,
    missing: Object.freeze(missing),
    normalized: Object.freeze({
      ...identityValidation.normalized,
      ...motiveValidation.normalized,
    }),
  });
}

export function validateTransactionDetails(input = {}) {
  const normalized = {};
  const missing = [];

  for (const section of TRANSACTION_DETAIL_SECTIONS) {
    const value = normalizeString(input[section.id]);
    if (!TRANSACTION_DETAIL_VALUES[section.id].has(value)) {
      missing.push(section.id);
      continue;
    }
    normalized[section.id] = value;
  }

  return Object.freeze({
    valid: missing.length === 0,
    missing: Object.freeze(missing),
    normalized: Object.freeze(normalized),
  });
}

export function validateDealContext(input = {}) {
  const startValidation = validateDealStartContext(input);
  const detailsValidation = validateTransactionDetails(input);
  const economicsValidation = validateDealEconomics(input);
  const missing = [...startValidation.missing, ...detailsValidation.missing, ...economicsValidation.missing];

  return Object.freeze({
    valid: missing.length === 0,
    missing: Object.freeze(missing),
    normalized: Object.freeze({
      ...startValidation.normalized,
      ...detailsValidation.normalized,
      ...economicsValidation.normalized,
    }),
  });
}

export function attachAcquisitionMotive(session, input, storedAt = new Date().toISOString()) {
  const validation = validateDealStartContext(input);
  const existingDetails = pickTransactionDetails(session?.dealContext?.data ?? {});
  const existingIdentity = pickDealIdentity(session?.dealContext?.data ?? {});
  const existingEconomics = pickDealEconomics(session?.dealContext?.data ?? {});
  const requiresTransactionDetails = validation.valid && requiresAcquirerTransactionDetails(validation.normalized);
  const nextRoute = validation.valid ? nextRouteForDealStart(validation.normalized) : null;

  return Object.freeze({
    session: Object.freeze({
      ...(session ?? {}),
      dealContext: validation.valid
        ? Object.freeze({
            completed: !requiresTransactionDetails,
            step: requiresTransactionDetails ? "acquirer-transaction-details" : "respondent-routing",
            nextRoute,
            storedAt,
            data: Object.freeze({
              ...existingIdentity,
              ...validation.normalized,
              ...existingDetails,
              ...existingEconomics,
            }),
          })
        : Object.freeze({
            completed: false,
            missing: validation.missing,
            data: null,
          }),
    }),
    validation,
  });
}

export function attachDealContext(session, input, storedAt = new Date().toISOString()) {
  const validation = validateDealContext(input);
  return Object.freeze({
    session: Object.freeze({
      ...(session ?? {}),
      dealContext: validation.valid
        ? Object.freeze({
            completed: true,
            nextRoute: "/screen-4-promise",
            storedAt,
            data: validation.normalized,
          })
        : Object.freeze({
            completed: false,
            missing: validation.missing,
            data: null,
          }),
    }),
    validation,
  });
}

export function isAcquirerModuleSourceLoaded(data = ACQUIRER_TRACK_DATA) {
  return Boolean(
    data?.acquirerModule?.source === "ST_Acquirer_Environment_Module.xlsx"
      && data?.acquirerModule?.worksheet === "3_Screening"
      && data.acquirerModule.questionCount >= 11
      && Array.isArray(data.acquirerModule.questions)
      && data.acquirerModule.questions.length === data.acquirerModule.questionCount
      && data.acquirerModule.questions.every((question) => question.options.length >= 4),
  );
}

export function canStartAcquirerModule(session) {
  const dealContext = session?.dealContext?.data ?? {};
  return Boolean(
    session?.dealContext?.completed
      && isAcquirerSideRespondent(dealContext.respondentSide)
      && isAcquirerModuleSourceLoaded(),
  );
}

function addHours(isoDate, hours) {
  return new Date(new Date(isoDate).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function hashValue(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function scoreAcquirerModule(answers = {}, data = ACQUIRER_TRACK_DATA) {
  const score = scoreLayeredEvidenceQuestionSet(data.acquirerModule.questions, answers, {
    environmentCodes: ACQUIRER_ENVIRONMENT_CODES,
    moduleId: "acquirer_environment",
  });
  return Object.freeze({
    ...score,
    respondentCount: 1,
  });
}

export function scoreCombinedAcquirerModule(primaryAnswers = {}, verificationAnswers = {}, data = ACQUIRER_TRACK_DATA) {
  const score = scoreLayeredEvidenceQuestionSets(
    [
      { id: "primary", respondentId: "primary", questions: data.acquirerModule.questions, answers: primaryAnswers },
      { id: "verification", respondentId: "verification", questions: data.acquirerModule.questions, answers: verificationAnswers },
    ],
    {
      environmentCodes: ACQUIRER_ENVIRONMENT_CODES,
      moduleId: "acquirer_environment_combined",
    },
  );
  return Object.freeze({
    ...score,
    respondentCount: 2,
    verificationIncluded: true,
  });
}

export function attachAcquirerModuleResult(session, answers, scoredAt = new Date().toISOString()) {
  const score = scoreAcquirerModule(answers);
  const classificationValidation = validateEvidenceClassifiedAnswers(ACQUIRER_TRACK_DATA.acquirerModule.questions, answers);
  return Object.freeze({
    session: Object.freeze({
      ...(session ?? {}),
      acquirer2A: Object.freeze({
        completed: score.valid && classificationValidation.valid,
        storedAt: scoredAt,
        answers: Object.freeze({ ...answers }),
        classificationValidation,
        score,
      }),
    }),
    score,
  });
}

export function requiresAcquirerVerification(session) {
  const score = session?.acquirer2A?.originalScore ?? session?.acquirer2A?.score;
  return Boolean(session?.acquirer2A?.completed && (score?.signalStrength === "weak" || score?.coPresence));
}

export function isAcquirerVerificationComplete(session) {
  return Boolean(session?.acquirerVerification?.completed && session?.acquirer2A?.score?.verificationIncluded);
}

export function canContinueToTargetObservationSetup(session) {
  return Boolean(
    session?.dealContext?.completed
      && isAcquirerSideRespondent(session?.dealContext?.data?.respondentSide)
      && session?.acquirer2A?.completed,
  );
}

export function hashAcquirerVerificationCode(code, acquirerVerificationSessionId, assessmentSessionId) {
  return hashValue(`${acquirerVerificationSessionId}:${assessmentSessionId}:${code}`);
}

export function generateAcquirerVerificationCode(random = Math.random) {
  return String(100000 + Math.floor(random() * 900000)).slice(0, 6);
}

export function buildAcquirerVerificationSurveyLink({
  basePath = "/screen-6-acquirer-verification",
  acquirerVerificationSessionId,
  assessmentSessionId,
  codeHash,
  createdAt,
  expiresAt,
}) {
  const params = new URLSearchParams();
  params.set("acquirerVerificationSessionId", acquirerVerificationSessionId);
  params.set("assessmentSessionId", assessmentSessionId);
  params.set("codeHash", codeHash);
  params.set("createdAt", createdAt);
  params.set("expiresAt", expiresAt);
  return `${basePath}?${params.toString()}`;
}

export function acquirerVerificationInviteFromLinkParams(params, basePath = "/screen-6-acquirer-verification") {
  const acquirerVerificationSessionId = params?.get("acquirerVerificationSessionId") ?? "";
  const assessmentSessionId = params?.get("assessmentSessionId") ?? "";
  const codeHash = params?.get("codeHash") ?? "";
  const createdAt = params?.get("createdAt") ?? "";
  const expiresAt = params?.get("expiresAt") ?? "";

  if (!acquirerVerificationSessionId || !assessmentSessionId || !codeHash || !createdAt || !expiresAt) return null;

  return Object.freeze({
    acquirerVerificationSessionId,
    assessmentSessionId,
    surveyLink: buildAcquirerVerificationSurveyLink({ basePath, acquirerVerificationSessionId, assessmentSessionId, codeHash, createdAt, expiresAt }),
    digitalCode: "",
    codeHash,
    createdAt,
    expiresAt,
    ttlHours: ACQUIRER_VERIFICATION_INVITE_TTL_HOURS,
    codeDigits: ACQUIRER_VERIFICATION_DIGITAL_CODE_DIGITS,
    completed: false,
    revoked: false,
  });
}

export function createAcquirerVerificationInvite(session, options = {}) {
  if (!requiresAcquirerVerification(session) || isAcquirerVerificationComplete(session)) {
    return Object.freeze({
      ok: false,
      reason: "weak-acquirer-signal-required",
      invite: null,
    });
  }

  const createdAt = options.createdAt ?? new Date().toISOString();
  const digitalCode = options.digitalCode ?? generateAcquirerVerificationCode(options.random);
  const assessmentSessionId = options.assessmentSessionId ?? session?.sessionId ?? "public-preview-session";
  const acquirerVerificationSessionId = options.acquirerVerificationSessionId ?? `acqv-${Date.parse(createdAt)}-${digitalCode}`;
  const expiresAt = options.expiresAt ?? addHours(createdAt, ACQUIRER_VERIFICATION_INVITE_TTL_HOURS);
  const basePath = options.basePath ?? "/screen-6-acquirer-verification";
  const codeHash = hashAcquirerVerificationCode(digitalCode, acquirerVerificationSessionId, assessmentSessionId);
  const surveyLink = buildAcquirerVerificationSurveyLink({ basePath, acquirerVerificationSessionId, assessmentSessionId, codeHash, createdAt, expiresAt });
  const invite = Object.freeze({
    acquirerVerificationSessionId,
    assessmentSessionId,
    surveyLink,
    digitalCode,
    codeHash,
    createdAt,
    expiresAt,
    ttlHours: ACQUIRER_VERIFICATION_INVITE_TTL_HOURS,
    codeDigits: ACQUIRER_VERIFICATION_DIGITAL_CODE_DIGITS,
    completed: false,
    revoked: false,
  });

  return Object.freeze({
    ok: true,
    invite,
    session: Object.freeze({
      ...(session ?? {}),
      acquirerVerificationInvite: invite,
    }),
  });
}

export function verifyAcquirerVerificationInvite(invite, code, now = new Date().toISOString()) {
  const normalizedCode = typeof code === "string" ? code.trim() : "";
  if (!invite) return Object.freeze({ ok: false, status: "not-found" });
  if (invite.revoked) return Object.freeze({ ok: false, status: "revoked" });
  if (invite.completed) return Object.freeze({ ok: false, status: "completed" });
  if (new Date(now).getTime() > new Date(invite.expiresAt).getTime()) return Object.freeze({ ok: false, status: "expired" });
  if (!/^\d{6}$/.test(normalizedCode)) return Object.freeze({ ok: false, status: "invalid-format" });

  const expectedHash = hashAcquirerVerificationCode(normalizedCode, invite.acquirerVerificationSessionId, invite.assessmentSessionId);
  if (expectedHash !== invite.codeHash) return Object.freeze({ ok: false, status: "wrong-code" });

  return Object.freeze({
    ok: true,
    status: "verified",
    verificationToken: `verified-${invite.acquirerVerificationSessionId}`,
  });
}

export function completeAcquirerVerificationInvite(invite, answers, completedAt = new Date().toISOString()) {
  const score = scoreAcquirerModule(answers);
  const classificationValidation = validateEvidenceClassifiedAnswers(ACQUIRER_TRACK_DATA.acquirerModule.questions, answers);
  if (!invite || invite.revoked || invite.completed || !score.valid || !classificationValidation.valid) {
    return Object.freeze({
      ok: false,
      reason: "acquirer-verification-invite-not-completable",
      invite,
      classificationValidation,
    });
  }

  const acquirerVerification = Object.freeze({
    completed: true,
    storedAt: completedAt,
    answers: Object.freeze({ ...answers }),
    classificationValidation,
    score,
  });

  return Object.freeze({
    ok: true,
    invite: Object.freeze({
      ...invite,
      completed: true,
      completedAt,
      acquirerVerification,
    }),
  });
}

export function attachAcquirerVerificationCompletion(currentSession, completedInvite) {
  if (!completedInvite?.completed || !completedInvite.acquirerVerification?.completed) return currentSession;
  if (currentSession?.sessionId !== completedInvite.assessmentSessionId) return currentSession;
  if (!currentSession?.acquirer2A?.completed) return currentSession;

  const originalScore = currentSession.acquirer2A.originalScore ?? currentSession.acquirer2A.score;
  const combinedScore = scoreCombinedAcquirerModule(
    currentSession.acquirer2A.answers,
    completedInvite.acquirerVerification.answers,
  );
  const mergedInvite = Object.freeze({
    ...(currentSession.acquirerVerificationInvite ?? {}),
    ...completedInvite,
    digitalCode: currentSession.acquirerVerificationInvite?.digitalCode ?? completedInvite.digitalCode ?? "",
  });

  return Object.freeze({
    ...currentSession,
    acquirerVerificationInvite: mergedInvite,
    acquirerVerification: completedInvite.acquirerVerification,
    acquirer2A: Object.freeze({
      ...currentSession.acquirer2A,
      originalScore,
      score: combinedScore,
      verificationCompleted: true,
    }),
  });
}
