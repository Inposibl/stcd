export function jsonResponse(statusCode: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function methodNotAllowed(method: string, allowed: string[]) {
  return jsonResponse(405, {
    status: "method-not-allowed",
    method,
    allowed,
  });
}
