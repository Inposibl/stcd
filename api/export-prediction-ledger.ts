import {
  PREDICTION_LEDGER_HEADERS,
  PREDICTION_LEDGER_SHEET,
  PREDICTION_LEDGER_WORKBOOK,
  exportSealedPredictionAuditRows,
} from "./_predictionLedger.ts";
import { jsonResponse, methodNotAllowed } from "./_response.ts";

function isLocalRequest(request: Request) {
  const url = new URL(request.url, "https://st.local");
  return url.hostname === "127.0.0.1" || url.hostname === "localhost";
}

function isAuthorizedAuditRequest(request: Request) {
  const configuredKey = process.env.PREDICTION_LEDGER_AUDIT_KEY;
  if (!configuredKey && isLocalRequest(request)) return true;
  if (!configuredKey) return false;
  const requestKey = request.headers.get("x-st-audit-key") ?? new URL(request.url, "https://st.local").searchParams.get("auditKey");
  return requestKey === configuredKey;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function toCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export default async function handler(request: Request) {
  if (request.method !== "GET") {
    return methodNotAllowed(request.method, ["GET"]);
  }

  if (!isAuthorizedAuditRequest(request)) {
    return jsonResponse(403, {
      endpoint: "/api/export-prediction-ledger",
      status: "audit-export-forbidden",
    });
  }

  const rows = exportSealedPredictionAuditRows();
  const url = new URL(request.url, "https://st.local");
  const format = url.searchParams.get("format") ?? "json";
  if (format === "csv") {
    return new Response(toCsv(PREDICTION_LEDGER_HEADERS, rows), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=\"prediction-ledger-audit.csv\"",
      },
    });
  }

  return jsonResponse(200, {
    endpoint: "/api/export-prediction-ledger",
    status: "audit-export-ready",
    storage: "backend-append-only-ledger",
    workbookRuntimeWrite: false,
    workbook: PREDICTION_LEDGER_WORKBOOK,
    sheet: PREDICTION_LEDGER_SHEET,
    generatedAt: new Date().toISOString(),
    rowCount: rows.length,
    headers: PREDICTION_LEDGER_HEADERS,
    rows,
  });
}
