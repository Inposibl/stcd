import { verifyServerTargetCode } from "./_sessionLedger.js";
import { methodNotAllowed, parseJsonBody, jsonResponse } from "./_response.js";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return methodNotAllowed(request.method, ["POST"]);
  }

  const body = await parseJsonBody(request);
  const targetSessionId = typeof body?.targetSessionId === "string" ? body.targetSessionId : "";
  const digitalCode = typeof body?.digitalCode === "string" ? body.digitalCode : "";
  const result = verifyServerTargetCode(targetSessionId, digitalCode);

  return jsonResponse(result.ok ? 200 : 403, {
    endpoint: "/api/verify-target-code",
    ...result,
  });
}
