const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_REPORT_HIDDEN_COPY_TO = "n.petyaev@gmail.com";

type NodeRequest = {
  body?: unknown;
  method?: string;
  url?: string;
  on?: (event: "data" | "end" | "error", callback: (chunk?: any) => void) => void;
};

type NodeResponse = {
  statusCode: number;
  json?: (body: unknown) => void;
  status?: (statusCode: number) => NodeResponse;
  setHeader: (name: string, value: string) => void;
  end: (body: string) => void;
};

function sendJson(response: NodeResponse, statusCode: number, body: unknown) {
  const setStatus = response.status;
  const sendBody = response.json;
  if (typeof setStatus === "function" && typeof sendBody === "function") {
    setStatus.call(response, statusCode);
    sendBody.call(response, body);
    return;
  }

  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function sendMethodNotAllowed(response: NodeResponse, method: string | undefined, allowed: string[]) {
  sendJson(response, 405, {
    status: "method-not-allowed",
    method: method ?? "UNKNOWN",
    allowed,
  });
}

async function parseBody(request: NodeRequest) {
  if (typeof request.body === "object" && request.body) {
    return request.body;
  }

  if (typeof request.body === "string") {
    try {
      return request.body ? JSON.parse(request.body) : null;
    } catch {
      return null;
    }
  }

  return new Promise<any>((resolve) => {
    let raw = "";

    if (typeof request.on !== "function") {
      resolve(null);
      return;
    }

    request.on("data", (chunk) => {
      raw += chunk?.toString() ?? "";
    });
    request.on("error", () => resolve(null));
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : null);
      } catch {
        resolve(null);
      }
    });
  });
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function firstConfiguredString(...values: unknown[]) {
  for (const value of values) {
    const cleanValue = cleanString(value);
    if (cleanValue) return cleanValue;
  }
  return "";
}

function sanitizeEmailProviderError(value: unknown) {
  let message = "";
  if (value instanceof Error) {
    message = value.message;
  } else if (typeof value === "string") {
    message = value;
  } else if (typeof value === "object" && value) {
    const body = value as { message?: unknown; error?: unknown; name?: unknown };
    message = cleanString(body.message ?? body.error ?? body.name);
  }

  return (message || "E-mail provider request failed")
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[redacted-email]")
    .replace(/https?:\/\/[^\s"')]+/g, "[redacted-url]")
    .replace(/\b\d{6}\b/g, "[redacted-code]")
    .slice(0, 300);
}

function validPdfFileName(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._ -]*\.pdf$/i.test(value);
}

function validPdfBase64(value: string) {
  return value.startsWith("JVBERi") && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validateAuthorizedSurveyLink(value: string) {
  try {
    const parsed = new URL(value);
    const allowedPath = parsed.pathname === "/screen-6a-target-observation-setup/authorized";
    const requiredParams = ["observationSessionId", "assessmentSessionId", "codeHash", "createdAt", "expiresAt"];
    const hasRequiredParams = requiredParams.every((param) => Boolean(parsed.searchParams.get(param)));
    return allowedPath && hasRequiredParams;
  } catch {
    return false;
  }
}

function validateTargetSelfSurveyLink(value: string) {
  try {
    const parsed = new URL(value);
    const allowedPath = parsed.pathname === "/screen-9a-target-code-gate";
    const requiredParams = ["targetSessionId", "assessmentId", "codeHash", "createdAt", "expiresAt"];
    const hasRequiredParams = requiredParams.every((param) => Boolean(parsed.searchParams.get(param)));
    return allowedPath && hasRequiredParams;
  } catch {
    return false;
  }
}

async function sendSurveyLink(
  request: NodeRequest,
  response: NodeResponse,
  params: URLSearchParams,
  options: {
    endpoint: string;
    invalidLinkStatus: string;
    invalidLinkError: string;
    subject: string;
    intro: string;
    linkText: string;
    validateSurveyLink: (value: string) => boolean;
  },
) {
  if (request.method !== "POST") {
    sendMethodNotAllowed(response, request.method, ["POST"]);
    return;
  }

  const body = await parseBody(request);
  const recipientEmail = normalizeEmail(body?.recipientEmail ?? params.get("recipientEmail"));
  const surveyLink = cleanString(body?.surveyLink ?? params.get("surveyLink"));
  const digitalCode = cleanString(body?.digitalCode ?? params.get("digitalCode"));
  const expiresAt = cleanString(body?.expiresAt ?? params.get("expiresAt"));

  if (!EMAIL_PATTERN.test(recipientEmail)) {
    sendJson(response, 400, {
      endpoint: options.endpoint,
      status: "invalid-recipient-email",
      error: "A valid recipientEmail is required",
    });
    return;
  }

  if (!options.validateSurveyLink(surveyLink) || !/^\d{6}$/.test(digitalCode) || !expiresAt) {
    sendJson(response, 400, {
      endpoint: options.endpoint,
      status: options.invalidLinkStatus,
      error: options.invalidLinkError,
    });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = firstConfiguredString(
    process.env.AUTHORIZED_LINK_FROM_EMAIL,
    process.env.AUTHORIZED_LINK_FROM,
    process.env.REPORT_FROM_EMAIL,
    process.env.REPORT_COPY_FROM,
  );

  if (!apiKey || !from) {
    sendJson(response, 503, {
      endpoint: options.endpoint,
      status: "email-service-not-configured",
      error: "RESEND_API_KEY and sender e-mail environment variables are required",
    });
    return;
  }

  const text = [
    options.intro,
    "",
    `Survey link: ${surveyLink}`,
    `6-digit code: ${digitalCode}`,
    `Expires at: ${expiresAt}`,
  ].join("\n");
  const html = [
    `<p>${escapeHtml(options.intro)}</p>`,
    `<p><a href="${escapeHtml(surveyLink)}">${escapeHtml(options.linkText)}</a></p>`,
    `<p><strong>6-digit code:</strong> ${escapeHtml(digitalCode)}</p>`,
    `<p><strong>Expires at:</strong> ${escapeHtml(expiresAt)}</p>`,
  ].join("");

  const action = cleanString(params.get("action")) || cleanString(options.endpoint.split("action=").at(1));
  let providerResponse: Response;
  let providerBody: any;

  try {
    providerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipientEmail],
        subject: options.subject,
        text,
        html,
      }),
    });
    providerBody = await providerResponse.json();
  } catch (error) {
    const sanitizedError = sanitizeEmailProviderError(error);
    console.error("Survey link e-mail send failed", {
      endpoint: options.endpoint,
      action,
      error: sanitizedError,
    });
    sendJson(response, 502, {
      endpoint: options.endpoint,
      status: "email-send-failed",
      action,
      error: sanitizedError,
    });
    return;
  }

  if (!providerResponse.ok) {
    const sanitizedError = sanitizeEmailProviderError(
      providerBody?.message ?? providerBody?.error ?? `Resend returned HTTP ${providerResponse.status}`,
    );
    console.error("Survey link e-mail provider rejected request", {
      endpoint: options.endpoint,
      action,
      providerStatus: providerResponse.status,
      error: sanitizedError,
    });
    sendJson(response, 502, {
      endpoint: options.endpoint,
      status: "email-provider-error",
      providerStatus: providerResponse.status,
      action,
      error: sanitizedError,
    });
    return;
  }

  sendJson(response, 200, {
    endpoint: options.endpoint,
    status: "sent",
    to: recipientEmail,
    provider: "resend",
    messageId: providerBody?.id ?? null,
  });
}

