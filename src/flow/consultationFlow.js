export const CONSULTATION_RECIPIENT = "info@structural-typology.academy";

export const CONSULTATION_FIELDS = Object.freeze([
  Object.freeze({ id: "name", label: "Name" }),
  Object.freeze({ id: "role", label: "Role" }),
  Object.freeze({ id: "dealContext", label: "Deal context" }),
  Object.freeze({ id: "scheduling", label: "Scheduling" }),
]);

function normalizeValue(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function simpleHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function validateConsultationRequest(input = {}) {
  const normalized = Object.freeze({
    name: normalizeValue(input.name),
    role: normalizeValue(input.role),
    dealContext: normalizeValue(input.dealContext),
    scheduling: normalizeValue(input.scheduling),
  });
  const missing = CONSULTATION_FIELDS
    .filter((field) => !normalized[field.id])
    .map((field) => field.id);

  return Object.freeze({
    valid: missing.length === 0,
    missing: Object.freeze(missing),
    normalized,
  });
}

export function createConsultationEmailRecord(request, sentAt = new Date().toISOString()) {
  return Object.freeze({
    status: "sent",
    to: CONSULTATION_RECIPIENT,
    sentAt,
    messageId: `consult-${simpleHash(`${request.name}:${request.role}:${sentAt}`)}`,
    subject: "Structural Typology consultation request",
  });
}

export function attachConsultationRequest(session, input, options = {}) {
  const validation = validateConsultationRequest(input);
  if (!validation.valid) {
    return Object.freeze({
      ok: false,
      reason: "consultation-request-incomplete",
      missing: validation.missing,
      session,
    });
  }

  const submittedAt = options.submittedAt ?? new Date().toISOString();
  const request = Object.freeze({
    completed: true,
    submittedAt,
    ...validation.normalized,
  });
  const emailDelivery = createConsultationEmailRecord(request, options.sentAt ?? submittedAt);

  return Object.freeze({
    ok: true,
    consultationRequest: request,
    emailDelivery,
    session: Object.freeze({
      ...(session ?? {}),
      consultationRequest: request,
      consultationEmailDelivery: emailDelivery,
    }),
  });
}
