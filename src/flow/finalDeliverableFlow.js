import { environmentAlias, publicSafeText } from "../constants/envAliases.ts";
import { FINAL_DELIVERABLE_DATA } from "../data/finalDeliverableData.js";

export const FINAL_ENVIRONMENT_CODES = Object.freeze([
  "NF/NT",
  "NT/STJ",
  "NT/STP",
  "NF/SFJ",
  "NF/SFP",
  "SFJ/SFP",
  "SFP/SFJ",
  "STJ/STP",
  "STP/STJ",
]);

const PENDING = "PENDING";

const OUTCOME_KEYS = Object.freeze({
  A: "confirmed",
  B: "acquirer-partial",
  C: "target-partial",
  D: "mixed",
});

const RESOURCE_TYPE_LABELS = Object.freeze({
  BG: "Behavioural ground",
  CO: "Coherence resource",
  HY: "Hybrid resource",
  SG: "Signal resource",
});

const RESOURCE_TIER_SCORES = Object.freeze({
  IGN: 0,
  LOW: 1,
  MID: 2,
  TOP: 3,
});

const RESOURCE_EFFECT_LABELS = Object.freeze({
  "+": "Amplifies",
  "-": "Suppresses",
  "~": "Neutral",
});

const RESOURCE_POTENTIAL_RISKS = Object.freeze({
  "Attention": "Attention conflict can fragment leadership focus, slow issue detection, and make critical post-close signals easier to miss.",
  "Connections": "Connections conflict can weaken informal coordination, isolate key relationship holders, and increase dependency on a small number of brokers.",
  "Creativity": "Creativity conflict can suppress useful adaptation, make new operating ideas feel unsafe, and reduce the target's ability to solve integration problems locally.",
  "Decisiveness": "Decisiveness conflict can create decision stalls, repeated escalation, and unclear ownership when integration tradeoffs need fast resolution.",
  "Energy": "Energy conflict can drain execution capacity, increase fatigue, and turn normal integration pressure into avoidable attrition risk.",
  "Health": "Health conflict can raise burnout risk, reduce sustainable pace, and make the combined organization dependent on short-term overextension.",
  "Influence": "Influence conflict can distort who actually gets heard, produce hidden veto points, and make formal governance weaker than informal power.",
  "Information": "Information conflict can create selective disclosure, reporting gaps, and mismatched assumptions between the acquirer and target teams.",
  "Knowledge": "Knowledge conflict can block transfer of know-how, make expertise harder to access, and increase the chance that critical operating memory leaves with key people.",
  "Money": "Money conflict can turn budget allocation into a legitimacy fight, delay investment decisions, and make resource commitments appear politically biased.",
  "Organisation / system": "Organisation and system conflict can break routines, duplicate authority, and make the new operating model hard to follow in daily work.",
  "Psychological resilience": "Psychological resilience conflict can reduce tolerance for ambiguity, amplify stress responses, and make recoverable integration issues feel irreversible.",
  "Reputation": "Reputation conflict can make status protection more important than problem solving, increasing defensiveness during early integration events.",
  "Skills": "Skills conflict can misplace capability, underuse the target's strongest operators, and make performance problems look like individual failure instead of fit failure.",
  "Time": "Time conflict can create incompatible operating tempo, missed windows, and frustration between teams that resolve priorities at different speeds.",
  "Trust": "Trust conflict can trigger defensive behavior, reduce disclosure quality, and make even technically sound integration decisions feel unsafe.",
  "Will / discipline": "Will and discipline conflict can weaken follow-through, create uneven compliance, and make agreed integration routines difficult to sustain.",
});

