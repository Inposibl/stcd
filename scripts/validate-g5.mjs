import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import exportPredictionLedgerHandler from "../api/export-prediction-ledger.ts";
import sealPredictionHandler from "../api/seal-prediction.ts";
import { ACQUIRER_TRACK_DATA } from "../src/data/acquirerTrackData.js";
import { FINAL_DELIVERABLE_DATA } from "../src/data/finalDeliverableData.js";
import {
  CONSULTATION_FIELDS,
  CONSULTATION_RECIPIENT,
  attachConsultationRequest,
} from "../src/flow/consultationFlow.js";
import {
  attachAcquirerModuleResult,
  attachAcquirerVerificationCompletion,
  canContinueToTargetObservationSetup,
  completeAcquirerVerificationInvite,
  createAcquirerVerificationInvite,
  requiresAcquirerVerification,
} from "../src/flow/acquirerTrackFlow.js";
import {
  FINAL_ENVIRONMENT_CODES,
  buildPaidOffer,
  buildPairDeliverable,
  publicText,
} from "../src/flow/finalDeliverableFlow.js";
import { routeForRole } from "../src/flow/roleRouting.js";
import {
  RESPONDENT_CONTEXT_SECTIONS,
  TARGET_OBSERVATION_SETUP_FIELDS,
  attachTargetObservationSetup,
  canStartTargetObservation,
} from "../src/flow/targetObservationFlow.js";
import {
  attachPreliminaryAssessment,
  completeTargetInvite,
  createTargetInvite,
  verifyTargetInvite,
} from "../src/flow/targetInviteFlow.js";
import { evidenceClassifiedAnswer } from "../src/flow/evidenceClassification.js";
import { SCREEN_REGISTRY } from "../src/screenRegistry.js";

const ROOT_DIR = fileURLToPath(new URL("..", import.meta.url));
const DIST_DIR = join(ROOT_DIR, "dist");
const SRC_DIR = join(ROOT_DIR, "src");
const API_DIR = join(ROOT_DIR, "api");
const APP_FILE = join(SRC_DIR, "App.jsx");
const LIGHTHOUSE_TMP_DIR = join(ROOT_DIR, ".lighthouse-tmp");
const LIGHTHOUSE_PROFILE_DIR = join(ROOT_DIR, ".lighthouse-profile");
const LIGHTHOUSE_MIN_ACCESSIBILITY_SCORE = 95;

const SEALED_CAVEAT = "This is a structural-level forecast, not an individual-verified prediction. The three anchor lines describe what is most likely to emerge given the environment pair, but the timing and intensity for specific leaders cannot be confirmed without type-level data on the individuals involved. Type-level confirmation is delivered in the paid Integration Risk Report (Step 7).";

class ValidationBlocker extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationBlocker";
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertCheck(condition, message) {
  if (!condition) throw new Error(message);
}

function assertBlocked(condition, message) {
  if (!condition) throw new ValidationBlocker(message);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function listFiles(dir, extensions) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, extensions));
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      files.push(fullPath);
    }
  }
  return files;
}

function bundleFiles() {
  assertCheck(existsSync(DIST_DIR), "dist is missing; run npm run build before validate:g5");
  return listFiles(DIST_DIR, [".html", ".js", ".css", ".json"]);
}

function scanFiles(files, pattern) {
  const hits = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const regex = new RegExp(pattern.source, flags);
    const matches = [...text.matchAll(regex)];
    if (matches.length > 0) {
      hits.push({
        file: relative(ROOT_DIR, file),
        count: matches.length,
        sample: matches[0][0],
      });
    }
  }
  return hits;
}

function summarizeHits(hits) {
  const total = hits.reduce((sum, hit) => sum + hit.count, 0);
  const sample = hits.slice(0, 3).map((hit) => `${hit.file} (${hit.count}, e.g. ${hit.sample})`).join("; ");
  return `${total} match(es). ${sample}`;
}

function lighthouseCliPath() {
  const cli = join(ROOT_DIR, "node_modules", "lighthouse", "cli", "index.js");
  return existsSync(cli) ? cli : null;
}

