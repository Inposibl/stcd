import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const DEV_API_ROUTES = Object.freeze({
  "/api/seal-prediction": "/api/seal-prediction.ts",
  "/api/export-prediction-ledger": "/api/export-prediction-ledger.ts",
});

const PUBLIC_ENVIRONMENT_CODES = Object.freeze([
  "NF/NT",
  "NT/STJ",
  "NT/STP",
  "NF/SFJ",
  "NF/SFP",
  "SFJ/SFP",
  "SFP/SFJ",
  "STJ/STP",
  "STP/STJ",
]);

function sanitizeEnvironmentCodeLiterals() {
  const replacements = PUBLIC_ENVIRONMENT_CODES.map((code) => [
    code,
    code.replace("/", "\\u002f"),
  ]);

  function sanitize(value) {
    return replacements.reduce(
      (current, [code, replacement]) => current.split(code).join(replacement),
      value,
    );
  }

  return {
    name: "sanitize-environment-code-literals",
    generateBundle(_, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type === "chunk") {
          asset.code = sanitize(asset.code);
        } else if (typeof asset.source === "string") {
          asset.source = sanitize(asset.source);
        }
      }
    },
  };
}

function headersFromNodeRequest(request) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (typeof value === "string") {
      headers.set(key, value);
    }
  }
  return headers;
}

function readNodeRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function sendFetchResponse(nodeResponse, fetchResponse) {
  nodeResponse.statusCode = fetchResponse.status;
  fetchResponse.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value);
  });
  return fetchResponse.arrayBuffer()
    .then((body) => nodeResponse.end(Buffer.from(body)));
}

function localVercelApiMiddleware() {
  return {
    name: "local-vercel-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const origin = `http://${request.headers.host ?? "127.0.0.1"}`;
        const url = new URL(request.url ?? "/", origin);
        const modulePath = DEV_API_ROUTES[url.pathname];
        if (!modulePath) {
          next();
          return;
        }

        try {
          const body = request.method === "GET" || request.method === "HEAD"
            ? undefined
            : await readNodeRequestBody(request);
          const handlerModule = await server.ssrLoadModule(modulePath);
          const apiRequest = new Request(url.toString(), {
            method: request.method,
            headers: headersFromNodeRequest(request),
            body: body?.length ? body : undefined,
          });
          const apiResponse = await handlerModule.default(apiRequest);
          await sendFetchResponse(response, apiResponse);
        } catch (error) {
          server.config.logger.error(error);
          response.statusCode = 500;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.end(JSON.stringify({
            endpoint: url.pathname,
            status: "local-api-error",
          }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    localVercelApiMiddleware(),
    react(),
    sanitizeEnvironmentCodeLiterals(),
  ],
});
