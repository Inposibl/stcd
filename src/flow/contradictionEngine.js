export const CONTRADICTION_ENGINE_VERSION = "newlogic-contradiction-engine-v1";

const INDIRECT_EVIDENCE_TYPES = new Set(["reported_by_others", "inference", "hypothetical", "unknown"]);
const INDIRECT_KNOWLEDGE_LEVELS = new Set(["second_hand", "pattern_based", "speculative", "not_known"]);
const LOW_CONFIDENCE_VALUES = new Set(["low", "cannot_determine"]);
const HIGH_RISK_FLAGS = new Set([
  "contradicted_by_respondent",
  "contradicted_by_document",
  "evasive",
  "speaks_for_group_without_access",
  "hypothetical",
  "structurally_unlikely",
  "no_direct_knowledge",
]);

const SOURCE_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "acquirer", label: "Acquirer self-observation", role: "acquirer" }),
  Object.freeze({ id: "targetObservation", label: "Target observed by acquirer", role: "target-observer" }),
  Object.freeze({ id: "targetDiagnostic", label: "Target current diagnostic", role: "target-diagnostic" }),
  Object.freeze({ id: "targetSelfAssessment", label: "Formal target self-description", role: "target" }),
]);

function round(value) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

function compact(value) {
  return typeof value === "string" ? value.trim() : "";
}

function primarySignal(score) {
  return compact(score?.primaryEnvironmentCode ?? score?.topEnvironmentCode ?? score?.primarySignalEnvironmentCode);
}

function secondarySignal(score) {
  return compact(score?.secondaryEnvironmentCode ?? score?.secondarySignalEnvironmentCode);
}

function sourceScore(session, sourceId) {
  if (sourceId === "acquirer") return session?.acquirer2A?.score ?? null;
  if (sourceId === "targetObservation") return session?.targetObservation?.score ?? null;
  if (sourceId === "targetDiagnostic") return session?.target2B?.finalScore ?? null;
  if (sourceId === "targetSelfAssessment") return session?.targetSelfAssessment?.score ?? null;
  return null;
}

function sourceCompleted(session, sourceId) {
  if (sourceId === "acquirer") return Boolean(session?.acquirer2A?.completed);
  if (sourceId === "targetObservation") return Boolean(session?.targetObservation?.completed);
  if (sourceId === "targetDiagnostic") return Boolean(session?.target2B?.completed);
  if (sourceId === "targetSelfAssessment") return Boolean(session?.targetSelfAssessment?.completed);
  return false;
}

function answeredResponses(score) {
  return Array.isArray(score?.questionResponses)
    ? score.questionResponses.filter((response) => !response?.missing)
    : [];
}

function reliabilityFlags(response) {
  return Array.isArray(response?.reliabilityFlags) ? response.reliabilityFlags.filter(Boolean) : [];
}

function isIndirectResponse(response) {
  return (
    response?.directObservationGate === "no"
    || INDIRECT_EVIDENCE_TYPES.has(response?.evidenceType)
    || INDIRECT_KNOWLEDGE_LEVELS.has(response?.knowledgeLevel)
    || reliabilityFlags(response).includes("no_direct_knowledge")
  );
}

function drivesSignal(response, signalCode) {
  return Boolean(
    signalCode
      && response?.weight > 0
      && Array.isArray(response.signalCodes)
      && response.signalCodes.includes(signalCode),
  );
}

function hasHighRiskMismatch(response) {
  const flags = reliabilityFlags(response);
  if (response?.directObservationGate === "yes" && INDIRECT_EVIDENCE_TYPES.has(response?.evidenceType)) return true;
  if (response?.directObservationGate === "no" && response?.evidenceType === "direct_observation") return true;
  if (response?.evidenceType === "direct_observation" && INDIRECT_KNOWLEDGE_LEVELS.has(response?.knowledgeLevel)) return true;
  if (response?.confidence === "high" && (response?.evidenceType === "unknown" || response?.evidenceType === "hypothetical")) return true;
  if (response?.confidence === "high" && (response?.knowledgeLevel === "speculative" || response?.knowledgeLevel === "not_known")) return true;
  return flags.some((flag) => HIGH_RISK_FLAGS.has(flag));
}

function flagCounts(responses) {
  const counts = new Map();
  for (const response of responses) {
    for (const flag of reliabilityFlags(response)) {
      counts.set(flag, (counts.get(flag) ?? 0) + 1);
    }
  }
  return Object.freeze(
    [...counts.entries()]
      .map(([flag, count]) => Object.freeze({ flag, count }))
      .sort((left, right) => right.count - left.count || left.flag.localeCompare(right.flag)),
  );
}

