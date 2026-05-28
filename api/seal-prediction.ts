import { sealPrediction } from "./_predictionLedger.ts";

type NodeApiRequest = {
  method: string;
  url?: string;
  body?: unknown;
  json?: () => Promise<unknown>;
};

type NodeApiResponse = {
  status(statusCode: number): {
    json(body: unknown): unknown;
  };
};

function createResponseAdapter(): NodeApiResponse {
  return {
    status(statusCode: number) {
      return {
        json(body: unknown) {
          return new Response(JSON.stringify(body), {
            status: statusCode,
            headers: {
              "content-type": "application/json; charset=utf-8",
            },
          });
        },
      };
    },
  };
}

async function parseNodeBody(req: NodeApiRequest) {
  if (req instanceof Request) {
    try {
      return await req.json();
    } catch {
      return null;
    }
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }

  if (typeof req.body === "object" && req.body) return req.body;

  return null;
}

export default async function handler(req: NodeApiRequest, res: NodeApiResponse) {
  res ??= createResponseAdapter();

  if (req.method !== "POST") {
    return res.status(405).json({
      status: "method-not-allowed",
      method: req.method,
      allowed: ["POST"],
    });
  }

  try {
    const body = await parseNodeBody(req);
    const result = sealPrediction(typeof body === "object" && body ? body : {});

    if (!result.ok) {
      return res.status(400).json({
        endpoint: "/api/seal-prediction",
        ...result,
      });
    }

    return res.status(201).json({
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
  } catch (error) {
    return res.status(500).json({
      endpoint: "/api/seal-prediction",
      status: "seal-failed",
      error: error instanceof Error ? error.message : "Prediction seal could not be created",
    });
  }
}
