import { isSessionLedgerStorageError, targetObservationState } from "./_sessionLedger.js";

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

export default async function handler(req: NodeApiRequest, res: NodeApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: "method-not-allowed",
      method: req.method,
      allowed: ["GET"],
    });
  }

  const url = new URL(req.url, "https://st.local");
  const sessionId = url.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return res.status(400).json({
      status: "invalid-request",
      error: "sessionId is required",
    });
  }

  try {
    const state = await targetObservationState(sessionId);
    return res.status(200).json({
      status: "target-observation-state",
      ...state,
    });
  } catch (error) {
    if (isSessionLedgerStorageError(error)) {
      return res.status(503).json({
        status: error.status,
        error: error.message,
      });
    }

    return res.status(500).json({
      status: "target-observation-state-unavailable",
      error: error instanceof Error ? error.message : "Target Observation state is unavailable",
    });
  }
}
