import assert from "node:assert/strict";
import {
  CONSULTATION_FIELDS,
  CONSULTATION_RECIPIENT,
  attachConsultationRequest,
  validateConsultationRequest,
} from "../src/flow/consultationFlow.js";
import { routeForRole } from "../src/flow/roleRouting.js";

assert.equal(routeForRole("advisor"), "/screen-12-consultation-request");
assert.deepEqual(CONSULTATION_FIELDS.map((field) => field.id), [
  "name",
  "role",
  "dealContext",
  "scheduling",
]);

const invalid = validateConsultationRequest({ name: "Only name" });
assert.equal(invalid.valid, false);
assert.deepEqual(invalid.missing, ["role", "dealContext", "scheduling"]);

const result = attachConsultationRequest(Object.freeze({ sessionId: "consult-smoke" }), {
  name: "Nataly",
  role: "Advisor",
  dealContext: "Live integration diligence",
  scheduling: "Next week",
}, {
  submittedAt: "2026-05-01T12:00:00.000Z",
});

assert.equal(result.ok, true);
assert.equal(result.consultationRequest.completed, true);
assert.equal(result.emailDelivery.status, "sent");
assert.equal(result.emailDelivery.to, CONSULTATION_RECIPIENT);
assert.equal(result.session.consultationRequest, result.consultationRequest);
assert.equal(result.session.consultationEmailDelivery, result.emailDelivery);

console.log("Consultation request routing and email-delivery smoke test passed");
