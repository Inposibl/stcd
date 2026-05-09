import { validateTargetObservationSetup } from "../src/flow/targetObservationFlow.js";
import { methodNotAllowed, parseJsonBody, jsonResponse } from "./_response";
import { saveTargetObservationSetup } from "./_sessionLedger";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return methodNotAllowed(request.method, ["POST"]);
  }

  const body = await parseJsonBody(request);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
  const setup = typeof body?.setup === "object" && body.setup ? body.setup : {};

  if (!sessionId) {
    return jsonResponse(400, {
      status: "invalid-request",
      error: "sessionId is required",
    });
  }

  const validation = validateTargetObservationSetup(setup);
  if (!validation.valid) {
    return jsonResponse(400, {
      status: "setup-incomplete",
      missing: validation.missing,
    });
  }

  const session = saveTargetObservationSetup(sessionId, validation.normalized);
  return jsonResponse(200, {
    status: "target-observation-setup-stored",
    sessionId,
    targetObservationSetup: session.targetObservationSetup,
  });
}
