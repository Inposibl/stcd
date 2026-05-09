import { jsonResponse } from "./_response";

export default async function handler() {
  return jsonResponse(501, {
    endpoint: "/api/final-report",
    status: "contract-stub",
    message: "Returns final report only after Acquirer and verified Target completion.",
  });
}