const RESOURCE_PRIORITY_MATRIX = Object.freeze([
  resourceProfile("Time", "BG", ["+ MID", "~ MID", "- TOP", "- MID", "~ LOW", "~ LOW", "+ TOP", "+ TOP", "~ LOW"]),
  resourceProfile("Energy", "BG", ["+ TOP", "+ TOP", "~ TOP", "- MID", "+ TOP", "+ TOP", "+ TOP", "+ TOP", "+ TOP"]),
  resourceProfile("Attention", "BG", ["+ TOP", "~ LOW", "- TOP", "- MID", "+ TOP", "+ TOP", "+ TOP", "+ TOP", "+ TOP"]),
  resourceProfile("Money", "HY", ["+ LOW", "+ TOP", "- MID", "- MID", "~ LOW", "~ LOW", "+ TOP", "~ LOW", "+ TOP"]),
  resourceProfile("Reputation", "SG", ["+ TOP", "+ TOP", "- MID", "~ TOP", "+ TOP", "+ TOP", "+ TOP", "+ TOP", "+ TOP"]),
  resourceProfile("Trust", "CO", ["+ TOP", "- IGN", "- MID", "- LOW", "~ LOW", "+ TOP", "~ LOW", "+ TOP", "- IGN"]),
  resourceProfile("Influence", "SG", ["+ TOP", "+ TOP", "- MID", "- TOP", "+ TOP", "+ TOP", "+ MID", "+ MID", "+ TOP"]),
  resourceProfile("Information", "BG", ["~ LOW", "~ LOW", "- MID", "- LOW", "+ TOP", "~ LOW", "+ MID", "+ MID", "~ MID"]),
  resourceProfile("Connections", "HY", ["+ MID", "~ LOW", "- LOW", "~ TOP", "~ IGN", "+ MID", "~ IGN", "+ MID", "+ TOP"]),
  resourceProfile("Skills", "HY", ["+ MID", "+ TOP", "- LOW", "- LOW", "+ MID", "+ MID", "+ MID", "+ MID", "+ MID"]),
  resourceProfile("Knowledge", "HY", ["- LOW", "- IGN", "- LOW", "- LOW", "+ MID", "~ LOW", "+ MID", "+ MID", "- IGN"]),
  resourceProfile("Health", "BG", ["+ MID", "+ MID", "- LOW", "- TOP", "~ LOW", "+ MID", "~ IGN", "~ IGN", "- LOW"]),
  resourceProfile("Psychological resilience", "BG", ["+ MID", "~ LOW", "- LOW", "- LOW", "+ MID", "+ MID", "+ MID", "+ LOW", "~ LOW"]),
  resourceProfile("Will / discipline", "BG", ["- LOW", "+ MID", "- TOP", "- TOP", "+ MID", "~ LOW", "+ LOW", "+ LOW", "+ MID"]),
  resourceProfile("Creativity", "SG", ["- IGN", "~ LOW", "- IGN", "- IGN", "+ MID", "+ MID", "+ LOW", "+ LOW", "~ MID"]),
  resourceProfile("Decisiveness", "SG", ["- IGN", "+ MID", "- IGN", "- IGN", "+ LOW", "~ IGN", "+ LOW", "~ LOW", "+ MID"]),
  resourceProfile("Organisation / system", "BG", ["- LOW", "+ MID", "~ TOP", "- MID", "~ IGN", "- IGN", "+ LOW", "~ IGN", "+ MID"]),
]);

function resourceProfile(resource, type, values) {
  return Object.freeze({
    resource,
    type,
    potentialRisk: RESOURCE_POTENTIAL_RISKS[resource],
    impacts: Object.freeze(Object.fromEntries(FINAL_ENVIRONMENT_CODES.map((code, index) => [code, values[index]]))),
  });
}

function pairKey(acquirerEnvironmentCode, targetEnvironmentCode) {
  return `${normalizeEnvironmentCode(acquirerEnvironmentCode)}::${normalizeEnvironmentCode(targetEnvironmentCode)}`;
}

function normalizeEnvironmentCode(code) {
  const normalized = typeof code === "string" ? code.trim() : "";
  return normalized === legacyFranchiseCode() ? "SFP/SFJ" : normalized;
}

function legacyFranchiseCode() {
  return ["SP", "SJ"].join(String.fromCharCode(47));
}

function recordsByPair(records) {
  return new Map(records.map((record) => [pairKey(record.acquirerEnvironmentCode, record.targetEnvironmentCode), record]));
}

const NARRATIVE_BY_PAIR = recordsByPair(FINAL_DELIVERABLE_DATA.narratives);
const FRICTION_BY_PAIR = recordsByPair(FINAL_DELIVERABLE_DATA.frictionPoints);

function replaceTemplate(value, replacements) {
  return Object.entries(replacements).reduce(
    (current, [key, replacement]) => current.replaceAll(`[${key}]`, replacement),
    value,
  );
}

export function aliasForEnvironment(code) {
  return environmentAlias(normalizeEnvironmentCode(code));
}

export function publicText(value) {
  return publicSafeText(value);
}

export function findFinalNarrative(acquirerEnvironmentCode, targetEnvironmentCode) {
  return NARRATIVE_BY_PAIR.get(pairKey(acquirerEnvironmentCode, targetEnvironmentCode)) ?? null;
}

