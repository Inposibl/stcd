import { sealPrediction } from "./_predictionLedger.js";
import { methodNotAllowed, parseJsonBody, jsonResponse } from "./_response.js";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return methodNotAllowed(request.method, ["POST"]);
  }

  const body = await parseJsonBody(request);
  const result = sealPrediction(typeof body === "object" && body ? body : {});

  if (!result.ok) {
    return jsonResponse(400, {
      endpoint: "/api/seal-prediction",
      ...result,
    });
  }

  return jsonResponse(201, {
    endpoint: "/api/seal-prediction",
    status: result.status,
    storage: result.storage,
    ledgerEntryId: result.entry.ledgerEntryId,
    sequence: result.entry.sequence,
    sealedAt: result.entry.sealedAt,
    sealHash: result.entry.sealHash,
    sealVersion: result.entry.sealVersion,
    workbookRuntimeWrite: result.workbookRuntimeWrite,
  });
}
