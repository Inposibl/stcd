export const DIRECT_OBSERVATION_GATE_OPTIONS = Object.freeze([
  Object.freeze({
    value: "yes",
    title: "Yes - direct observation",
    description: "I observed the event, decision, or behavior directly.",
  }),
  Object.freeze({
    value: "no",
    title: "No - indirect basis",
    description: "I did not observe it directly; my answer is based on another evidence basis.",
  }),
]);

export const EVIDENCE_TYPE_OPTIONS = Object.freeze([
  Object.freeze({
    value: "direct_observation",
    title: "Direct Observation",
    description: "You personally observed the event, decision, or behavior.",
  }),
  Object.freeze({
    value: "document_supported",
    title: "Document-Supported",
    description: "A specific document or diligence artifact supports the answer.",
  }),
  Object.freeze({
    value: "reported_by_others",
    title: "Reported by Others",
    description: "Another person reported the information to you.",
  }),
  Object.freeze({
    value: "inference",
    title: "Inference",
    description: "You are reasoning from related facts or patterns.",
  }),
  Object.freeze({
    value: "hypothetical",
    title: "Hypothetical",
    description: "No observed case is known; this is an expectation.",
  }),
  Object.freeze({
    value: "unknown",
    title: "Unknown / Cannot Answer",
    description: "You do not have a reliable basis for this answer.",
  }),
]);

export const KNOWLEDGE_LEVEL_OPTIONS = Object.freeze([
  Object.freeze({ value: "first_hand", title: "First-Hand" }),
  Object.freeze({ value: "second_hand", title: "Second-Hand" }),
  Object.freeze({ value: "document_based", title: "Document-Based" }),
  Object.freeze({ value: "pattern_based", title: "Pattern-Based" }),
  Object.freeze({ value: "speculative", title: "Speculative" }),
  Object.freeze({ value: "not_known", title: "Not Known" }),
]);

export const CONFIDENCE_LEVEL_OPTIONS = Object.freeze([
  Object.freeze({ value: "high", title: "High" }),
  Object.freeze({ value: "medium", title: "Medium" }),
  Object.freeze({ value: "low", title: "Low" }),
  Object.freeze({ value: "cannot_determine", title: "Cannot Determine" }),
]);

export const RELIABILITY_FLAG_OPTIONS = Object.freeze([
  Object.freeze({ value: "contradicted_by_respondent", title: "Contradicted by another respondent" }),
  Object.freeze({ value: "contradicted_by_document", title: "Contradicted by document" }),
  Object.freeze({ value: "socially_desirable", title: "Socially desirable response" }),
  Object.freeze({ value: "evasive", title: "Evasive / non-answer" }),
  Object.freeze({ value: "overgeneralized", title: "Overgeneralized" }),
  Object.freeze({ value: "speaks_for_group_without_access", title: "Speaks for group without access" }),
  Object.freeze({ value: "hypothetical", title: "Hypothetical answer" }),
  Object.freeze({ value: "structurally_unlikely", title: "Structurally unlikely event" }),
  Object.freeze({ value: "no_direct_knowledge", title: "No direct knowledge" }),
]);

const DIRECT_OBSERVATION_GATE_VALUES = new Set(DIRECT_OBSERVATION_GATE_OPTIONS.map((option) => option.value));
const EVIDENCE_TYPE_VALUES = new Set(EVIDENCE_TYPE_OPTIONS.map((option) => option.value));
const KNOWLEDGE_LEVEL_VALUES = new Set(KNOWLEDGE_LEVEL_OPTIONS.map((option) => option.value));
const CONFIDENCE_LEVEL_VALUES = new Set(CONFIDENCE_LEVEL_OPTIONS.map((option) => option.value));
const RELIABILITY_FLAG_VALUES = new Set(RELIABILITY_FLAG_OPTIONS.map((option) => option.value));
const INDIRECT_EVIDENCE_TYPES = new Set(["document_supported", "reported_by_others", "inference", "hypothetical", "unknown"]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeReliabilityFlags(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(normalizeString).filter((flag) => RELIABILITY_FLAG_VALUES.has(flag)));
  }
  if (typeof value === "string") {
    return Object.freeze(value.split(",").map(normalizeString).filter((flag) => RELIABILITY_FLAG_VALUES.has(flag)));
  }
  return Object.freeze([]);
}