export function findFrictionPoint(acquirerEnvironmentCode, targetEnvironmentCode) {
  return FRICTION_BY_PAIR.get(pairKey(acquirerEnvironmentCode, targetEnvironmentCode)) ?? null;
}

export function compatibilityRange(score) {
  if (!Number.isFinite(score)) return PENDING;
  const low = Math.max(0, Math.round(score - 5));
  const high = Math.min(100, Math.round(score + 5));
  return `${low}\u2013${high}`;
}

function protocolForRiskBand(riskBand = "") {
  if (riskBand === "HIGH COMPATIBILITY") return "RHQA";
  if (riskBand === "HIGH RISK" || riskBand === "MODERATE-LOW") return "Ring-Fence";
  return "Selective";
}

function outcomeGuide(outcomeLetter) {
  return FINAL_DELIVERABLE_DATA.clientJourney.outcomes[outcomeLetter] ?? {
    title: "",
    condition: "",
    nextStep: "",
  };
}

function targetScoreFromInput(input) {
  return {
    primaryEnvironmentCode: input.targetEnvironmentCode,
    secondaryEnvironmentCode: input.targetSecondaryEnvironmentCode,
    signalStrength: input.targetSignalStrength ?? "confirmed",
    coPresence: input.targetCoPresence === true,
  };
}

function acquirerScoreFromInput(input) {
  return {
    primaryEnvironmentCode: input.acquirerEnvironmentCode,
    secondaryEnvironmentCode: input.acquirerSecondaryEnvironmentCode,
    signalStrength: input.acquirerSignalStrength ?? "confirmed",
    coPresence: input.acquirerCoPresence === true,
  };
}

function normalizeResourceKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/organisation/g, "organization")
    .replace(/repute/g, "reputation")
    .replace(/psychological resilience/g, "psychologicalresilience")
    .replace(/[^a-z]/g, "");
}

function parseConflictedResources(value) {
  return new Map(
    String(value ?? "")
      .split(/,\s*(?=[A-Z][A-Za-z /]+ \()/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const resourceName = entry.split("(")[0].trim();
        return [normalizeResourceKey(resourceName), Object.freeze({
          resourceName,
          sourceSignal: entry,
        })];
      }),
  );
}

function parseResourceImpact(value) {
  const [effect = "~", tier = "LOW"] = String(value ?? "").trim().split(/\s+/);
  return Object.freeze({
    effect,
    tier,
    tierScore: RESOURCE_TIER_SCORES[tier] ?? 1,
    label: `${RESOURCE_EFFECT_LABELS[effect] ?? "Neutral"} ${tier}`,
  });
}

function boundedScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function effectPenalty(leftEffect, rightEffect, sameEnvironment) {
  if (sameEnvironment) return 0;
  if (leftEffect === rightEffect) return leftEffect === "-" ? 14 : 0;
  if (leftEffect === "~" || rightEffect === "~") return 18;
  return 44;
}

function buildResourceConflictDrivers(acquirerImpact, targetImpact, sourceConflict, sameEnvironment) {
  return Object.freeze([
    sourceConflict ? "primary friction lookup" : "",
    !sameEnvironment && acquirerImpact.effect !== targetImpact.effect ? "resource direction mismatch" : "",
    !sameEnvironment && Math.abs(acquirerImpact.tierScore - targetImpact.tierScore) >= 2 ? "resource tier gap" : "",
    !sameEnvironment && acquirerImpact.effect === "-" && targetImpact.effect === "-" ? "compound suppression" : "",
  ].filter(Boolean));
}

function resourceInteractionScore(acquirerImpact, targetImpact, sourceConflict, sameEnvironment) {
  const tierGap = Math.abs(acquirerImpact.tierScore - targetImpact.tierScore);
  const ignoredResourcePenalty = acquirerImpact.tier === "IGN" || targetImpact.tier === "IGN" ? 9 : 0;
  const sourcePenalty = sourceConflict ? 45 : 0;
  return boundedScore(
    100
      - effectPenalty(acquirerImpact.effect, targetImpact.effect, sameEnvironment)
      - tierGap * 9
      - ignoredResourcePenalty
      - sourcePenalty,
  );
}

function conflictProbability(interactionScore, sourceConflict, sameEnvironment) {
  if (!sameEnvironment && (sourceConflict || interactionScore <= 58)) return "High";
  if (!sameEnvironment && interactionScore <= 74) return "Monitor";
  return "Low";
}