function chromePath() {
  const configured = process.env.CHROME_PATH;
  const candidates = [
    configured,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function routeOutputName(route) {
  if (route === "/") return "root";
  return route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

function lighthouseBaseUrl() {
  return (process.env.G5_LIGHTHOUSE_BASE_URL ?? "http://127.0.0.1:5280").replace(/\/$/, "");
}

function routeUrl(baseUrl, route) {
  return route === "/" ? `${baseUrl}/` : `${baseUrl}${route}`;
}

async function assertServerReachable(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/`);
    assertBlocked(response.ok, `Lighthouse base URL returned HTTP ${response.status}: ${baseUrl}`);
  } catch (error) {
    throw new ValidationBlocker(`Lighthouse base URL is not reachable: ${baseUrl} (${error.message})`);
  }
}

function lighthouseJsonHasEnvCode(lhr) {
  const text = JSON.stringify(lhr);
  return FINAL_ENVIRONMENT_CODES.find((code) => text.includes(code));
}

function failingAccessibilityAudits(lhr) {
  return Object.values(lhr.audits ?? {})
    .filter((audit) => audit.score === 0)
    .map((audit) => {
      const node = audit.details?.items?.[0]?.node;
      return `${audit.id}: ${audit.title}${node?.nodeLabel ? ` (${node.nodeLabel})` : ""}`;
    });
}

async function runLighthouseAccessibilityAudit() {
  const lighthouseCli = lighthouseCliPath();
  assertBlocked(Boolean(lighthouseCli), "Lighthouse is not installed; cannot verify accessibility score >= 95 for every screen");

  const browserPath = chromePath();
  assertBlocked(Boolean(browserPath), "Chrome or Edge was not found; cannot run Lighthouse accessibility audit");

  const baseUrl = lighthouseBaseUrl();
  await assertServerReachable(baseUrl);

  mkdirSync(LIGHTHOUSE_TMP_DIR, { recursive: true });
  mkdirSync(LIGHTHOUSE_PROFILE_DIR, { recursive: true });

  const port = Number(process.env.G5_LIGHTHOUSE_PORT ?? 9222);
  const browser = spawn(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${LIGHTHOUSE_PROFILE_DIR}`,
    "about:blank",
  ], {
    detached: false,
    stdio: "ignore",
    windowsHide: true,
  });

  await wait(2000);

  const failures = [];
  try {
    for (const screen of SCREEN_REGISTRY) {
      const url = routeUrl(baseUrl, screen.route);
      const outputPath = join(LIGHTHOUSE_TMP_DIR, `${routeOutputName(screen.route)}.json`);
      const result = spawnSync(process.execPath, [
        lighthouseCli,
        url,
        `--port=${port}`,
        "--only-categories=accessibility",
        "--output=json",
        `--output-path=${outputPath}`,
        "--quiet",
      ], {
        cwd: ROOT_DIR,
        encoding: "utf8",
        env: {
          ...process.env,
          CHROME_PATH: browserPath,
          TEMP: LIGHTHOUSE_TMP_DIR,
          TMP: LIGHTHOUSE_TMP_DIR,
        },
        timeout: 120000,
      });

      if (result.error) {
        failures.push(`${screen.route}: Lighthouse process error: ${result.error.message}`);
        continue;
      }
      if (result.status !== 0) {
        failures.push(`${screen.route}: Lighthouse exited ${result.status}: ${(result.stderr || result.stdout).trim()}`);
        continue;
      }

      const lhr = JSON.parse(readFileSync(outputPath, "utf8"));
      const score = Math.round((lhr.categories?.accessibility?.score ?? 0) * 100);
      const leakedCode = lighthouseJsonHasEnvCode(lhr);
      if (leakedCode) {
        failures.push(`${screen.route}: Lighthouse result contains exact environment code ${leakedCode}`);
      }
      if (score < LIGHTHOUSE_MIN_ACCESSIBILITY_SCORE) {
        failures.push(`${screen.route}: accessibility ${score}; ${failingAccessibilityAudits(lhr).join("; ")}`);
      }
    }
  } finally {
    browser.kill();
  }

  assertCheck(failures.length === 0, failures.join(" | "));
  return `${SCREEN_REGISTRY.length} routes audited at >= ${LIGHTHOUSE_MIN_ACCESSIBILITY_SCORE}`;
}

function completeTrack1Session() {
  return Object.freeze({
    sessionId: "g5-session",
    dealContext: Object.freeze({
      completed: true,
      data: Object.freeze({
        acquisitionMotive: "management_buyout",
        transactionRole: "partner_md",
        firmTenure: "more_than_3_years",
        integrationTimeline: "standard",
      }),
    }),
    acquirer2A: Object.freeze({
      completed: true,
      score: Object.freeze({ primaryEnvironmentCode: "NT/STJ" }),
    }),
    targetObservation: Object.freeze({
      completed: true,
      score: Object.freeze({ topEnvironmentCode: "NF/NT" }),
      outputContext: Object.freeze({
        observationPosition: "Acquirer diligence lead",
      }),
    }),
    target2B: Object.freeze({
      completed: true,
      finalScore: Object.freeze({
        primaryEnvironmentCode: "NF/NT",
        signalStrength: "confirmed",
      }),
    }),
  });
}

function acquirerAnswers(value, overrides = {}) {
  return Object.freeze(Object.fromEntries(
    ACQUIRER_TRACK_DATA.acquirerModule.questions.map((question) => [question.id, evidenceClassifiedAnswer(value, overrides)]),
  ));
}

async function sealPredictionSmoke() {
  const payload = {
    dealId: "G5-LEDGER",
    acquirerEnvironmentCode: "NF/NT",
    targetEnvironmentCode: "NT/STJ",
    primaryActorType: "STRUCTURAL_LEVEL",
    dominantFunction: "NOT_TYPE_VERIFIED",
    anchors: [
      "30-day first signal anchor",
      "Months 2-6 integration anchor",
      "Months 6-18 transition anchor",
    ],
    prediction1: "J-05 in strategic meetings expected weeks 6-10 post-close",
    prediction2: "Transition rate central estimate with confidence band",
    prediction3: "Key departure window in months 19-30 post-close",
    falsificationCondition: "If J-05 absent by week 12, reduce baseline multiplier",
  };
  const response = await sealPredictionHandler(new Request("http://127.0.0.1/api/seal-prediction", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }));
  const body = await response.json();
  assertCheck(response.status === 201, `seal-prediction returned ${response.status}`);
  assertCheck(body.workbookRuntimeWrite === false, "seal-prediction must not write workbook files at runtime");
  assertCheck(/^[a-f0-9]{64}$/.test(body.sealHash), "seal hash must be sha256 hex");

  const exportResponse = await exportPredictionLedgerHandler(new Request("http://127.0.0.1/api/export-prediction-ledger"));
  const exportBody = await exportResponse.json();
  assertCheck(exportResponse.status === 200, `ledger export returned ${exportResponse.status}`);
  assertCheck(exportBody.workbookRuntimeWrite === false, "ledger export must not write workbook files at runtime");
  assertCheck(exportBody.rows.some((row) => row[10] === body.sealHash), "ledger export must include sealed hash");
}

