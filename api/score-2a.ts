import { scoreAcquirerModule } from "../src/flow/acquirerTrackFlow.js";
import { methodNotAllowed, parseJsonBody, jsonResponse } from "./_response.js";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return methodNotAllowed(request.method, ["POST"]);
  }

  const body = await parseJsonBody(request);
  const answers = typeof body?.answers === "object" && body.answers ? body.answers : {};
  const score = scoreAcquirerModule(answers);

  if (!score.valid) {
    return jsonResponse(400, {
      endpoint: "/api/score-2a",
      status: "answers-incomplete",
      missingQuestionIds: score.missingQuestionIds,
    });
  }

  return jsonResponse(200, {
    endpoint: "/api/score-2a",
    status: "scored",
    score,
  });
}