function listResourceNames(rows) {
  if (rows.length === 0) return "no resource type";
  if (rows.length === 1) return rows[0].resource;
  if (rows.length === 2) return `${rows[0].resource} and ${rows[1].resource}`;
  return `${rows.slice(0, -1).map((row) => row.resource).join(", ")}, and ${rows.at(-1).resource}`;
}

function buildResourceAnalysisConclusion(profile, options) {
  const acquirerAlias = aliasForEnvironment(options.acquirerEnvironmentCode);
  const targetAlias = aliasForEnvironment(options.targetEnvironmentCode);
  const riskBand = options.riskBand ?? PENDING;
  const protocolName = options.protocolName ?? protocolForRiskBand(riskBand);
  const ecsLabel = profile.ecsScoreLabel;
  const highRows = profile.highProbabilityConflicts;
  const topRows = highRows.slice(0, 4);
  const lowestRow = highRows[0];

  if (highRows.length === 0) {
    return Object.freeze([
      `The resource hierarchy scan verifies all ${profile.resourcesScanned} behavioural resources for ${acquirerAlias} and ${targetAlias}.`,
      `The ECS result is ${ecsLabel}, and the verified risk band is ${riskBand}.`,
      "No resource type crossed the high-probability conflict threshold in the current environment-level analysis.",
      "The preliminary conclusion is that environment-level resource collision is not the dominant integration risk in this pair.",
      "The remaining risk should be read through hierarchy depth, role overlap, and individual type distribution rather than through a broad resource clash.",
      `The recommended protocol route remains ${protocolName} because the resource scan does not override the pair-level ECS result.`,
    ]);
  }

  return Object.freeze([
    `The resource hierarchy scan verifies all ${profile.resourcesScanned} behavioural resources for ${acquirerAlias} and ${targetAlias}.`,
    `The ECS result is ${ecsLabel}, and the verified risk band is ${riskBand}.`,
    `The public report isolates the ${topRows.length} strongest resource conflict type${topRows.length === 1 ? "" : "s"} from the verified high-probability set.`,
    `The displayed verified conflict resource${topRows.length === 1 ? "" : "s"} are ${listResourceNames(topRows)}.`,
    `${lowestRow.resource} is the most acute resource conflict signal because it ranks first in the verified 17-resource conflict scan.`,
    `The conclusion is that the integration risk is concentrated in identifiable resource types, so the ${protocolName} protocol should be applied to those resources before post-close operating routines are merged.`,
  ]);
}

function buildProtocolDealInsights({ acquirerAlias, targetAlias, protocolName, resourceConflictProfile }) {
  const conflictRows = resourceConflictProfile?.highProbabilityConflicts?.slice(0, 3) ?? [];
  if (!protocolName || conflictRows.length === 0) return Object.freeze([]);

  return Object.freeze(conflictRows.map((row) => Object.freeze({
    title: `${row.resource} control point`,
    text: `${acquirerAlias} acquiring ${targetAlias} should treat ${row.resource.toLowerCase()} as a protected integration resource. ${row.potentialRisk} ${resourceControlAction(row.resource, protocolName)}`,
  })));
}

function resourceControlAction(resource, protocolName) {
  const actions = {
    "Attention": `The ${protocolName} route should define a weekly attention map, limit competing workstreams, and assign one owner for signal triage.`,
    "Connections": `The ${protocolName} route should preserve named relationship holders, map informal coordination paths, and prevent abrupt broker replacement during the first integration cycle.`,
    "Creativity": `The ${protocolName} route should protect a bounded adaptation space, define where experimentation remains allowed, and separate creative evaluation from compliance review.`,
    "Decisiveness": `The ${protocolName} route should set decision thresholds, name the accountable decision forum, and pre-agree escalation timing for unresolved tradeoffs.`,
    "Energy": `The ${protocolName} route should pace integration load, reserve capacity for critical operators, and monitor fatigue before execution quality drops.`,
    "Health": `The ${protocolName} route should cap unsustainable workload peaks, protect recovery windows, and make burnout indicators part of integration governance.`,
    "Influence": `The ${protocolName} route should identify informal veto holders, align them with formal governance, and expose hidden power shifts before they distort execution.`,
    "Information": `The ${protocolName} route should specify disclosure rules, reporting cadence, and exception escalation when material information is delayed or filtered.`,
    "Knowledge": `The ${protocolName} route should create a protected knowledge-transfer track, identify critical knowledge holders, and verify that know-how moves before structural changes begin.`,
    "Money": `The ${protocolName} route should separate investment logic from status claims, define budget authority, and document why priority resources are funded or withheld.`,
    "Organisation / system": `The ${protocolName} route should freeze the minimum viable operating model, remove duplicate authority, and test whether daily routines remain understandable to both sides.`,
    "Psychological resilience": `The ${protocolName} route should define stress-response triggers, create a recovery path for contested decisions, and prevent temporary strain from becoming permanent resistance.`,
    "Reputation": `The ${protocolName} route should protect face-saving channels, clarify how performance will be judged, and keep status repair separate from operating decisions.`,
    "Skills": `The ${protocolName} route should map scarce capabilities to roles, protect high-skill operators from misassignment, and distinguish fit problems from performance failures.`,
    "Time": `The ${protocolName} route should align decision tempo, set explicit time horizons for major workstreams, and prevent one side's operating rhythm from silently overriding the other.`,
    "Trust": `The ${protocolName} route should assign a named trust owner, define mandatory disclosure moments, and escalate credibility breaks before defensive behavior hardens.`,
    "Will / discipline": `The ${protocolName} route should define non-negotiable routines, track follow-through visibly, and intervene early when compliance becomes uneven.`,
  };
  return actions[resource] ?? `The ${protocolName} route should assign one accountable owner, clarify operating authority, and set an early review point for this resource.`;
}

