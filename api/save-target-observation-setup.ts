import { validateTargetObservationSetup } from "../src/flow/targetObservationFlow.js";
import { isSessionLedgerStorageError, saveTargetObservationSetup } from "./_sessionLedger.js";

type NodeApiRequest = {
  method: string;
  url: string;
  body?: unknown;
};

type NodeApiResponse = {
  status(statusCode: number): {
    json(body: unknown): unknown;
  };
};

function parseNodeBody(req: NodeApiRequest) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }

  return typeof req.body === "object" && req.body ? req.body : null;
}

export default async function handler(req: NodeApiRequest, res: NodeApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      status: "method-not-allowed",
      method: req.method,
      allowed: ["POST"],
    });
  }

  const body = parseNodeBody(req);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
  const setup = typeof body?.setup === "object" && body.setup ? body.setup : {};

  if (!sessionId) {
    return res.status(400).json({
      status: "invalid-request",
      error: "sessionId is required",
    });
  }

  const validation = validateTargetObservationSetup(setup);
  if (!validation.valid) {
    return res.status(400).json({
      status: "setup-incomplete",
      missing: validation.missing,
    });
  }

  let session;
  try {
    session = await saveTargetObservationSetup(sessionId, validation.normalized);
  } catch (error) {
    if (isSessionLedgerStorageError(error)) {
      return res.status(503).json({
        status: error.status,
        error: error.message,
      });
    }

    return res.status(500).json({
      status: "target-observation-setup-save-failed",
      error: error instanceof Error ? error.message : "Target Observation setup could not be saved",
    });
  }

  return res.status(200).json({
    status: "target-observation-setup-stored",
    sessionId,
    targetObservationSetup: session.targetObservationSetup,
  });
}
