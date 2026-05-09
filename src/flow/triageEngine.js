import { buildContradictionReport } from "./contradictionEngine.js";

export const TRIAGE_ENGINE_VERSION = "newlogic-triage-engine-v1";

const TRIAGE_TRIGGER_DEFINITIONS = Object.freeze({
  weak_signal: Object.freeze({
    id: "weak_signal",
    label: "Trigger 1: weak signal",
    severity: "medium",
    meaning: "A candidate signal exists, but evidence is too thin for analyst confirmation without verification.",
    action: "Run accuracy checks, then verify the candidate signal if evidence quality can be improved.",
  }),
  co_presence: Object.freeze({
    id: "co_presence",
    label: "Trigger 2: co-presence",
    severity: "medium",
    meaning: "Two signal directions remain close enough that neither should be treated as dominant.",
    action: "Run accuracy checks and route both candidate directions into analyst-mediated disambiguation.",
  }),
  partial_signal: Object.freeze({
    id: "partial_signal",
    label: "Trigger 3: partial signal",
    severity: "medium",
    meaning: "A signal direction emerged, but coverage or evidence support is incomplete.",
    action: "Run accuracy checks and verify the partial candidate before relying on it.",
  }),
  negative_only: Object.freeze({
    id: "negative_only",
    label: "Trigger 4: negative-only result",
    severity: "high",
    meaning: "No positive candidate signal emerged, so there is no instrument-level candidate to verify.",
    action: "Do not serve a verification instrument. Escalate to practitioner review.",
  }),
  reliability_saturation: Object.freeze({
    id: "reliability_saturation",
    label: "Trigger 5: reliability saturation",
    severity: "high",
    meaning: "The limiting problem is answer reliability, not instrument coverage.",
    action: "Do not serve a verification instrument. Route to analyst review and practitioner consultation if unresolved.",
  }),
  contradiction_blocking: Object.freeze({
    id: "contradiction_blocking",
    label: "Trigger 6: contradiction blocking",
    severity: "critical",
    meaning: "Cross-source contradictions are too severe for another questionnaire to resolve.",
    action: "Do not serve a verification instrument. Route to contradiction triage and practitioner escalation.",
  }),
});

const TIER_RANK = Object.freeze({
  NONE: 0,
  LOW: 1,
  FEW: 2,
  MODERATE: 2,
  MANY: 3,
  HIGH: 4,
  CRITICAL: 5,
  BLOCKING: 6,
});

const CRITICAL_RELIABILITY_FLAGS = new Set([
  "acquisition_framing_contamination",
  "contradicted_by_document",
  "contradiction_with_self",
]);

const HIGH_RELIABILITY_FLAGS = new Set([
  "status_protection",
  "narrative_interest",
  "compensation_exposure",
  "evasive",
  "structurally_unlikely",
  "speaks_for_group_without_access",
]);

const MODERATE_RELIABILITY_FLAGS = new Set([
  "observation_gap",
  "role_inappropriateness",
  "peer_consistency_bias",
  "memory_distance",
  "contradicted_by_respondent",
  "hypothetical",
  "no_direct_knowledge",
  "overgeneralized",
  "socially_desirable",
]);

const INDIRECT_EVIDENCE_TYPES = new Set(["reported_by_others", "inference", "hypothetical", "unknown"]);
const INDIRECT_KNOWLEDGE_LEVELS = new Set(["second_hand", "pattern_based", "speculative", "not_known"]);

function round(value) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

