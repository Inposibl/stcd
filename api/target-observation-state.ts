import { methodNotAllowed, jsonResponse } from "./_response.js";
import { targetObservationState } from "./_sessionLedger.js";

export default async function handler(request: Request) {
  if (request.method !== "GET") {
    return methodNotAllowed(request.method, ["GET"]);
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return jsonResponse(400, {
      status: "invalid-request",
      error: "sessionId is required",
    });
  }

  return jsonResponse(200, {
    status: "target-observation-state",
    ...targetObservationState(sessionId),
  });
}
