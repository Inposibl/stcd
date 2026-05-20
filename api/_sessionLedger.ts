import { createHash, randomInt, randomUUID } from "node:crypto";
import {
  buildTargetObservationSetupRecord,
  canStartTargetObservation,
  hashObservationSetupCode,
  scoreTargetObservation,
} from "../src/flow/targetObservationFlow.js";
import {
  scoreTargetDiagnosticCombined,
  scoreTargetDiagnosticLevel1,
  scoreTargetDiagnosticQuestions,
} from "../src/flow/targetDiagnosticFlow.js";
import { validateEvidenceClassifiedAnswers } from "../src/flow/evidenceClassification.js";
import { TARGET_DIAGNOSTIC_DATA } from "../src/data/targetDiagnosticData.js";

const TARGET_INVITE_TTL_HOURS = 72;
const TARGET_OBSERVATION_SESSION_TTL_SECONDS = 259200;
const REDIS_REST_TIMEOUT_MS = 4000;

type SessionRecord = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  targetObservationSetup: ReturnType<typeof buildTargetObservationSetupRecord> | null;
  targetObservation: unknown | null;
  target2B: unknown | null;
  targetInvite?: TargetInviteRecord | null;
};

type LedgerGlobal = typeof globalThis & {
  __stPublicSessionLedger?: Map<string, SessionRecord>;
};

export class SessionLedgerStorageError extends Error {
  status: string;

  constructor(status: string, message: string) {
    super(message);
    this.name = "SessionLedgerStorageError";
    this.status = status;
  }
}

export function isSessionLedgerStorageError(error: unknown): error is SessionLedgerStorageError {
  return error instanceof SessionLedgerStorageError;
}

type TargetInviteRecord = {
  targetSessionId: string;
  assessmentSessionId: string;
  preliminaryAssessmentId: string;
  reportBinding: unknown;
  codeHash: string;
  createdAt: string;
  expiresAt: string;
  completed: boolean;
  revoked: boolean;
  completedAt?: string;
  revokedAt?: string;
  revokedReason?: string;
  targetSelfAssessment?: unknown;
};

function ledger() {
  const root = globalThis as LedgerGlobal;
  if (!root.__stPublicSessionLedger) {
    root.__stPublicSessionLedger = new Map<string, SessionRecord>();
  }
  return root.__stPublicSessionLedger;
}

function cleanEnv(value: unknown) {
  return String(value ?? "").trim();
}

function isLocalDevelopmentRuntime() {
  return process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production";
}

function storageConfig() {
  const url = cleanEnv(process.env.KV_REST_API_URL) || cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
  const token = cleanEnv(process.env.KV_REST_API_TOKEN) || cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (url && token) {
    return {
      url: url.replace(/\/$/, ""),
      token,
    };
  }

  if (isLocalDevelopmentRuntime()) return null;

  throw new SessionLedgerStorageError(
    "persistent-storage-not-configured",
    "Target Observation persistent storage is not configured.",
  );
}

function emptySessionRecord(sessionId: string, now = new Date().toISOString()): SessionRecord {
  return {
    sessionId,
    createdAt: now,
    updatedAt: now,
    targetObservationSetup: null,
    targetObservation: null,
    target2B: null,
    targetInvite: null,
  };
}

function targetObservationSessionKey(sessionId: string) {
  return `target-observation-session:${sessionId}`;
}

function normalizeSessionRecord(sessionId: string, value: unknown): SessionRecord {
  const now = new Date().toISOString();
  const record = typeof value === "object" && value ? value as Partial<SessionRecord> : {};
  return {
    sessionId,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : now,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : now,
    targetObservationSetup: record.targetObservationSetup ?? null,
    targetObservation: record.targetObservation ?? null,
    target2B: record.target2B ?? null,
    targetInvite: record.targetInvite ?? null,
  };
}

async function redisCommand(command: unknown[], failureStatus: string) {
  const config = storageConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REDIS_REST_TIMEOUT_MS);
  let response: Response;
  let payload: { error?: string; result?: unknown } | null;
  try {
    response = await fetch(config.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(command),
      signal: controller.signal,
    });
    payload = await response.json().catch((error) => {
      if (controller.signal.aborted) throw error;
      return null;
    });
  } catch (error) {
    const aborted = controller.signal.aborted || typeof error === "object"
      && error !== null
      && "name" in error
      && (error as { name?: unknown }).name === "AbortError";
    throw new SessionLedgerStorageError(
      failureStatus,
      aborted
        ? `Target Observation persistent storage request timed out after ${REDIS_REST_TIMEOUT_MS} ms.`
        : error instanceof Error ? error.message : "Target Observation persistent storage request failed.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok || payload?.error) {
    throw new SessionLedgerStorageError(
      failureStatus,
      payload?.error ?? `Target Observation persistent storage returned status ${response.status}.`,
    );
  }

  return payload?.result ?? null;
}

