import { TARGET_OBSERVATION_DIAGNOSTIC } from "../data/targetObservedEnvironmentDiagnostic.js";
import {
  selectedOptionValue,
  validateEvidenceClassifiedAnswers,
} from "./evidenceClassification.js";
import { scoreLayeredEvidenceQuestionSet } from "./layeredEvidenceScoring.js";

const TARGET_OBSERVATION_ENVIRONMENT_CODES = Object.freeze([
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

export const OBSERVATION_SETUP_INVITE_TTL_HOURS = 72;
export const OBSERVATION_SETUP_DIGITAL_CODE_DIGITS = 6;

export const RESPONDENT_CONTEXT_SECTIONS = Object.freeze([
  Object.freeze({
    id: "targetExposureDuration",
    label: "STEP 1 · TARGET EXPOSURE DURATION",
    options: Object.freeze([
      Object.freeze({ value: "less_than_2_weeks", title: "Less than 2 weeks", description: "Initial diligence contact only." }),
      Object.freeze({ value: "2_to_6_weeks", title: "2 to 6 weeks", description: "Several diligence cycles or structured interactions." }),
      Object.freeze({ value: "2_to_6_months", title: "2 to 6 months", description: "Repeated exposure across diligence, planning, or early integration." }),
      Object.freeze({ value: "more_than_6_months", title: "More than 6 months", description: "Extended operating, advisory, board, or partner exposure." }),
    ]),
  }),
  Object.freeze({
    id: "targetAccessLevel",
    label: "STEP 2 · CLOSEST ACCESS TO THE TARGET",
    options: Object.freeze([
      Object.freeze({ value: "documents_only", title: "Documents and data room", description: "Primary view comes from materials, reports, and diligence files." }),
      Object.freeze({ value: "management_interviews", title: "Management interviews", description: "Direct exposure through leadership meetings or diligence interviews." }),
      Object.freeze({ value: "site_or_team_sessions", title: "Site visits or team sessions", description: "Observed live team interactions, routines, or working sessions." }),
      Object.freeze({ value: "direct_operating_contact", title: "Direct operating contact", description: "Worked with the target in operating, integration, or delivery contexts." }),
    ]),
  }),
  Object.freeze({
    id: "observedActorLevel",
    label: "STEP 3 · PRIMARY ACTORS OBSERVED",
    options: Object.freeze([
      Object.freeze({ value: "founder_or_ceo", title: "Founder or CEO", description: "Most evidence comes from the top decision-maker." }),
      Object.freeze({ value: "senior_leadership", title: "Senior leadership team", description: "Most evidence comes from executives or business-unit leaders." }),
      Object.freeze({ value: "middle_management", title: "Middle management or functional leads", description: "Most evidence comes from managers who run daily execution." }),
      Object.freeze({ value: "frontline_teams", title: "Frontline teams", description: "Most evidence comes from operators closest to day-to-day work." }),
    ]),
  }),
  Object.freeze({
    id: "observationEvidenceBasis",
    label: "STEP 4 · EVIDENCE BASIS",
    options: Object.freeze([
      Object.freeze({ value: "single_meeting", title: "Single meeting or presentation", description: "A narrow snapshot of target behaviour." }),
      Object.freeze({ value: "structured_interviews", title: "Structured interviews", description: "Comparable answers across multiple target respondents." }),
      Object.freeze({ value: "repeated_workshops", title: "Repeated workshops", description: "Multiple live sessions where working behaviour could be observed." }),
      Object.freeze({ value: "live_operating_behavior", title: "Live operating behaviour", description: "Evidence from real work, decisions, handoffs, or conflict." }),
    ]),
  }),
]);

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

export function hashObservationSetupCode(code, observationSessionId, assessmentSessionId) {
  return hashValue(`${observationSessionId}:${assessmentSessionId}:${code}`);
}

export function generateObservationSetupCode(random = Math.random) {
  return String(100000 + Math.floor(random() * 900000)).slice(0, 6);
}

function normalizeObservationSessionId(value) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function isValidObservationSessionId(value) {
  const normalized = normalizeObservationSessionId(value);
  return Boolean(normalized && normalized !== "0");
}

function generatedObservationSessionId(createdAt, digitalCode) {
  const parsed = Date.parse(createdAt);
  const timestamp = Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
  return `obs-${timestamp}-${digitalCode}`;
}

export function buildObservationSetupSurveyLink({
  basePath = "/screen-6a-target-observation-setup/authorized",
  observationSessionId,
  assessmentSessionId,
  codeHash,
  createdAt,
  expiresAt,
}) {
  const params = new URLSearchParams();
  params.set("observationSessionId", observationSessionId);
  params.set("assessmentSessionId", assessmentSessionId);
  params.set("codeHash", codeHash);
  params.set("createdAt", createdAt);
  params.set("expiresAt", expiresAt);
  return `${basePath}?${params.toString()}`;
}

export function observationSetupInviteFromLinkParams(params, basePath = "/screen-6a-target-observation-setup/authorized") {
  const observationSessionId = params?.get("observationSessionId") ?? "";
  const assessmentSessionId = params?.get("assessmentSessionId") ?? "";
  const codeHash = params?.get("codeHash") ?? "";
  const createdAt = params?.get("createdAt") ?? "";
  const expiresAt = params?.get("expiresAt") ?? "";

  if (!isValidObservationSessionId(observationSessionId) || !assessmentSessionId || !codeHash || !createdAt || !expiresAt) return null;

  return Object.freeze({
    observationSessionId,
    assessmentSessionId,
    surveyLink: buildObservationSetupSurveyLink({ basePath, observationSessionId, assessmentSessionId, codeHash, createdAt, expiresAt }),
    digitalCode: "",
    codeHash,
    createdAt,
    expiresAt,
    ttlHours: OBSERVATION_SETUP_INVITE_TTL_HOURS,
    codeDigits: OBSERVATION_SETUP_DIGITAL_CODE_DIGITS,
    completed: false,
    revoked: false,
  });
}

export function createObservationSetupInvite(session, options = {}) {
  const createdAt = options.createdAt ?? new Date().toISOString();
  const digitalCode = options.digitalCode ?? generateObservationSetupCode(options.random);
  const assessmentSessionId = options.assessmentSessionId ?? session?.sessionId ?? "public-preview-session";
  const requestedObservationSessionId = normalizeObservationSessionId(options.observationSessionId);
  const observationSessionId = isValidObservationSessionId(requestedObservationSessionId)
    ? requestedObservationSessionId
    : generatedObservationSessionId(createdAt, digitalCode);
  const expiresAt = options.expiresAt ?? addHours(createdAt, OBSERVATION_SETUP_INVITE_TTL_HOURS);
  const basePath = options.basePath ?? "/screen-6a-target-observation-setup/authorized";
  const codeHash = hashObservationSetupCode(digitalCode, observationSessionId, assessmentSessionId);
  const surveyLink = buildObservationSetupSurveyLink({ basePath, observationSessionId, assessmentSessionId, codeHash, createdAt, expiresAt });

  const invite = Object.freeze({
    observationSessionId,
    assessmentSessionId,
    surveyLink,
    digitalCode,
    codeHash,
    createdAt,
    expiresAt,
    ttlHours: OBSERVATION_SETUP_INVITE_TTL_HOURS,
    codeDigits: OBSERVATION_SETUP_DIGITAL_CODE_DIGITS,
    completed: false,
    revoked: false,
  });

  return Object.freeze({
    ok: true,
    invite,
    session: Object.freeze({
      ...(session ?? {}),
      targetObservationSetupInvite: invite,
    }),
  });
}

export function verifyObservationSetupInvite(invite, code, now = new Date().toISOString()) {
  const normalizedCode = typeof code === "string" ? code.trim() : "";
  if (!invite) return Object.freeze({ ok: false, status: "not-found" });
  if (!isValidObservationSessionId(invite.observationSessionId)) return Object.freeze({ ok: false, status: "invalid-session" });
  if (invite.revoked) return Object.freeze({ ok: false, status: "revoked" });
  if (invite.completed) return Object.freeze({ ok: false, status: "completed" });
  if (new Date(now).getTime() > new Date(invite.expiresAt).getTime()) return Object.freeze({ ok: false, status: "expired" });
  if (!/^\d{6}$/.test(normalizedCode)) return Object.freeze({ ok: false, status: "invalid-format" });

  const expectedHash = hashObservationSetupCode(normalizedCode, invite.observationSessionId, invite.assessmentSessionId);
  if (expectedHash !== invite.codeHash) return Object.freeze({ ok: false, status: "wrong-code" });

  return Object.freeze({
    ok: true,
    status: "verified",
    verificationToken: `verified-${invite.observationSessionId}`,
  });
}

export function completeObservationSetupInvite(invite, setup, targetObservation = null, completedAt = new Date().toISOString()) {
  if (!invite || !isValidObservationSessionId(invite.observationSessionId) || invite.revoked || invite.completed || !setup?.completed || !targetObservation?.completed) {
    return Object.freeze({
      ok: false,
      reason: "observation-setup-invite-not-completable",
      invite,
    });
  }

  return Object.freeze({
    ok: true,
    invite: Object.freeze({
      ...invite,
      completed: true,
      completedAt,
      targetObservationSetup: setup,
      targetObservation: Object.freeze({
        ...targetObservation,
        observationSessionId: invite.observationSessionId,
      }),
    }),
  });
}

function completedInviteMatchesCurrentInvite(currentInvite, completedInvite) {
  if (!currentInvite) return false;

  const currentObservationSessionId = normalizeObservationSessionId(currentInvite.observationSessionId);
  const completedObservationSessionId = normalizeObservationSessionId(completedInvite?.observationSessionId);
  const completedTargetObservationSessionId = normalizeObservationSessionId(completedInvite?.targetObservation?.observationSessionId);
  if (
    !isValidObservationSessionId(currentObservationSessionId)
    || !isValidObservationSessionId(completedObservationSessionId)
    || currentObservationSessionId !== completedObservationSessionId
    || completedTargetObservationSessionId !== completedObservationSessionId
  ) {
    return false;
  }

  const currentCodeHash = currentInvite.codeHash ?? "";
  const completedCodeHash = completedInvite?.codeHash ?? "";
  if (currentCodeHash && completedCodeHash && currentCodeHash !== completedCodeHash) {
    return false;
  }

  return true;
}

export function attachAuthorizedObservationCompletion(currentSession, completedInvite) {
  if (!completedInvite?.completed || !completedInvite.targetObservation?.completed || !completedInvite.target2B?.completed) return currentSession;
  if (currentSession?.sessionId !== completedInvite.assessmentSessionId) return currentSession;

  const currentInvite = currentSession.targetObservationSetupInvite;
  if (!completedInviteMatchesCurrentInvite(currentInvite, completedInvite)) return currentSession;

  const mergedInvite = Object.freeze({
    ...(currentInvite ?? {}),
    ...completedInvite,
    digitalCode: currentInvite?.digitalCode ?? completedInvite.digitalCode ?? "",
  });

  const nextSession = {
    ...currentSession,
    targetObservationSetupInvite: mergedInvite,
    targetObservationSetup: completedInvite.targetObservationSetup,
    targetObservation: completedInvite.targetObservation,
  };

  if (completedInvite.target2B) {
    nextSession.target2B = completedInvite.target2B;
  }

  return Object.freeze(nextSession);
}

export const TARGET_OBSERVATION_SETUP_FIELDS = Object.freeze([
  Object.freeze({
    id: "observationPosition",
    label: "Observation position",
    type: "select",
    options: Object.freeze([
      "Acquirer deal sponsor",
      "Acquirer diligence lead",
      "Acquirer integration lead",
      "Acquirer functional leader",
      "External advisor acting for Acquirer",
    ]),
  }),
  Object.freeze({
    id: "respondentContext",
    label: "Respondent context",
    type: "structured-context",
    sections: RESPONDENT_CONTEXT_SECTIONS,
  }),
  Object.freeze({
    id: "integrationTimeline",
    label: "Evidence collection stage",
    type: "select",
    options: Object.freeze([
      "Pre-signing diligence",
      "Signing to close",
      "First 30 days after close",
    ]),
  }),
]);

export const TARGET_OBSERVATION_REQUIRED_FIELD_IDS = Object.freeze(
  [
    "observationPosition",
    ...RESPONDENT_CONTEXT_SECTIONS.map((section) => section.id),
    "integrationTimeline",
  ],
);

const RESPONDENT_CONTEXT_OPTION_LABELS = Object.freeze(Object.fromEntries(
  RESPONDENT_CONTEXT_SECTIONS.flatMap((section) =>
    section.options.map((option) => [option.value, option.title]),
  ),
));

const RESPONDENT_CONTEXT_OPTION_VALUES = Object.freeze(Object.fromEntries(
  RESPONDENT_CONTEXT_SECTIONS.map((section) => [section.id, new Set(section.options.map((option) => option.value))]),
));

function normalizeValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildRespondentContextSummary(profile = {}) {
  return RESPONDENT_CONTEXT_SECTIONS
    .map((section) => RESPONDENT_CONTEXT_OPTION_LABELS[profile[section.id]])
    .filter(Boolean)
    .join(" | ");
}

export function validateTargetObservationSetup(input = {}) {
  const normalized = {};
  const missing = [];

  for (const field of TARGET_OBSERVATION_SETUP_FIELDS) {
    if (field.type === "structured-context") {
      const profile = {};
      for (const section of RESPONDENT_CONTEXT_SECTIONS) {
        const value = normalizeValue(input[section.id] ?? input.respondentContextProfile?.[section.id]);
        if (!RESPONDENT_CONTEXT_OPTION_VALUES[section.id].has(value)) {
          missing.push(section.id);
          continue;
        }
        profile[section.id] = value;
      }

      if (Object.keys(profile).length === RESPONDENT_CONTEXT_SECTIONS.length) {
        normalized.respondentContextProfile = Object.freeze(profile);
        normalized.respondentContext = buildRespondentContextSummary(profile);
      } else if (normalizeValue(input.respondentContext)) {
        normalized.respondentContext = normalizeValue(input.respondentContext);
      }
      continue;
    }

    const value = normalizeValue(input[field.id]);
    if (!field.options?.includes(value)) {
      missing.push(field.id);
      continue;
    }
    normalized[field.id] = value;
  }

  return Object.freeze({
    valid: missing.length === 0,
    missing: Object.freeze(missing),
    normalized: Object.freeze(normalized),
  });
}

export function buildTargetObservationSetupRecord(input, storedAt = new Date().toISOString()) {
  const validation = validateTargetObservationSetup(input);
  if (!validation.valid) {
    return Object.freeze({
      completed: false,
      missing: validation.missing,
      data: null,
    });
  }

  return Object.freeze({
    completed: true,
    storedAt,
    data: validation.normalized,
  });
}

export function attachTargetObservationSetup(session, input, storedAt) {
  const setup = buildTargetObservationSetupRecord(input, storedAt);
  return Object.freeze({
    session: Object.freeze({
      ...(session ?? {}),
      targetObservationSetup: setup,
    }),
    setup,
  });
}

export function isTargetObservationSourceLoaded(diagnostic = TARGET_OBSERVATION_DIAGNOSTIC) {
  return Boolean(
    diagnostic?.source === "ST_Target_Observed_Environment_Diagnostic.xlsx"
      && diagnostic?.worksheet === "Questionnaire"
      && Number.isInteger(diagnostic?.questionCount)
      && Array.isArray(diagnostic?.questions)
      && diagnostic.questions.length === diagnostic.questionCount
      && diagnostic.questions.length > 0,
  );
}

export function canStartTargetObservation(session, diagnostic = TARGET_OBSERVATION_DIAGNOSTIC) {
  return Boolean(session?.targetObservationSetup?.completed && isTargetObservationSourceLoaded(diagnostic));
}

function selectedOption(question, value) {
  return question.options.find((option) => option.value === selectedOptionValue(value));
}

function confidenceValue(option) {
  const match = option?.confidenceImpact?.match(/\+(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function scoreTargetObservation(answers = {}, diagnostic = TARGET_OBSERVATION_DIAGNOSTIC) {
  const missingQuestionIds = [];
  let evidenceConfidence = 0;
  let diagnosticAnswerCount = 0;
  const classificationValidation = validateEvidenceClassifiedAnswers(diagnostic.questions, answers);

  for (const question of diagnostic.questions) {
    const answer = answers[question.id];
    const option = selectedOption(question, answer);
    if (!option) {
      missingQuestionIds.push(question.id);
      continue;
    }

    if (option.environment === "N/A") {
      evidenceConfidence += confidenceValue(option);
      continue;
    }

    diagnosticAnswerCount += 1;
  }

  const score = scoreLayeredEvidenceQuestionSet(diagnostic.questions, answers, {
    environmentCodes: TARGET_OBSERVATION_ENVIRONMENT_CODES,
    moduleId: "target_observed_environment",
  });

  return Object.freeze({
    ...score,
    valid: missingQuestionIds.length === 0 && classificationValidation.valid,
    missingQuestionIds: Object.freeze(missingQuestionIds),
    invalidClassification: classificationValidation.invalid,
    classificationValidation,
    answeredQuestionCount: diagnostic.questionCount - missingQuestionIds.length,
    diagnosticAnswerCount,
    evidenceConfidence,
    topEnvironmentCode: score.primaryEnvironmentCode,
  });
}

export function createTargetObservationOutputContext(session, score) {
  const setup = session?.targetObservationSetup;
  if (!setup?.completed) {
    return null;
  }

  return Object.freeze({
    observationPosition: setup.data.observationPosition,
    respondentContext: setup.data.respondentContext,
    respondentContextProfile: setup.data.respondentContextProfile ?? null,
    integrationTimeline: setup.data.integrationTimeline,
    observedTargetEnvironment: score?.topEnvironmentCode ?? null,
    evidenceConfidence: score?.evidenceConfidence ?? 0,
  });
}
