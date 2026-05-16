import { FINAL_DELIVERABLE_DATA } from "../data/finalDeliverableData.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeFirstName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function fieldId(label) {
  return label.toLowerCase() === "email" ? "email" : "firstName";
}

function parseScreen12Body(body) {
  const text = String(body ?? "");
  const fieldMatch = text.match(/Two fields:\s*([^.]*)\./);
  const labels = (fieldMatch?.[1] ?? "Email \u00b7 First name")
    .split(/\s*\u00b7\s*/)
    .map((label) => label.trim())
    .filter(Boolean);

  return Object.freeze({
    fields: Object.freeze(labels.map((label) => Object.freeze({ id: fieldId(label), label }))),
    note: text.replace(fieldMatch?.[0] ?? "", "").trim(),
  });
}

function simpleHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildEmailCaptureCopy(data = FINAL_DELIVERABLE_DATA) {
  const parsedBody = parseScreen12Body(data.screenCopy.screen12Body);
  return Object.freeze({
    screen: "screen-12",
    route: "/screen-12-email-capture",
    header: data.screenCopy.screen12Header,
    fields: parsedBody.fields,
    note: parsedBody.note,
    cta: data.screenCopy.screen12Cta,
  });
}

export function validateEmailCaptureInput(input = {}) {
  const email = normalizeEmail(input.email);
  const firstName = normalizeFirstName(input.firstName);
  const errors = {};

  if (!EMAIL_PATTERN.test(email)) errors.email = "invalid-email";
  if (!firstName) errors.firstName = "missing-first-name";

  return Object.freeze({
    ok: Object.keys(errors).length === 0,
    errors: Object.freeze(errors),
    value: Object.freeze({ email, firstName }),
  });
}

export function createReportDeliveryRecord(capture, deliveredAt = new Date().toISOString(), options = {}) {
  const reportId = `pdf-${simpleHash(`${capture.email}:${capture.capturedAt}`)}`;
  return Object.freeze({
    completed: true,
    status: "delivered",
    reportId,
    fileName: options.fileName ?? "structural-typology-final-deliverables-report.pdf",
    mimeType: "application/pdf",
    deliveredAt,
    generatedAt: options.generatedAt ?? deliveredAt,
    recipientEmail: capture.email,
    provider: options.provider ?? null,
    messageId: options.messageId ?? null,
    hiddenCopy: Boolean(options.hiddenCopy),
  });
}

export function attachEmailCapture(session, input, options = {}) {
  const validation = validateEmailCaptureInput(input);
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      reason: "invalid-email-capture",
      errors: validation.errors,
      session,
    });
  }

  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const capture = Object.freeze({
    completed: true,
    capturedAt,
    email: validation.value.email,
    firstName: validation.value.firstName,
    sourceRoute: "/screen-12-email-capture",
  });
  const reportDelivery = createReportDeliveryRecord(capture, options.deliveredAt ?? capturedAt, options);

  return Object.freeze({
    ok: true,
    emailCapture: capture,
    reportDelivery,
    session: Object.freeze({
      ...(session ?? {}),
      emailCapture: capture,
      reportDelivery,
    }),
  });
}

export function isEmailCaptureSourceLoaded(data = FINAL_DELIVERABLE_DATA) {
  const copy = buildEmailCaptureCopy(data);
  return Boolean(
    data?.sources?.includes("ST_UI_Track_Coder_Agent_Specification_v1.xlsx")
      && copy.header === "Where should we send your report?"
      && copy.fields.some((field) => field.id === "email")
      && copy.fields.some((field) => field.id === "firstName")
      && copy.cta === "\u2192 Send report",
  );
}