async function sendFinalReport(request: NodeRequest, response: NodeResponse) {
  if (request.method !== "POST") {
    sendMethodNotAllowed(response, request.method, ["POST"]);
    return;
  }

  const body = await parseBody(request);
  const recipientEmail = normalizeEmail(body?.recipientEmail);
  const firstName = cleanString(body?.firstName);
  const reportId = cleanString(body?.reportId);
  const fileName = cleanString(body?.fileName) || "structural-typology-final-deliverables-report.pdf";
  const pdfBase64 = cleanString(body?.pdfBase64);

  if (!EMAIL_PATTERN.test(recipientEmail) || !firstName) {
    sendJson(response, 400, {
      endpoint: "/api/final-report?action=send-final-report",
      status: "invalid-report-recipient",
      error: "A valid recipientEmail and firstName are required",
    });
    return;
  }

  if (!reportId || !validPdfFileName(fileName) || !validPdfBase64(pdfBase64)) {
    sendJson(response, 400, {
      endpoint: "/api/final-report?action=send-final-report",
      status: "invalid-final-report",
      error: "A valid reportId, PDF fileName, and PDF attachment are required",
    });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = firstConfiguredString(
    process.env.REPORT_FROM_EMAIL,
    process.env.REPORT_COPY_FROM,
    process.env.AUTHORIZED_LINK_FROM_EMAIL,
    process.env.AUTHORIZED_LINK_FROM,
  );
  const hiddenCopyTo = normalizeEmail(firstConfiguredString(
    process.env.REPORT_HIDDEN_COPY_TO,
    DEFAULT_REPORT_HIDDEN_COPY_TO,
  ));
  const bcc = EMAIL_PATTERN.test(hiddenCopyTo) && hiddenCopyTo !== recipientEmail ? [hiddenCopyTo] : undefined;

  if (!apiKey || !from) {
    sendJson(response, 503, {
      endpoint: "/api/final-report?action=send-final-report",
      status: "email-service-not-configured",
      error: "RESEND_API_KEY and sender e-mail environment variables are required",
    });
    return;
  }

  const subject = "Structural Typology Final Report";
  const text = [
    `Hello ${firstName},`,
    "",
    "Your Structural Typology final report is attached.",
    "",
    `Report reference: ${reportId}`,
  ].join("\n");
  const html = [
    `<p>Hello ${escapeHtml(firstName)},</p>`,
    "<p>Your Structural Typology final report is attached.</p>",
    `<p><strong>Report reference:</strong> ${escapeHtml(reportId)}</p>`,
  ].join("");

  const providerResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipientEmail],
      ...(bcc ? { bcc } : {}),
      subject,
      text,
      html,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
        },
      ],
    }),
  });

  const providerBody = await providerResponse.json().catch(() => null);
  if (!providerResponse.ok) {
    sendJson(response, 502, {
      endpoint: "/api/final-report?action=send-final-report",
      status: "email-provider-error",
      providerStatus: providerResponse.status,
      error: providerBody?.message ?? "Resend rejected the final report e-mail request",
    });
    return;
  }

  sendJson(response, 200, {
    endpoint: "/api/final-report?action=send-final-report",
    status: "sent",
    to: recipientEmail,
    hiddenCopy: Boolean(bcc),
    provider: "resend",
    messageId: providerBody?.id ?? null,
  });
}