function scoreSignal(score) {
  return score?.primaryEnvironmentCode ?? score?.topEnvironmentCode ?? score?.primarySignalEnvironmentCode ?? null;
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

function responseFlags(response) {
  return Array.isArray(response?.reliabilityFlags) ? response.reliabilityFlags.filter(Boolean) : [];
}

function isIndirectResponse(response) {
  return (
    response?.directObservationGate === "no"
    || INDIRECT_EVIDENCE_TYPES.has(response?.evidenceType)
    || INDIRECT_KNOWLEDGE_LEVELS.has(response?.knowledgeLevel)
    || responseFlags(response).includes("no_direct_knowledge")
  );
}

function sourceMetrics(session, sourceId, label) {
  const score = sourceScore(session, sourceId);
  const responses = answeredResponses(score);
  const primarySignal = scoreSignal(score);
  const drivingResponses = responses.filter((response) => (
    primarySignal
      && response?.weight > 0
      && Array.isArray(response.signalCodes)
      && response.signalCodes.includes(primarySignal)
  ));
  const indirectDrivingCount = drivingResponses.filter(isIndirectResponse).length;
  const evidenceSupportedShare = score?.evidenceQuality?.evidenceSupportedShare ?? 0;
  const reliabilityFlagCount = responses.filter((response) => responseFlags(response).length > 0).length;
  const directNoCount = responses.filter((response) => response?.directObservationGate === "no").length;
  const confidence = score?.confidence ?? score?.evidenceQuality?.confidence ?? null;

  return Object.freeze({
    id: sourceId,
    label,
    completed: sourceCompleted(session, sourceId),
    primarySignal,
    secondarySignal: score?.secondaryEnvironmentCode ?? score?.secondarySignalEnvironmentCode ?? null,
    signalStrength: score?.signalStrength ?? null,
    coPresence: score?.coPresence === true,
    confidence,
    answeredCount: responses.length,
    effectiveAnswerCount: score?.effectiveAnswerCount ?? drivingResponses.length,
    totalEvidenceWeight: score?.totalEvidenceWeight ?? 0,
    evidenceSupportedShare,
    reliabilityFlagCount,
    reliabilityFlagRate: responses.length ? round(reliabilityFlagCount / responses.length) : 0,
    noDirectObservationRate: responses.length ? round(directNoCount / responses.length) : 0,
    indirectDrivingRate: drivingResponses.length ? round(indirectDrivingCount / drivingResponses.length) : 0,
    missingQuestionCount: Array.isArray(score?.missingQuestionIds) ? score.missingQuestionIds.length : 0,
    weakSignal: Boolean(primarySignal && (
      score?.signalStrength === "weak"
      || confidence === "low"
      || confidence === "cannot_determine"
      || (score?.effectiveAnswerCount ?? drivingResponses.length) <= 1
      || (score?.totalEvidenceWeight ?? 0) <= 1
    )),
    partialSignal: Boolean(primarySignal && !score?.coPresence && confidence === "medium"),
    negativeOnly: Boolean(score && !primarySignal && sourceCompleted(session, sourceId)),
    responses,
  });
}

function allSourceMetrics(session) {
  return Object.freeze([
    sourceMetrics(session, "acquirer", "Acquirer self-observation"),
    sourceMetrics(session, "targetObservation", "Target observed by acquirer"),
    sourceMetrics(session, "targetDiagnostic", "Target current diagnostic"),
    sourceMetrics(session, "targetSelfAssessment", "Formal target self-description"),
  ]);
}

function reliabilityCounts(sources) {
  const flags = [];
  let answeredCount = 0;
  for (const source of sources) {
    answeredCount += source.answeredCount;
    for (const response of source.responses) {
      flags.push(...responseFlags(response));
    }
  }

  const flagCount = flags.length;
  const criticalFlagCount = flags.filter((flag) => CRITICAL_RELIABILITY_FLAGS.has(flag)).length;
  const highFlagCount = flags.filter((flag) => HIGH_RELIABILITY_FLAGS.has(flag)).length;
  const moderateFlagCount = flags.filter((flag) => MODERATE_RELIABILITY_FLAGS.has(flag)).length;
  return Object.freeze({
    answeredCount,
    flagCount,
    flagRate: answeredCount ? round(flagCount / answeredCount) : 0,
    criticalFlagCount,
    highFlagCount,
    moderateFlagCount,
  });
}

function reliabilityTierFor(counts) {
  if (counts.criticalFlagCount >= 2) return "CRITICAL";
  if (counts.flagRate > 0.4 || counts.criticalFlagCount >= 1 || counts.highFlagCount >= 3) return "HIGH";
  if (counts.flagRate >= 0.1 || counts.moderateFlagCount >= 2) return "MODERATE";
  return "LOW";
}

function isContradictionFinding(finding) {
  return Boolean(finding?.type?.includes("divergence") || finding?.type?.includes("disagreement"));
}

function contradictionTierFor(contradictionFindings) {
  const count = contradictionFindings.length;
  const criticalCount = contradictionFindings.filter((finding) => finding.severity === "critical").length;
  const highCount = contradictionFindings.filter((finding) => finding.severity === "high").length;
  if (criticalCount >= 1 || count >= 5) return "BLOCKING";
  if (highCount >= 1 || count >= 3) return "MANY";
  if (count >= 1) return "FEW";
  return "NONE";
}

function maxTier(left, right) {
  return (TIER_RANK[left] ?? 0) >= (TIER_RANK[right] ?? 0) ? left : right;
}

function combinedTier(reliabilityTier, contradictionTier) {
  return maxTier(reliabilityTier, contradictionTier);
}

function routeForTier(tier, triggerIds) {
  if (triggerIds.includes("contradiction_blocking") || triggerIds.includes("negative_only") || tier === "BLOCKING" || tier === "CRITICAL") {
    return Object.freeze({
      route: "practitioner_escalation",
      label: "Practitioner escalation required",
      gate: "paid_output_blocked",
      gateLabel: "Do not issue paid output until resolved",
      confidenceCap: "cannot_determine",
      action: "Compile a practitioner brief and resolve the blocking issue before final report issuance.",
    });
  }

  if (tier === "HIGH") {
    return Object.freeze({
      route: "senior_analyst_review",
      label: "Senior analyst review required",
      gate: "paid_output_conditional",
      gateLabel: "Paid output requires senior review",
      confidenceCap: "low",
      action: "Route to analyst workspace with senior review; do not treat raw answers as final evidence.",
    });
  }

  if (tier === "MANY") {
    return Object.freeze({
      route: "priority_analyst_review",
      label: "Priority analyst review",
      gate: "paid_output_conditional",
      gateLabel: "Paid output requires contradiction resolution",
      confidenceCap: "medium",
      action: "Resolve contradictions before using the signal pattern as a final risk input.",
    });
  }

  if (tier === "MODERATE" || tier === "FEW") {
    return Object.freeze({
      route: "standard_analyst_review",
      label: "Standard analyst review with reliability note",
      gate: "analyst_review_required",
      gateLabel: "Analyst review required",
      confidenceCap: "medium",
      action: "Document reliability limits and analyst rationale in the worksheet.",
    });
  }

  return Object.freeze({
    route: "standard_analyst_review",
    label: "Standard analyst review",
    gate: "analyst_review_required",
    gateLabel: "Analyst review required",
    confidenceCap: "high",
    action: "Proceed to analyst worksheet; no triage escalation is active.",
  });
}

function triggerRecord(definition, details = {}) {
  return Object.freeze({
    ...definition,
    details: Object.freeze(details),
  });
}

function activeTriggers(sources, reliabilityTier, contradictionTier, contradictionFindings) {
  const triggers = [];
  const weakSources = sources.filter((source) => source.weakSignal);
  const coPresenceSources = sources.filter((source) => source.coPresence);
  const partialSources = sources.filter((source) => source.partialSignal);
  const negativeOnlySources = sources.filter((source) => source.negativeOnly);

  if (weakSources.length) {
    triggers.push(triggerRecord(TRIAGE_TRIGGER_DEFINITIONS.weak_signal, {
      affectedSources: weakSources.map((source) => source.label),
    }));
  }
  if (coPresenceSources.length) {
    triggers.push(triggerRecord(TRIAGE_TRIGGER_DEFINITIONS.co_presence, {
      affectedSources: coPresenceSources.map((source) => source.label),
    }));
  }
  if (partialSources.length) {
    triggers.push(triggerRecord(TRIAGE_TRIGGER_DEFINITIONS.partial_signal, {
      affectedSources: partialSources.map((source) => source.label),
    }));
  }
  if (negativeOnlySources.length) {
    triggers.push(triggerRecord(TRIAGE_TRIGGER_DEFINITIONS.negative_only, {
      affectedSources: negativeOnlySources.map((source) => source.label),
    }));
  }
  if (reliabilityTier === "HIGH" || reliabilityTier === "CRITICAL") {
    triggers.push(triggerRecord(TRIAGE_TRIGGER_DEFINITIONS.reliability_saturation, {
      reliabilityTier,
    }));
  }
  if (contradictionTier === "BLOCKING") {
    triggers.push(triggerRecord(TRIAGE_TRIGGER_DEFINITIONS.contradiction_blocking, {
      contradictionCount: contradictionFindings.length,
    }));
  }

  return Object.freeze(triggers);
}

function accuracyChecks(sources, reliabilityTier) {
  const checks = [];
  const targetExposure = sources.find((source) => source.id === "targetObservation");
  const noDirectRate = sources.length
    ? Math.max(...sources.map((source) => source.noDirectObservationRate))
    : 0;
  const indirectDrivingRate = sources.length
    ? Math.max(...sources.map((source) => source.indirectDrivingRate))
    : 0;

  checks.push(Object.freeze({
    id: "respondent_tenure",
    label: "Respondent tenure",
    status: targetExposure?.completed ? "review_required" : "unknown",
    result: "Verify that the respondent had enough continuous observation from the stated vantage point.",
  }));
  checks.push(Object.freeze({
    id: "respondent_role",
    label: "Respondent role",
    status: "review_required",
    result: "Confirm the respondent had access to authority mechanisms and resource flows.",
  }));
  checks.push(Object.freeze({
    id: "event_anchored_answers",
    label: "Event-anchored answers",
    status: noDirectRate > 0.25 ? "fail" : "pass",
    result: noDirectRate > 0.25
      ? "A material share of answers were not direct observations."
      : "Direct-observation pattern is not a triage blocker.",
  }));
  checks.push(Object.freeze({
    id: "multiple_respondent_gap",
    label: "Multiple-respondent gap",
    status: "review_required",
    result: "Current public flow preserves each role separately but does not yet provide full multi-respondent coverage.",
  }));
  checks.push(Object.freeze({
    id: "direct_observation_gate",
    label: "Direct-observation gate pattern",
    status: noDirectRate > 0.5 ? "fail" : "pass",
    result: noDirectRate > 0.5
      ? "Instrument verification will not fix the observation gap."
      : "Direct-observation gate does not independently block verification.",
  }));
  checks.push(Object.freeze({
    id: "evidence_quality",
    label: "Evidence quality",
    status: indirectDrivingRate > 0.5 || reliabilityTier === "HIGH" || reliabilityTier === "CRITICAL" ? "fail" : "pass",
    result: indirectDrivingRate > 0.5 || reliabilityTier === "HIGH" || reliabilityTier === "CRITICAL"
      ? "Evidence machinery is too weak for instrument verification to be sufficient by itself."
      : "Evidence machinery does not independently block verification.",
  }));

  return Object.freeze(checks);
}

function instrumentActionFor(triggerIds, route) {
  if (route === "practitioner_escalation" || triggerIds.includes("negative_only") || triggerIds.includes("reliability_saturation") || triggerIds.includes("contradiction_blocking")) {
    return "Do not serve a verification instrument; route through analyst or practitioner resolution first.";
  }
  if (triggerIds.includes("co_presence")) {
    return "Select verification instruments for both candidate signal directions, then return results to the analyst workspace.";
  }
  if (triggerIds.includes("weak_signal") || triggerIds.includes("partial_signal")) {
    return "Select a verification instrument for the candidate signal direction, subject to accuracy-check results.";
  }
  return "No triage verification instrument is required; proceed to standard analyst review.";
}

export function buildTriageReport(session = {}, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const sources = allSourceMetrics(session);
  const contradictionReport = options.contradictionReport ?? buildContradictionReport(session, { generatedAt });
  const contradictionFindings = contradictionReport.findings.filter(isContradictionFinding);
  const counts = reliabilityCounts(sources);
  const reliabilityTier = reliabilityTierFor(counts);
  const contradictionTier = contradictionTierFor(contradictionFindings);
  const effectiveTier = combinedTier(reliabilityTier, contradictionTier);
  const triggers = activeTriggers(sources, reliabilityTier, contradictionTier, contradictionFindings);
  const triggerIds = triggers.map((trigger) => trigger.id);
  const routing = routeForTier(effectiveTier, triggerIds);

  return Object.freeze({
    completed: true,
    version: TRIAGE_ENGINE_VERSION,
    generatedAt,
    reliabilityTier,
    contradictionTier,
    effectiveTier,
    routing,
    instrumentAction: instrumentActionFor(triggerIds, routing.route),
    triggers,
    triggerCount: triggers.length,
    accuracyChecks: accuracyChecks(sources, reliabilityTier),
    reliabilitySummary: counts,
    contradictionSummary: Object.freeze({
      contradictionCount: contradictionFindings.length,
      highSeverityCount: contradictionFindings.filter((finding) => finding.severity === "high").length,
      criticalSeverityCount: contradictionFindings.filter((finding) => finding.severity === "critical").length,
    }),
    sourceSummaries: Object.freeze(sources.map((source) => Object.freeze({
      id: source.id,
      label: source.label,
      completed: source.completed,
      signalStrength: source.signalStrength,
      confidence: source.confidence,
      coPresence: source.coPresence,
      weakSignal: source.weakSignal,
      partialSignal: source.partialSignal,
      negativeOnly: source.negativeOnly,
      reliabilityFlagRate: source.reliabilityFlagRate,
      noDirectObservationRate: source.noDirectObservationRate,
      indirectDrivingRate: source.indirectDrivingRate,
      evidenceSupportedShare: source.evidenceSupportedShare,
    }))),
  });
}