export function selectedOptionValue(answer) {
  if (answer && typeof answer === "object") {
    return normalizeString(answer.selectedOption ?? answer.option ?? answer.value);
  }
  return normalizeString(answer);
}

export function normalizeEvidenceAnswer(answer) {
  if (answer && typeof answer === "object") {
    return Object.freeze({
      selectedOption: selectedOptionValue(answer),
      directObservationGate: normalizeString(answer.directObservationGate),
      evidenceType: normalizeString(answer.evidenceType),
      knowledgeLevel: normalizeString(answer.knowledgeLevel),
      confidence: normalizeString(answer.confidence),
      reliabilityFlags: normalizeReliabilityFlags(answer.reliabilityFlags),
      reliabilityFlagsAcknowledged: answer.reliabilityFlagsAcknowledged === true,
      source: normalizeString(answer.source) || "structured_answer",
    });
  }

  return Object.freeze({
    selectedOption: selectedOptionValue(answer),
    directObservationGate: "",
    evidenceType: "",
    knowledgeLevel: "",
    confidence: "",
    reliabilityFlags: Object.freeze([]),
    reliabilityFlagsAcknowledged: false,
    source: "structured_answer",
  });
}

function withFlag(flags, flag) {
  return Object.freeze([...new Set([...flags, flag])]);
}

function withoutFlag(flags, flag) {
  return Object.freeze(flags.filter((item) => item !== flag));
}

function clearUnknownEvidenceState(answer, keepEvidenceType = false) {
  const reliabilityFlags = withoutFlag(answer.reliabilityFlags, "no_direct_knowledge");
  return {
    ...answer,
    evidenceType: keepEvidenceType ? answer.evidenceType : "",
    knowledgeLevel: "",
    confidence: "",
    reliabilityFlags,
    reliabilityFlagsAcknowledged: reliabilityFlags.length > 0 ? answer.reliabilityFlagsAcknowledged : false,
  };
}

export function updateEvidenceAnswer(answer, patch = {}) {
  const current = normalizeEvidenceAnswer(answer);
  let next = {
    ...current,
    ...patch,
    selectedOption: normalizeString(patch.selectedOption ?? current.selectedOption),
    directObservationGate: normalizeString(patch.directObservationGate ?? current.directObservationGate),
    evidenceType: normalizeString(patch.evidenceType ?? current.evidenceType),
    knowledgeLevel: normalizeString(patch.knowledgeLevel ?? current.knowledgeLevel),
    confidence: normalizeString(patch.confidence ?? current.confidence),
    reliabilityFlags: patch.reliabilityFlags !== undefined
      ? normalizeReliabilityFlags(patch.reliabilityFlags)
      : current.reliabilityFlags,
    reliabilityFlagsAcknowledged: patch.reliabilityFlagsAcknowledged !== undefined
      ? patch.reliabilityFlagsAcknowledged === true
      : current.reliabilityFlagsAcknowledged,
    source: "structured_answer",
  };

  const selectedNormalOptionAfterUnknown = current.evidenceType === "unknown"
    && patch.selectedOption !== undefined
    && patch.evidenceType === undefined;
  const evidenceTypeChangedFromUnknown = current.evidenceType === "unknown"
    && patch.evidenceType !== undefined
    && next.evidenceType !== "unknown";
  const directGateChangedFromUnknown = current.evidenceType === "unknown"
    && patch.directObservationGate !== undefined
    && next.directObservationGate === "yes"
    && patch.evidenceType === undefined;

  if (selectedNormalOptionAfterUnknown || evidenceTypeChangedFromUnknown || directGateChangedFromUnknown) {
    next = clearUnknownEvidenceState(next, evidenceTypeChangedFromUnknown);
  }

  if (next.evidenceType === "unknown") {
    next = {
      ...next,
      directObservationGate: "no",
      knowledgeLevel: "not_known",
      confidence: "cannot_determine",
      reliabilityFlags: withFlag(next.reliabilityFlags, "no_direct_knowledge"),
      reliabilityFlagsAcknowledged: true,
    };
  }

  return Object.freeze(next);
}