function sourceSummary(session, definition) {
  const score = sourceScore(session, definition.id);
  const responses = answeredResponses(score);
  const signalCode = primarySignal(score);
  const drivingResponses = responses.filter((response) => drivesSignal(response, signalCode));
  const indirectDrivingResponses = drivingResponses.filter(isIndirectResponse);
  const lowConfidenceDrivingResponses = drivingResponses.filter((response) => LOW_CONFIDENCE_VALUES.has(response?.confidence));
  const flaggedResponses = responses.filter((response) => reliabilityFlags(response).length > 0);
  const noDirectKnowledgeResponses = responses.filter((response) => (
    response?.directObservationGate === "no"
    || response?.knowledgeLevel === "not_known"
    || reliabilityFlags(response).includes("no_direct_knowledge")
  ));
  const highRiskMismatchResponses = responses.filter(hasHighRiskMismatch);
  const evidenceQuality = score?.evidenceQuality ?? {};

  return Object.freeze({
    ...definition,
    completed: sourceCompleted(session, definition.id),
    primarySignalCode: signalCode || null,
    secondarySignalCode: secondarySignal(score) || null,
    signalStrength: score?.signalStrength ?? null,
    signalBadge: score?.signalBadge ?? null,
    confidence: score?.confidence ?? evidenceQuality.confidence ?? null,
    answeredCount: responses.length,
    missingQuestionCount: Array.isArray(score?.missingQuestionIds) ? score.missingQuestionIds.length : 0,
    effectiveAnswerCount: score?.effectiveAnswerCount ?? drivingResponses.length,
    totalEvidenceWeight: score?.totalEvidenceWeight ?? 0,
    drivingAnswerCount: drivingResponses.length,
    indirectDrivingCount: indirectDrivingResponses.length,
    indirectDrivingRate: drivingResponses.length ? round(indirectDrivingResponses.length / drivingResponses.length) : 0,
    lowConfidenceDrivingCount: lowConfidenceDrivingResponses.length,
    reliabilityFlagCount: flaggedResponses.length,
    reliabilityFlagRate: responses.length ? round(flaggedResponses.length / responses.length) : 0,
    noDirectKnowledgeCount: noDirectKnowledgeResponses.length,
    noDirectKnowledgeRate: responses.length ? round(noDirectKnowledgeResponses.length / responses.length) : 0,
    highRiskMismatchCount: highRiskMismatchResponses.length,
    highRiskMismatchRate: responses.length ? round(highRiskMismatchResponses.length / responses.length) : 0,
    evidenceSupportedShare: evidenceQuality.evidenceSupportedShare ?? 0,
    directObservationCount: evidenceQuality.directObservationCount ?? 0,
    documentSupportedCount: evidenceQuality.documentSupportedCount ?? 0,
    topReliabilityFlags: flagCounts(responses).slice(0, 4),
  });
}

function severityForPair(left, right) {
  if (left.confidence === "high" && right.confidence === "high") return "high";
  if (
    LOW_CONFIDENCE_VALUES.has(left.confidence)
    || LOW_CONFIDENCE_VALUES.has(right.confidence)
    || left.signalStrength === "weak"
    || right.signalStrength === "weak"
  ) {
    return "medium";
  }
  return "high";
}

function severityForRate(rate, highThreshold, mediumThreshold) {
  if (rate >= highThreshold) return "high";
  if (rate >= mediumThreshold) return "medium";
  return "low";
}

function finding(id, input) {
  return Object.freeze({
    id,
    severity: input.severity,
    type: input.type,
    title: input.title,
    explanation: input.explanation,
    leftSource: input.leftSource ?? null,
    rightSource: input.rightSource ?? null,
    leftSignalCode: input.leftSignalCode ?? null,
    rightSignalCode: input.rightSignalCode ?? null,
    affectedSources: Object.freeze(input.affectedSources ?? []),
    riskCategory: input.riskCategory,
    evidenceBasis: input.evidenceBasis,
    metrics: Object.freeze(input.metrics ?? {}),
    requiresAnalystReview: true,
  });
}