async function readLedgerSession(sessionId: string) {
  const config = storageConfig();
  if (!config) return getSession(sessionId);

  const raw = await redisCommand(["GET", targetObservationSessionKey(sessionId)], "persistent-storage-read-failed");
  if (raw === null || raw === undefined) {
    return emptySessionRecord(sessionId);
  }

  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const session = normalizeSessionRecord(sessionId, parsed);
    ledger().set(sessionId, session);
    return session;
  } catch {
    throw new SessionLedgerStorageError(
      "persistent-storage-invalid-record",
      "Target Observation persistent storage returned an invalid session record.",
    );
  }
}

async function writeLedgerSession(sessionId: string, session: SessionRecord) {
  const config = storageConfig();
  ledger().set(sessionId, session);
  if (!config) return session;

  await redisCommand(
    ["SET", targetObservationSessionKey(sessionId), JSON.stringify(session), "EX", String(TARGET_OBSERVATION_SESSION_TTL_SECONDS)],
    "persistent-storage-write-failed",
  );
  return session;
}

export function getSession(sessionId: string) {
  const store = ledger();
  const existing = store.get(sessionId);
  if (existing) return existing;

  const session = emptySessionRecord(sessionId);
  store.set(sessionId, session);
  return session;
}

export async function saveTargetObservationSetup(sessionId: string, setupInput: Record<string, unknown>) {
  const session = await readLedgerSession(sessionId);
  const setup = buildTargetObservationSetupRecord(setupInput);
  const nextSession: SessionRecord = {
    ...session,
    updatedAt: new Date().toISOString(),
    targetObservationSetup: setup,
  };
  return writeLedgerSession(sessionId, nextSession);
}

export async function targetObservationState(sessionId: string) {
  const session = await readLedgerSession(sessionId);
  return {
    sessionId,
    targetObservationSetup: session.targetObservationSetup,
    targetObservation: session.targetObservation,
    target2B: session.target2B,
    canStartTargetObservation: canStartTargetObservation(session),
    authorizedTargetObservationComplete: Boolean((session.targetObservation as { completed?: boolean } | null)?.completed),
    authorizedTargetObserverComplete: Boolean(
      (session.targetObservation as { completed?: boolean } | null)?.completed
      && (session.target2B as { completed?: boolean } | null)?.completed,
    ),
  };
}

function buildTargetDiagnosticRecord(input: {
  level1Answers?: Record<string, unknown>;
  level2Answers?: Record<string, unknown>;
}) {
  const level1Answers = typeof input.level1Answers === "object" && input.level1Answers ? input.level1Answers : {};
  const level2Answers = typeof input.level2Answers === "object" && input.level2Answers ? input.level2Answers : {};
  const level1Questions = [...TARGET_DIAGNOSTIC_DATA.level1.questions];
  const level2Questions = [...TARGET_DIAGNOSTIC_DATA.level2.questions];
  const level1Score = scoreTargetDiagnosticLevel1(level1Answers);
  const level1ClassificationValidation = validateEvidenceClassifiedAnswers(level1Questions, level1Answers);

  if (!level1Score.valid) {
    return {
      ok: false,
      status: "target-diagnostic-level-1-incomplete",
      missingQuestionIds: level1Score.missingQuestionIds,
    };
  }
  if (!level1ClassificationValidation.valid) {
    return {
      ok: false,
      status: "target-diagnostic-level-1-classification-incomplete",
      invalidClassification: level1ClassificationValidation.invalid,
    };
  }

  const now = new Date().toISOString();
  if (!level1Score.requiresLevel2) {
    return {
      ok: true,
      target2B: Object.freeze({
        level1: Object.freeze({
          completed: true,
          storedAt: now,
          answers: Object.freeze({ ...level1Answers }),
          classificationValidation: level1ClassificationValidation,
          score: level1Score,
        }),
        requiresLevel2: false,
        completed: true,
        finalScore: level1Score,
      }),
    };
  }

  const level2Score = scoreTargetDiagnosticQuestions(level2Questions, level2Answers);
  const level2ClassificationValidation = validateEvidenceClassifiedAnswers(level2Questions, level2Answers);
  const finalClassificationValidation = validateEvidenceClassifiedAnswers(
    [...level1Questions, ...level2Questions],
    { ...level1Answers, ...level2Answers },
  );
  if (!level2Score.valid) {
    return {
      ok: false,
      status: "target-diagnostic-level-2-incomplete",
      requiresLevel2: true,
      level1Score,
      missingQuestionIds: level2Score.missingQuestionIds,
    };
  }
  if (!level2ClassificationValidation.valid || !finalClassificationValidation.valid) {
    return {
      ok: false,
      status: "target-diagnostic-level-2-classification-incomplete",
      requiresLevel2: true,
      invalidClassification: finalClassificationValidation.invalid,
    };
  }

  return {
    ok: true,
    target2B: Object.freeze({
      level1: Object.freeze({
        completed: true,
        storedAt: now,
        answers: Object.freeze({ ...level1Answers }),
        classificationValidation: level1ClassificationValidation,
        score: level1Score,
      }),
      level2: Object.freeze({
        completed: true,
        storedAt: now,
        answers: Object.freeze({ ...level2Answers }),
        classificationValidation: level2ClassificationValidation,
        score: level2Score,
      }),
      requiresLevel2: true,
      completed: true,
      classificationValidation: finalClassificationValidation,
      finalScore: scoreTargetDiagnosticCombined(level1Answers, level2Answers),
    }),
  };
}

