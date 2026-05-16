const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const from = process.env.AUTHORIZED_LINK_FROM_EMAIL
    ?? process.env.AUTHORIZED_LINK_FROM
    ?? process.env.REPORT_COPY_FROM;

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

  const providerResponse = await fetch("https://api.resend.com/emails", {
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

  const providerBody = await providerResponse.json().catch(() => null);
  if (!providerResponse.ok) {
    sendJson(response, 502, {
      endpoint: options.endpoint,
      status: "email-provider-error",
      providerStatus: providerResponse.status,
      error: providerBody?.message ?? "Resend rejected the e-mail request",
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

export default async function handler(request: NodeRequest, response: NodeResponse) {
  const requestUrl = new URL(request.url ?? "/api/final-report", "https://st.local");
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
