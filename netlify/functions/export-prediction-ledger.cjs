const {
  PREDICTION_LEDGER_HEADERS,
  PREDICTION_LEDGER_SHEET,
  PREDICTION_LEDGER_WORKBOOK,
  exportSealedPredictionAuditRows,
} = require("./_predictionLedger.cjs");

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

function isLocalHost(hostname) {
  return hostname === "127.0.0.1" || hostname === "localhost";
}

function isAuthorizedAuditRequest(event) {
  const configuredKey = process.env.PREDICTION_LEDGER_AUDIT_KEY;
  const url = new URL(event.rawUrl ?? `https://${event.headers.host ?? "localhost"}${event.path ?? "/"}`);
  if (!configuredKey && isLocalHost(url.hostname)) return true;
  if (!configuredKey) return false;
  const requestKey = event.headers["x-st-audit-key"] ?? url.searchParams.get("auditKey");
  return requestKey === configuredKey;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function toCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, {
      status: "method-not-allowed",
      method: event.httpMethod,
      allowed: ["GET"],
    });
  }

  if (!isAuthorizedAuditRequest(event)) {
    return jsonResponse(403, {
      endpoint: "/api/export-prediction-ledger",
      status: "audit-export-forbidden",
    });
  }

  const rows = exportSealedPredictionAuditRows();
  const url = new URL(event.rawUrl ?? `https://${event.headers.host ?? "localhost"}${event.path ?? "/"}`);
  const format = url.searchParams.get("format") ?? "json";
  if (format === "csv") {
    return {
      statusCode: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=\"prediction-ledger-audit.csv\"",
      },
      body: toCsv(PREDICTION_LEDGER_HEADERS, rows),
    };
  }

  return jsonResponse(200, {
    endpoint: "/api/export-prediction-ledger",
    status: "audit-export-ready",
    storage: "netlify-function-memory-ledger",
    workbookRuntimeWrite: false,
    workbook: PREDICTION_LEDGER_WORKBOOK,
    sheet: PREDICTION_LEDGER_SHEET,
    generatedAt: new Date().toISOString(),
    rowCount: rows.length,
    headers: PREDICTION_LEDGER_HEADERS,
    rows,
  });
};