export async function saveTargetObservationCompletion(input: {
  assessmentSessionId: string;
  observationSessionId: string;
  codeHash: string;
  digitalCode: string;
  setup: Record<string, unknown>;
  answers: Record<string, unknown>;
  targetDiagnostic?: {
    level1Answers?: Record<string, unknown>;
    level2Answers?: Record<string, unknown>;
  };
}) {
  const expectedHash = hashObservationSetupCode(input.digitalCode, input.observationSessionId, input.assessmentSessionId);
  if (!/^\d{6}$/.test(input.digitalCode) || expectedHash !== input.codeHash) {
    return {
      ok: false,
      status: "wrong-code",
    };
  }

  const setupRecord = buildTargetObservationSetupRecord(input.setup);
  if (!setupRecord.completed) {
    return {
      ok: false,
      status: "setup-incomplete",
      missing: setupRecord.missing,
    };
  }

  const score = scoreTargetObservation(input.answers);
  if (!score.valid) {
    if (score.invalidClassification?.length) {
      return {
        ok: false,
        status: "target-observation-classification-incomplete",
        invalidClassification: score.invalidClassification,
      };
    }
    return {
      ok: false,
      status: "target-observation-incomplete",
      missingQuestionIds: score.missingQuestionIds,
    };
  }

  const targetDiagnostic = buildTargetDiagnosticRecord(input.targetDiagnostic ?? {});
  if (!targetDiagnostic.ok) {
    return targetDiagnostic;
  }

  const now = new Date().toISOString();
  const setupData = setupRecord.data as Record<string, unknown>;
  const targetObservation = Object.freeze({
    completed: true,
    storedAt: now,
    observationSessionId: input.observationSessionId,
    answers: Object.freeze({ ...input.answers }),
    classificationValidation: score.classificationValidation,
    score,
    outputContext: Object.freeze({
      observationPosition: setupData.observationPosition,
      respondentContext: setupData.respondentContext,
      respondentContextProfile: setupData.respondentContextProfile ?? null,
      integrationTimeline: setupData.integrationTimeline,
      observedTargetEnvironment: score.topEnvironmentCode,
      evidenceConfidence: score.evidenceConfidence,
    }),
  });

  const session = await readLedgerSession(input.assessmentSessionId);
  const nextSession: SessionRecord = {
    ...session,
    updatedAt: now,
    targetObservationSetup: setupRecord,
    targetObservation,
    target2B: targetDiagnostic.target2B,
  };
  await writeLedgerSession(input.assessmentSessionId, nextSession);

  return {
    ok: true,
    status: "target-observation-received",
    sessionId: input.assessmentSessionId,
    targetObservationSetup: setupRecord,
    targetObservation,
    target2B: targetDiagnostic.target2B,
  };
}

