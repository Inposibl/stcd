import { canCreatePreliminaryAssessment } from "./targetDiagnosticFlow.js";
import { buildContradictionReport } from "./contradictionEngine.js";
import { buildTriageReport } from "./triageEngine.js";

export const TARGET_INVITE_TTL_HOURS = 72;
export const TARGET_DIGITAL_CODE_DIGITS = 6;

function addHours(isoDate, hours) {
  return new Date(new Date(isoDate).getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function hashDigitalCode(code, targetSessionId, assessmentId) {
  const input = `${targetSessionId}:${assessmentId}:${code}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function generateSixDigitCode(random = Math.random) {
  return String(100000 + Math.floor(random() * 900000)).slice(0, 6);
}

export function buildTargetSurveyLink({
  basePath = "/screen-9a-target-code-gate",
  targetSessionId,
  assessmentId,
  codeHash,
  createdAt,
  expiresAt,
}) {
  const params = new URLSearchParams();
  params.set("targetSessionId", targetSessionId);
  params.set("assessmentId", assessmentId);
  params.set("codeHash", codeHash);
  params.set("createdAt", createdAt);
  params.set("expiresAt", expiresAt);
  return `${basePath}?${params.toString()}`;
}

export function targetInviteFromLinkParams(params, basePath = "/screen-9a-target-code-gate") {
  const targetSessionId = params?.get("targetSessionId") ?? "";
  const assessmentId = params?.get("assessmentId") ?? "";
  const codeHash = params?.get("codeHash") ?? "";
  const createdAt = params?.get("createdAt") ?? "";
  const expiresAt = params?.get("expiresAt") ?? "";

  if (!targetSessionId || !assessmentId || !codeHash || !createdAt || !expiresAt) return null;

  return Object.freeze({
    targetSessionId,
    assessmentId,
    surveyLink: buildTargetSurveyLink({ basePath, targetSessionId, assessmentId, codeHash, createdAt, expiresAt }),
    digitalCode: "",
    codeHash,
    createdAt,
    expiresAt,
    ttlHours: TARGET_INVITE_TTL_HOURS,
    codeDigits: TARGET_DIGITAL_CODE_DIGITS,
    completed: false,
    revoked: false,
  });
}

export function createPreliminaryAssessment(session, createdAt = new Date().toISOString()) {
  if (!canCreatePreliminaryAssessment(session)) {
    return Object.freeze({
      completed: false,
      reason: "track-1-incomplete",
    });
  }

  const contradictionReport = buildContradictionReport(session, { generatedAt: createdAt });

  return Object.freeze({
    completed: true,
    assessmentId: `pa-${session.sessionId}-${Date.parse(createdAt)}`,
    createdAt,
    dealContext: session.dealContext.data,
    acquirerEnvironmentCode: session.acquirer2A.score.primaryEnvironmentCode,
    targetObservedEnvironmentCode: session.targetObservation.score.topEnvironmentCode,
    targetDiagnosticEnvironmentCode: session.target2B.finalScore.primaryEnvironmentCode,
    targetDiagnosticSignal: session.target2B.finalScore.signalStrength,
    observationContext: session.targetObservation.outputContext,
    contradictionReport,
    triageReport: buildTriageReport(session, { generatedAt: createdAt, contradictionReport }),
  });
}

export function attachPreliminaryAssessment(session, createdAt) {
  const preliminaryAssessment = createPreliminaryAssessment(session, createdAt);
  return Object.freeze({
    session: Object.freeze({
      ...(session ?? {}),
      preliminaryAssessment,
    }),
    preliminaryAssessment,
  });
}

export function canGenerateTargetInvite(session) {
  return Boolean(session?.preliminaryAssessment?.completed && !session?.targetInvite?.completed);
}

export function createTargetInvite(session, options = {}) {
  if (!canGenerateTargetInvite(session)) {
    return Object.freeze({
      ok: false,
      reason: "preliminary-assessment-required",
      invite: null,
    });
  }

  const createdAt = options.createdAt ?? new Date().toISOString();
  const digitalCode = options.digitalCode ?? generateSixDigitCode(options.random);
  const targetSessionId = options.targetSessionId ?? `tgt-${Date.parse(createdAt)}-${digitalCode}`;
  const assessmentId = session.preliminaryAssessment.assessmentId;
  const expiresAt = options.expiresAt ?? addHours(createdAt, TARGET_INVITE_TTL_HOURS);
  const basePath = options.basePath ?? "/screen-9a-target-code-gate";
  const codeHash = hashDigitalCode(digitalCode, targetSessionId, assessmentId);
  const surveyLink = buildTargetSurveyLink({ basePath, targetSessionId, assessmentId, codeHash, createdAt, expiresAt });

  const invite = Object.freeze({
    targetSessionId,
    assessmentId,
    surveyLink,
    digitalCode,
    codeHash,
    createdAt,
    expiresAt,
    ttlHours: TARGET_INVITE_TTL_HOURS,
    codeDigits: TARGET_DIGITAL_CODE_DIGITS,
    completed: false,
    revoked: false,
  });

  return Object.freeze({
    ok: true,
    invite,
    session: Object.freeze({
      ...session,
      targetInvite: invite,
    }),
  });
}

export function verifyTargetInvite(invite, code, now = new Date().toISOString()) {
  const normalizedCode = typeof code === "string" ? code.trim() : "";
  if (!invite) {
    return Object.freeze({ ok: false, status: "not-found" });
  }
  if (invite.revoked) {
    return Object.freeze({ ok: false, status: "revoked" });
  }
  if (invite.completed) {
    return Object.freeze({ ok: false, status: "completed" });
  }
  if (new Date(now).getTime() > new Date(invite.expiresAt).getTime()) {
    return Object.freeze({ ok: false, status: "expired" });
  }
  if (!/^\d{6}$/.test(normalizedCode)) {
    return Object.freeze({ ok: false, status: "invalid-format" });
  }
  const expectedHash = hashDigitalCode(normalizedCode, invite.targetSessionId, invite.assessmentId);
  if (expectedHash !== invite.codeHash) {
    return Object.freeze({ ok: false, status: "wrong-code" });
  }
  return Object.freeze({
    ok: true,
    status: "verified",
    verificationToken: `verified-${invite.targetSessionId}`,
  });
}

export function completeTargetInvite(invite, targetSelfAssessment, completedAt = new Date().toISOString()) {
  if (!invite || invite.revoked || invite.completed || !targetSelfAssessment?.completed) {
    return Object.freeze({
      ok: false,
      reason: "target-invite-not-completable",
      invite,
    });
  }

  return Object.freeze({
    ok: true,
    invite: Object.freeze({
      ...invite,
      completed: true,
      completedAt,
      targetSelfAssessment,
    }),
  });
}

export function invalidateTargetInvite(invite, revokedAt = new Date().toISOString(), reason = "reset") {
  if (!invite) return null;
  return Object.freeze({
    ...invite,
    revoked: true,
    revokedAt,
    revokedReason: reason,
  });
}

export function resetPublicAssessmentSession(session, resetAt = new Date().toISOString()) {
  return Object.freeze({
    sessionId: `public-session-${Date.parse(resetAt)}`,
    previousSessionId: session?.sessionId ?? null,
    resetAt,
    invalidatedInvite: invalidateTargetInvite(session?.targetInvite, resetAt, "assessment-reset"),
    dealContext: null,
    acquirer2A: null,
    acquirerVerificationInvite: null,
    acquirerVerification: null,
    targetObservationSetup: null,
    targetObservationSetupInvite: null,
    targetObservation: null,
    target2B: null,
    preliminaryAssessment: null,
    analystWorksheet: null,
    evidenceItems: Object.freeze([]),
    targetInvite: null,
    targetSelfAssessment: null,
    emailCapture: null,
    reportDelivery: null,
    consultationRequest: null,
    consultationEmailDelivery: null,
  });
}