function addPairFinding(findings, id, left, right, input) {
  if (!left?.primarySignalCode || !right?.primarySignalCode) {
    return;
  }
  if (left.primarySignalCode === right.primarySignalCode) {
    return;
  }

  findings.push(finding(id, {
    ...input,
    severity: severityForPair(left, right),
    leftSource: left.label,
    rightSource: right.label,
    leftSignalCode: left.primarySignalCode,
    rightSignalCode: right.primarySignalCode,
    affectedSources: [left.id, right.id],
    evidenceBasis: `${left.label} and ${right.label} produce different primary operating-environment signals.`,
    metrics: {
      leftConfidence: left.confidence,
      rightConfidence: right.confidence,
      leftSignalStrength: left.signalStrength,
      rightSignalStrength: right.signalStrength,
    },
  }));
}

function addSourceEvidenceFindings(findings, source) {
  if (!source.completed || !source.primarySignalCode) return;

  if (LOW_CONFIDENCE_VALUES.has(source.confidence)) {
    findings.push(finding(`${source.id}-low-confidence-primary`, {
      severity: source.confidence === "cannot_determine" ? "high" : "medium",
      type: "low_confidence_primary_signal",
      title: "Low-confidence evidence is driving a primary signal",
      explanation: `${source.label} produced a primary signal, but the evidence classification does not support treating it as a settled fact.`,
      affectedSources: [source.id],
      riskCategory: "Evidence Reliability",
      evidenceBasis: "Primary signal has low or cannot-determine confidence.",
      metrics: {
        confidence: source.confidence,
        evidenceSupportedShare: source.evidenceSupportedShare,
        totalEvidenceWeight: source.totalEvidenceWeight,
      },
    }));
  }

  if (source.indirectDrivingRate >= 0.35) {
    findings.push(finding(`${source.id}-indirect-driving-score`, {
      severity: severityForRate(source.indirectDrivingRate, 0.55, 0.35),
      type: "indirect_answers_driving_score",
      title: "Indirect answers are driving the scored pattern",
      explanation: `${source.label} relies materially on reported, inferred, hypothetical, or no-direct-knowledge answers for the current signal.`,
      affectedSources: [source.id],
      riskCategory: "Evidence Reliability",
      evidenceBasis: "A material share of score-driving answers are not direct or document-supported observations.",
      metrics: {
        indirectDrivingRate: source.indirectDrivingRate,
        indirectDrivingCount: source.indirectDrivingCount,
        drivingAnswerCount: source.drivingAnswerCount,
      },
    }));
  }

  if (source.reliabilityFlagRate >= 0.25) {
    findings.push(finding(`${source.id}-reliability-flag-concentration`, {
      severity: severityForRate(source.reliabilityFlagRate, 0.4, 0.25),
      type: "reliability_flag_concentration",
      title: "Reliability flags are concentrated in this module",
      explanation: `${source.label} contains enough reliability flags that the analyst should inspect whether the answers are evasive, overgeneralized, contradicted, or outside the respondent's access.`,
      affectedSources: [source.id],
      riskCategory: "Answer Reliability",
      evidenceBasis: "Reliability flag rate exceeds the review threshold.",
      metrics: {
        reliabilityFlagRate: source.reliabilityFlagRate,
        reliabilityFlagCount: source.reliabilityFlagCount,
        answeredCount: source.answeredCount,
        topReliabilityFlags: source.topReliabilityFlags,
      },
    }));
  }

  if (source.noDirectKnowledgeRate >= 0.25) {
    findings.push(finding(`${source.id}-no-direct-knowledge-concentration`, {
      severity: severityForRate(source.noDirectKnowledgeRate, 0.5, 0.25),
      type: "no_direct_knowledge_concentration",
      title: "No-direct-knowledge answers are concentrated",
      explanation: `${source.label} includes a material share of answers where the respondent could not claim direct knowledge.`,
      affectedSources: [source.id],
      riskCategory: "Evidence Coverage",
      evidenceBasis: "No-direct-knowledge answers exceed the review threshold.",
      metrics: {
        noDirectKnowledgeRate: source.noDirectKnowledgeRate,
        noDirectKnowledgeCount: source.noDirectKnowledgeCount,
        answeredCount: source.answeredCount,
      },
    }));
  }

  if (source.highRiskMismatchRate >= 0.15) {
    findings.push(finding(`${source.id}-evidence-basis-mismatch`, {
      severity: severityForRate(source.highRiskMismatchRate, 0.3, 0.15),
      type: "evidence_basis_mismatch",
      title: `${source.label}: evidence basis mismatch`,
      explanation: `${source.label} contains answers where confidence, evidence type, knowledge level, or reliability flags do not fit the strength of the stated answer.`,
      affectedSources: [source.id],
      riskCategory: "Evidence Reliability",
      evidenceBasis: "High-risk answer classification mismatches exceed the review threshold.",
      metrics: {
        highRiskMismatchRate: source.highRiskMismatchRate,
        highRiskMismatchCount: source.highRiskMismatchCount,
        answeredCount: source.answeredCount,
      },
    }));
  }
}