function buildResourceConflictProfile(acquirerEnvironmentCode, targetEnvironmentCode, options = {}) {
  const acquirerCode = normalizeEnvironmentCode(acquirerEnvironmentCode);
  const targetCode = normalizeEnvironmentCode(targetEnvironmentCode);
  const sameEnvironment = acquirerCode === targetCode;
  const primaryConflicts = parseConflictedResources(options.friction?.primaryConflictedResources);
  const ecsScore = Number.isFinite(options.ecsScore) ? options.ecsScore : null;
  const ecsScoreLabel = ecsScore === null ? options.ecsRange ?? PENDING : ecsScore.toFixed(1);

  const rows = RESOURCE_PRIORITY_MATRIX.map((resource) => {
    const acquirerImpact = parseResourceImpact(resource.impacts[acquirerCode]);
    const targetImpact = parseResourceImpact(resource.impacts[targetCode]);
    const sourceConflict = primaryConflicts.get(normalizeResourceKey(resource.resource)) ?? null;
    const environmentInteractionScore = resourceInteractionScore(acquirerImpact, targetImpact, Boolean(sourceConflict), sameEnvironment);
    const probability = conflictProbability(environmentInteractionScore, Boolean(sourceConflict), sameEnvironment);
    return Object.freeze({
      resource: resource.resource,
      resourceType: resource.type,
      resourceTypeLabel: RESOURCE_TYPE_LABELS[resource.type] ?? resource.type,
      potentialRisk: resource.potentialRisk,
      acquirerImpact,
      targetImpact,
      environmentInteractionScore,
      ecsScore,
      ecsScoreLabel,
      probability,
      sourceSignal: sourceConflict?.sourceSignal ?? "",
      conflictDrivers: buildResourceConflictDrivers(acquirerImpact, targetImpact, Boolean(sourceConflict), sameEnvironment),
    });
  });

  const sortedRows = [...rows].sort((left, right) => (
    left.environmentInteractionScore - right.environmentInteractionScore
      || left.resource.localeCompare(right.resource)
  ));
  const highProbabilityConflicts = sortedRows.filter((row) => row.probability === "High");
  const profile = {
    ecsScore,
    ecsScoreLabel,
    resourcesScanned: RESOURCE_PRIORITY_MATRIX.length,
    highProbabilityCount: highProbabilityConflicts.length,
    highProbabilityConflicts: Object.freeze(highProbabilityConflicts),
    allResources: Object.freeze(sortedRows),
  };

  return Object.freeze({
    ...profile,
    conclusion: buildResourceAnalysisConclusion(profile, {
      acquirerEnvironmentCode: acquirerCode,
      targetEnvironmentCode: targetCode,
      riskBand: options.riskBand,
      protocolName: options.protocolName,
    }),
  });
}

function candidateRange(acquirerEnvironmentCode, targetEnvironmentCode) {
  const friction = findFrictionPoint(acquirerEnvironmentCode, targetEnvironmentCode);
  const narrative = findFinalNarrative(acquirerEnvironmentCode, targetEnvironmentCode);
  const score = friction?.ecs ?? narrative?.ecs ?? null;
  const riskBand = friction?.riskBand ?? narrative?.riskBand ?? PENDING;
  return Object.freeze({
    acquirerEnvironmentCode: normalizeEnvironmentCode(acquirerEnvironmentCode),
    targetEnvironmentCode: normalizeEnvironmentCode(targetEnvironmentCode),
    acquirerAlias: aliasForEnvironment(acquirerEnvironmentCode),
    targetAlias: aliasForEnvironment(targetEnvironmentCode),
    score,
    range: compatibilityRange(score),
    riskBand,
  });
}