function codeHash(code: string, targetSessionId: string, preliminaryAssessmentId: string) {
  return createHash("sha256").update(`${targetSessionId}:${preliminaryAssessmentId}:${code}`).digest("hex");
}

function sixDigitCode() {
  return String(randomInt(100000, 1000000));
}

function expiresAt(createdAt: string) {
  return new Date(new Date(createdAt).getTime() + TARGET_INVITE_TTL_HOURS * 60 * 60 * 1000).toISOString();
}

function findInvite(targetSessionId: string) {
  for (const session of ledger().values()) {
    if (session.targetInvite?.targetSessionId === targetSessionId) {
      return { session, invite: session.targetInvite };
    }
  }
  return null;
}

export function createServerTargetSession(input: {
  assessmentSessionId: string;
  preliminaryAssessmentId: string;
  track1Complete: boolean;
  preliminaryAssessmentCreated: boolean;
  reportBinding?: unknown;
  baseUrl?: string;
}) {
  if (!input.track1Complete || !input.preliminaryAssessmentCreated) {
    return {
      ok: false,
      status: "track-1-or-preliminary-incomplete",
    };
  }

  const session = getSession(input.assessmentSessionId);
  const now = new Date().toISOString();
  const digitalCode = sixDigitCode();
  const targetSessionId = `tgt-${randomUUID()}`;
  const invite: TargetInviteRecord = {
    targetSessionId,
    assessmentSessionId: input.assessmentSessionId,
    preliminaryAssessmentId: input.preliminaryAssessmentId,
    reportBinding: input.reportBinding ?? null,
    codeHash: codeHash(digitalCode, targetSessionId, input.preliminaryAssessmentId),
    createdAt: now,
    expiresAt: expiresAt(now),
    completed: false,
    revoked: false,
  };

  const priorInvite = session.targetInvite && !session.targetInvite.completed
    ? {
        ...session.targetInvite,
        revoked: true,
        revokedAt: now,
        revokedReason: "superseded",
      }
    : session.targetInvite;

  const nextSession: SessionRecord = {
    ...session,
    updatedAt: now,
    targetInvite: invite,
  };
  ledger().set(input.assessmentSessionId, nextSession);

  const baseUrl = input.baseUrl?.replace(/\/$/, "") ?? "";
  return {
    ok: true,
    status: "target-session-created",
    priorInvite,
    targetSessionId,
    surveyLink: `${baseUrl}/screen-9a-target-code-gate?targetSessionId=${encodeURIComponent(targetSessionId)}`,
    digitalCode,
    expiresAt: invite.expiresAt,
    ttlHours: TARGET_INVITE_TTL_HOURS,
    codeDigits: 6,
  };
}

export function verifyServerTargetCode(targetSessionId: string, code: string, now = new Date().toISOString()) {
  const found = findInvite(targetSessionId);
  const normalizedCode = typeof code === "string" ? code.trim() : "";
  if (!found) return { ok: false, status: "not-found" };
  const { invite } = found;
  if (invite.revoked) return { ok: false, status: "revoked" };
  if (invite.completed) return { ok: false, status: "completed" };
  if (new Date(now).getTime() > new Date(invite.expiresAt).getTime()) return { ok: false, status: "expired" };
  if (!/^\d{6}$/.test(normalizedCode)) return { ok: false, status: "invalid-format" };
  if (codeHash(normalizedCode, targetSessionId, invite.preliminaryAssessmentId) !== invite.codeHash) {
    return { ok: false, status: "wrong-code" };
  }
  return {
    ok: true,
    status: "verified",
    targetSessionId,
    verificationToken: createHash("sha256").update(`${targetSessionId}:${invite.codeHash}:verified`).digest("hex"),
  };
}

export function completeServerTargetSession(targetSessionId: string, code: string, targetSelfAssessment: unknown) {
  const verification = verifyServerTargetCode(targetSessionId, code);
  if (!verification.ok) return verification;

  const found = findInvite(targetSessionId);
  if (!found) return { ok: false, status: "not-found" };
  const now = new Date().toISOString();
  const invite: TargetInviteRecord = {
    ...found.invite,
    completed: true,
    completedAt: now,
    targetSelfAssessment,
  };
  const session: SessionRecord = {
    ...found.session,
    updatedAt: now,
    targetInvite: invite,
  };
  ledger().set(found.session.sessionId, session);
  return {
    ok: true,
    status: "target-self-assessment-received",
    targetSessionId,
    completedAt: now,
  };
}