export function toggleReliabilityFlag(answer, flag) {
  const current = normalizeEvidenceAnswer(answer);
  if (!RELIABILITY_FLAG_VALUES.has(flag)) return current;
  const flags = current.reliabilityFlags.includes(flag)
    ? current.reliabilityFlags.filter((item) => item !== flag)
    : [...current.reliabilityFlags, flag];
  return updateEvidenceAnswer(current, {
    reliabilityFlags: flags,
    reliabilityFlagsAcknowledged: flags.length > 0,
  });
}

export function evidenceClassifiedAnswer(optionValue, overrides = {}) {
  return updateEvidenceAnswer(
    {
      selectedOption: optionValue,
      directObservationGate: "yes",
      evidenceType: "direct_observation",
      knowledgeLevel: "first_hand",
      confidence: "high",
      reliabilityFlags: [],
      reliabilityFlagsAcknowledged: true,
    },
    overrides,
  );
}

export function validateEvidenceClassifiedAnswer(answer) {
  const normalized = normalizeEvidenceAnswer(answer);
  const missing = [];

  if (!normalized.selectedOption) missing.push("answer option");
  if (!DIRECT_OBSERVATION_GATE_VALUES.has(normalized.directObservationGate)) missing.push("direct observation gate");
  if (!EVIDENCE_TYPE_VALUES.has(normalized.evidenceType)) missing.push("evidence type");
  if (!KNOWLEDGE_LEVEL_VALUES.has(normalized.knowledgeLevel)) missing.push("knowledge level");
  if (!CONFIDENCE_LEVEL_VALUES.has(normalized.confidence)) missing.push("confidence");
  if (!normalized.reliabilityFlagsAcknowledged) missing.push("reliability flags acknowledgement");

  const consistencyIssues = [];
  if (normalized.directObservationGate === "no" && !INDIRECT_EVIDENCE_TYPES.has(normalized.evidenceType)) {
    consistencyIssues.push("indirect answers cannot use direct-observation or document-supported evidence type");
  }
  if (normalized.directObservationGate === "yes" && normalized.evidenceType === "unknown") {
    consistencyIssues.push("directly observed answers cannot use unknown evidence type");
  }
  if (normalized.evidenceType === "unknown") {
    if (normalized.knowledgeLevel !== "not_known") consistencyIssues.push("unknown evidence requires Not Known knowledge level");
    if (normalized.confidence !== "cannot_determine") consistencyIssues.push("unknown evidence requires Cannot Determine confidence");
  }

  return Object.freeze({
    valid: missing.length === 0 && consistencyIssues.length === 0,
    missing: Object.freeze(missing),
    consistencyIssues: Object.freeze(consistencyIssues),
    normalized,
  });
}

export function validateEvidenceClassifiedAnswers(questions = [], answers = {}) {
  const invalid = questions
    .map((question) => {
      const validation = validateEvidenceClassifiedAnswer(answers[question.id]);
      return validation.valid ? null : Object.freeze({
        questionId: question.id,
        missing: validation.missing,
        consistencyIssues: validation.consistencyIssues,
      });
    })
    .filter(Boolean);

  return Object.freeze({
    valid: invalid.length === 0,
    invalid: Object.freeze(invalid),
  });
}