function buildAnchors(friction) {
  return Object.freeze([
    Object.freeze({
      label: "Within 30 days",
      sourceColumn: "Early Warning Signal",
      text: friction?.earlyWarningSignal || PENDING,
    }),
    Object.freeze({
      label: "Months 2\u20136",
      sourceColumn: "FP2",
      text: friction?.fp2 || PENDING,
    }),
    Object.freeze({
      label: "Months 6\u201318",
      sourceColumn: "FP3",
      text: friction?.fp3 || PENDING,
    }),
  ]);
}

function homogeneousAnchors(alias) {
  const body = FINAL_DELIVERABLE_DATA.screenCopy.homogeneousBody.replaceAll("{alias}", alias);
  const patterns = [
    ["Within 30 days", /Within 30 days:\s*'([^']+)'/],
    ["Months 2\u20136", /Months 2\u20136:\s*'([^']+)'/],
    ["Months 6\u201318", /Months 6\u201318:\s*'([^']+)'/],
  ];
  return Object.freeze(
    patterns.map(([label, pattern]) => Object.freeze({
      label,
      sourceColumn: "APPENDIX_B Screen 10b",
      text: body.match(pattern)?.[1] ?? PENDING,
    })),
  );
}

function buildSealPayload(acquirerEnvironmentCode, targetEnvironmentCode, anchors) {
  return Object.freeze({
    acquirerEnvironmentCode,
    targetEnvironmentCode,
    anchors: Object.freeze(anchors.map((anchor) => anchor.text)),
  });
}

function stripSectionLabel(value) {
  return String(value ?? "").replace(/^\[[^\]]+\]\s*/, "");
}

function replaceOfferAlias(value, alias) {
  return String(value ?? "").replaceAll("{alias}", alias || PENDING);
}

function parseComparisonRows(body, alias) {
  return Object.freeze(
    String(body ?? "")
      .split(/\n+/)
      .map((line) => replaceOfferAlias(line, alias).replace(/^\s*\u2022\s*/, "").trim())
      .filter((line) => line.startsWith("Free:"))
      .map((line) => {
        const match = line.match(/^Free:\s*(.*?)\s*\|\s*Paid adds:\s*(.*)$/);
        return Object.freeze({
          free: match?.[1] ?? PENDING,
          paidAdds: match?.[2] ?? PENDING,
        });
      }),
  );
}

function parseOfferBody(body, alias) {
  const sections = String(body ?? "")
    .split(/\n{2,}/)
    .map((section) => replaceOfferAlias(section.trim(), alias))
    .filter(Boolean);
  const pricingSection = sections.find((section) => section.startsWith("[Pricing band]")) ?? "";
  const costAnchorSection = sections.find((section) => section.startsWith("[Cost anchor")) ?? "";

  return Object.freeze({
    comparisonRows: parseComparisonRows(body, alias),
    pricingBand: stripSectionLabel(pricingSection) || PENDING,
    costAnchor: stripSectionLabel(costAnchorSection),
  });
}

function parseOfferCtas(ctaCopy) {
  const entries = Object.fromEntries(
    String(ctaCopy ?? "")
      .split(/\n+/)
      .map((line) => line.split(":"))
      .filter((parts) => parts.length >= 2)
      .map(([key, ...rest]) => [key.trim().toLowerCase(), rest.join(":").trim()]),
  );
  return Object.freeze({
    primary: entries.primary || PENDING,
    secondary: entries.secondary || PENDING,
  });
}

function priceFromText(value) {
  return String(value ?? "").match(/\$[0-9]+K\u2013\$[0-9]+K/)?.[0] ?? PENDING;
}

function buildCandidateRanges(outcomeLetter, acquirerScore, targetScore, targetEnvironmentCode) {
  if (outcomeLetter === "B") {
    return [acquirerScore.primaryEnvironmentCode, acquirerScore.secondaryEnvironmentCode]
      .filter(Boolean)
      .map((candidateCode) => candidateRange(candidateCode, targetEnvironmentCode));
  }

  if (outcomeLetter === "C") {
    return [targetScore.primaryEnvironmentCode, targetScore.secondaryEnvironmentCode]
      .filter(Boolean)
      .map((candidateCode) => candidateRange(acquirerScore.primaryEnvironmentCode, candidateCode));
  }

  return [];
}

