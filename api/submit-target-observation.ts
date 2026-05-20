import { isSessionLedgerStorageError, saveTargetObservationCompletion } from "./_sessionLedger.js";

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
  const assessmentSessionId = typeof body?.assessmentSessionId === "string" ? body.assessmentSessionId.trim() : "";
  const observationSessionId = typeof body?.observationSessionId === "string" ? body.observationSessionId.trim() : "";
  const codeHash = typeof body?.codeHash === "string" ? body.codeHash.trim() : "";
  const digitalCode = typeof body?.digitalCode === "string" ? body.digitalCode.trim() : "";
  const setup = typeof body?.setup === "object" && body.setup ? body.setup : {};
  const answers = typeof body?.answers === "object" && body.answers ? body.answers : {};
  const targetDiagnostic = typeof body?.targetDiagnostic === "object" && body.targetDiagnostic ? body.targetDiagnostic : {};

  if (!assessmentSessionId || !observationSessionId || !codeHash || !digitalCode) {
    return res.status(400).json({
      endpoint: "/api/submit-target-observation",
      status: "invalid-request",
      error: "assessmentSessionId, observationSessionId, codeHash, and digitalCode are required",
    });
  }

  let result;
  try {
    result = await saveTargetObservationCompletion({
      assessmentSessionId,
      observationSessionId,
      codeHash,
      digitalCode,
      setup,
      answers,
      targetDiagnostic,
    });
  } catch (error) {
    if (isSessionLedgerStorageError(error)) {
      return res.status(503).json({
        endpoint: "/api/submit-target-observation",
        status: error.status,
        error: error.message,
      });
    }

    return res.status(500).json({
      endpoint: "/api/submit-target-observation",
      status: "target-observation-save-failed",
      error: error instanceof Error ? error.message : "Target Observation submission could not be saved",
    });
  }

  return res.status(result.ok ? 200 : 400).json({
    endpoint: "/api/submit-target-observation",
    ...result,
  });
}