function severityRank(value) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

function typeRank(value) {
  const ranks = {
    acquirer_target_disagreement: 10,
    target_observed_self_divergence: 9,
    target_observed_diagnostic_divergence: 8,
    target_diagnostic_self_divergence: 7,
    evidence_basis_mismatch: 6,
    reliability_flag_concentration: 5,
    no_direct_knowledge_concentration: 4,
    low_confidence_primary_signal: 3,
    indirect_answers_driving_score: 2,
  };
  return ranks[value] ?? 0;
}

function sortFindings(findings) {
  return Object.freeze([...findings].sort((left, right) => (
    severityRank(right.severity) - severityRank(left.severity)
    || typeRank(right.type) - typeRank(left.type)
    || left.id.localeCompare(right.id)
  )));
}

function summaryFor(findings, sources) {
  const highSeverityCount = findings.filter((item) => item.severity === "high").length;
  const mediumSeverityCount = findings.filter((item) => item.severity === "medium").length;
  return Object.freeze({
    findingCount: findings.length,
    highSeverityCount,
    mediumSeverityCount,
    contradictionCount: findings.filter((item) => item.type.includes("divergence") || item.type.includes("disagreement")).length,
    reliabilityRiskCount: findings.filter((item) => item.riskCategory === "Evidence Reliability" || item.riskCategory === "Answer Reliability").length,
    missingEvidenceCount: sources.filter((source) => source.missingQuestionCount > 0 || source.noDirectKnowledgeRate >= 0.25).length,
    analystReviewRequired: findings.length > 0,
  });
}

export function buildContradictionReport(session = {}, options = {}) {
  const sources = Object.freeze(Object.fromEntries(
    SOURCE_DEFINITIONS.map((definition) => [definition.id, sourceSummary(session, definition)]),
  ));
  const findings = [];

  addPairFinding(findings, "acquirer-target-diagnostic-disagreement", sources.acquirer, sources.targetDiagnostic, {
    type: "acquirer_target_disagreement",
    title: "Acquirer and target operating assumptions disagree",
    explanation: "The acquirer-side environment read and the structured target diagnostic point to different operating assumptions. This is an integration-fracture signal, not a statistical error to average away.",
    riskCategory: "Integration Fracture Risk",
  });

  addPairFinding(findings, "acquirer-target-self-disagreement", sources.acquirer, sources.targetSelfAssessment, {
    type: "acquirer_target_disagreement",
    title: "Acquirer and formal target self-description disagree",
    explanation: "The acquirer-side environment read and the target respondent's self-description point to different operating assumptions. Analyst review should determine whether this is true misfit, positioning, or respondent access bias.",
    riskCategory: "Integration Fracture Risk",
  });

  addPairFinding(findings, "target-observed-diagnostic-divergence", sources.targetObservation, sources.targetDiagnostic, {
    type: "target_observed_diagnostic_divergence",
    title: "Observed target behavior differs from structured target diagnostic",
    explanation: "The acquirer-observed target pattern and the target diagnostic pattern disagree. This may indicate observation bias, incomplete access, or a target system that behaves differently across contexts.",
    riskCategory: "Target Evidence Divergence",
  });

  addPairFinding(findings, "target-observed-self-divergence", sources.targetObservation, sources.targetSelfAssessment, {
    type: "target_observed_self_divergence",
    title: "Observed target behavior differs from target self-description",
    explanation: "The target self-description does not match the acquirer-side observation. This is a core diligence contradiction and should be reviewed before integration assumptions are finalized.",
    riskCategory: "Target Evidence Divergence",
  });

  addPairFinding(findings, "target-diagnostic-self-divergence", sources.targetDiagnostic, sources.targetSelfAssessment, {
    type: "target_diagnostic_self_divergence",
    title: "Target diagnostic and target self-description disagree",
    explanation: "The target's structured diagnostic output does not match the formal target self-description. Analyst review should test whether the self-report is aspirational, politically safe, or role-limited.",
    riskCategory: "Target Evidence Divergence",
  });

  for (const source of Object.values(sources)) {
    addSourceEvidenceFindings(findings, source);
  }

  const sortedFindings = sortFindings(findings);
  return Object.freeze({
    completed: true,
    version: CONTRADICTION_ENGINE_VERSION,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    summary: summaryFor(sortedFindings, Object.values(sources)),
    sources,
    findings: sortedFindings,
  });
}
