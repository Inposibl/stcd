import { methodNotAllowed, parseJsonBody, jsonResponse } from "./_response.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

async function sendAuthorizedLink(request: Request) {
  if (request.method !== "POST") {
    return methodNotAllowed(request.method, ["POST"]);
  }

  const body = await parseJsonBody(request);
  const recipientEmail = normalizeEmail(body?.recipientEmail);
  const surveyLink = cleanString(body?.surveyLink);
  const digitalCode = cleanString(body?.digitalCode);
  const expiresAt = cleanString(body?.expiresAt);

  if (!EMAIL_PATTERN.test(recipientEmail)) {
    return jsonResponse(400, {
      endpoint: "/api/final-report?action=send-authorized-link",
      status: "invalid-recipient-email",
      error: "A valid recipientEmail is required",
    });
  }

  if (!validateAuthorizedSurveyLink(surveyLink) || !/^\d{6}$/.test(digitalCode) || !expiresAt) {
    return jsonResponse(400, {
      endpoint: "/api/final-report?action=send-authorized-link",
      status: "invalid-authorized-link",
      error: "A valid authorized surveyLink, 6-digit digitalCode, and expiresAt are required",
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTHORIZED_LINK_FROM_EMAIL
    ?? process.env.AUTHORIZED_LINK_FROM
    ?? process.env.REPORT_COPY_FROM;

  if (!apiKey || !from) {
    return jsonResponse(503, {
      endpoint: "/api/final-report?action=send-authorized-link",
      status: "email-service-not-configured",
      error: "RESEND_API_KEY and sender e-mail environment variables are required",
    });
  }

  const subject = "Authorized Target Observer survey link";
  const text = [
    "Please complete the authorized Target Observer survey.",
    "",
    `Survey link: ${surveyLink}`,
    `6-digit code: ${digitalCode}`,
    `Expires at: ${expiresAt}`,
  ].join("\n");
  const html = [
    "<p>Please complete the authorized Target Observer survey.</p>",
    `<p><a href="${escapeHtml(surveyLink)}">Open the authorized survey</a></p>`,
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
      subject,
      text,
      html,
    }),
  });

  const providerBody = await providerResponse.json().catch(() => null);
  if (!providerResponse.ok) {
    return jsonResponse(502, {
      endpoint: "/api/final-report?action=send-authorized-link",
      status: "email-provider-error",
      providerStatus: providerResponse.status,
      error: providerBody?.message ?? "Resend rejected the e-mail request",
    });
  }

  return jsonResponse(200, {
    endpoint: "/api/final-report?action=send-authorized-link",
    status: "sent",
    to: recipientEmail,
    provider: "resend",
    messageId: providerBody?.id ?? null,
  });
}

export default async function handler(request: Request) {
  const requestUrl = new URL(request.url);
  if (requestUrl.searchParams.get("action") === "send-authorized-link") {
    return sendAuthorizedLink(request);
  }

  return jsonResponse(501, {
    endpoint: "/api/final-report",
    status: "contract-stub",
    message: "Returns final report only after Acquirer and verified Target completion.",
  });
}