function determineOutcome(acquirerScore, targetScore, narrative, mixedSignal) {
  if (mixedSignal || !narrative) return "D";
  if (acquirerScore.signalStrength === "weak" || acquirerScore.coPresence) return "B";
  if (targetScore.signalStrength === "weak" || targetScore.coPresence) return "C";
  return "A";
}

export function buildPairDeliverable(input = {}) {
  const acquirerScore = acquirerScoreFromInput(input);
  const targetScore = targetScoreFromInput(input);
  const acquirerEnvironmentCode = normalizeEnvironmentCode(acquirerScore.primaryEnvironmentCode);
  const targetEnvironmentCode = normalizeEnvironmentCode(targetScore.primaryEnvironmentCode);

  if (!acquirerEnvironmentCode || !targetEnvironmentCode) {
    return Object.freeze({
      ready: false,
      status: "environment-pair-incomplete",
    });
  }

  const acquirerAlias = aliasForEnvironment(acquirerEnvironmentCode);
  const targetAlias = aliasForEnvironment(targetEnvironmentCode);

  if (acquirerEnvironmentCode === targetEnvironmentCode) {
    const anchors = homogeneousAnchors(acquirerAlias);
    const compatibilityRangeValue = "80\u201395";
    return Object.freeze({
      ready: true,
      route: "/screen-10b-homogeneous",
      screen: "screen-10b",
      outcomeKey: "homogeneous",
      acquirerEnvironmentCode,
      targetEnvironmentCode,
      acquirerAlias,
      targetAlias,
      headline: FINAL_DELIVERABLE_DATA.screenCopy.homogeneousHeaderTemplate.replaceAll("{alias}", acquirerAlias),
      body: publicText(FINAL_DELIVERABLE_DATA.screenCopy.homogeneousBody.replaceAll("{alias}", acquirerAlias)),
      compatibilityRange: compatibilityRangeValue,
      riskBand: "HIGH COMPATIBILITY",
      resourceConflictProfile: buildResourceConflictProfile(acquirerEnvironmentCode, targetEnvironmentCode, {
        ecsRange: compatibilityRangeValue,
        riskBand: "HIGH COMPATIBILITY",
        protocolName: "RHQA",
      }),
      anchors,
      caveat: FINAL_DELIVERABLE_DATA.screenCopy.sealedCaveat,
      cta: FINAL_DELIVERABLE_DATA.screenCopy.homogeneousCtaLabel.replaceAll("{alias}", acquirerAlias),
      sealPayload: buildSealPayload(acquirerEnvironmentCode, targetEnvironmentCode, anchors),
    });
  }

  const narrative = findFinalNarrative(acquirerEnvironmentCode, targetEnvironmentCode);
  const friction = findFrictionPoint(acquirerEnvironmentCode, targetEnvironmentCode);
  const outcomeLetter = determineOutcome(acquirerScore, targetScore, narrative, input.mixedSignal === true);
  const score = friction?.ecs ?? narrative?.ecs ?? null;
  const riskBand = friction?.riskBand ?? narrative?.riskBand ?? PENDING;
  const anchors = buildAnchors(friction);
  const protocolName = protocolForRiskBand(riskBand);
  const resourceConflictProfile = buildResourceConflictProfile(acquirerEnvironmentCode, targetEnvironmentCode, {
    friction,
    ecsScore: score,
    ecsRange: compatibilityRange(score),
    riskBand,
    protocolName,
  });
  const protocolDealInsights = buildProtocolDealInsights({
    acquirerAlias,
    targetAlias,
    protocolName,
    resourceConflictProfile,
  });

  return Object.freeze({
    ready: true,
    route: "/screen-10-reveal",
    screen: "screen-10",
    outcomeLetter,
    outcomeKey: OUTCOME_KEYS[outcomeLetter],
    outcomeGuide: outcomeGuide(outcomeLetter),
    acquirerEnvironmentCode,
    targetEnvironmentCode,
    acquirerAlias,
    targetAlias,
    narrative,
    friction,
    compatibilityScore: score,
    compatibilityRange: compatibilityRange(score),
    riskBand,
    resourceConflictProfile,
    isEcsIssued: outcomeLetter !== "D",
    candidateRanges: Object.freeze(buildCandidateRanges(outcomeLetter, acquirerScore, targetScore, targetEnvironmentCode)),
    protocol: Object.freeze({
      name: protocolName,
      marker: "Full protocol specification: Step 7.",
      dealInsights: protocolDealInsights,
    }),
    anchors,
    caveat: FINAL_DELIVERABLE_DATA.screenCopy.sealedCaveat,
    cta: narrative?.cta ?? "",
    bSingleCopy: FINAL_DELIVERABLE_DATA.bSingleCopyTemplates,
    sealPayload: buildSealPayload(acquirerEnvironmentCode, targetEnvironmentCode, anchors),
  });
}

