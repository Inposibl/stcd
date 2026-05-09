const { sealPrediction } = require("./_predictionLedger.cjs");

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

function parseJsonBody(event) {
  try {
    return event.body ? JSON.parse(event.body) : null;
  } catch {
    return null;
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, {
      status: "method-not-allowed",
      method: event.httpMethod,
      allowed: ["POST"],
    });
  }

  const body = parseJsonBody(event);
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
};