function assertNoRuntimeWorkbookWrites() {
  const runtimeFiles = [
    ...listFiles(API_DIR, [".js", ".jsx", ".ts"]),
    ...listFiles(SRC_DIR, [".js", ".jsx", ".ts"]),
  ];
  const forbidden = [
    /\bwriteFile(?:Sync)?\b/,
    /\bappendFile(?:Sync)?\b/,
    /\bcreateWriteStream\b/,
    /\bXLSX\.write(?:File)?\b/i,
    /\bxlsx\.write(?:File)?\b/i,
    /\bdocx\.write\b/i,
    /from\s+["']node:fs["']/,
    /from\s+["']fs["']/,
  ];
  const offenders = [];
  for (const file of runtimeFiles) {
    const text = readFileSync(file, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(text)) offenders.push(`${relative(ROOT_DIR, file)}: ${pattern}`);
    }
  }
  assertCheck(offenders.length === 0, `runtime workbook write capability found: ${offenders.join("; ")}`);
}

const CHECKS = [
  {
    id: "V-01",
    title: "No exact environment codes in production bundle",
    run() {
      const pattern = new RegExp(FINAL_ENVIRONMENT_CODES.map(escapeRegExp).join("|"), "g");
      const hits = scanFiles(bundleFiles(), pattern);
      assertCheck(hits.length === 0, `exact environment code leak: ${summarizeHits(hits)}`);
      return "production bundle has zero exact environment code matches";
    },
  },
  {
    id: "V-02",
    title: "81 pair routing combinations",
    run() {
      let heterogeneous = 0;
      let homogeneous = 0;
      for (const acquirerEnvironmentCode of FINAL_ENVIRONMENT_CODES) {
        for (const targetEnvironmentCode of FINAL_ENVIRONMENT_CODES) {
          const deliverable = buildPairDeliverable({ acquirerEnvironmentCode, targetEnvironmentCode });
          assertCheck(deliverable.ready, `${acquirerEnvironmentCode} x ${targetEnvironmentCode} not ready`);
          if (acquirerEnvironmentCode === targetEnvironmentCode) {
            homogeneous += 1;
            assertCheck(deliverable.screen === "screen-10b", `${acquirerEnvironmentCode} self-pair did not route to Screen 10b`);
          } else {
            heterogeneous += 1;
            assertCheck(deliverable.screen === "screen-10", `${acquirerEnvironmentCode} x ${targetEnvironmentCode} did not route to Screen 10`);
            assertCheck(Boolean(deliverable.narrative), `${acquirerEnvironmentCode} x ${targetEnvironmentCode} narrative missing`);
          }
        }
      }
      assertCheck(heterogeneous === 72, `expected 72 heterogeneous pairs, found ${heterogeneous}`);
      assertCheck(homogeneous === 9, `expected 9 homogeneous pairs, found ${homogeneous}`);
      return "72 heterogeneous pairs route to Screen 10; 9 self-pairs route to Screen 10b";
    },
  },
  {
    id: "V-03",
    title: "Block 5 anchors from friction lookup",
    run() {
      const samples = FINAL_DELIVERABLE_DATA.frictionPoints.slice(0, 10);
      assertCheck(samples.length === 10, "need 10 friction rows for deterministic sample");
      for (const sample of samples) {
        const deliverable = buildPairDeliverable({
          acquirerEnvironmentCode: sample.acquirerEnvironmentCode,
          targetEnvironmentCode: sample.targetEnvironmentCode,
        });
        assertCheck(deliverable.anchors.length === 3, "sealed prediction must have three anchors");
        assertCheck(deliverable.anchors[0].sourceColumn === "Early Warning Signal", "30-day anchor source mismatch");
        assertCheck(deliverable.anchors[1].sourceColumn === "FP2", "Months 2-6 anchor source mismatch");
        assertCheck(deliverable.anchors[2].sourceColumn === "FP3", "Months 6-18 anchor source mismatch");
        assertCheck(deliverable.anchors.every((anchor) => anchor.text !== "PENDING"), "friction anchor should not be PENDING");
        assertCheck(deliverable.resourceConflictProfile.resourcesScanned === 17, "resource conflict scan must cover all 17 resources");
        assertCheck(deliverable.resourceConflictProfile.highProbabilityConflicts.length > 0, "expected high-probability resource conflicts");
        assertCheck(
          deliverable.resourceConflictProfile.highProbabilityConflicts.every((row) => Number.isInteger(row.environmentInteractionScore)),
          "resource conflicts must expose an environment interaction score",
        );
        assertCheck(
          deliverable.resourceConflictProfile.conclusion.length >= 5,
          "resource analysis conclusion must contain at least five verified sentences",
        );
        assertCheck(
          deliverable.resourceConflictProfile.highProbabilityConflicts.slice(0, 4).every((row) => row.potentialRisk && row.potentialRisk.length > 40),
          "displayed resource conflicts must include public potential-risk explanations",
        );
      }
      const app = readFileSync(APP_FILE, "utf8");
      assertCheck(app.includes(".slice(0, 4)"), "Screen 9a must display only the four strongest resource conflicts");
      assertCheck(!app.includes("<span role=\"columnheader\">ECS score</span>"), "resource conflict type block must not show ECS score column");
      assertCheck(app.includes("<span role=\"columnheader\">Potential risks</span>"), "resource conflict type block must show potential risks");
      assertCheck(app.includes("When a resource appears in this conflict zone"), "resource conflict type block must explain conflict-zone risk");
      assertCheck(!app.includes("Client output blocks 1-5"), "public client report must not expose block numbering label");
      assertCheck(!app.includes("Block 1 \u00b7 Diagnostic Summary"), "public client report must not expose internal block headings");
      return "10 deterministic friction rows have anchors, 17-resource scans, five-sentence conclusions, and public report labels";
    },
  },
  {
    id: "V-04",
    title: "Sealed caveat exact",
    run() {
      assertCheck(FINAL_DELIVERABLE_DATA.screenCopy.sealedCaveat === SEALED_CAVEAT, "sealed caveat text changed");
      const deliverable = buildPairDeliverable({ acquirerEnvironmentCode: "NF/NT", targetEnvironmentCode: "NT/STJ" });
      assertCheck(deliverable.caveat === SEALED_CAVEAT, "Screen 10 caveat mismatch");
      return "sealed caveat matches source text";
    },
  },
  {
    id: "V-05",
    title: "Forward-only flow and browser-back warning",
    run() {
      const app = readFileSync(APP_FILE, "utf8");
      assertCheck(app.includes("Progress will be lost if you go back. Continue?"), "browser-back warning text missing");
      assertCheck(app.includes("window.addEventListener(\"popstate\", handleBrowserBack)"), "browser popstate handler missing");
      const visibleBackLabels = />\s*(?:Back|Back to|Return|Return to)\b/i;
      const flowSource = app.replace(
        "<a href=\"/about-methodology\" onClick={handleRouteClick(\"/about-methodology\")}>Back to About Methodology</a>",
        "",
      );
      assertCheck(!visibleBackLabels.test(flowSource), "visible Back/Return button label remains in diagnostic/final-report flow");
      return "browser-back warning is implemented and visible Back/Return labels are absent";
    },
  },
  {
    id: "V-06",
    title: "Advisor/Other consultation-only route",
    run() {
      assertCheck(routeForRole("advisor") === "/screen-12-consultation-request", "advisor route must go to consultation");
      assertCheck(CONSULTATION_FIELDS.map((field) => field.id).join(",") === "name,role,dealContext,scheduling", "consultation field set mismatch");
      const result = attachConsultationRequest(Object.freeze({ sessionId: "g5-consultation" }), {
        name: "Nataly",
        role: "Advisor",
        dealContext: "Live integration diligence",
        scheduling: "Next week",
      }, {
        submittedAt: "2026-05-01T12:00:00.000Z",
      });
      assertCheck(result.ok, "consultation request did not validate");
      assertCheck(result.emailDelivery.to === CONSULTATION_RECIPIENT, "consultation recipient mismatch");
      return `consultation request has four fields and sends to ${CONSULTATION_RECIPIENT}`;
    },
  },
  {
    id: "V-07",
    title: "Screen 10 Block 3 range",
    run() {
      const deliverable = buildPairDeliverable({ acquirerEnvironmentCode: "NF/NT", targetEnvironmentCode: "NT/STJ" });
      assertCheck(/^\d+\u2013\d+$/.test(deliverable.compatibilityRange), `compatibility range is invalid: ${deliverable.compatibilityRange}`);
      assertCheck(!/^\d+$/.test(deliverable.compatibilityRange), "compatibility must not be a point estimate");
      assertCheck(deliverable.protocol.dealInsights.length > 0, "Screen 10 protocol block must expose deal-specific control insights");
      assertCheck(
        deliverable.protocol.dealInsights.every((insight) => insight.title && insight.text.length > 100),
        "Screen 10 protocol insights must be substantive",
      );
      const app = readFileSync(APP_FILE, "utf8");
      const finalFlow = readFileSync(join(SRC_DIR, "flow", "finalDeliverableFlow.js"), "utf8");
      assertCheck(app.includes("Deal-specific integration controls"), "Screen 10 must render deal-specific integration controls");
      assertCheck(app.includes("Save full report in PDF"), "Screen 10 must expose PDF save action");
      assertCheck(app.includes("href=\"/screen-12-consultation-request\""), "Screen 10 Talk to us link must route to consultation request");
      assertCheck(app.includes("Reset all data and back to start page"), "Screen 10 CTA must reset and return to start");
      assertCheck(app.includes("Preliminary Assessment Report"), "saved PDF must include Preliminary Assessment report section");
      assertCheck(app.includes("function buildFinalDeliverablesReportLines"), "saved PDF source must include report line builder");
      assertCheck(app.includes("function createFinalDeliverablesReportPdf"), "saved PDF source must include PDF generator");
      assertCheck(app.includes("Preliminary Forecast Brief"), "saved PDF must include current public report title");
      assertCheck(app.includes("Forecast-led public report"), "saved PDF must include current public report positioning");
      assertCheck(app.includes("M&A Post-Deal Behavior Forecast"), "saved PDF must include current public report product marker");
      assertCheck(app.includes("economics: buildDealEconomicsReport(session, { baseEcsScore: score })"), "public final report must map Deal Economics from displayed ECS score");
      assertCheck(app.includes("report.economics.lines.map"), "HTML Deal Economics must render report.economics.lines");
      assertCheck(app.includes("addEconomicRiskTranslationPdfSection(items, report, nextSectionNumber())"), "PDF Section 8 must render Economic Risk Translation");
      assertCheck(!app.includes("addCaseStudyPdfSection(items, nextSectionNumber(), \"Deal Economics\")"), "PDF Section 8 must not keep old Deal Economics heading");
      assertCheck(!app.includes("Generated: ${new Date().toISOString()}"), "saved PDF must not expose generated timestamp technical line");
      assertCheck(!app.includes("Full Analysis Context"), "saved PDF must not include sales/comparison context");
      assertCheck(!app.includes("Free output:"), "saved PDF must not include free/paid comparison rows");
      assertCheck(!finalFlow.includes("The ${protocolName} route should define ownership, decision rights, and early escalation rules"), "Block 6 must not repeat the generic protocol sentence");
      assertCheck(!app.includes("<h2>Recommended protocol:"), "Screen 10 must not show uninformative protocol marker block");
      assertCheck(!app.includes("navigate(\"/screen-11-paid-offer\")}>Continue"), "Screen 10 must not use Continue CTA to paid offer");
      return `Screen 10 emits range ${deliverable.compatibilityRange} with deal-specific controls and combined public report PDF`;
    },
  },
  {
    id: "V-08",
    title: "Sealed prediction hash and ledger export",
    async run() {
      await sealPredictionSmoke();
      return "sealed prediction creates sha256 hash and appears in export";
    },
  },
  {
    id: "V-09",
    title: "No browser storage APIs in production bundle",
    run() {
      const hits = scanFiles(bundleFiles(), /localStorage|sessionStorage|indexedDB/g);
      assertCheck(hits.length === 0, `browser storage API found: ${summarizeHits(hits)}`);
      return "production bundle has zero storage API matches";
    },
  },
  {
    id: "V-10",
    title: "No mock/fixture/dummy/test-data markers in production bundle",
    run() {
      const hits = scanFiles(bundleFiles(), /mock|fixtures|dummy|test-data/gi);
      assertCheck(hits.length === 0, `test marker found in production bundle: ${summarizeHits(hits)}`);
      return "production bundle has zero test-data marker matches";
    },
  },
  {
    id: "V-11",
    title: "Lighthouse accessibility score",
    async run() {
      return runLighthouseAccessibilityAudit();
    },
  },
  {
    id: "V-12",
    title: "Screen 11 CTA availability",
    run() {
      for (const variant of ["heterogeneous", "homogeneous"]) {
        const offer = buildPaidOffer(variant, { alias: "The Research Commons" });
        assertCheck(offer.ctas.primary.includes("Book a 30-minute scoping call"), `${variant} primary CTA missing`);
      }
      const app = readFileSync(APP_FILE, "utf8");
      assertCheck(app.includes("primary-offer-cta"), "primary CTA class missing");
      assertCheck(!app.includes("secondary-offer-cta"), "paid offer page must hide the secondary PDF download CTA");
      assertCheck(!app.includes("Final Deliverables report PDF downloaded."), "paid offer page must not run direct PDF download state");
      return "both offer variants expose only the primary paid-offer CTA";
    },
  },
  {
    id: "V-13",
    title: "Self-pairs route to Screen 10b",
    run() {
      for (const code of FINAL_ENVIRONMENT_CODES) {
        const deliverable = buildPairDeliverable({ acquirerEnvironmentCode: code, targetEnvironmentCode: code });
        assertCheck(deliverable.screen === "screen-10b", `${code} self-pair did not route to Screen 10b`);
        assertCheck(publicText(deliverable.body).includes(code) === false, `${code} leaked in public homogeneous body`);
      }
      return "all nine self-pairs route to Screen 10b";
    },
  },
  {
    id: "V-14",
    title: "No legacy SP/SJ in production bundle",
    run() {
      const hits = scanFiles(bundleFiles(), /SP\/SJ/g);
      assertCheck(hits.length === 0, `legacy SP/SJ found: ${summarizeHits(hits)}`);
      return "production bundle has zero SP/SJ matches";
    },
  },
  {
    id: "V-15",
    title: "Track 1 sequence and Target Observation Setup gate",
    run() {
      assertCheck(TARGET_OBSERVATION_SETUP_FIELDS.length === 3, "Target Observation Setup field count mismatch");
      assertCheck(RESPONDENT_CONTEXT_SECTIONS.length === 4, "respondent context structured section count mismatch");
      assertCheck(canStartTargetObservation(Object.freeze({ sessionId: "blocked" })) === false, "Target Observation must be blocked before setup");
      const weakAcquirerSession = attachAcquirerModuleResult(Object.freeze({
        sessionId: "g5-acquirer-verification",
        dealContext: Object.freeze({
          completed: true,
          data: Object.freeze({
            acquisitionMotive: "management_buyout",
            transactionRole: "partner_md",
            firmTenure: "more_than_3_years",
            integrationTimeline: "standard",
          }),
        }),
      }), acquirerAnswers("B", {
        directObservationGate: "no",
        evidenceType: "inference",
        knowledgeLevel: "pattern_based",
        confidence: "low",
        reliabilityFlags: ["no_direct_knowledge"],
      })).session;
      assertCheck(requiresAcquirerVerification(weakAcquirerSession), "weak/co-present acquirer signal must recommend verification");
      assertCheck(canContinueToTargetObservationSetup(weakAcquirerSession), "weak acquirer signal must allow Target Observation Setup when optional verification is skipped");
      const inviteResult = createAcquirerVerificationInvite(weakAcquirerSession, {
        createdAt: "2026-05-01T00:00:00.000Z",
        digitalCode: "654321",
        acquirerVerificationSessionId: "acqv-g5",
      });
      assertCheck(inviteResult.ok, "acquirer verification invite was not created");
      assertCheck(inviteResult.invite.surveyLink.includes("/screen-6-acquirer-verification"), "acquirer verification link must use the authorized standalone route");
      assertCheck(/^\d{6}$/.test(inviteResult.invite.digitalCode), "acquirer verification must expose a 6-digit code");
      const completion = completeAcquirerVerificationInvite(inviteResult.invite, acquirerAnswers("A"), "2026-05-01T01:00:00.000Z");
      assertCheck(completion.ok, "acquirer verification invite did not complete");
      const verifiedSession = attachAcquirerVerificationCompletion(inviteResult.session, completion.invite);
      assertCheck(verifiedSession.acquirer2A.score.verificationIncluded, "verified acquirer response must be merged into score");
      assertCheck(verifiedSession.acquirer2A.score.respondentCount === 2, "merged acquirer score must count both respondents");
      assertCheck(canContinueToTargetObservationSetup(verifiedSession), "Target Observation Setup must remain available after acquirer verification");
      assertCheck(
        verifiedSession.acquirer2A.score.primaryEnvironmentCode !== weakAcquirerSession.acquirer2A.score.primaryEnvironmentCode,
        "merged acquirer response must be capable of changing Preliminary Assessment acquirer environment",
      );
      const setup = attachTargetObservationSetup(Object.freeze({ sessionId: "g5-setup" }), {
        observationPosition: "Acquirer diligence lead",
        targetExposureDuration: "2_to_6_months",
        targetAccessLevel: "site_or_team_sessions",
        observedActorLevel: "senior_leadership",
        observationEvidenceBasis: "repeated_workshops",
        integrationTimeline: "Pre-signing diligence",
      });
      assertCheck(setup.setup.completed, "Target Observation Setup did not store");
      assertCheck(Boolean(setup.setup.data.respondentContextProfile), "structured respondent context did not store");
      assertCheck(canStartTargetObservation(setup.session), "Target Observation did not unlock after setup");
      const app = readFileSync(APP_FILE, "utf8");
      assertCheck(app.includes("Generate optional Acquirer verification link and 6-digit code"), "optional Acquirer weak-signal verification UI missing");
      assertCheck(app.includes("poor estimation accuracy"), "unverified weak acquirer signal must show poor accuracy warning");
      assertCheck(app.includes("Poor estimation accuracy warning"), "Final report must show poor acquirer accuracy notice when verification is skipped");
      assertCheck(
        SCREEN_REGISTRY.some((screen) => screen.route === "/screen-6-acquirer-verification"),
        "Authorized acquirer verification route missing",
      );
      assertCheck(!app.includes("[\"CT-05\", \"CT-06\", \"CT-07\"]"), "final report must not show inactive acquirer copy survey cards");
      return "Target Observation is gated behind setup completion and weak acquirer verification is optional with lower-accuracy reporting";
    },
  },
  {
    id: "V-16",
    title: "Target link/code states",
    run() {
      const session = attachPreliminaryAssessment(completeTrack1Session(), "2026-05-01T00:00:00.000Z").session;
      const inviteResult = createTargetInvite(session, {
        createdAt: "2026-05-01T00:00:00.000Z",
        digitalCode: "123456",
        targetSessionId: "tgt-g5",
      });
      assertCheck(inviteResult.ok, "target invite was not created");
      assertCheck(verifyTargetInvite(inviteResult.invite, "000000", "2026-05-01T01:00:00.000Z").status === "wrong-code", "wrong-code state missing");
      assertCheck(verifyTargetInvite(inviteResult.invite, "123456", "2026-05-04T00:00:01.000Z").status === "expired", "expired state missing");
      assertCheck(verifyTargetInvite(inviteResult.invite, "123456", "2026-05-01T01:00:00.000Z").status === "verified", "verified state missing");
      const completed = completeTargetInvite(inviteResult.invite, Object.freeze({ completed: true }), "2026-05-01T01:30:00.000Z").invite;
      assertCheck(verifyTargetInvite(completed, "123456", "2026-05-01T01:31:00.000Z").status === "completed", "completed state missing");
      return "target link/code states cover wrong, expired, verified, and completed";
    },
  },
  {
    id: "V-17",
    title: "No runtime workbook writes; ledger persistence/export",
    async run() {
      assertNoRuntimeWorkbookWrites();
      await sealPredictionSmoke();
      return "runtime files do not expose workbook writes and ledger export is available";
    },
  },
  {
    id: "V-18",
    title: "No public admin/source/corpus/internal validation leakage",
    run() {
      const forbidden = /\badmin\b|source-file|source file|\bcorpus\b|internal validation|route scaffold|source-bound/gi;
      const hits = scanFiles(bundleFiles(), forbidden);
      assertCheck(hits.length === 0, `internal/public leakage found: ${summarizeHits(hits)}`);
      return "production bundle has zero admin/source-file/corpus/internal-validation markers";
    },
  },
];

const results = [];
for (const check of CHECKS) {
  try {
    const detail = await check.run();
    results.push({ ...check, status: "PASS", detail });
  } catch (error) {
    results.push({
      ...check,
      status: error instanceof ValidationBlocker ? "BLOCKED" : "FAIL",
      detail: error?.message ?? String(error),
    });
  }
}

for (const result of results) {
  console.log(`${result.status.padEnd(7)} ${result.id} ${result.title} - ${result.detail}`);
}

const passing = results.filter((result) => result.status === "PASS").length;
const failing = results.filter((result) => result.status === "FAIL").length;
const blocked = results.filter((result) => result.status === "BLOCKED").length;

console.log(`G-5 summary: ${passing}/${results.length} pass, ${failing} fail, ${blocked} blocked`);

if (failing || blocked) {
  process.exitCode = 1;
}