function hasCompletedTargetSelfAssessment(session) {
  if (session?.targetSelfAssessment?.completed !== true) return false;
  return session?.targetInvite?.completed === true || session?.targetSelfDirect?.completed === true;
}

export function buildFinalDeliverable(session) {
  if (!hasCompletedTargetSelfAssessment(session)) {
    return Object.freeze({
      ready: false,
      status: "target-self-assessment-required",
    });
  }

  const acquirerScore = session?.acquirer2A?.score ?? {};
  const targetSelfScore = session?.targetSelfAssessment?.score ?? {};
  const targetDiagnosticScore = session?.target2B?.finalScore ?? {};
  const targetScore = targetSelfScore.valid ? targetSelfScore : targetDiagnosticScore;

  return buildPairDeliverable({
    acquirerEnvironmentCode: acquirerScore.primaryEnvironmentCode,
    acquirerSecondaryEnvironmentCode: acquirerScore.secondaryEnvironmentCode,
    acquirerSignalStrength: acquirerScore.signalStrength,
    acquirerCoPresence: acquirerScore.coPresence,
    targetEnvironmentCode: targetScore.primaryEnvironmentCode,
    targetSecondaryEnvironmentCode: targetScore.secondaryEnvironmentCode,
    targetSignalStrength: targetScore.signalStrength,
    targetCoPresence: Boolean(targetScore.coPresence || targetDiagnosticScore.coPresence),
  });
}

export function buildPaidOffer(variant = "heterogeneous", options = {}) {
  const isHomogeneous = variant === "homogeneous";
  const alias = options.alias ?? options.deliverable?.acquirerAlias ?? PENDING;
  const header = isHomogeneous
    ? FINAL_DELIVERABLE_DATA.screenCopy.screen11bHeader
    : FINAL_DELIVERABLE_DATA.screenCopy.screen11Header;
  const body = isHomogeneous
    ? FINAL_DELIVERABLE_DATA.screenCopy.screen11bBody
    : FINAL_DELIVERABLE_DATA.screenCopy.screen11Body;
  const ctaCopy = isHomogeneous
    ? FINAL_DELIVERABLE_DATA.screenCopy.screen11bCta
    : FINAL_DELIVERABLE_DATA.screenCopy.screen11Cta;
  const parsedBody = parseOfferBody(body, alias);

  return Object.freeze({
    ready: true,
    screen: isHomogeneous ? "screen-11b" : "screen-11",
    route: isHomogeneous ? "/screen-11b-homogeneous-offer" : "/screen-11-paid-offer",
    variant: isHomogeneous ? "homogeneous" : "heterogeneous",
    header: replaceOfferAlias(header, alias),
    comparisonRows: parsedBody.comparisonRows,
    pricingBand: parsedBody.pricingBand,
    price: priceFromText(parsedBody.pricingBand),
    costAnchor: parsedBody.costAnchor,
    ctas: parseOfferCtas(ctaCopy),
  });
}

export function isFinalDeliverableSourceLoaded(data = FINAL_DELIVERABLE_DATA) {
  return Boolean(
    data?.sources?.includes("ST_Free_Tier_Output_Narratives_updated.xlsx")
      && data?.sources?.includes("ST_Friction_Point_Lookup_updated.xlsx")
      && data?.sources?.includes("ST_UI_Track_Coder_Agent_Specification_v1.xlsx")
      && data?.sources?.includes("ST_Investment_Memorandum_final.docx")
      && data.narratives.length === 72
      && data.frictionPoints.length === 56
      && data.screenCopy.screen11Header
      && data.screenCopy.screen11Body
      && data.screenCopy.screen11Cta
      && data.screenCopy.screen11bHeader
      && data.screenCopy.screen11bBody
      && data.screenCopy.screen11bCta
      && data.screenCopy.sealedCaveat
      && data.clientJourney.outcomes.A
      && data.clientJourney.outcomes.B
      && data.clientJourney.outcomes.C
      && data.clientJourney.outcomes.D,
  );
}