async function sendFinalReportHiddenCopy(request: NodeRequest, response: NodeResponse) {
  if (request.method !== "POST") {
    sendMethodNotAllowed(response, request.method, ["POST"]);
    return;
  }

  const body = await parseBody(request);
  const reportId = cleanString(body?.reportId);
  const fileName = cleanString(body?.fileName) || "structural-typology-final-deliverables-report.pdf";
  const pdfBase64 = cleanString(body?.pdfBase64);

  if (!reportId || !validPdfFileName(fileName) || !validPdfBase64(pdfBase64)) {
    sendJson(response, 400, {
      endpoint: "/api/final-report?action=send-final-report-hidden-copy",
      status: "invalid-final-report",
      error: "A valid reportId, PDF fileName, and PDF attachment are required",
    });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = firstConfiguredString(
    process.env.REPORT_FROM_EMAIL,
    process.env.REPORT_COPY_FROM,
    process.env.AUTHORIZED_LINK_FROM_EMAIL,
    process.env.AUTHORIZED_LINK_FROM,
  );
  const hiddenCopyTo = normalizeEmail(firstConfiguredString(
    process.env.REPORT_HIDDEN_COPY_TO,
    DEFAULT_REPORT_HIDDEN_COPY_TO,
  ));

  if (!apiKey || !from || !EMAIL_PATTERN.test(hiddenCopyTo)) {
    sendJson(response, 503, {
      endpoint: "/api/final-report?action=send-final-report-hidden-copy",
      status: "email-service-not-configured",
      error: "RESEND_API_KEY, sender e-mail, and hidden-copy recipient environment variables are required",
    });
    return;
  }

  const providerResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [hiddenCopyTo],
      subject: "Structural Typology Final Report Copy",
      text: `A final report PDF was saved from the public diagnostic.\n\nReport reference: ${reportId}`,
      html: `<p>A final report PDF was saved from the public diagnostic.</p><p><strong>Report reference:</strong> ${escapeHtml(reportId)}</p>`,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
        },
      ],
    }),
  });

  const providerBody = await providerResponse.json().catch(() => null);
  if (!providerResponse.ok) {
    sendJson(response, 502, {
      endpoint: "/api/final-report?action=send-final-report-hidden-copy",
      status: "email-provider-error",
      providerStatus: providerResponse.status,
      error: providerBody?.message ?? "Resend rejected the hidden final report e-mail request",
    });
    return;
  }

  sendJson(response, 200, {
    endpoint: "/api/final-report?action=send-final-report-hidden-copy",
    status: "sent",
    hiddenCopy: true,
    provider: "resend",
    messageId: providerBody?.id ?? null,
  });
}

export default async function handler(request: NodeRequest, response: NodeResponse) {
  const requestUrl = new URL(request.url ?? "/api/final-report", "https://st.local");
  if (requestUrl.searchParams.get("action") === "send-final-report-hidden-copy") {
    await sendFinalReportHiddenCopy(request, response);
    return;
  }

  if (requestUrl.searchParams.get("action") === "send-final-report") {
    await sendFinalReport(request, response);
    return;
  }

  if (requestUrl.searchParams.get("action") === "send-authorized-link") {
    await sendSurveyLink(request, response, requestUrl.searchParams, {
      endpoint: "/api/final-report?action=send-authorized-link",
      invalidLinkStatus: "invalid-authorized-link",
      invalidLinkError: "A valid authorized surveyLink, 6-digit digitalCode, and expiresAt are required",
      subject: "Authorized Target Observer survey link",
      intro: "Please complete the authorized Target Observer survey.",
      linkText: "Open the authorized survey",
      validateSurveyLink: validateAuthorizedSurveyLink,
    });
    return;
  }

  if (requestUrl.searchParams.get("action") === "send-target-self-link") {
    await sendSurveyLink(request, response, requestUrl.searchParams, {
      endpoint: "/api/final-report?action=send-target-self-link",
      invalidLinkStatus: "invalid-target-self-link",
      invalidLinkError: "A valid Target Self-Assessment surveyLink, 6-digit digitalCode, and expiresAt are required",
      subject: "Target Self-Assessment survey link",
      intro: "Please complete the Target Self-Assessment survey.",
      linkText: "Open the Target Self-Assessment",
      validateSurveyLink: validateTargetSelfSurveyLink,
    });
    return;
  }

  sendJson(response, 501, {
    endpoint: "/api/final-report",
    status: "contract-stub",
    message: "Returns final report only after Acquirer and verified Target completion.",
  });
}
