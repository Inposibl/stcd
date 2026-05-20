import { methodNotAllowed, jsonResponse } from "./_response.js";
import { isSessionLedgerStorageError, targetObservationState } from "./_sessionLedger.js";

export default async function handler(request: Request) {
  if (request.method !== "GET") {
    return methodNotAllowed(request.method, ["GET"]);
  }

  const url = new URL(request.url, "https://st.local");
  const sessionId = url.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return jsonResponse(400, {
      status: "invalid-request",
      error: "sessionId is required",
    });
  }

  try {
    return jsonResponse(200, {
      status: "target-observation-state",
      ...await targetObservationState(sessionId),
    });
  } catch (error) {
    return jsonResponse(isSessionLedgerStorageError(error) ? 503 : 500, {
      status: isSessionLedgerStorageError(error) ? error.status : "target-observation-state-unavailable",
      error: error instanceof Error ? error.message : "Target Observation state is unavailable",
    });
  }
}
