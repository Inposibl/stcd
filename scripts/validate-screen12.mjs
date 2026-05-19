import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  attachEmailCapture,
  buildEmailCaptureCopy,
  isEmailCaptureSourceLoaded,
  validateEmailCaptureInput,
} from "../src/flow/emailCaptureFlow.js";
import { resetPublicAssessmentSession } from "../src/flow/targetInviteFlow.js";
import { SCREEN_REGISTRY } from "../src/screenRegistry.js";

const routeIds = new Set(SCREEN_REGISTRY.map((screen) => screen.id));
assert.equal(routeIds.has("screen-12-email-capture"), true);

assert.equal(isEmailCaptureSourceLoaded(), true);

const copy = buildEmailCaptureCopy();
assert.equal(copy.screen, "screen-12");
assert.equal(copy.route, "/screen-12-email-capture");
assert.equal(copy.header, "Where should we send your report?");
assert.equal(copy.cta, "\u2192 Send report");
assert.deepEqual(copy.fields.map((field) => field.id), ["email", "firstName"]);
assert.deepEqual(copy.fields.map((field) => field.label), ["Email", "First name"]);

const invalid = validateEmailCaptureInput({ email: "not-an-email", firstName: "" });
assert.equal(invalid.ok, false);
assert.equal(invalid.errors.email, "invalid-email");
assert.equal(invalid.errors.firstName, "missing-first-name");

const baseSession = Object.freeze({ sessionId: "screen12-smoke" });
const result = attachEmailCapture(baseSession, {
  email: "FOUNDER@EXAMPLE.COM ",
  firstName: "  Nataly  ",
}, {
  capturedAt: "2026-05-01T12:00:00.000Z",
});

assert.equal(result.ok, true);
assert.equal(result.emailCapture.completed, true);
assert.equal(result.emailCapture.email, "founder@example.com");
assert.equal(result.emailCapture.firstName, "Nataly");
assert.equal(result.emailCapture.sourceRoute, "/screen-12-email-capture");
assert.equal(result.reportDelivery.completed, true);
assert.equal(result.reportDelivery.status, "delivered");
assert.equal(result.reportDelivery.mimeType, "application/pdf");
assert.equal(result.reportDelivery.recipientEmail, "founder@example.com");
assert.equal(result.reportDelivery.fileName, "structural-typology-final-deliverables-report.pdf");
assert.equal(result.session.emailCapture, result.emailCapture);
assert.equal(result.session.reportDelivery, result.reportDelivery);

const sentResult = attachEmailCapture(baseSession, {
  email: "FOUNDER@EXAMPLE.COM ",
  firstName: "Nataly",
}, {
  capturedAt: "2026-05-01T12:00:00.000Z",
  fileName: "structural-typology-final-deliverables-report.pdf",
  provider: "resend",
  messageId: "email_123",
  hiddenCopy: true,
});
assert.equal(sentResult.reportDelivery.provider, "resend");
assert.equal(sentResult.reportDelivery.messageId, "email_123");
assert.equal(sentResult.reportDelivery.hiddenCopy, true);

const apiSource = readFileSync(new URL("../api/final-report.ts", import.meta.url), "utf8");
assert.match(apiSource, /send-final-report/);
assert.match(apiSource, /send-final-report-hidden-copy/);
assert.match(apiSource, /send-authorized-link/);
assert.match(apiSource, /send-target-self-link/);
assert.match(apiSource, /bcc/);
assert.match(apiSource, /n\.petyaev@gmail\.com/);
assert.match(apiSource, /firstConfiguredString/);
assert.ok((apiSource.match(/REPORT_HIDDEN_COPY_TO/g) ?? []).length >= 2);
assert.ok((apiSource.match(/DEFAULT_REPORT_HIDDEN_COPY_TO/g) ?? []).length >= 3);

const surveyLinkStart = apiSource.indexOf("async function sendSurveyLink");
const finalReportStart = apiSource.indexOf("async function sendFinalReport");
assert.notEqual(surveyLinkStart, -1);
assert.notEqual(finalReportStart, -1);
const surveyLinkSource = apiSource.slice(surveyLinkStart, finalReportStart);
assert.match(surveyLinkSource, /process\.env\.AUTHORIZED_LINK_FROM_EMAIL/);
assert.match(surveyLinkSource, /process\.env\.AUTHORIZED_LINK_FROM/);
assert.match(surveyLinkSource, /process\.env\.REPORT_FROM_EMAIL/);
assert.match(surveyLinkSource, /process\.env\.REPORT_COPY_FROM/);

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
assert.match(appSource, /action=send-final-report/);
assert.match(appSource, /action=send-final-report-hidden-copy/);
assert.match(appSource, /sendHiddenFinalDeliverablesReportCopy/);
assert.match(appSource, /Save full report in PDF/);
assert.match(appSource, /hidden copy was not sent/);
assert.match(appSource, /pdfBase64/);

const resetSession = resetPublicAssessmentSession(result.session, "2026-05-01T13:00:00.000Z");
assert.equal(resetSession.emailCapture, null);
assert.equal(resetSession.reportDelivery, null);

console.log("Screen 12 email capture storage and PDF-delivery smoke test passed");
