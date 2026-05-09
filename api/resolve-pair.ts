import { buildPairDeliverable } from "../src/flow/finalDeliverableFlow.js";
import { jsonResponse, methodNotAllowed, parseJsonBody } from "./_response.ts";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return methodNotAllowed(request.method, ["POST"]);
  }

  const body = await parseJsonBody(request);
  const result = buildPairDeliverable(typeof body === "object" && body ? body : {});

  if (!result.ready) {
    return jsonResponse(400, {
      endpoint: "/api/resolve-pair",
      status: result.status,
    });
  }

  return jsonResponse(200, {
    endpoint: "/api/resolve-pair",
    status: "pair-resolved",
    route: result.route,
    screen: result.screen,
    outcomeKey: result.outcomeKey,
    acquirerAlias: result.acquirerAlias,
    targetAlias: result.targetAlias,
    compatibilityRange: result.compatibilityRange,
    riskBand: result.riskBand,
    narrativeFound: "narrative" in result ? Boolean(result.narrative) : false,
    frictionFound: "friction" in result ? Boolean(result.friction) : false,
  });
}
