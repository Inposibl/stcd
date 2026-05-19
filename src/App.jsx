import React, { useEffect, useRef, useState } from "react";
import { ACQUIRER_TRACK_DATA } from "./data/acquirerTrackData.js";
import { CASE_STUDIES, caseStudyById } from "./data/caseStudies.js";
import { ENVIRONMENTS, environmentById } from "./data/environments.js";
import { environmentAlias } from "./constants/envAliases.ts";
import { TARGET_DIAGNOSTIC_DATA } from "./data/targetDiagnosticData.js";
import { TARGET_OBSERVATION_DIAGNOSTIC } from "./data/targetObservedEnvironmentDiagnostic.js";
import { TARGET_SELF_ASSESSMENT_DATA } from "./data/targetSelfAssessmentData.js";
import {
  ACQUISITION_MOTIVE_OPTIONS,
  DEAL_TYPE_OPTIONS,
  RESPONDENT_ACCESS_LEVEL_OPTIONS,
  RESPONDENT_FUNCTION_OPTIONS,
  RESPONDENT_ROLE_OPTIONS,
  RESPONDENT_SENIORITY_OPTIONS,
  RESPONDENT_SIDE_OPTIONS,
  TRANSACTION_DETAIL_SECTIONS,
  acquisitionMotiveForDealType,
  acquirerVerificationInviteFromLinkParams,
  attachAcquirerModuleResult,
  attachAcquirerVerificationCompletion,
  attachAcquisitionMotive,
  attachDealContext,
  canContinueToTargetObservationSetup,
  canStartAcquirerModule,
  completeAcquirerVerificationInvite,
  createAcquirerVerificationInvite,
  isAcquirerVerificationComplete,
  nextRouteForDealStart,
  requiresAcquirerVerification,
  verifyAcquirerVerificationInvite,
} from "./flow/acquirerTrackFlow.js";
import {
  RESPONDENT_CONTEXT_SECTIONS,
  TARGET_OBSERVATION_SETUP_FIELDS,
  attachAuthorizedObservationCompletion,
  attachTargetObservationSetup,
  buildTargetObservationSetupRecord,
  canStartTargetObservation,
  completeObservationSetupInvite,
  createObservationSetupInvite,
  createTargetObservationOutputContext,
  observationSetupInviteFromLinkParams,
  scoreTargetObservation,
  validateTargetObservationSetup,
  verifyObservationSetupInvite,
} from "./flow/targetObservationFlow.js";
import {
  attachTargetDiagnosticLevel1,
  attachTargetDiagnosticLevel2,
  canCreatePreliminaryAssessment,
  canStartTargetDiagnostic,
  isStandaloneTargetDiagnosticSession,
} from "./flow/targetDiagnosticFlow.js";
import {
  attachPreliminaryAssessment,
  completeTargetInvite,
  createTargetInvite,
  resetPublicAssessmentSession,
  targetInviteFromLinkParams,
  verifyTargetInvite,
} from "./flow/targetInviteFlow.js";
import { buildContradictionReport } from "./flow/contradictionEngine.js";
import { buildTriageReport } from "./flow/triageEngine.js";
import {
  ANALYST_CONFIDENCE_LEVELS,
  ANALYST_REVIEW_STATUSES,
  ANALYST_SEVERITY_LEVELS,
  attachAnalystWorksheetReview,
  buildAnalystWorksheet,
} from "./flow/analystWorkflow.js";
import { buildRiskOutputReport } from "./flow/riskOutputEngine.js";
import {
  buildTargetSelfAssessmentRecord,
  isTargetSelfAssessmentSourceLoaded,
  targetSelfOtherSpecifyFieldId,
  targetSelfPositioningOptionRequiresSpecify,
  validateTargetSelfPositioning,
} from "./flow/targetSelfAssessmentFlow.js";
import {
  attachEmailCapture,
  buildEmailCaptureCopy,
} from "./flow/emailCaptureFlow.js";
import {
  CONSULTATION_FIELDS,
  CONSULTATION_RECIPIENT,
  attachConsultationRequest,
} from "./flow/consultationFlow.js";
import {
  CONFIDENCE_LEVEL_OPTIONS,
  DIRECT_OBSERVATION_GATE_OPTIONS,
  EVIDENCE_TYPE_OPTIONS,
  KNOWLEDGE_LEVEL_OPTIONS,
  RELIABILITY_FLAG_OPTIONS,
  normalizeEvidenceAnswer,
  selectedOptionValue,
  toggleReliabilityFlag,
  updateEvidenceAnswer,
  validateEvidenceClassifiedAnswer,
} from "./flow/evidenceClassification.js";
import {
  EVIDENCE_CONFIDENCE_OPTIONS,
  EVIDENCE_DOCUMENT_TYPE_OPTIONS,
  EVIDENCE_ITEM_TYPE_OPTIONS,
  EVIDENCE_RELATIONSHIP_OPTIONS,
  EVIDENCE_REVIEW_STATUS_OPTIONS,
  EVIDENCE_RISK_CATEGORY_OPTIONS,
  EVIDENCE_SOURCE_PARTY_OPTIONS,
  attachEvidenceItem,
  buildEvidenceCoverage,
  evidenceItemsFromSession,
  removeEvidenceItem,
} from "./flow/evidenceCapture.js";
import {
  buildPairDeliverable,
  buildFinalDeliverable,
  buildPaidOffer,
  publicText,
} from "./flow/finalDeliverableFlow.js";
import { buildFinalReportStructure } from "./flow/finalReportEngine.js";
import { screenByRoute } from "./screenRegistry.js";
import "./styles.css";

const INITIAL_SESSION = Object.freeze({
  sessionId: "public-preview-session",
  dealContext: null,
  acquirer2A: null,
  acquirerVerificationInvite: null,
  acquirerVerification: null,
  targetObservationSetup: null,
  targetObservationSetupInvite: null,
  targetObservation: null,
  target2B: null,
  preliminaryAssessment: null,
  analystWorksheet: null,
  evidenceItems: Object.freeze([]),
  targetInvite: null,
  targetSelfAssessment: null,
  emailCapture: null,
  reportDelivery: null,
  consultationRequest: null,
  consultationEmailDelivery: null,
});

const BACK_NAVIGATION_WARNING = "Progress will be lost if you go back. Continue?";
const NAVIGATE_EVENT = "st:navigate";
const ACQUIRER_VERIFICATION_COMPLETION_EVENT = "st:acquirer-verification-completion";
const ACQUIRER_VERIFICATION_COMPLETION_CHANNEL = "st-acquirer-verification-completion";
const AUTHORIZED_OBSERVATION_COMPLETION_EVENT = "st:authorized-observation-completion";
const AUTHORIZED_OBSERVATION_COMPLETION_CHANNEL = "st-authorized-observation-completion";
const TARGET_SELF_COMPLETION_EVENT = "st:target-self-assessment-completion";
const TARGET_SELF_COMPLETION_CHANNEL = "st-target-self-assessment-completion";

function parseAcquirerVerificationCompletion(value) {
  if (!value) return null;

  try {
    const payload = typeof value === "string" ? JSON.parse(value) : value;
    if (
      !payload?.assessmentSessionId
      || !payload?.acquirerVerificationSessionId
      || !payload?.completed
      || !payload?.acquirerVerification?.completed
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function publishAcquirerVerificationCompletion(completedInvite) {
  const payload = parseAcquirerVerificationCompletion({
    assessmentSessionId: completedInvite?.assessmentSessionId,
    acquirerVerificationSessionId: completedInvite?.acquirerVerificationSessionId,
    codeHash: completedInvite?.codeHash,
    completed: true,
    completedAt: completedInvite?.completedAt ?? completedInvite?.acquirerVerification?.storedAt ?? new Date().toISOString(),
    acquirerVerification: completedInvite?.acquirerVerification,
  });

  if (typeof window === "undefined" || !payload) return null;

  try {
    window.dispatchEvent(new CustomEvent(ACQUIRER_VERIFICATION_COMPLETION_EVENT, { detail: payload }));
  } catch {
    // BroadcastChannel remains the cross-tab path when CustomEvent is unavailable.
  }

  try {
    const channel = new BroadcastChannel(ACQUIRER_VERIFICATION_COMPLETION_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  } catch {
    // Optional browser feature; same-tab state updates still complete the flow.
  }

  return payload;
}

function parseAuthorizedObservationCompletion(value) {
  if (!value) return null;

  try {
    const payload = typeof value === "string" ? JSON.parse(value) : value;
    if (
      !payload?.assessmentSessionId
      || !payload?.observationSessionId
      || !payload?.completed
      || !payload?.targetObservation?.completed
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function publishAuthorizedObservationCompletion(completedInvite) {
  const payload = parseAuthorizedObservationCompletion({
    assessmentSessionId: completedInvite?.assessmentSessionId,
    observationSessionId: completedInvite?.observationSessionId,
    codeHash: completedInvite?.codeHash,
    completed: true,
    completedAt: completedInvite?.completedAt ?? completedInvite?.targetObservation?.storedAt ?? new Date().toISOString(),
    targetObservationSetup: completedInvite?.targetObservationSetup,
    targetObservation: completedInvite?.targetObservation,
    target2B: completedInvite?.target2B ?? null,
  });

  if (typeof window === "undefined" || !payload) return null;

  try {
    window.dispatchEvent(new CustomEvent(AUTHORIZED_OBSERVATION_COMPLETION_EVENT, { detail: payload }));
  } catch {
    // Older browser shells can miss CustomEvent; BroadcastChannel and API polling still carry the state.
  }

  try {
    const channel = new BroadcastChannel(AUTHORIZED_OBSERVATION_COMPLETION_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  } catch {
    // BroadcastChannel is optional; API polling remains the cross-browser fallback.
  }

  return payload;
}

function parseTargetSelfCompletion(value) {
  if (!value) return null;

  try {
    const payload = typeof value === "string" ? JSON.parse(value) : value;
    if (
      !payload?.targetSessionId
      || !payload?.assessmentId
      || !payload?.completed
      || !payload?.targetSelfAssessment?.completed
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function publishTargetSelfCompletion(completedInvite) {
  const payload = parseTargetSelfCompletion({
    targetSessionId: completedInvite?.targetSessionId,
    assessmentId: completedInvite?.assessmentId,
    codeHash: completedInvite?.codeHash,
    completed: true,
    completedAt: completedInvite?.completedAt ?? new Date().toISOString(),
    targetSelfAssessment: completedInvite?.targetSelfAssessment,
  });

  if (typeof window === "undefined" || !payload) return null;

  try {
    window.dispatchEvent(new CustomEvent(TARGET_SELF_COMPLETION_EVENT, { detail: payload }));
  } catch {
    // BroadcastChannel remains the cross-tab path when CustomEvent is unavailable.
  }

  try {
    const channel = new BroadcastChannel(TARGET_SELF_COMPLETION_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  } catch {
    // Optional browser feature; same-tab state updates still complete the flow.
  }

  return payload;
}

function attachTargetSelfCompletion(currentSession, completedInvite) {
  if (!completedInvite?.completed || !completedInvite.targetSelfAssessment?.completed) return currentSession;

  const currentInvite = currentSession?.targetInvite;
  if (!currentInvite) return currentSession;
  if (currentInvite.targetSessionId !== completedInvite.targetSessionId) return currentSession;
  if (currentInvite.assessmentId !== completedInvite.assessmentId) return currentSession;
  if (currentInvite.codeHash && completedInvite.codeHash && currentInvite.codeHash !== completedInvite.codeHash) return currentSession;

  const mergedInvite = Object.freeze({
    ...currentInvite,
    ...completedInvite,
    digitalCode: currentInvite.digitalCode ?? "",
  });

  const nextSession = {
    ...currentSession,
    targetInvite: mergedInvite,
    targetSelfAssessment: completedInvite.targetSelfAssessment,
  };
  if (currentSession?.preliminaryAssessment?.completed) {
    const contradictionReport = buildContradictionReport(nextSession, {
      generatedAt: completedInvite.completedAt ?? new Date().toISOString(),
    });
    nextSession.preliminaryAssessment = Object.freeze({
      ...currentSession.preliminaryAssessment,
      targetSelfAssessmentCompletedAt: completedInvite.completedAt ?? completedInvite.targetSelfAssessment.submittedAt ?? null,
      targetSelfEnvironmentCode: completedInvite.targetSelfAssessment.score?.primaryEnvironmentCode ?? null,
      contradictionReport,
      triageReport: buildTriageReport(nextSession, {
        generatedAt: completedInvite.completedAt ?? new Date().toISOString(),
        contradictionReport,
      }),
    });
  }
  if (currentSession?.analystWorksheet) {
    nextSession.analystWorksheet = buildAnalystWorksheet(nextSession, currentSession.analystWorksheet, {
      generatedAt: completedInvite.completedAt ?? new Date().toISOString(),
    });
  }

  return Object.freeze({
    ...nextSession,
  });
}

function currentRoutePath() {
  return window.location.pathname === "/" ? "/" : window.location.pathname;
}

function useCurrentRoute() {
  const [screen, setScreen] = useState(() => screenByRoute(currentRoutePath()));
  const activeRouteRef = useRef(screen.route);

  useEffect(() => {
    activeRouteRef.current = screen.route;
  }, [screen.route]);

  useEffect(() => {
    function syncScreen() {
      const nextScreen = screenByRoute(currentRoutePath());
      activeRouteRef.current = nextScreen.route;
      setScreen(nextScreen);
    }

    function handleBrowserBack() {
      const currentRoute = activeRouteRef.current;
      if (currentRoute.startsWith("/screen-") && !window.confirm(BACK_NAVIGATION_WARNING)) {
        window.history.pushState({}, "", currentRoute);
        syncScreen();
        return;
      }
      syncScreen();
    }

    window.addEventListener(NAVIGATE_EVENT, syncScreen);
    window.addEventListener("popstate", handleBrowserBack);
    return () => {
      window.removeEventListener(NAVIGATE_EVENT, syncScreen);
      window.removeEventListener("popstate", handleBrowserBack);
    };
  }, []);

  return screen;
}

function navigate(route) {
  window.history.pushState({}, "", route);
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT));
}

function handleRouteClick(route) {
  return (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(route);
  };
}

function targetSessionIdFromLocation() {
  return new URLSearchParams(window.location.search).get("targetSessionId");
}

function targetInviteFromLocation() {
  return targetInviteFromLinkParams(new URLSearchParams(window.location.search));
}

function observationSetupInviteFromLocation() {
  return observationSetupInviteFromLinkParams(new URLSearchParams(window.location.search));
}

function acquirerVerificationInviteFromLocation() {
  return acquirerVerificationInviteFromLinkParams(new URLSearchParams(window.location.search));
}

function aliasFor(code) {
  return environmentAlias(code);
}

function Paragraphs({ text }) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => <p key={paragraph}>{publicText(paragraph)}</p>);
}

function publicReportText(value) {
  return publicText(value)
    .replace(/\s*\(Step\s*[0-9A-Za-z-]+\)/gi, "")
    .replace(/\bStep\s*[0-9A-Za-z-]+\b/gi, "")
    .replace(/\bBlock\s*[0-9A-Za-z-]+\s*[·.-]?\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function PublicReportParagraphs({ text }) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => <p key={paragraph}>{publicReportText(paragraph)}</p>);
}

function TalkToUsParagraphs({ text }) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => {
      const visibleText = publicText(paragraph);
      const match = visibleText.match(/Talk to Us/i);
      if (!match) return <p key={paragraph}>{visibleText}</p>;

      const before = visibleText.slice(0, match.index);
      const after = visibleText.slice((match.index ?? 0) + match[0].length);
      return (
        <p key={paragraph}>
          {before}
          <a href="/screen-12-consultation-request" onClick={handleRouteClick("/screen-12-consultation-request")}>Talk to us</a>
          {after}
        </p>
      );
    });
}

const SIDEBAR_NAV_ITEMS = Object.freeze([
  Object.freeze({ label: "Home", route: "/home", section: "home" }),
  Object.freeze({ label: "About Methodology", route: "/about-methodology", section: "methodology" }),
  Object.freeze({ label: "The 9 Interaction Environments", route: "/environments", section: "environments" }),
  Object.freeze({ label: "Case Studies", route: "/case-studies", section: "case-studies" }),
  Object.freeze({ label: "Start Diagnostic", route: "/start-diagnostic/deal-context", section: "diagnostic" }),
]);

const HOME_COPY = Object.freeze({
  title: "Post-Deal Behavior Forecast",
  lead: "70% of M&A integrations that destroy value fail for the same reason.",
  paragraphs: Object.freeze([
    "M&A deals are pursued for different reasons: to acquire a team, enter a new market, hit strategic KPIs, or remove a competitor. But integration value is lost for the same reason: the organizations cannot operate together in reality.",
    "The model may close. The strategy may look right. The transaction may satisfy the board. But after close, value breaks down when leaders clash over decisions, resources, speed, accountability, power, and conflict.",
    "Our product identifies these risks before they become post-deal failures.",
    "Whether the goal is to retain the acquired team, scale into a new market, protect KPI-driven deal value, or absorb a former competitor, we show where the integration will fracture and what must be changed before months 6 to 18, when the acquired management team often stops performing.",
  ]),
  closing: "Run the diagnostic in less than one hour. No account. No card.",
});

const METHODOLOGY_OVERVIEW_SECTIONS = Object.freeze([
  Object.freeze({
    title: "1. Purpose",
    body: "Post-Deal Behavior Forecast is a framework for predicting behavioural outcomes in defined interaction environments. Its primary commercial application is human capital due diligence in mergers and acquisitions: forecasting integration success or failure before deal close, at the resolution of the specific resources that will come into conflict, the specific populations that will be at risk, and the timeline on which that risk will become visible.",
  }),
  Object.freeze({
    title: "2. Evidence base",
    body: "The framework rests on three categories of evidence. First, structured-respondent observational data gathered through validated diagnostic instruments administered to defined populations within an organisation. Second, documented case reconstructions of completed M&A transactions across multiple industries, each traced from environment composition through integration mechanism to observable outcome. Third, sealed forward predictions, recorded before close and verified at fixed post-close horizons.",
  }),
  Object.freeze({
    title: "3. The analyst gate",
    body: "Respondent answers are treated as observational evidence subject to analyst review, not as classification outputs. A trained analyst interprets the response pattern in context, applies the framework’s internal contradiction and triage rules, and arrives at a conclusion that the respondent alone cannot determine. This design choice distinguishes Post-Deal Behavior Forecast from self-administered personality instruments and from fully automated typing systems. The diagnostic input is data; the analytical conclusion is professional judgement, recorded with its evidentiary basis.",
  }),
  Object.freeze({
    title: "4. Environment Compatibility Score, conceptually",
    body: "The Environment Compatibility Score (ECS) is a 0–100 metric that quantifies the predicted compatibility between two interaction environments. It is computed pairwise, at the environment level, from documented resource profiles, and calibrated against the actual outcomes of completed transactions. The ECS is a specification, not a verdict: it identifies where structural friction will arise, at what intensity, and on what timeline. Whether that friction is fatal or manageable depends on the integration protocol selected. Two recorded transactions of nearly identical numerical compatibility have produced opposite outcomes for exactly this reason.",
  }),
  Object.freeze({
    title: "5. Calibration",
    body: "The framework is calibrated through two mechanisms. First, retroactive application to ten completed M&A transactions across nine industries, each documented in full with the environment reading, the resource-level conflict mechanism, and the observable outcome. The AECOM–URS transaction (2014), for example, is recorded as a structural failure of the legacy construction business, with the divestiture in 2020 confirming the prediction at the level of mechanism, not merely direction. Second, the mathematical architecture underlying the score is the subject of an independent quantitative audit — formula-level review, edge-case testing, and version-controlled correction — conducted outside the development team. Calibration is a continuing process, not a one-time validation.",
  }),
  Object.freeze({
    title: "6. Access",
    body: "This overview describes the framework’s epistemic position, its evidence categories, and the meaning of its principal output. It is not a methodological disclosure. The diagnostic instruments, the resource architecture, the full case portfolio, the integration protocols, and the operational ECS computation are released under non-disclosure agreement to qualified counterparties. The Investment Memorandum and pilot terms are available on request.",
  }),
]);

const ECS_SCORE_BANDS = Object.freeze([
  Object.freeze({ range: "80–100", title: "HIGH COMPATIBILITY", ev: "EV 0% – 2%", synergy: "Synergy 85% – 100%", flight: "Talent flight risk: LOW", tone: "blue" }),
  Object.freeze({ range: "65–79", title: "MODERATE-HIGH", ev: "EV 2% – 7%", synergy: "Synergy 65% – 84%", flight: "Talent flight risk: LOW-MED", tone: "green" }),
  Object.freeze({ range: "50–64", title: "MODERATE", ev: "EV 7% – 15%", synergy: "Synergy 40% – 64%", flight: "Talent flight risk: MEDIUM", tone: "yellow" }),
  Object.freeze({ range: "35–49", title: "MODERATE-LOW", ev: "EV 15% – 25%", synergy: "Synergy 15% – 39%", flight: "Talent flight risk: HIGH", tone: "orange" }),
  Object.freeze({ range: "0–34", title: "HIGH RISK", ev: "EV 35% – 60%+", synergy: "Synergy 0% – 14%", flight: "Talent flight risk: EXTREME", tone: "red" }),
]);

const ENVIRONMENT_DETAIL_ROWS = Object.freeze([
  Object.freeze({ key: "oneLineDefinition", label: "One-line definition" }),
  Object.freeze({ key: "authorityStructure", label: "Authority structure" }),
  Object.freeze({ key: "decisionMechanism", label: "Decision mechanism" }),
  Object.freeze({ key: "innovationStance", label: "Innovation stance" }),
  Object.freeze({ key: "economicFunction", label: "Economic function" }),
  Object.freeze({ key: "resourceTarget", label: "Resource target" }),
  Object.freeze({ key: "systemicRole", label: "Systemic role" }),
]);

const ENVIRONMENT_BLOCK_ORDER = Object.freeze([
  "idea-lab",
  "performance-arena",
  "mission-field",
  "power-racket",
  "enforcer-network",
  "disruption-lab",
  "creative-commons",
  "hometown-network",
  "franchise-machine",
]);

const ORDERED_ENVIRONMENTS = Object.freeze(
  ENVIRONMENT_BLOCK_ORDER.map((environmentId) => ENVIRONMENTS.find((environment) => environment.id === environmentId)).filter(Boolean),
);

function routeSection(route) {
  if (route === "/" || route === "/home") return "home";
  if (route === "/about-methodology" || route.startsWith("/about-methodology/")) return "methodology";
  if (route === "/case-studies" || route.startsWith("/case-studies/")) return "case-studies";
  if (route === "/start-diagnostic" || route.startsWith("/start-diagnostic/")) return "diagnostic";
  if (route === "/environments" || route.startsWith("/environments/")) return "environments";
  return "";
}

function SiteSidebar({ currentRoute }) {
  const activeSection = routeSection(currentRoute);

  return (
    <aside className="site-sidebar" aria-label="Primary navigation">
      <a className="sidebar-header" href="/home" onClick={handleRouteClick("/home")}>
        <strong>Structural Typology</strong>
        <span>Diagnostic</span>
      </a>
      <nav className="sidebar-nav" aria-label="Site sections">
        {SIDEBAR_NAV_ITEMS.map((item) => (
          <a
            aria-current={activeSection === item.section ? "page" : undefined}
            className={activeSection === item.section ? "active" : ""}
            href={item.route}
            key={item.route}
            onClick={handleRouteClick(item.route)}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function HomeScreen() {
  return (
    <main className="landing-screen home-screen">
      <section className="landing-inner home-inner">
        <header className="home-brand-hero">
          <p className="eyebrow">M&A Integration Risk Due Diligence</p>
          <h1>{HOME_COPY.title}</h1>
          <p className="home-lead">{HOME_COPY.lead}</p>
          <div className="landing-copy home-copy">
            {HOME_COPY.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p className="home-closing">{HOME_COPY.closing}</p>
          </div>
        </header>

        <section className="home-start-section" aria-labelledby="home-start-title">
          <div>
            <p className="eyebrow">Start Diagnostic</p>
            <h2 id="home-start-title">Begin the integration-risk diagnostic</h2>
            <p>Answer the deal-context questions first, then complete the environment modules required for the ECS read.</p>
          </div>
          <a href="/start-diagnostic/deal-context" onClick={handleRouteClick("/start-diagnostic/deal-context")}>Start Diagnostic</a>
        </section>
      </section>
    </main>
  );
}

function AboutMethodologyScreen() {
  return (
    <main className="marketing-screen">
      <section className="page-shell">
        <header className="framework-hero">
          <h1>The ST Framework</h1>
          <p>
            Structural Typology is a 15-year developed behavioural intelligence framework that synthesises Jung, Myers-Briggs, Piaget, and Vygotsky to predict organisational compatibility with numerical precision. The diagnostic unit is the interaction environment, not the individual.
          </p>
          <p>
            <a href="/about-methodology/overview" onClick={handleRouteClick("/about-methodology/overview")}>Read the methodology paper</a>
          </p>
        </header>

        <section className="framework-section">
          <h2>The Environment Compatibility Score (ECS)</h2>
          <p>
            The ECS is computed across 17 behavioural resources - Authority, Trust, Reputation, Information, Influence, Will/Discipline, Energy, Attention, Time, Health, Money, Imagination, Relationships, Status, Territory, Meaning, and Security. Each resource is scored 0-100 for a given environment pair. The composite score predicts the probability of post-close resource collapse and determines the integration protocol.
          </p>
          <div className="ecs-card-stack" aria-label="ECS score bands">
            {ECS_SCORE_BANDS.map((band) => (
              <article className={`ecs-band ecs-${band.tone}`} key={band.range}>
                <strong>{band.range}</strong>
                <span>{band.title}</span>
                <em>{band.ev}</em>
                <em>{band.synergy}</em>
                <em>{band.flight}</em>
              </article>
            ))}
          </div>
          <p className="methodology-note">
            <em>Note: High scores (85+) with ring-fence protocols indicate paradoxical incompatibility - the score measures surface alignment, not structural compatibility. Protocol selection determines outcome, not the score alone.</em>
          </p>
        </section>

        <section className="framework-section">
          <h2>The 9 Interaction Environments</h2>
          <div className="environment-card-grid">
            {ORDERED_ENVIRONMENTS.map((environment) => (
              <a
                className="environment-card-link"
                href={`/environments/${environment.id}`}
                key={environment.id}
                onClick={handleRouteClick(`/environments/${environment.id}`)}
              >
                <strong>{environment.alias}</strong>
                <p>{environment.shortDescription}</p>
                <span>Full description →</span>
              </a>
            ))}
          </div>
        </section>

      </section>
    </main>
  );
}

function MethodologyOverviewScreen() {
  return (
    <main className="marketing-screen">
      <section className="page-shell">
        <header className="framework-hero compact">
          <p className="eyebrow">Methodology paper</p>
          <h1>Post-Deal Behavior Forecast Methodology Overview</h1>
        </header>

        {METHODOLOGY_OVERVIEW_SECTIONS.map((section) => (
          <section className="framework-section" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        <section className="framework-section">
          <p>
            <a href="/about-methodology" onClick={handleRouteClick("/about-methodology")}>Back to About Methodology</a>
          </p>
        </section>
      </section>
    </main>
  );
}

function EnvironmentsScreen({ environmentId }) {
  const selectedEnvironment = environmentById(environmentId);

  return (
    <main className="marketing-screen">
      <section className="page-shell">
        <header className="framework-hero compact">
          <h1>The 9 Interaction Environments</h1>
          <p>Descriptions of the nine interaction environments</p>
        </header>

        <nav className="environment-tabs" aria-label="Interaction environment selector">
          {ORDERED_ENVIRONMENTS.map((environment) => {
            const route = `/environments/${environment.id}`;
            const isActive = environment.id === selectedEnvironment.id;
            return (
              <a
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "environment-tab active" : "environment-tab"}
                href={route}
                key={environment.id}
                onClick={handleRouteClick(route)}
              >
                <strong>{environment.alias}</strong>
              </a>
            );
          })}
        </nav>

        <section className="environment-detail-panel">
          <h2>{selectedEnvironment.alias}</h2>
          <div className="environment-detail-table">
            {ENVIRONMENT_DETAIL_ROWS.map((row) => (
              <div className="environment-detail-row" key={row.key}>
                <div className="environment-detail-label">{row.label}</div>
                <div className="environment-detail-value">{selectedEnvironment[row.key]}</div>
              </div>
            ))}
          </div>
          <button className="dark-action" type="button" onClick={() => navigate("/start-diagnostic/deal-context")}>Start a Diagnostic</button>
        </section>
      </section>
    </main>
  );
}

function caseToneClass(caseStudy) {
  return caseStudy.result === "success" ? "case-success" : "case-failure";
}

function CaseStudyCard({ caseStudy }) {
  const route = `/case-studies/${caseStudy.id}`;
  return (
    <article className="case-card">
      <div className="case-card-main">
        <p className={`case-card-outcome ${caseToneClass(caseStudy)}`}>{publicText(caseStudy.headline)}</p>
        <h3>{publicText(caseStudy.title)}</h3>
        <p className="case-card-meta">{caseStudy.year} - {publicText(caseStudy.industry)}</p>
        <span className={`case-protocol-pill protocol-${caseStudy.protocolTone}`}>{publicText(caseStudy.protocol)}</span>
        <p className="case-environment-line">
          <span>{publicText(caseStudy.acquirerEnvironment)} {"->"} {publicText(caseStudy.targetEnvironment)}</span>
          <em>{publicText(caseStudy.integrationMode)}</em>
        </p>
        <p className="case-card-excerpt">{publicText(caseStudy.excerpt)}</p>
        <a className="case-analysis-link" href={route} onClick={handleRouteClick(route)}>View analysis {"->"}</a>
      </div>
      <div className="case-card-score" aria-label={`ECS ${caseStudy.ecs} out of 100`}>
        <strong>{caseStudy.ecs}</strong>
        <span>ECS</span>
      </div>
    </article>
  );
}

function CaseStudyGroup({ title, cases }) {
  return (
    <section className="case-study-group">
      <h2 className={title.toLowerCase().startsWith("success") ? "case-group-success" : "case-group-failure"}>{title}</h2>
      <div className="case-card-grid">
        {cases.map((caseStudy) => <CaseStudyCard caseStudy={caseStudy} key={caseStudy.id} />)}
      </div>
    </section>
  );
}

function CaseStudiesScreen() {
  const failures = CASE_STUDIES.filter((caseStudy) => caseStudy.result === "failure");
  const successes = CASE_STUDIES.filter((caseStudy) => caseStudy.result === "success");

  return (
    <main className="marketing-screen case-studies-screen">
      <section className="page-shell case-studies-shell">
        <header className="framework-hero compact case-studies-hero">
          <h1>10 Retroactive Analyses</h1>
          <p>$400B+ in value destroyed. $1T+ enabled. The same ECS formula - computed before the deal closed.</p>
        </header>
        <CaseStudyGroup title="Failures - 5 Cases" cases={failures} />
        <CaseStudyGroup title="Successes - 5 Cases" cases={successes} />
      </section>
    </main>
  );
}

function resourceScoreClass(score) {
  if (score >= 85) return "resource-high";
  if (score >= 65) return "resource-medium";
  return "resource-low";
}

function CasePartyCard({ party, label }) {
  return (
    <article className="case-party-card">
      <p>{label}</p>
      <h3>{publicText(party.name)}</h3>
      <span>{publicText(party.environment)}</span>
      <p>{publicText(party.description)}</p>
    </article>
  );
}

function ResourceRiskMap({ resources }) {
  return (
    <section className="case-report-panel">
      <h2>Resource Risk Map</h2>
      <div className="resource-risk-grid">
        {resources.map((resource) => (
          <div className={`resource-risk-row ${resourceScoreClass(resource.score)}`} key={resource.label}>
            <span>{resource.label}</span>
            <strong>{resource.score}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function CaseStudyDetailScreen({ caseId }) {
  const caseStudy = caseStudyById(caseId);
  if (!caseStudy) {
    return (
      <main className="marketing-screen case-detail-screen">
        <section className="page-shell case-detail-shell">
          <a className="case-back-link" href="/case-studies" onClick={handleRouteClick("/case-studies")}>Case studies</a>
          <header className="framework-hero compact">
            <h1>Case study not found</h1>
            <p>Open the case-study index and choose one of the ten available analyses.</p>
          </header>
        </section>
      </main>
    );
  }

  return (
    <main className="marketing-screen case-detail-screen">
      <section className="page-shell case-detail-shell">
        <a className="case-back-link" href="/case-studies" onClick={handleRouteClick("/case-studies")}>Case studies</a>
        <header className="case-detail-header">
          <div>
            <p className={`case-detail-kicker ${caseToneClass(caseStudy)}`}>
              {publicText(caseStudy.result)} - {publicText(caseStudy.industry)} - {caseStudy.year}
            </p>
            <h1>{publicText(caseStudy.title)}</h1>
            <p>{publicText(caseStudy.valueLine)}</p>
          </div>
          <div className="case-detail-score" aria-label={`ECS ${caseStudy.exactEcs} out of 100`}>
            <strong>{caseStudy.ecs}</strong>
            <span>ECS / 100</span>
          </div>
        </header>

        <section className={`case-protocol-panel protocol-panel-${caseStudy.protocolTone}`}>
          <p>{publicText(caseStudy.protocolTitle)}</p>
          <h2>{publicText(caseStudy.integrationMode)}</h2>
          <span>{publicText(caseStudy.protocolBody)}</span>
          <em>{publicText(caseStudy.protocolStabilization)}</em>
        </section>

        <div className="case-party-grid">
          <CasePartyCard label="Acquirer" party={caseStudy.acquirer} />
          <CasePartyCard label="Target" party={caseStudy.target} />
        </div>

        <ResourceRiskMap resources={caseStudy.resources} />

        <section className="case-report-panel">
          <div className="case-outcome-grid">
            <div>
              <h2>Predicted vs Actual Outcomes</h2>
              <h3>ST predicted pre-close</h3>
              <ul>
                {caseStudy.predicted.map((item) => <li key={item}>{publicText(item)}</li>)}
              </ul>
            </div>
            <div>
              <h3>What actually happened</h3>
              <ul className="case-actual-list">
                {caseStudy.actual.map((item) => <li key={item}>{publicText(item)}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="case-report-panel case-framework-analysis">
          <h2>Framework Analysis</h2>
          <p>{publicText(caseStudy.analysis)}</p>
        </section>

        <section className="case-assessment-cta">
          <h2>Run your own assessment</h2>
          <a href="/start-diagnostic/deal-context" onClick={handleRouteClick("/start-diagnostic/deal-context")}>Start Diagnostic</a>
        </section>
      </section>
    </main>
  );
}

const DEAL_CONTEXT_MISSING_LABELS = Object.freeze({
  acquirerName: "Acquirer",
  targetName: "Target",
  dealType: "Deal type",
  respondentSide: "Respondent side",
  respondentRole: "Respondent role",
  respondentSeniority: "Respondent seniority",
  respondentFunction: "Respondent function",
  respondentAccessLevel: "Respondent access level",
  acquisitionMotive: "Acquisition motive",
  competitorPreservation: "Target system preservation",
  transactionRole: "Transaction responsibility level",
  firmTenure: "Your tenure at the firm",
  integrationTimeline: "Planned integration pace",
});

function dealContextFieldLabel(fieldId) {
  return DEAL_CONTEXT_MISSING_LABELS[fieldId] ?? fieldId;
}

function initialDealIdentity(existingContext) {
  return {
    acquirerName: existingContext.acquirerName ?? "",
    targetName: existingContext.targetName ?? "",
    dealType: existingContext.dealType ?? "",
    respondentSide: existingContext.respondentSide ?? "",
    respondentRole: existingContext.respondentRole ?? "",
    respondentSeniority: existingContext.respondentSeniority ?? "",
    respondentFunction: existingContext.respondentFunction ?? "",
    respondentAccessLevel: existingContext.respondentAccessLevel ?? "",
  };
}

function roleOptionsForSide(respondentSide) {
  if (!respondentSide) return RESPONDENT_ROLE_OPTIONS;
  return RESPONDENT_ROLE_OPTIONS.filter((option) => option.sides.includes(respondentSide) || option.sides.includes("other"));
}

function dealStartSubmitLabel(respondentSide) {
  if (respondentSide === "target") return "Continue to Target Self-Assessment";
  if (respondentSide === "advisor") return "Continue to Advisor Diagnostic";
  if (respondentSide === "other") return "Continue to Consultation";
  return "Continue";
}

function targetDiagnosticCompletionRoute(session) {
  return isStandaloneTargetDiagnosticSession(session) ? "/screen-12-consultation-request" : "/screen-9a-target-code-gate";
}

function targetDiagnosticCompletionLabel(session) {
  return isStandaloneTargetDiagnosticSession(session) ? "Continue to Consultation" : "Continue to Preliminary Assessment";
}

function AcquisitionMotiveScreen({ session, setSession }) {
  const existingContext = session.dealContext?.data ?? {};
  const [dealIdentity, setDealIdentity] = useState(() => initialDealIdentity(existingContext));
  const [error, setError] = useState("");
  const finalDeliverable = buildFinalDeliverable(session);
  const respondentRoleOptions = roleOptionsForSide(dealIdentity.respondentSide);
  const respondentRoleValid = respondentRoleOptions.some((option) => option.value === dealIdentity.respondentRole);
  const dealIdentityComplete = Object.values(dealIdentity).every(Boolean) && respondentRoleValid;
  const canContinue = Boolean(dealIdentityComplete);
  const submitLabel = dealStartSubmitLabel(dealIdentity.respondentSide);
  const derivedAcquisitionMotive = acquisitionMotiveForDealType(dealIdentity.dealType);
  const isOtherIntegrationSensitiveDeal = dealIdentity.dealType === "other_integration_sensitive";
  const motiveProfile = ACQUISITION_MOTIVE_OPTIONS.find((motive) => motive.value === derivedAcquisitionMotive);

  function updateDealIdentity(fieldId, value) {
    setDealIdentity((current) => {
      const next = { ...current, [fieldId]: value };
      if (fieldId === "respondentSide") {
        const nextRoleOptions = roleOptionsForSide(value);
        if (!nextRoleOptions.some((option) => option.value === current.respondentRole)) {
          next.respondentRole = "";
        }
      }
      return next;
    });
    setError("");
  }

  function submit(event) {
    event.preventDefault();
    const result = attachAcquisitionMotive(session, {
      ...dealIdentity,
      acquisitionMotive: derivedAcquisitionMotive,
    });
    if (!result.validation.valid) {
      setError(`Required: ${result.validation.missing.map(dealContextFieldLabel).join(", ")}`);
      return;
    }
    setSession(result.session);
    setError("");
    navigate(result.session.dealContext.nextRoute ?? nextRouteForDealStart(result.session.dealContext.data));
  }

  return (
    <main className="screen-shell flow-screen compact-flow deal-context-screen">
      <p className="eyebrow">DEAL CONTEXT</p>
      <form className="deal-context-form" onSubmit={submit}>
        <section className="deal-context-intro">
          <p className="section-label">Step 1 / Deal Context</p>
          <h1>Identify the deal and respondent role.</h1>
          <p className="lead">
            The diagnostic keeps respondent perspective separate from deal facts so contradictions remain visible later in the workflow.
          </p>
        </section>

        <section className="deal-identity-panel" aria-label="Deal and respondent context">
          <div className="deal-identity-grid">
            <label className="field-block">
              <span>Acquirer <small>(enter buyer or investor name; identifies the organization being assessed as acquirer)</small></span>
              <input
                autoComplete="organization"
                value={dealIdentity.acquirerName}
                onChange={(event) => updateDealIdentity("acquirerName", event.target.value)}
              />
            </label>
            <label className="field-block">
              <span>Target <small>(enter acquired company name; identifies the organization being integrated)</small></span>
              <input
                autoComplete="organization"
                value={dealIdentity.targetName}
                onChange={(event) => updateDealIdentity("targetName", event.target.value)}
              />
            </label>
            <label className="field-block">
              <span>Deal type <small>(choose primary deal rationale; sets the integration-risk lens)</small></span>
              <select value={dealIdentity.dealType} onChange={(event) => updateDealIdentity("dealType", event.target.value)}>
                <option value="">Select deal type</option>
                {DEAL_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.title}</option>
                ))}
              </select>
            </label>
            <label className="field-block">
              <span>Respondent side <small>(choose who you represent; keeps evidence separated by perspective)</small></span>
              <select value={dealIdentity.respondentSide} onChange={(event) => updateDealIdentity("respondentSide", event.target.value)}>
                <option value="">Select respondent side</option>
                {RESPONDENT_SIDE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.title}</option>
                ))}
              </select>
            </label>
            <label className="field-block">
              <span>Respondent role <small>(choose your role in the deal; calibrates what you can know directly)</small></span>
              <select value={dealIdentity.respondentRole} onChange={(event) => updateDealIdentity("respondentRole", event.target.value)}>
                <option value="">Select respondent role</option>
                {respondentRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.title}</option>
                ))}
              </select>
            </label>
            <label className="field-block">
              <span>Seniority <small>(choose decision level; calibrates authority, access, and accountability evidence)</small></span>
              <select value={dealIdentity.respondentSeniority} onChange={(event) => updateDealIdentity("respondentSeniority", event.target.value)}>
                <option value="">Select seniority</option>
                {RESPONDENT_SENIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.title}</option>
                ))}
              </select>
            </label>
            <label className="field-block">
              <span>Function <small>(choose functional area; shows which facts you can observe directly)</small></span>
              <select value={dealIdentity.respondentFunction} onChange={(event) => updateDealIdentity("respondentFunction", event.target.value)}>
                <option value="">Select function</option>
                {RESPONDENT_FUNCTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.title}</option>
                ))}
              </select>
            </label>
            <label className="field-block">
              <span>Access level <small>(choose diligence access; marks answer reliability and missing-evidence risk)</small></span>
              <select value={dealIdentity.respondentAccessLevel} onChange={(event) => updateDealIdentity("respondentAccessLevel", event.target.value)}>
                <option value="">Select access level</option>
                {RESPONDENT_ACCESS_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.title}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="deal-context-intro">
          <p className="section-label">Acquisition motive information</p>
          <h2>The deal type above sets the acquisition motive.</h2>
          <p className="lead">
            This block is informational only. The diagnostic derives the motive profile from Deal type so the same variable is not
            requested twice.
          </p>
        </section>

        <section className="motive-info-panel" aria-label="Acquisition motive information">
          {isOtherIntegrationSensitiveDeal ? (
            <article className="motive-card motive-info-card active">
              <span>Derived from Deal type</span>
              <strong>Insufficient information</strong>
              <em>Mapped internally to absorb or neutralize a competitor.</em>
              <p>There is insufficient information to clarify the value of the composite score indicator (ECS).</p>
            </article>
          ) : motiveProfile ? (
            <article className="motive-card motive-info-card active">
              <span>Derived from Deal type</span>
              <strong>{motiveProfile.title}</strong>
              <em>{motiveProfile.demand}</em>
              <p>{motiveProfile.description}</p>
            </article>
          ) : (
            <article className="motive-card motive-info-card">
              <span>Pending Deal type</span>
              <strong>Select Deal type above</strong>
              <em>No separate motive selection is required.</em>
              <p>The acquisition motive profile will appear here after Deal type is selected.</p>
            </article>
          )}
        </section>

        {error ? <p className="form-error">{error}</p> : null}
        <div className="button-row">
          {finalDeliverable.ready ? (
            <button type="button" onClick={() => navigate(finalDeliverable.route)}>Go to final report page</button>
          ) : null}
          <button className="primary-flow-action" disabled={!canContinue} type="submit">{submitLabel}</button>
        </div>
      </form>
    </main>
  );
}

function TransactionDetailsScreen({ session, setSession }) {
  const existingContext = session.dealContext?.data ?? {};
  const [form, setForm] = useState(() =>
    Object.fromEntries(TRANSACTION_DETAIL_SECTIONS.map((section) => [section.id, existingContext[section.id] ?? ""])),
  );
  const [error, setError] = useState("");
  const hasDealStartContext = Boolean(existingContext.dealType && existingContext.respondentSide);
  const canContinue = TRANSACTION_DETAIL_SECTIONS.every((section) => Boolean(form[section.id]));
  const dealSummaryItems = [
    ["Acquirer", existingContext.acquirerName ?? "Pending"],
    ["Target", existingContext.targetName ?? "Pending"],
    ["Deal type", optionTitle(DEAL_TYPE_OPTIONS, existingContext.dealType)],
    ["Respondent side", optionTitle(RESPONDENT_SIDE_OPTIONS, existingContext.respondentSide)],
    ["Respondent role", optionTitle(RESPONDENT_ROLE_OPTIONS, existingContext.respondentRole)],
  ];

  function updateDetail(sectionId, value) {
    setForm((current) => ({ ...current, [sectionId]: value }));
    setError("");
  }

  function submit(event) {
    event.preventDefault();
    const result = attachDealContext(session, {
      ...existingContext,
      ...form,
    });
    if (!result.validation.valid) {
      setError(`Required: ${result.validation.missing.map(dealContextFieldLabel).join(", ")}`);
      return;
    }
    setSession(result.session);
    setError("");
    navigate("/screen-4-promise");
  }

  if (!hasDealStartContext) {
    return (
      <main className="screen-shell flow-screen compact-flow">
        <p className="eyebrow">ACQUIRER TRANSACTION CONTEXT</p>
        <h1>Deal and respondent context is required first</h1>
        <button type="button" onClick={() => navigate("/start-diagnostic/deal-context")}>Open Deal Context</button>
      </main>
    );
  }

  return (
    <main className="screen-shell flow-screen compact-flow deal-context-screen">
      <p className="eyebrow">ACQUIRER TRANSACTION CONTEXT</p>
      <form className="deal-context-form transaction-details-form" onSubmit={submit}>
        <section className="deal-context-intro">
          <h1>Add acquirer transaction context</h1>
        </section>

        <section className="context-strip" aria-label="Confirmed deal and respondent context">
          {dealSummaryItems.map(([label, value]) => (
            <span key={label}>{label}: {value || "Pending"}</span>
          ))}
        </section>

        {TRANSACTION_DETAIL_SECTIONS.map((section) => (
          <section className="transaction-section" key={section.id}>
            <h2>{section.label}</h2>
            <div className="transaction-option-grid" aria-label={section.label}>
              {section.options.map((option) => {
                const selected = form[section.id] === option.value;
                return (
                  <button
                    aria-pressed={selected}
                    className={selected ? "transaction-option-card active" : "transaction-option-card"}
                    key={option.value}
                    type="button"
                    onClick={() => updateDetail(section.id, option.value)}
                  >
                    <strong>{option.title}</strong>
                    {option.description ? <p>{option.description}</p> : null}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {error ? <p className="form-error">{error}</p> : null}
        <div className="button-row">
          <button className="primary-flow-action" disabled={!canContinue} type="submit">
            Continue to Acquirer Module <span aria-hidden="true">{"\u2192"}</span>
          </button>
        </div>
      </form>
    </main>
  );
}

function targetObserverSetupInputCount() {
  return TARGET_OBSERVATION_SETUP_FIELDS.reduce(
    (total, field) => total + (field.type === "structured-context" ? RESPONDENT_CONTEXT_SECTIONS.length : 1),
    0,
  );
}

function minutesRange(minSeconds, maxSeconds = minSeconds) {
  const min = Math.ceil(minSeconds / 60);
  const max = Math.ceil(maxSeconds / 60);
  return min === max ? `${min} min` : `${min}-${max} min`;
}

function buildPromiseMetrics() {
  const acquirerQuestions = ACQUIRER_TRACK_DATA.acquirerModule.questionCount;
  const targetObservationQuestions = TARGET_OBSERVATION_DIAGNOSTIC.questionCount;
  const targetDiagnosticLevel1Questions = TARGET_DIAGNOSTIC_DATA.level1.questionCount;
  const targetDiagnosticLevel2Questions = TARGET_DIAGNOSTIC_DATA.level2.questionCount;
  const setupInputs = targetObserverSetupInputCount();
  const minimumQuestions = acquirerQuestions + targetObservationQuestions + targetDiagnosticLevel1Questions;
  const maximumQuestions = minimumQuestions + targetDiagnosticLevel2Questions;
  const secondsPerQuestion = 30;
  const secondsPerSetupInput = 20;
  const minimumSeconds = (minimumQuestions * secondsPerQuestion) + (setupInputs * secondsPerSetupInput);
  const maximumSeconds = (maximumQuestions * secondsPerQuestion) + (setupInputs * secondsPerSetupInput);
  const acquirerSeconds = acquirerQuestions * secondsPerQuestion;
  const observerMinimumSeconds = ((targetObservationQuestions + targetDiagnosticLevel1Questions) * secondsPerQuestion) + (setupInputs * secondsPerSetupInput);
  const observerMaximumSeconds = observerMinimumSeconds + (targetDiagnosticLevel2Questions * secondsPerQuestion);

  return Object.freeze({
    acquirerQuestions,
    targetObservationQuestions,
    targetDiagnosticLevel1Questions,
    targetDiagnosticLevel2Questions,
    setupInputs,
    minimumQuestions,
    maximumQuestions,
    totalQuestionLabel: minimumQuestions === maximumQuestions ? `${minimumQuestions}` : `${minimumQuestions}-${maximumQuestions}`,
    totalTimeLabel: minutesRange(minimumSeconds, maximumSeconds),
    acquirerTimeLabel: minutesRange(acquirerSeconds),
    observerTimeLabel: minutesRange(observerMinimumSeconds, observerMaximumSeconds),
  });
}

const TARGET_OBSERVATION_USER_REQUIREMENTS = Object.freeze([
  Object.freeze({
    status: "Must",
    title: "Acquirer / deal owner",
    body: "Completes Deal Context and the Acquirer module, then either answers the Target Observer block directly or sends the authorized link and code.",
  }),
  Object.freeze({
    status: "Must",
    title: "Target Observer / authorized respondent",
    body: "Provides observed evidence about the target's operating reality. This can be a diligence lead, integration lead, functional owner, or advisor acting for the acquirer.",
  }),
  Object.freeze({
    status: "Could",
    title: "Target self-assessment respondent",
    body: "A founder, owner, executive, or manager from the target can add the target-side self-assessment later. It improves reconciliation, but it is not required for the first Preliminary Assessment.",
  }),
  Object.freeze({
    status: "Could",
    title: "External consultant / advisor",
    body: "Can act as the Target Observer only if they directly observed target behaviour, or can support evidence review. They are not required if the acquirer team has enough direct evidence.",
  }),
]);

function TargetObservationProcessBlock({ metrics, children }) {
  return (
    <section className="target-observation-process" aria-label="Target Observation process">
      <h2>Target Observation process</h2>
      <p className="process-intro">
        The first useful Preliminary Assessment needs two mandatory perspectives: the acquirer's self-observation and one observed target signal. The observed signal is the Target Observer block, not a separate target-company survey.
      </p>
      <div className="process-metric-grid" aria-label="Question and time summary">
        <p><strong>{metrics.totalQuestionLabel}</strong><span>scored questions to first useful information</span></p>
        <p><strong>{metrics.setupInputs}</strong><span>Target Observer setup inputs</span></p>
        <p><strong>{metrics.totalTimeLabel}</strong><span>estimated active answer time</span></p>
      </div>
      <div className="user-requirement-grid" aria-label="Required and optional users">
        {TARGET_OBSERVATION_USER_REQUIREMENTS.map((item) => (
          <article className="user-requirement" key={`${item.status}-${item.title}`}>
            <span className={item.status === "Must" ? "requirement-must" : "requirement-could"}>{item.status}</span>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
      <div className="target-process-steps" aria-label="Target Observation completion steps">
        <p><strong>1.</strong> Acquirer completes {metrics.acquirerQuestions} questions and opens Target Observation Setup.</p>
        <p><strong>2.</strong> Setup can be entered directly or sent through a 72-hour authorized link with a 6-digit code.</p>
        <p><strong>3.</strong> Target Observer completes {metrics.setupInputs} setup inputs, {metrics.targetObservationQuestions} Target Observation questions, and {metrics.targetDiagnosticLevel1Questions} Target Diagnostic Level 1 questions.</p>
        <p><strong>4.</strong> If the Level 1 signal is weak or co-present, the observer answers {metrics.targetDiagnosticLevel2Questions} more Level 2 questions. When the full Target Observer block is received, the Preliminary Assessment opens.</p>
      </div>
      <p className="process-timing">
        Target Observer active answer time: about {metrics.observerTimeLabel}. Total active answer time to first useful information: about {metrics.totalTimeLabel}.
      </p>
      {children}
    </section>
  );
}

function PromiseScreen({ session }) {
  if (!session.dealContext?.completed) {
    return (
      <main className="screen-shell flow-screen">
        <p className="eyebrow">Screen 4 / Promise</p>
        <h1>Deal context is required first</h1>
        <button type="button" onClick={() => navigate("/start-diagnostic/deal-context")}>Open Deal Context</button>
      </main>
    );
  }

  const metrics = buildPromiseMetrics();

  return (
    <main className="screen-shell flow-screen compact-flow">
      <p className="eyebrow">Screen 4 / Promise</p>
      <h1>You are {metrics.totalQuestionLabel} scored questions from the first useful Preliminary Assessment.</h1>
      <TargetObservationProcessBlock metrics={metrics} />
      <section className="promise-list" aria-label="Diagnostic deliverables">
        {ACQUIRER_TRACK_DATA.promise.deliverables.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </section>
      <p className="lead">Estimated active answer time to first useful information: {metrics.totalTimeLabel}. This is split across the acquirer and the Target Observer; waiting time depends on how fast the observer completes the link.</p>
      <p className="source-note">{ACQUIRER_TRACK_DATA.promise.footnote}</p>
      <button type="button" onClick={() => navigate("/screen-5-acquirer-module")}>Begin - {metrics.acquirerTimeLabel} now - forward-only</button>
    </main>
  );
}

function selectedOptionPatch(question, value) {
  const option = question.options.find((item) => item.value === value);
  const cannotAnswer = value === "E"
    || value === "F"
    || option?.excludedFromPrimaryScoring === true
    || /cannot answer|no direct observation|unknown/i.test(option?.text ?? "");

  return cannotAnswer
    ? { selectedOption: value, evidenceType: "unknown" }
    : { selectedOption: value };
}

function updateQuestionnaireSelectedAnswer(answers, question, value) {
  return {
    ...answers,
    [question.id]: updateEvidenceAnswer(answers[question.id], selectedOptionPatch(question, value)),
  };
}

function DirectObservationGatePanel({ question, answer, onChange }) {
  const gate = question.directObservationGate;
  if (!gate) return null;

  const normalized = normalizeEvidenceAnswer(answer);
  const prompt = typeof gate === "string" ? gate : gate.prompt;

  function updateGate(value) {
    onChange(updateEvidenceAnswer(normalized, { directObservationGate: value }));
  }

  return (
    <section className="direct-observation-gate" aria-label="Direct observation gate">
      <div>
        <strong>Direct Observation Gate</strong>
        <p>{publicText(prompt)}</p>
      </div>
      <div className="direct-observation-options">
        {DIRECT_OBSERVATION_GATE_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              checked={normalized.directObservationGate === option.value}
              name={`${question.id}-direct-observation`}
              onChange={() => updateGate(option.value)}
              type="radio"
              value={option.value}
            />
            <span>{option.title}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function EvidenceClassificationPanel({ answer, onChange, showDirectObservation = true }) {
  const normalized = normalizeEvidenceAnswer(answer);

  function updateField(fieldId, value) {
    onChange(updateEvidenceAnswer(normalized, { [fieldId]: value }));
  }

  function toggleFlag(flag) {
    onChange(toggleReliabilityFlag(normalized, flag));
  }

  function toggleNoFlags() {
    onChange(updateEvidenceAnswer(normalized, {
      reliabilityFlags: [],
      reliabilityFlagsAcknowledged: !(normalized.reliabilityFlagsAcknowledged && normalized.reliabilityFlags.length === 0),
    }));
  }

  const noFlagsSelected = normalized.reliabilityFlagsAcknowledged && normalized.reliabilityFlags.length === 0;
  const unknownAnswer = normalized.evidenceType === "unknown"
    && normalized.knowledgeLevel === "not_known"
    && normalized.confidence === "cannot_determine";

  if (unknownAnswer) {
    return (
      <section className="evidence-classification-panel" aria-label="Evidence classification">
        <div className="evidence-classification-header">
          <h2>Evidence classification</h2>
          <p>This answer is recorded as no direct knowledge. It is excluded from primary environment scoring and preserved as coverage evidence.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="evidence-classification-panel" aria-label="Evidence classification">
      <div className="evidence-classification-header">
        <h2>Evidence classification</h2>
        <p>Classify the basis for this answer. The score treats answers as evidence, not as facts.</p>
      </div>
      <div className="evidence-classification-grid">
        {showDirectObservation ? (
          <label className="field-block">
            <span>Direct observation</span>
            <select
              value={normalized.directObservationGate}
              onChange={(event) => updateField("directObservationGate", event.target.value)}
            >
              <option value="">Select basis</option>
              {DIRECT_OBSERVATION_GATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.title}</option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field-block">
          <span>Evidence type</span>
          <select
            value={normalized.evidenceType}
            onChange={(event) => updateField("evidenceType", event.target.value)}
          >
            <option value="">Select evidence type</option>
            {EVIDENCE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.title}</option>
            ))}
          </select>
        </label>
        <label className="field-block">
          <span>Knowledge level</span>
          <select
            value={normalized.knowledgeLevel}
            onChange={(event) => updateField("knowledgeLevel", event.target.value)}
          >
            <option value="">Select knowledge level</option>
            {KNOWLEDGE_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.title}</option>
            ))}
          </select>
        </label>
        <label className="field-block">
          <span>Confidence</span>
          <select
            value={normalized.confidence}
            onChange={(event) => updateField("confidence", event.target.value)}
          >
            <option value="">Select confidence</option>
            {CONFIDENCE_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.title}</option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="reliability-flag-fieldset">
        <legend>Reliability flags</legend>
        <div className="reliability-flag-grid">
          <label className="reliability-flag-option reliability-flag-none">
            <input
              checked={noFlagsSelected}
              onChange={toggleNoFlags}
              type="checkbox"
            />
            <span>No reliability flags apply</span>
          </label>
          {RELIABILITY_FLAG_OPTIONS.map((flag) => (
            <label key={flag.value} className="reliability-flag-option">
              <input
                checked={normalized.reliabilityFlags.includes(flag.value)}
                onChange={() => toggleFlag(flag.value)}
                type="checkbox"
              />
              <span>{flag.title}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

function evidenceClassificationMessage(validation) {
  if (!validation || validation.valid) return "";
  if (validation.missing.includes("answer option")) return "Select one answer to continue.";

  const parts = [];
  if (validation.missing.length > 0) {
    parts.push(`Complete: ${validation.missing.join(", ")}.`);
  }
  if (validation.consistencyIssues.length > 0) {
    parts.push(`Resolve: ${validation.consistencyIssues.join(" ")}`);
  }
  return parts.join(" ");
}

function QuestionnaireBlockingMessage({ validation }) {
  const message = evidenceClassificationMessage(validation);
  if (!message) return null;

  return (
    <p className="form-error" role="status" aria-live="polite">
      {message}
    </p>
  );
}

function AcquirerModuleScreen({ session, setSession }) {
  const existingAnswers = session.acquirer2A?.answers ?? {};
  const [answers, setAnswers] = useState(existingAnswers);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const questions = ACQUIRER_TRACK_DATA.acquirerModule.questions;
  const question = questions[activeIndex];
  const currentAnswer = normalizeEvidenceAnswer(answers[question.id]);
  const selectedAnswer = selectedOptionValue(currentAnswer);
  const currentAnswerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
  const canSubmitQuestion = currentAnswerValidation.valid;

  if (!canStartAcquirerModule(session)) {
    return (
      <main className="screen-shell flow-screen">
        <p className="eyebrow">Screens 5-6 / Step 2-A</p>
        <h1>Deal context is required before the Acquirer module</h1>
        <button type="button" onClick={() => navigate("/start-diagnostic/deal-context")}>Open Deal Context</button>
      </main>
    );
  }

  function updateAnswer(value) {
    setAnswers((current) => updateQuestionnaireSelectedAnswer(current, question, value));
    setError("");
  }

  function updateCurrentEvidenceAnswer(answer) {
    setAnswers((current) => ({ ...current, [question.id]: answer }));
    setError("");
  }

  function nextQuestion(event) {
    event.preventDefault();
    if (!selectedAnswer) {
      setError("Select one answer to continue.");
      return;
    }

    const answerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
    if (!answerValidation.valid) {
      const missingText = answerValidation.missing.length ? `Missing: ${answerValidation.missing.join(", ")}.` : "";
      const issueText = answerValidation.consistencyIssues.length ? answerValidation.consistencyIssues.join(" ") : "";
      setError(`${missingText} ${issueText}`.trim());
      return;
    }

    const normalizedAnswers = { ...answers, [question.id]: answerValidation.normalized };

    if (activeIndex < questions.length - 1) {
      setAnswers(normalizedAnswers);
      setActiveIndex((index) => index + 1);
      return;
    }

    const result = attachAcquirerModuleResult(session, normalizedAnswers);
    setSession(result.session);
    navigate("/screen-6-acquirer-submit");
  }

  return (
    <main className="screen-shell flow-screen question-screen">
      <p className="eyebrow">Step 2-A - Q{activeIndex + 1} of {questions.length} - {publicText(question.axis)}</p>
      <h1>{publicText(question.text)}</h1>
      <form className="question-form" onSubmit={nextQuestion}>
        <DirectObservationGatePanel
          question={question}
          answer={answers[question.id]}
          onChange={updateCurrentEvidenceAnswer}
        />
        <div className="option-list">
          {question.options.map((option) => (
            <label key={option.value} className="option-row">
              <input
                checked={selectedAnswer === option.value}
                name={question.id}
                onChange={() => updateAnswer(option.value)}
                type="radio"
                value={option.value}
              />
              <span><strong>{option.value}</strong>{publicText(option.text)}</span>
            </label>
          ))}
        </div>
        {selectedAnswer ? (
          <EvidenceClassificationPanel
            answer={answers[question.id]}
            onChange={updateCurrentEvidenceAnswer}
            showDirectObservation={!question.directObservationGate}
          />
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        <QuestionnaireBlockingMessage validation={currentAnswerValidation} />
        <div className="button-row">
          <button className="primary-flow-action" disabled={!canSubmitQuestion} type="submit">
            {activeIndex === questions.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </form>
    </main>
  );
}

function AcquirerSubmitScreen({ session, setSession }) {
  const [emailState, setEmailState] = useState("");
  const invite = session.acquirerVerificationInvite;

  useEffect(() => {
    if (!invite || invite.completed || !setSession) return undefined;

    let cancelled = false;
    let completionChannel = null;

    function applyCompletion(completedInvite) {
      if (cancelled || !completedInvite) return;
      setSession((current) => attachAcquirerVerificationCompletion(current, {
        ...invite,
        ...completedInvite,
        completed: true,
      }));
    }

    function handleCompletionEvent(event) {
      applyCompletion(parseAcquirerVerificationCompletion(event.detail));
    }

    try {
      completionChannel = new BroadcastChannel(ACQUIRER_VERIFICATION_COMPLETION_CHANNEL);
      completionChannel.onmessage = (event) => {
        applyCompletion(parseAcquirerVerificationCompletion(event.data));
      };
    } catch {
      completionChannel = null;
    }

    window.addEventListener(ACQUIRER_VERIFICATION_COMPLETION_EVENT, handleCompletionEvent);
    return () => {
      cancelled = true;
      window.removeEventListener(ACQUIRER_VERIFICATION_COMPLETION_EVENT, handleCompletionEvent);
      completionChannel?.close();
    };
  }, [invite, setSession]);

  if (!session.acquirer2A?.completed) {
    return (
      <main className="screen-shell flow-screen">
        <p className="eyebrow">Screen 6 / Acquirer module submit</p>
        <h1>Step 2-A is not complete</h1>
        <button type="button" onClick={() => navigate("/screen-5-acquirer-module")}>Open Acquirer Module</button>
      </main>
    );
  }

  const score = session.acquirer2A.score;
  const originalScore = session.acquirer2A.originalScore;
  const verificationRecommended = requiresAcquirerVerification(session);
  const verificationComplete = isAcquirerVerificationComplete(session);
  const nextReady = canContinueToTargetObservationSetup(session);
  const fullLink = invite ? `${window.location.origin}${invite.surveyLink}` : "";

  function createVerificationInvite() {
    const result = createAcquirerVerificationInvite(session);
    if (result.ok) {
      setSession(result.session);
      setEmailState("");
    }
  }

  return (
    <main className="screen-shell flow-screen compact-flow">
      <p className="eyebrow">Screen 6 / Acquirer module submit</p>
      <h1>Acquirer environment signal captured</h1>
      <section className="result-panel">
        <strong>{aliasFor(score.primaryEnvironmentCode)} - {score.signalBadge}</strong>
        <span>Primary signal score: {score.primarySignalScore}</span>
        <span>Secondary signal: {aliasFor(score.secondaryEnvironmentCode)} - {score.secondarySignalScore}</span>
        <span>{score.coPresence ? "Co-presence flag active" : "No co-presence flag"}</span>
        {score.respondentCount ? <span>Respondents included: {score.respondentCount}</span> : null}
      </section>

      {verificationRecommended ? (
        <section className="invite-panel">
          <h2>Optional precision upgrade</h2>
          {verificationComplete ? (
            <>
              <p>Authorized acquirer response received. Continue to Target Observation Setup when ready. The Preliminary Assessment will use the merged acquirer signal, so the acquirer environment type and its relationship with the Target environment are calculated from both acquirer responses.</p>
              <div className="range-table">
                <div className="range-row">
                  <span>Original acquirer signal</span>
                  <strong>{aliasFor(originalScore?.primaryEnvironmentCode ?? score.primaryEnvironmentCode)}</strong>
                  <em>{originalScore?.signalBadge ?? originalScore?.signalStrength ?? "captured"}</em>
                </div>
                <div className="range-row">
                  <span>Merged acquirer signal</span>
                  <strong>{aliasFor(score.primaryEnvironmentCode)}</strong>
                  <em>{score.signalBadge}</em>
                </div>
              </div>
            </>
          ) : (
            <>
              <p>Your acquirer signal came back weak or close to a second environment. Sending this link is optional, but a second authorized acquirer response will make the Preliminary Assessment and final report more precise.</p>
              <p className="source-note">If you continue without sending it, the next steps stay open and the report will be marked with poor estimation accuracy because the acquirer environment is based on a weak single-respondent signal.</p>
              {!invite ? (
                <button className="primary-flow-action" type="button" onClick={createVerificationInvite}>
                  Generate optional Acquirer verification link and 6-digit code
                </button>
              ) : (
                <>
                  <div className="invite-grid">
                    <label>
                      <span>Survey link - active for 72 hours</span>
                      <input readOnly value={fullLink} />
                    </label>
                    <label>
                      <span>6-digit code</span>
                      <input readOnly value={invite.digitalCode} />
                    </label>
                    <label>
                      <span>Expires at</span>
                      <input readOnly value={invite.expiresAt} />
                    </label>
                  </div>
                  <p className="source-note">Keep this tab open if you want it to update automatically when the authorized acquirer response is received. You can continue now; if that response arrives before the final report is generated, it will be merged with the original acquirer response and improve precision.</p>
                  <div className="button-row">
                    <button type="button" onClick={() => setEmailState("Prepared for email sending: Acquirer verification link and code are ready.")}>Enter e-mail for sending</button>
                    <button type="button" onClick={() => window.open(fullLink, "_blank", "noopener,noreferrer")}>Open Acquirer verification survey</button>
                  </div>
                  {emailState ? <p className="source-note">{emailState}</p> : null}
                </>
              )}
            </>
          )}
        </section>
      ) : null}

      <button
        disabled={!nextReady}
        type="button"
        onClick={() => navigate("/screen-6a-target-observation-setup")}
      >
        Continue to Target Observation Setup
      </button>
    </main>
  );
}

function AcquirerVerificationReceiptScreen() {
  return (
    <main className="target-only-screen">
      <section className="receipt-panel">
        <p className="eyebrow">Acquirer verification</p>
        <h1>Thank you. The second acquirer response has been received.</h1>
        <p>The Preliminary Assessment will use the merged acquirer signal when the main assessment continues.</p>
        <p className="source-note">When the original assessment tab is still open in this browser, it is notified automatically. If that tab does not update, return to it and continue from the next available action.</p>
        <strong>You can close this window.</strong>
      </section>
    </main>
  );
}

function AcquirerVerificationQuestionnaire({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const questions = ACQUIRER_TRACK_DATA.acquirerModule.questions;
  const question = questions[activeIndex];
  const currentAnswer = normalizeEvidenceAnswer(answers[question.id]);
  const selectedAnswer = selectedOptionValue(currentAnswer);
  const currentAnswerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
  const canSubmitQuestion = currentAnswerValidation.valid;

  function updateAnswer(value) {
    setAnswers((current) => updateQuestionnaireSelectedAnswer(current, question, value));
    setError("");
  }

  function updateCurrentEvidenceAnswer(answer) {
    setAnswers((current) => ({ ...current, [question.id]: answer }));
    setError("");
  }

  function submit(event) {
    event.preventDefault();
    if (!selectedAnswer) {
      setError("Select one answer to continue.");
      return;
    }

    const answerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
    if (!answerValidation.valid) {
      const missingText = answerValidation.missing.length ? `Missing: ${answerValidation.missing.join(", ")}.` : "";
      const issueText = answerValidation.consistencyIssues.length ? answerValidation.consistencyIssues.join(" ") : "";
      setError(`${missingText} ${issueText}`.trim());
      return;
    }

    const completed = { ...answers, [question.id]: answerValidation.normalized };
    if (activeIndex < questions.length - 1) {
      setAnswers(completed);
      setActiveIndex((index) => index + 1);
      return;
    }

    onComplete(completed);
  }

  return (
    <section className="target-survey-panel question-screen">
      <p className="eyebrow">Acquirer verification - Q{activeIndex + 1} of {questions.length} - {publicText(question.axis)}</p>
      <h1>{publicText(question.text)}</h1>
      <form className="question-form" onSubmit={submit}>
        <DirectObservationGatePanel
          question={question}
          answer={answers[question.id]}
          onChange={updateCurrentEvidenceAnswer}
        />
        <div className="option-list">
          {question.options.map((option) => (
            <label key={option.value} className="option-row">
              <input
                checked={selectedAnswer === option.value}
                name={question.id}
                onChange={() => updateAnswer(option.value)}
                type="radio"
                value={option.value}
              />
              <span><strong>{option.value}</strong>{publicText(option.text)}</span>
            </label>
          ))}
        </div>
        {selectedAnswer ? (
          <EvidenceClassificationPanel
            answer={answers[question.id]}
            onChange={updateCurrentEvidenceAnswer}
            showDirectObservation={!question.directObservationGate}
          />
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        <QuestionnaireBlockingMessage validation={currentAnswerValidation} />
        <div className="button-row">
          <button className="primary-flow-action" disabled={!canSubmitQuestion} type="submit">
            {activeIndex === questions.length - 1 ? "Submit acquirer verification" : "Next"}
          </button>
        </div>
      </form>
    </section>
  );
}

function AuthorizedAcquirerVerificationScreen({ setSession }) {
  const invite = acquirerVerificationInviteFromLocation();
  const [digitalCode, setDigitalCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const [error, setError] = useState("");

  if (receipt) return <AcquirerVerificationReceiptScreen />;

  if (!invite) {
    return (
      <main className="target-only-screen">
        <section className="receipt-panel">
          <h1>This acquirer verification link is not active.</h1>
          <p>The link may be incomplete, expired, or no longer match the generated code.</p>
          <strong>You can close this window.</strong>
        </section>
      </main>
    );
  }

  function verifyCode(event) {
    event.preventDefault();
    const verification = verifyAcquirerVerificationInvite(invite, digitalCode);
    if (!verification.ok) {
      setError(`Code verification failed: ${verification.status}.`);
      return;
    }
    setError("");
    setVerified(true);
  }

  if (!verified) {
    return (
      <main className="target-only-screen">
        <section className="target-code-panel">
          <p className="eyebrow">Authorized Acquirer Verification Survey</p>
          <h1>Enter the 6-digit digital code.</h1>
          <p>The code opens the Acquirer module for the correct Preliminary Assessment path.</p>
          <form className="setup-form" onSubmit={verifyCode}>
            <label className="field-block">
              <span>6-digit code</span>
              <input
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                value={digitalCode}
                onChange={(event) => setDigitalCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-flow-action" disabled={digitalCode.length !== 6} type="submit">Open Acquirer verification survey</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="target-only-screen">
      <AcquirerVerificationQuestionnaire
        onComplete={(completedAnswers) => {
          const completion = completeAcquirerVerificationInvite(invite, completedAnswers);
          if (!completion.ok) {
            setError("Acquirer verification could not be completed. Check that all questions were answered and the link is still active.");
            return;
          }
          publishAcquirerVerificationCompletion(completion.invite);
          setSession?.((current) => attachAcquirerVerificationCompletion(current, completion.invite));
          setReceipt(true);
        }}
      />
      {error ? <p className="form-error standalone-error">{error}</p> : null}
    </main>
  );
}

function fieldLabel(fieldId) {
  return TARGET_OBSERVATION_SETUP_FIELDS.find((field) => field.id === fieldId)?.label
    ?? RESPONDENT_CONTEXT_SECTIONS.find((section) => section.id === fieldId)?.label
    ?? fieldId;
}

function initialTargetObservationSetupForm(existingSetup) {
  return Object.freeze({
    observationPosition: existingSetup.observationPosition ?? "",
    integrationTimeline: existingSetup.integrationTimeline ?? "",
    ...Object.fromEntries(
      RESPONDENT_CONTEXT_SECTIONS.map((section) => [
        section.id,
        existingSetup.respondentContextProfile?.[section.id] ?? existingSetup[section.id] ?? "",
      ]),
    ),
  });
}

function TargetObservationSetupForm({ existingSetup = {}, submitLabel = "Continue to Target Observation", onValidSubmit }) {
  const [form, setForm] = useState(() => initialTargetObservationSetupForm(existingSetup));
  const [error, setError] = useState("");
  const setupValidation = validateTargetObservationSetup(form);
  const canContinue = setupValidation.valid;

  function updateField(fieldId, value) {
    setForm((current) => ({ ...current, [fieldId]: value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    const validation = validateTargetObservationSetup(form);
    if (!validation.valid) {
      setError(`Required: ${validation.missing.map(fieldLabel).join(", ")}`);
      return;
    }

    const result = await onValidSubmit(validation.normalized);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setError("");
  }

  return (
    <form className="setup-form" onSubmit={submit}>
      {TARGET_OBSERVATION_SETUP_FIELDS.map((field) => {
        if (field.type === "structured-context") {
          return (
            <section className="setup-choice-panel" key={field.id}>
              <span>{field.label}</span>
              {field.sections.map((section) => (
                <section className="transaction-section setup-choice-section" key={section.id}>
                  <h2>{section.label}</h2>
                  <div className="transaction-option-grid" aria-label={section.label}>
                    {section.options.map((option) => {
                      const selected = form[section.id] === option.value;
                      return (
                        <button
                          aria-pressed={selected}
                          className={selected ? "transaction-option-card active" : "transaction-option-card"}
                          key={option.value}
                          type="button"
                          onClick={() => updateField(section.id, option.value)}
                        >
                          <strong>{option.title}</strong>
                          <p>{option.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </section>
          );
        }

        return (
          <label className="field-block" key={field.id}>
            <span>{field.label}</span>
            <select value={form[field.id]} onChange={(event) => updateField(field.id, event.target.value)}>
              <option value="">Select</option>
              {field.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        );
      })}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="button-row">
        <button className="primary-flow-action" disabled={!canContinue} type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}

function TargetObservationSetupIntroScreen({ session, setSession }) {
  const [emailState, setEmailState] = useState("");
  const [showAuthorizedEmail, setShowAuthorizedEmail] = useState(false);
  const [authorizedRecipientEmail, setAuthorizedRecipientEmail] = useState("");
  const [authorizedEmailSending, setAuthorizedEmailSending] = useState(false);
  const invite = session.targetObservationSetupInvite;
  const authorizedRouteLocked = Boolean(invite);
  const authorizedSurveyComplete = Boolean(invite?.completed && invite?.targetObservation?.completed && invite?.target2B?.completed);

  useEffect(() => {
    if (!invite || invite.completed) return undefined;

    let cancelled = false;
    let completionChannel = null;

    function applyCompletion(completedInvite) {
      if (cancelled || !completedInvite) return;
      setSession((current) => attachAuthorizedObservationCompletion(current, {
        ...invite,
        ...completedInvite,
        completed: true,
      }));
    }

    function handleCompletionEvent(event) {
      applyCompletion(parseAuthorizedObservationCompletion(event.detail));
    }

    async function refreshAuthorizedCompletion() {
      try {
        const response = await fetch(`/api/target-observation-state?sessionId=${encodeURIComponent(invite.assessmentSessionId)}`);
        if (!response.ok) return;
        const body = await response.json();
        if (cancelled || !body?.targetObservation?.completed || !body?.target2B?.completed) return;
        const completedInvite = {
          ...invite,
          completed: true,
          completedAt: body.targetObservation.storedAt,
          targetObservationSetup: body.targetObservationSetup,
          targetObservation: body.targetObservation,
          target2B: body.target2B,
        };
        publishAuthorizedObservationCompletion(completedInvite);
        applyCompletion(completedInvite);
      } catch {
        // Local static preview does not expose API routes; same-origin tab completion still updates state directly.
      }
    }

    try {
      completionChannel = new BroadcastChannel(AUTHORIZED_OBSERVATION_COMPLETION_CHANNEL);
      completionChannel.onmessage = (event) => {
        applyCompletion(parseAuthorizedObservationCompletion(event.data));
      };
    } catch {
      completionChannel = null;
    }

    window.addEventListener(AUTHORIZED_OBSERVATION_COMPLETION_EVENT, handleCompletionEvent);
    refreshAuthorizedCompletion();
    const timer = window.setInterval(refreshAuthorizedCompletion, 5000);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTHORIZED_OBSERVATION_COMPLETION_EVENT, handleCompletionEvent);
      completionChannel?.close();
      window.clearInterval(timer);
    };
  }, [invite, setSession]);

  if (!canContinueToTargetObservationSetup(session)) {
    return (
      <main className="screen-shell flow-screen compact-flow">
        <p className="eyebrow">Screen 6a / Target Observation Setup</p>
        <h1>Step 2-A is required first</h1>
        <p className="lead">Target Observation Setup opens after the Acquirer module has produced an environment signal. Optional acquirer verification can improve precision, but it does not block this step.</p>
        <button type="button" onClick={() => navigate("/screen-5-acquirer-module")}>Open Acquirer Module</button>
      </main>
    );
  }

  function createAuthorizedInvite() {
    const result = createObservationSetupInvite(session);
    setSession(result.session);
    setEmailState("");
    setShowAuthorizedEmail(false);
    setAuthorizedRecipientEmail("");
    setAuthorizedEmailSending(false);
  }

  const fullLink = invite ? `${window.location.origin}${invite.surveyLink}` : "";

  async function sendAuthorizedEmail(event) {
    event.preventDefault();
    const recipientEmail = authorizedRecipientEmail.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      setEmailState("Enter a valid recipient e-mail before sending.");
      return;
    }

    setAuthorizedEmailSending(true);
    setEmailState("Sending authorized respondent e-mail...");

    try {
      const params = new URLSearchParams({
        action: "send-authorized-link",
        recipientEmail,
        surveyLink: fullLink,
        digitalCode: invite.digitalCode,
        expiresAt: invite.expiresAt,
      });
      const response = await fetch(`/api/final-report?${params.toString()}`, { method: "POST" });
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.status !== "sent") {
        setEmailState(result?.error ?? "E-mail service did not send the message.");
        return;
      }

      setEmailState(`E-mail sent to ${recipientEmail}.`);
    } catch {
      setEmailState("E-mail service is unavailable. Try again later.");
    } finally {
      setAuthorizedEmailSending(false);
    }
  }

  return (
    <main className="screen-shell flow-screen compact-flow">
      <p className="eyebrow">Screen 6a / Target Observation Setup</p>
      <h1>Who will provide the Target Observation setup?</h1>
      <section className="invite-panel">
        <h2>Who should answer this survey</h2>
        <p>The Target Observer survey must be answered by the person who has direct evidence of how the target actually operates. High-quality answers require observed facts, not assumptions, public information, or the acquisition thesis.</p>
        <div className="evidence-checklist" aria-label="Evidence needed to answer directly">
          <strong>Use Option 1 only if you can answer clearly from evidence about:</strong>
          <ul>
            <li>who actually makes important decisions inside the target company;</li>
            <li>how target leaders respond to challenge, disagreement, and bad news;</li>
            <li>how resources, authority, accountability, and exceptions are handled in practice;</li>
            <li>what routines, meetings, approvals, handoffs, and escalation paths really look like;</li>
            <li>how the target behaves under pressure, not only in prepared diligence materials.</li>
          </ul>
        </div>
        <p>Use the acquirer route only if you personally observed enough of this through diligence, planning, workshops, management meetings, site visits, or early integration work to answer without guessing.</p>
        <p>Send the authorized link if another person has the better evidence: diligence lead, integration lead, functional owner, board observer, or external advisor acting for the acquirer.</p>
        <p>The target company's self-assessment respondent is not this survey respondent. That target-side survey is generated later if it is not ready yet.</p>
      </section>

      <section className="motive-grid" aria-label="Target Observation setup routing">
        <button
          className="motive-card"
          disabled={authorizedRouteLocked}
          type="button"
          onClick={() => navigate("/screen-6a-target-observation-setup/details")}
        >
          <span>OPTION 1</span>
          <strong>I have answers and I'm ready to continue</strong>
          <p>Use this only when you have clear, first-hand or well-documented evidence of the target's real decision routines, authority, conflict handling, resource allocation, and operating behaviour.</p>
        </button>
        <button
          aria-pressed={authorizedRouteLocked}
          className={authorizedRouteLocked ? "motive-card active" : "motive-card"}
          disabled={authorizedRouteLocked}
          type="button"
          onClick={createAuthorizedInvite}
        >
          <span>OPTION 2</span>
          <strong>Send link to authorized person</strong>
          <p>Send this to the person with direct knowledge of the target's operating reality, such as the diligence lead, integration lead, functional owner, or advisor who has observed the target's leadership routines.</p>
        </button>
      </section>

      {invite ? (
        <section className="invite-panel">
          <h2>Authorized respondent link and digital code</h2>
            <div className="invite-grid">
              <label>
                <span>Survey link - active for 72 hours</span>
                <input readOnly value={fullLink} />
              </label>
              <label>
                <span>6-digit code</span>
                <input readOnly value={invite.digitalCode} />
              </label>
              <label>
                <span>Expires at</span>
                <input readOnly value={invite.expiresAt} />
              </label>
            </div>
            {!authorizedSurveyComplete ? (
              <p className="source-note">Keep this tab open; it will update automatically when the authorized respondent submits the full Target Observer block. Direct entry is locked for this survey until then.</p>
            ) : (
              <p className="source-note">Authorized response received. Open it to review the selected answers in read-only mode before continuing to Preliminary Assessment.</p>
            )}
            <div className="button-row">
              <button
                type="button"
                onClick={() => {
                  setShowAuthorizedEmail(true);
                  setEmailState("");
                }}
              >
                Enter e-mail for sending
              </button>
              <button
                disabled={!authorizedSurveyComplete}
                type="button"
                onClick={() => navigate("/screen-6b-target-observation?review=authorized")}
              >
                Open Authorized Survey
              </button>
              {authorizedSurveyComplete ? (
                <button
                  className="primary-flow-action"
                  type="button"
                  onClick={() => navigate("/screen-9a-target-code-gate")}
                >
                  Continue to Preliminary Assessment
                </button>
              ) : null}
            </div>
            {showAuthorizedEmail ? (
              <form className="invite-grid" onSubmit={sendAuthorizedEmail}>
                <label>
                  <span>Recipient e-mail</span>
                  <input
                    autoComplete="email"
                    onChange={(event) => {
                      setAuthorizedRecipientEmail(event.target.value);
                      setEmailState("");
                    }}
                    placeholder="name@example.com"
                    type="email"
                    value={authorizedRecipientEmail}
                  />
                </label>
                <label>
                  <span>Prepared message</span>
                  <input readOnly value="Authorized Target Observer link and 6-digit code" />
                </label>
                <button disabled={authorizedEmailSending} type="submit">
                  {authorizedEmailSending ? "Sending..." : "Send e-mail"}
                </button>
              </form>
            ) : null}
            {emailState ? <p className="source-note">{emailState}</p> : null}
        </section>
      ) : null}
    </main>
  );
}

async function submitAuthorizedObservationCompletion(invite, digitalCode, setupRecord, answers, targetDiagnosticAnswers) {
  try {
    const response = await fetch("/api/submit-target-observation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        assessmentSessionId: invite.assessmentSessionId,
        observationSessionId: invite.observationSessionId,
        codeHash: invite.codeHash,
        digitalCode,
        setup: setupRecord.data,
        answers,
        targetDiagnostic: targetDiagnosticAnswers,
      }),
    });

    if (!response.ok) return null;
    const body = await response.json();
    if (!body?.targetObservation?.completed || !body?.target2B?.completed) return null;

    return Object.freeze({
      ...invite,
      completed: true,
      completedAt: body.targetObservation.storedAt,
      targetObservationSetup: body.targetObservationSetup,
      targetObservation: body.targetObservation,
      target2B: body.target2B,
    });
  } catch {
    // Local static preview does not expose API routes; same-session completion still updates state directly.
    return null;
  }
}

function TargetObservationSetupScreen({ session, setSession }) {
  if (!canContinueToTargetObservationSetup(session)) {
    return (
      <main className="screen-shell flow-screen compact-flow">
        <p className="eyebrow">Screen 6a / Target Observation Setup</p>
        <h1>Step 2-A is required first</h1>
        <button type="button" onClick={() => navigate("/screen-5-acquirer-module")}>Open Acquirer Module</button>
      </main>
    );
  }

  return (
    <main className="screen-shell flow-screen">
      <p className="eyebrow">Screen 6a / Target Observation Setup</p>
      <h1>From which position will the Target Observation be completed?</h1>
      <TargetObservationSetupForm
        existingSetup={session.targetObservationSetup?.data ?? {}}
        onValidSubmit={(normalized) => {
          const result = attachTargetObservationSetup(session, normalized);
          setSession(result.session);
          navigate("/screen-6b-target-observation");
          return null;
        }}
      />
    </main>
  );
}

function TargetObservationSetupReceiptScreen() {
  return (
    <main className="target-only-screen">
      <section className="receipt-panel">
        <p className="eyebrow">Screen 6b / Target Observation</p>
        <h1>Thank you. Your Target Observer answers have been received.</h1>
        <p>The original assessment tab is notified automatically when it is still open in this browser. If that tab does not update, return to it and open the authorized survey review.</p>
        <strong>You can close this window.</strong>
      </section>
    </main>
  );
}

function TargetObservationQuestionnaire({ answers, setAnswers, setup, onComplete }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const questions = TARGET_OBSERVATION_DIAGNOSTIC.questions;
  const question = questions[activeIndex];
  const currentAnswer = normalizeEvidenceAnswer(answers[question.id]);
  const selectedAnswer = selectedOptionValue(currentAnswer);
  const currentAnswerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
  const canSubmitQuestion = currentAnswerValidation.valid;

  function updateAnswer(value) {
    setAnswers((current) => updateQuestionnaireSelectedAnswer(current, question, value));
    setError("");
  }

  function updateCurrentEvidenceAnswer(answer) {
    setAnswers((current) => ({ ...current, [question.id]: answer }));
    setError("");
  }

  function submit(event) {
    event.preventDefault();
    if (!selectedAnswer) {
      setError("Select one answer to continue.");
      return;
    }

    const answerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
    if (!answerValidation.valid) {
      const missingText = answerValidation.missing.length ? `Missing: ${answerValidation.missing.join(", ")}.` : "";
      const issueText = answerValidation.consistencyIssues.length ? answerValidation.consistencyIssues.join(" ") : "";
      setError(`${missingText} ${issueText}`.trim());
      return;
    }

    const completedAnswers = { ...answers, [question.id]: answerValidation.normalized };
    setAnswers(completedAnswers);

    if (activeIndex < questions.length - 1) {
      setActiveIndex((index) => index + 1);
      return;
    }

    const score = scoreTargetObservation(completedAnswers);
    if (!score.valid) {
      if (score.invalidClassification?.length > 0) {
        setError("Evidence classification is required for every Target Observation answer.");
        return;
      }
      setError(`${score.missingQuestionIds.length} answer(s) are still required.`);
      return;
    }

    setError("");
    onComplete(completedAnswers, score);
  }

  return (
    <>
      <p className="eyebrow">Screen 6b / Target Observation - Q{activeIndex + 1} of {questions.length} - {publicText(question.section)}</p>
      <h1>{publicText(question.text)}</h1>
      <section className="context-strip" aria-label="Stored observation context">
        <span>{setup.observationPosition}</span>
        <span>{setup.integrationTimeline}</span>
        <span>{setup.respondentContext}</span>
      </section>
      <form className="question-form" onSubmit={submit}>
        <DirectObservationGatePanel
          question={question}
          answer={answers[question.id]}
          onChange={updateCurrentEvidenceAnswer}
        />
        <div className="option-list">
          {question.options.map((option) => (
            <label key={option.value} className="option-row">
              <input
                checked={selectedAnswer === option.value}
                name={question.id}
                onChange={() => updateAnswer(option.value)}
                type="radio"
                value={option.value}
              />
              <span><strong>{option.value}</strong>{publicText(option.text)}</span>
            </label>
          ))}
        </div>
        {selectedAnswer ? (
          <EvidenceClassificationPanel
            answer={answers[question.id]}
            onChange={updateCurrentEvidenceAnswer}
            showDirectObservation={!question.directObservationGate}
          />
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        <QuestionnaireBlockingMessage validation={currentAnswerValidation} />
        <div className="button-row">
          <button className="primary-flow-action" disabled={!canSubmitQuestion} type="submit">
            {activeIndex === questions.length - 1 ? "Submit Target Observation" : "Next"}
          </button>
        </div>
      </form>
    </>
  );
}

function ReadOnlyTargetObservationReview({ session }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const questions = TARGET_OBSERVATION_DIAGNOSTIC.questions;
  const question = questions[activeIndex];
  const observation = session.targetObservation;
  const answers = observation?.answers ?? {};
  const selectedAnswer = selectedOptionValue(answers[question.id]);
  const setup = session.targetObservationSetup?.data
    ?? observation?.outputContext
    ?? {};
  const finalAnswer = activeIndex === questions.length - 1;

  if (!observation?.completed) {
    return (
      <main className="screen-shell flow-screen compact-flow">
        <p className="eyebrow">Screen 6b / Target Observation</p>
        <h1>Authorized survey is not complete yet</h1>
        <p className="lead">The authorized respondent must verify the digital code and submit all Target Observation answers before read-only review opens.</p>
        <button type="button" onClick={() => navigate("/screen-6a-target-observation-setup")}>Open Target Observation Setup</button>
      </main>
    );
  }

  function nextAnswer() {
    setActiveIndex((index) => Math.min(index + 1, questions.length - 1));
  }

  function nextStep() {
    navigate("/screen-9a-target-code-gate");
  }

  return (
    <main className="screen-shell flow-screen question-screen read-only-question-screen">
      <p className="eyebrow">Authorized Target Observation - Q{activeIndex + 1} of {questions.length} - {publicText(question.section)}</p>
      <h1>{publicText(question.text)}</h1>
      <section className="context-strip" aria-label="Stored observation context">
        <span>{setup.observationPosition}</span>
        <span>{setup.integrationTimeline}</span>
        <span>{setup.respondentContext}</span>
      </section>
      <div className="question-form">
        <div className="option-list">
          {question.options.map((option) => {
            const selected = selectedAnswer === option.value;
            return (
              <label key={option.value} className={selected ? "option-row read-only-selected" : "option-row"}>
                <input
                  checked={selected}
                  disabled
                  name={question.id}
                  readOnly
                  type="radio"
                  value={option.value}
                />
                <span><strong>{option.value}</strong>{publicText(option.text)}</span>
              </label>
            );
          })}
        </div>
        <div className="button-row">
          {!finalAnswer ? (
            <button className="primary-flow-action" type="button" onClick={nextAnswer}>Next answer</button>
          ) : (
            <button className="primary-flow-action" type="button" onClick={nextStep}>Next step</button>
          )}
        </div>
      </div>
    </main>
  );
}

function TargetObserverDiagnosticSurvey({ baseSession, onComplete }) {
  const [phase, setPhase] = useState("level1");
  const [sessionSnapshot, setSessionSnapshot] = useState(baseSession);
  const [level1Answers, setLevel1Answers] = useState({});
  const [level2Answers, setLevel2Answers] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const questions = phase === "level1" ? TARGET_DIAGNOSTIC_DATA.level1.questions : TARGET_DIAGNOSTIC_DATA.level2.questions;
  const data = phase === "level1" ? TARGET_DIAGNOSTIC_DATA.level1 : TARGET_DIAGNOSTIC_DATA.level2;
  const answers = phase === "level1" ? level1Answers : level2Answers;
  const setAnswers = phase === "level1" ? setLevel1Answers : setLevel2Answers;
  const question = questions[activeIndex];
  const currentAnswer = normalizeEvidenceAnswer(answers[question.id]);
  const selectedAnswer = selectedOptionValue(currentAnswer);
  const currentAnswerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
  const canSubmitQuestion = currentAnswerValidation.valid;

  function updateAnswer(value) {
    setAnswers((current) => updateQuestionnaireSelectedAnswer(current, question, value));
    setError("");
  }

  function updateCurrentEvidenceAnswer(answer) {
    setAnswers((current) => ({ ...current, [question.id]: answer }));
    setError("");
  }

  function submit(event) {
    event.preventDefault();
    if (!selectedAnswer) {
      setError("Select one answer to continue.");
      return;
    }

    const answerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
    if (!answerValidation.valid) {
      const missingText = answerValidation.missing.length ? `Missing: ${answerValidation.missing.join(", ")}.` : "";
      const issueText = answerValidation.consistencyIssues.length ? answerValidation.consistencyIssues.join(" ") : "";
      setError(`${missingText} ${issueText}`.trim());
      return;
    }

    const completed = { ...answers, [question.id]: answerValidation.normalized };
    setAnswers(completed);

    if (activeIndex < questions.length - 1) {
      setActiveIndex((index) => index + 1);
      return;
    }

    if (phase === "level1") {
      const level1Result = attachTargetDiagnosticLevel1(baseSession, completed);
      if (!level1Result.session.target2B?.level1?.completed) {
        setError("Evidence classification is required for every answer.");
        return;
      }
      if (level1Result.session.target2B.completed) {
        onComplete(level1Result.session.target2B, {
          level1Answers: completed,
          level2Answers: {},
        });
        return;
      }

      setSessionSnapshot(level1Result.session);
      setLevel1Answers(completed);
      setLevel2Answers({});
      setPhase("level2");
      setActiveIndex(0);
      setError("");
      return;
    }

    const level2Result = attachTargetDiagnosticLevel2(sessionSnapshot, completed);
    if (!level2Result.session.target2B?.completed) {
      setError("Evidence classification is required for every answer.");
      return;
    }
    onComplete(level2Result.session.target2B, {
      level1Answers,
      level2Answers: completed,
    });
  }

  return (
    <main className="target-only-screen">
      <section className="target-survey-panel question-screen">
        <p className="eyebrow">Target Observer Diagnostic - {phase === "level1" ? "Level 1" : "Level 2"} - Q{activeIndex + 1} of {questions.length} - {publicText(question.group)}</p>
        <h1>{publicText(question.text)}</h1>
        <p className="source-note">Source: {data.source} / {data.questionCount} {phase === "level1" ? "Level 1" : "Level 2"} questions</p>
        <form className="question-form" onSubmit={submit}>
          <DirectObservationGatePanel
            question={question}
            answer={answers[question.id]}
            onChange={updateCurrentEvidenceAnswer}
          />
          <div className="option-list">
            {question.options.map((option) => (
              <label key={option.value} className="option-row">
                <input
                  checked={selectedAnswer === option.value}
                  name={`${phase}-${question.id}`}
                  onChange={() => updateAnswer(option.value)}
                  type="radio"
                  value={option.value}
                />
                <span><strong>{option.value}</strong>{publicText(option.text)}</span>
              </label>
            ))}
          </div>
          {selectedAnswer ? (
            <EvidenceClassificationPanel
              answer={answers[question.id]}
              onChange={updateCurrentEvidenceAnswer}
              showDirectObservation={!question.directObservationGate}
            />
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <QuestionnaireBlockingMessage validation={currentAnswerValidation} />
          <div className="button-row">
            <button className="primary-flow-action" disabled={!canSubmitQuestion} type="submit">
              {activeIndex === questions.length - 1 ? `Submit ${phase === "level1" ? "Level 1" : "Level 2"}` : "Next"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function AuthorizedTargetObservationSetupScreen({ setSession }) {
  const invite = observationSetupInviteFromLocation();
  const [digitalCode, setDigitalCode] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [setupRecord, setSetupRecord] = useState(null);
  const [targetObservationRecord, setTargetObservationRecord] = useState(null);
  const [answers, setAnswers] = useState({});
  const [receipt, setReceipt] = useState(false);
  const [error, setError] = useState("");

  if (receipt) return <TargetObservationSetupReceiptScreen />;

  if (!invite) {
    return (
      <main className="target-only-screen">
        <section className="receipt-panel">
          <h1>This authorized respondent link is not active.</h1>
          <p>The link may be incomplete, expired, or no longer match the generated code.</p>
          <strong>You can close this window.</strong>
        </section>
      </main>
    );
  }

  function verifyCode(event) {
    event.preventDefault();
    const verification = verifyObservationSetupInvite(invite, digitalCode);
    if (!verification.ok) {
      setError(`Code verification failed: ${verification.status}.`);
      return;
    }
    setError("");
    setVerifiedCode(digitalCode);
    setVerified(true);
  }

  if (!verified) {
    return (
      <main className="target-only-screen">
        <section className="target-code-panel">
          <p className="eyebrow">Authorized Target Observation Survey</p>
          <h1>Enter the 6-digit digital code.</h1>
          <p>The code opens the Target Observation survey for the correct Preliminary Assessment.</p>
          <form className="setup-form" onSubmit={verifyCode}>
            <label className="field-block">
              <span>6-digit code</span>
              <input
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                value={digitalCode}
                onChange={(event) => setDigitalCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="primary-flow-action" disabled={digitalCode.length !== 6} type="submit">Open Target Observation survey</button>
          </form>
        </section>
      </main>
    );
  }

  if (setupRecord?.completed && !targetObservationRecord) {
    return (
      <main className="target-only-screen">
        <section className="target-survey-panel question-screen">
          <TargetObservationQuestionnaire
            answers={answers}
            setAnswers={setAnswers}
            setup={setupRecord.data}
            onComplete={(completedAnswers, score) => {
              const targetObservation = Object.freeze({
                completed: true,
                storedAt: new Date().toISOString(),
                answers: Object.freeze({ ...completedAnswers }),
                classificationValidation: score.classificationValidation,
                score,
                outputContext: Object.freeze({
                  observationPosition: setupRecord.data.observationPosition,
                  respondentContext: setupRecord.data.respondentContext,
                  respondentContextProfile: setupRecord.data.respondentContextProfile ?? null,
                  integrationTimeline: setupRecord.data.integrationTimeline,
                  observedTargetEnvironment: score.topEnvironmentCode,
                  evidenceConfidence: score.evidenceConfidence,
                }),
              });
              setTargetObservationRecord(targetObservation);
            }}
          />
        </section>
      </main>
    );
  }

  if (setupRecord?.completed && targetObservationRecord?.completed) {
    const baseSession = Object.freeze({
      sessionId: invite.assessmentSessionId,
      targetObservationSetup: setupRecord,
      targetObservation: targetObservationRecord,
      target2B: null,
    });

    return (
      <TargetObserverDiagnosticSurvey
        baseSession={baseSession}
        onComplete={(target2B, targetDiagnosticAnswers) => {
          const completion = completeObservationSetupInvite(invite, setupRecord, targetObservationRecord);
          if (completion.ok) {
            const completedInvite = Object.freeze({
              ...completion.invite,
              target2B,
            });
            publishAuthorizedObservationCompletion(completedInvite);
            setSession?.((current) => attachAuthorizedObservationCompletion(current, completedInvite));
            submitAuthorizedObservationCompletion(
              invite,
              verifiedCode,
              setupRecord,
              targetObservationRecord.answers,
              targetDiagnosticAnswers,
            ).then((serverInvite) => {
              if (!serverInvite) return;
              publishAuthorizedObservationCompletion(serverInvite);
              setSession?.((current) => attachAuthorizedObservationCompletion(current, serverInvite));
            });
          }
          setReceipt(true);
        }}
      />
    );
  }

  return (
    <main className="target-only-screen">
      <section className="target-survey-panel">
        <p className="eyebrow">Authorized Target Observation Survey</p>
        <h1>Confirm observation context</h1>
        <TargetObservationSetupForm
          submitLabel="Submit setup answers"
          onValidSubmit={(normalized) => {
            const setup = buildTargetObservationSetupRecord(normalized);
            if (!setup.completed) return { error: "Target Observation setup is incomplete." };

            setSetupRecord(setup);
            fetch("/api/save-target-observation-setup", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                sessionId: invite.assessmentSessionId,
                setup: normalized,
              }),
            }).catch(() => {
              // The survey can continue without this intermediate server save; final submission persists completion.
            });
            return null;
          }}
        />
      </section>
    </main>
  );
}

function TargetObservationScreen({ session, setSession }) {
  const [answers, setAnswers] = useState(session.targetObservation?.answers ?? {});
  const [result, setResult] = useState(session.targetObservation?.score ?? null);
  const readOnlyReview = new URLSearchParams(window.location.search).get("review") === "authorized";

  if (readOnlyReview) {
    return <ReadOnlyTargetObservationReview session={session} />;
  }

  if (!canStartTargetObservation(session)) {
    return (
      <main className="screen-shell flow-screen">
        <p className="eyebrow">Screen 6b / Target Observation</p>
        <h1>Target Observation Setup missing or incomplete</h1>
        <p className="lead">Target Observation is blocked until observation position, respondent context, and evidence collection stage are stored.</p>
        <button type="button" onClick={() => navigate("/screen-6a-target-observation-setup")}>Open Target Observation Setup</button>
      </main>
    );
  }

  const setup = session.targetObservationSetup.data;

  function completeObservation(completedAnswers, score) {
    const outputContext = createTargetObservationOutputContext(session, score);
    const completedObservation = Object.freeze({
      completed: true,
      storedAt: new Date().toISOString(),
      answers: Object.freeze({ ...completedAnswers }),
      classificationValidation: score.classificationValidation,
      score,
      outputContext,
    });

    setSession(Object.freeze({ ...session, targetObservation: completedObservation }));
    setResult(score);
  }

  if (result) {
    return (
      <main className="screen-shell flow-screen compact-flow">
        <p className="eyebrow">Screen 6b / Target Observation</p>
        <h1>Target Observation captured</h1>
        <section className="result-panel">
          <strong>Observed target environment: {aliasFor(result.topEnvironmentCode)}</strong>
          <span>Evidence confidence score: {result.evidenceConfidence}</span>
        </section>
        <button type="button" onClick={() => navigate("/screen-7-step-2b-level-1")}>Continue to Step 2-B</button>
      </main>
    );
  }

  return (
    <main className="screen-shell flow-screen question-screen">
      <TargetObservationQuestionnaire
        answers={answers}
        setAnswers={setAnswers}
        setup={setup}
        onComplete={completeObservation}
      />
    </main>
  );
}

function Step2BLevel1Screen({ session, setSession }) {
  const existingAnswers = session.target2B?.level1?.answers ?? {};
  const [answers, setAnswers] = useState(existingAnswers);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const questions = TARGET_DIAGNOSTIC_DATA.level1.questions;
  const question = questions[activeIndex];
  const currentAnswer = normalizeEvidenceAnswer(answers[question.id]);
  const selectedAnswer = selectedOptionValue(currentAnswer);
  const currentAnswerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
  const canSubmitQuestion = currentAnswerValidation.valid;

  if (!canStartTargetDiagnostic(session)) {
    return (
      <main className="screen-shell flow-screen">
        <p className="eyebrow">Screen 7 / Step 2-B Level 1</p>
        <h1>Target Observation must be complete before Step 2-B</h1>
        <button type="button" onClick={() => navigate("/screen-6b-target-observation")}>Open Target Observation</button>
      </main>
    );
  }

  function updateAnswer(value) {
    setAnswers((current) => updateQuestionnaireSelectedAnswer(current, question, value));
    setError("");
  }

  function updateCurrentEvidenceAnswer(answer) {
    setAnswers((current) => ({ ...current, [question.id]: answer }));
    setError("");
  }

  function nextQuestion(event) {
    event.preventDefault();
    if (!selectedAnswer) {
      setError("Select one answer to continue.");
      return;
    }

    const answerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
    if (!answerValidation.valid) {
      const missingText = answerValidation.missing.length ? `Missing: ${answerValidation.missing.join(", ")}.` : "";
      const issueText = answerValidation.consistencyIssues.length ? answerValidation.consistencyIssues.join(" ") : "";
      setError(`${missingText} ${issueText}`.trim());
      return;
    }

    const normalizedAnswers = { ...answers, [question.id]: answerValidation.normalized };

    if (activeIndex < questions.length - 1) {
      setAnswers(normalizedAnswers);
      setActiveIndex((index) => index + 1);
      return;
    }

    const result = attachTargetDiagnosticLevel1(session, normalizedAnswers);
    if (!result.session.target2B?.level1?.completed) {
      setError("Evidence classification is required for every answer.");
      return;
    }
    setSession(result.session);
    navigate("/screen-8-step-2b-transition");
  }

  return (
    <main className="screen-shell flow-screen question-screen">
      <p className="eyebrow">Step 2-B Level 1 - Q{activeIndex + 1} of {questions.length} - {publicText(question.group)}</p>
      <h1>{publicText(question.text)}</h1>
      <p className="source-note">Source: {TARGET_DIAGNOSTIC_DATA.level1.source} / {TARGET_DIAGNOSTIC_DATA.level1.questionCount} Level 1 questions</p>
      <form className="question-form" onSubmit={nextQuestion}>
        <DirectObservationGatePanel
          question={question}
          answer={answers[question.id]}
          onChange={updateCurrentEvidenceAnswer}
        />
        <div className="option-list">
          {question.options.map((option) => (
            <label key={option.value} className="option-row">
              <input
                checked={selectedAnswer === option.value}
                name={question.id}
                onChange={() => updateAnswer(option.value)}
                type="radio"
                value={option.value}
              />
              <span><strong>{option.value}</strong>{publicText(option.text)}</span>
            </label>
          ))}
        </div>
        {selectedAnswer ? (
          <EvidenceClassificationPanel
            answer={answers[question.id]}
            onChange={updateCurrentEvidenceAnswer}
            showDirectObservation={!question.directObservationGate}
          />
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        <QuestionnaireBlockingMessage validation={currentAnswerValidation} />
        <div className="button-row">
          <button className="primary-flow-action" disabled={!canSubmitQuestion} type="submit">
            {activeIndex === questions.length - 1 ? "Submit Level 1" : "Next"}
          </button>
        </div>
      </form>
    </main>
  );
}

function Step2BTransitionScreen({ session }) {
  const [ready, setReady] = useState(false);
  const level1 = session.target2B?.level1;
  const score = level1?.score;

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!level1?.completed) {
    return (
      <main className="screen-shell flow-screen">
        <p className="eyebrow">Screen 8 / Step 2-B transition</p>
        <h1>Level 1 is not complete</h1>
        <button type="button" onClick={() => navigate("/screen-7-step-2b-level-1")}>Open Level 1</button>
      </main>
    );
  }

  const nextRoute = score.requiresLevel2 ? "/screen-9-step-2b-level-2" : targetDiagnosticCompletionRoute(session);
  const nextLabel = score.requiresLevel2 ? "Continue to Level 2" : targetDiagnosticCompletionLabel(session);

  return (
    <main className="screen-shell flow-screen compact-flow">
      <p className="eyebrow">Screen 8 / Step 2-B transition</p>
      <h1>Calculating environment signature...</h1>
      <section className="result-panel">
        <strong>{aliasFor(score.primaryEnvironmentCode)} - {score.signalBadge}</strong>
        <span>Primary signal score: {score.primarySignalScore}</span>
        <span>Secondary signal: {aliasFor(score.secondaryEnvironmentCode)} - {score.secondarySignalScore}</span>
        <span>{score.requiresLevel2 ? "Level 2 required: weak or co-present Level 1 signal" : "Level 2 not required by current routing rule"}</span>
      </section>
      <button disabled={!ready} type="button" onClick={() => navigate(nextRoute)}>
        {nextLabel}
      </button>
    </main>
  );
}

function Step2BLevel2Screen({ session, setSession }) {
  const existingAnswers = session.target2B?.level2?.answers ?? {};
  const [answers, setAnswers] = useState(existingAnswers);
  const [activeIndex, setActiveIndex] = useState(0);
  const [result, setResult] = useState(session.target2B?.finalScore ?? null);
  const [error, setError] = useState("");
  const questions = TARGET_DIAGNOSTIC_DATA.level2.questions;
  const question = questions[activeIndex];
  const currentAnswer = normalizeEvidenceAnswer(answers[question.id]);
  const selectedAnswer = selectedOptionValue(currentAnswer);
  const currentAnswerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
  const canSubmitQuestion = currentAnswerValidation.valid;

  if (!session.target2B?.level1?.completed) {
    return (
      <main className="screen-shell flow-screen">
        <p className="eyebrow">Screen 9 / Step 2-B Level 2</p>
        <h1>Level 1 is not complete</h1>
        <button type="button" onClick={() => navigate("/screen-7-step-2b-level-1")}>Open Level 1</button>
      </main>
    );
  }

  if (!session.target2B.requiresLevel2) {
    const completionRoute = targetDiagnosticCompletionRoute(session);
    return (
      <main className="screen-shell flow-screen compact-flow">
        <p className="eyebrow">Screen 9 / Step 2-B Level 2</p>
        <h1>Level 2 is not required for this Level 1 signal</h1>
        <button type="button" onClick={() => navigate(completionRoute)}>{targetDiagnosticCompletionLabel(session)}</button>
      </main>
    );
  }

  function updateAnswer(value) {
    setAnswers((current) => updateQuestionnaireSelectedAnswer(current, question, value));
    setError("");
  }

  function updateCurrentEvidenceAnswer(answer) {
    setAnswers((current) => ({ ...current, [question.id]: answer }));
    setError("");
  }

  function nextQuestion(event) {
    event.preventDefault();
    if (!selectedAnswer) {
      setError("Select one answer to continue.");
      return;
    }

    const answerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
    if (!answerValidation.valid) {
      const missingText = answerValidation.missing.length ? `Missing: ${answerValidation.missing.join(", ")}.` : "";
      const issueText = answerValidation.consistencyIssues.length ? answerValidation.consistencyIssues.join(" ") : "";
      setError(`${missingText} ${issueText}`.trim());
      return;
    }

    const normalizedAnswers = { ...answers, [question.id]: answerValidation.normalized };

    if (activeIndex < questions.length - 1) {
      setAnswers(normalizedAnswers);
      setActiveIndex((index) => index + 1);
      return;
    }

    const scored = attachTargetDiagnosticLevel2(session, normalizedAnswers);
    if (!scored.session.target2B?.completed) {
      setError("Evidence classification is required for every answer.");
      return;
    }
    setSession(scored.session);
    setResult(scored.finalScore);
    setError("");
  }

  return (
    <main className="screen-shell flow-screen question-screen">
      <p className="eyebrow">Step 2-B Level 2 - Q{activeIndex + 1} of {questions.length} - {publicText(question.group)}</p>
      <h1>{publicText(question.text)}</h1>
      <p className="source-note">Source: {TARGET_DIAGNOSTIC_DATA.level2.source} / {TARGET_DIAGNOSTIC_DATA.level2.questionCount} Level 2 questions</p>
      <form className="question-form" onSubmit={nextQuestion}>
        <DirectObservationGatePanel
          question={question}
          answer={answers[question.id]}
          onChange={updateCurrentEvidenceAnswer}
        />
        <div className="option-list">
          {question.options.map((option) => (
            <label key={option.value} className="option-row">
              <input
                checked={selectedAnswer === option.value}
                name={question.id}
                onChange={() => updateAnswer(option.value)}
                type="radio"
                value={option.value}
              />
              <span><strong>{option.value}</strong>{publicText(option.text)}</span>
            </label>
          ))}
        </div>
        {selectedAnswer ? (
          <EvidenceClassificationPanel
            answer={answers[question.id]}
            onChange={updateCurrentEvidenceAnswer}
            showDirectObservation={!question.directObservationGate}
          />
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        <QuestionnaireBlockingMessage validation={currentAnswerValidation} />
        {result ? (
          <section className="result-panel">
            <strong>Target environment: {aliasFor(result.primaryEnvironmentCode)} - {result.signalBadge}</strong>
            <span>Primary signal score: {result.primarySignalScore}</span>
            <span>Secondary signal: {aliasFor(result.secondaryEnvironmentCode)} - {result.secondarySignalScore}</span>
            <span>{isStandaloneTargetDiagnosticSession(session) ? "Advisor diagnostic saved for analyst review" : canCreatePreliminaryAssessment({ ...session, target2B: { ...session.target2B, completed: true } }) ? "Ready for Preliminary Assessment" : "Preliminary Assessment remains locked"}</span>
          </section>
        ) : null}
        <div className="button-row">
          <button className="primary-flow-action" disabled={!canSubmitQuestion || Boolean(result)} type="submit">
            {activeIndex === questions.length - 1 ? "Submit Level 2" : "Next"}
          </button>
          {result ? <button type="button" onClick={() => navigate(targetDiagnosticCompletionRoute(session))}>{targetDiagnosticCompletionLabel(session)}</button> : null}
        </div>
      </form>
    </main>
  );
}

function targetSelfFieldLabel(fieldId) {
  if (fieldId.endsWith("OtherSpecify")) {
    const baseFieldId = fieldId.replace(/OtherSpecify$/, "");
    const baseField = TARGET_SELF_ASSESSMENT_DATA.positioningFields.find((field) => field.id === baseFieldId);
    return baseField ? `${baseField.label} - please specify` : fieldId;
  }

  return TARGET_SELF_ASSESSMENT_DATA.positioningFields.find((field) => field.id === fieldId)?.label ?? fieldId;
}

function targetSelfPositioningOptionText(option) {
  if (targetSelfPositioningOptionRequiresSpecify(option)) {
    return "Other - please specify below";
  }

  return publicText(option.text);
}

function TargetReceiptScreen({ invited = false }) {
  return (
    <main className="target-only-screen">
      <section className="receipt-panel">
        <p className="eyebrow">Target Self-Assessment</p>
        <h1>{TARGET_SELF_ASSESSMENT_DATA.receipt.title}</h1>
        <p>{TARGET_SELF_ASSESSMENT_DATA.receipt.body}</p>
        {invited ? <p className="source-note">When the original assessment tab is still open in this browser, it is notified automatically. If that tab does not update, return to it and open Final Deliverables.</p> : null}
        <strong>{TARGET_SELF_ASSESSMENT_DATA.receipt.close}</strong>
      </section>
    </main>
  );
}

function TargetSelfAssessmentSurvey({ session, setSession, invite = null }) {
  const [positioning, setPositioning] = useState({});
  const [answers, setAnswers] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(false);
  const questions = TARGET_SELF_ASSESSMENT_DATA.targetSelfAssessment.questions;
  const question = questions[activeIndex];
  const currentAnswer = normalizeEvidenceAnswer(answers[question.id]);
  const selectedAnswer = selectedOptionValue(currentAnswer);
  const currentAnswerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
  const canSubmitQuestion = currentAnswerValidation.valid;

  if (receipt || invite?.completed || (!invite && session.targetSelfAssessment?.completed)) return <TargetReceiptScreen invited={Boolean(invite)} />;

  function updatePositioning(field, value) {
    const specifyFieldId = targetSelfOtherSpecifyFieldId(field.id);
    const selectedOption = field.options.find((option) => option.value === value);
    setPositioning((current) => ({
      ...current,
      [field.id]: value,
      ...(targetSelfPositioningOptionRequiresSpecify(selectedOption) ? {} : { [specifyFieldId]: "" }),
    }));
    setError("");
  }

  function updatePositioningSpecify(fieldId, value) {
    setPositioning((current) => ({ ...current, [targetSelfOtherSpecifyFieldId(fieldId)]: value }));
    setError("");
  }

  function updateAnswer(value) {
    setAnswers((current) => updateQuestionnaireSelectedAnswer(current, question, value));
    setError("");
  }

  function updateCurrentEvidenceAnswer(answer) {
    setAnswers((current) => ({ ...current, [question.id]: answer }));
    setError("");
  }

  function submit(event) {
    event.preventDefault();
    if (!selectedAnswer) {
      setError("Select one answer to continue.");
      return;
    }

    const answerValidation = validateEvidenceClassifiedAnswer(answers[question.id]);
    if (!answerValidation.valid) {
      const missingText = answerValidation.missing.length ? `Missing: ${answerValidation.missing.join(", ")}.` : "";
      const issueText = answerValidation.consistencyIssues.length ? answerValidation.consistencyIssues.join(" ") : "";
      setError(`${missingText} ${issueText}`.trim());
      return;
    }

    const normalizedAnswers = { ...answers, [question.id]: answerValidation.normalized };

    if (activeIndex === 0) {
      const positioningValidation = validateTargetSelfPositioning(positioning);
      if (!positioningValidation.valid) {
        setError(`Required: ${positioningValidation.missing.map(targetSelfFieldLabel).join(", ")}`);
        return;
      }
    }

    if (activeIndex < questions.length - 1) {
      setAnswers(normalizedAnswers);
      setActiveIndex((index) => index + 1);
      return;
    }

    const completedAnswers = normalizedAnswers;
    const targetSelfAssessment = buildTargetSelfAssessmentRecord(positioning, completedAnswers);
    if (!targetSelfAssessment.completed) {
      if (targetSelfAssessment.missingPositioning.length > 0) {
        setError(`Required: ${targetSelfAssessment.missingPositioning.map(targetSelfFieldLabel).join(", ")}`);
        return;
      }
      if (targetSelfAssessment.invalidClassification?.length > 0) {
        setError("Evidence classification is required for every answer.");
        return;
      }
      setError(`${targetSelfAssessment.missingQuestionIds.length} answer(s) are still required.`);
      return;
    }

    if (invite) {
      const completedInvite = completeTargetInvite(invite, targetSelfAssessment);
      if (!completedInvite.ok) {
        setError("This target survey is no longer active.");
        return;
      }

      publishTargetSelfCompletion(completedInvite.invite);
      setSession(Object.freeze({
        ...session,
        targetInvite: completedInvite.invite,
        targetSelfAssessment,
      }));
    } else {
      setSession(Object.freeze({
        ...session,
        targetSelfAssessment,
        targetSelfDirect: Object.freeze({
          completed: true,
          route: "step-2c-direct",
          completedAt: targetSelfAssessment.submittedAt,
        }),
      }));
    }
    setReceipt(true);
  }

  return (
    <main className="target-only-screen">
      <section className="target-survey-panel">
        <p className="eyebrow">Target Self-Assessment</p>
        <h1>{publicText(question.text)}</h1>
        <p className="source-note">Q{activeIndex + 1} of {questions.length} - {publicText(question.axis)}</p>
        {activeIndex === 0 ? (
          <section className="setup-form target-positioning" aria-label="Target respondent positioning">
            {TARGET_SELF_ASSESSMENT_DATA.positioningFields.map((field) => (
              <label className="field-block" key={field.id}>
                <span>{field.label}</span>
                <select value={positioning[field.id] ?? ""} onChange={(event) => updatePositioning(field, event.target.value)}>
                  <option value="">Select</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>{targetSelfPositioningOptionText(option)}</option>
                  ))}
                </select>
                {targetSelfPositioningOptionRequiresSpecify(field.options.find((option) => option.value === positioning[field.id])) ? (
                  <input
                    onChange={(event) => updatePositioningSpecify(field.id, event.target.value)}
                    placeholder="Please specify"
                    type="text"
                    value={positioning[targetSelfOtherSpecifyFieldId(field.id)] ?? ""}
                  />
                ) : null}
              </label>
            ))}
          </section>
        ) : null}
        <form className="question-form" onSubmit={submit}>
          <DirectObservationGatePanel
            question={question}
            answer={answers[question.id]}
            onChange={updateCurrentEvidenceAnswer}
          />
          <div className="option-list">
            {question.options.map((option) => (
              <label key={option.value} className="option-row">
                <input
                  checked={selectedAnswer === option.value}
                  name={question.id}
                  onChange={() => updateAnswer(option.value)}
                  type="radio"
                  value={option.value}
                />
                <span><strong>{option.value}</strong>{publicText(option.text)}</span>
              </label>
            ))}
          </div>
          {selectedAnswer ? (
            <EvidenceClassificationPanel
              answer={answers[question.id]}
              onChange={updateCurrentEvidenceAnswer}
              showDirectObservation={!question.directObservationGate}
            />
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <QuestionnaireBlockingMessage validation={currentAnswerValidation} />
          <div className="button-row">
            <button className="primary-flow-action" disabled={!canSubmitQuestion} type="submit">
              {activeIndex === questions.length - 1 ? "Submit Target Self-Assessment" : "Next"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function TargetSelfAssessmentDirectScreen({ session, setSession }) {
  const respondentSide = session.dealContext?.data?.respondentSide;

  if (!session.dealContext?.completed || respondentSide !== "target") {
    return (
      <main className="target-only-screen">
        <section className="receipt-panel">
          <p className="eyebrow">Step 2-C / Target Self-Assessment</p>
          <h1>Target respondent context is required first.</h1>
          <p>Open Step 1 and select Target as the respondent side before starting the Target Self-Assessment.</p>
          <button type="button" onClick={() => navigate("/start-diagnostic/deal-context")}>Open Deal Context</button>
        </section>
      </main>
    );
  }

  if (!isTargetSelfAssessmentSourceLoaded()) {
    return (
      <main className="target-only-screen">
        <section className="receipt-panel">
          <h1>Target survey is temporarily unavailable.</h1>
          <p>You can close this page.</p>
        </section>
      </main>
    );
  }

  return <TargetSelfAssessmentSurvey session={session} setSession={setSession} />;
}

function TargetCodeEntryScreen({ session, setSession, targetSessionId }) {
  const linkInvite = targetInviteFromLocation();
  const invite = session.targetInvite?.targetSessionId === targetSessionId ? session.targetInvite : linkInvite;
  const [digitalCode, setDigitalCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  if (!isTargetSelfAssessmentSourceLoaded()) {
    return (
      <main className="target-only-screen">
        <section className="receipt-panel">
          <h1>Target survey is temporarily unavailable.</h1>
          <p>You can close this page.</p>
        </section>
      </main>
    );
  }

  if (!invite) {
    return (
      <main className="target-only-screen">
        <section className="receipt-panel">
          <h1>This target survey link is not active.</h1>
          <p>The assessment may have been reset or the link may not match an active report.</p>
          <strong>You can close this page.</strong>
        </section>
      </main>
    );
  }

  if (invite.completed) return <TargetReceiptScreen invited />;
  if (verified) return <TargetSelfAssessmentSurvey invite={invite} session={session} setSession={setSession} />;

  function submit(event) {
    event.preventDefault();
    const verification = verifyTargetInvite(invite, digitalCode);
    if (!verification.ok) {
      setError(`Code verification failed: ${verification.status}.`);
      return;
    }
    setError("");
    setVerified(true);
  }

  return (
    <main className="target-only-screen">
      <section className="target-code-panel">
        <p className="eyebrow">Target Survey Access</p>
        <h1>Enter the 6-digit digital code.</h1>
        <p>The code connects your responses to the correct acquirer report.</p>
        <form className="setup-form" onSubmit={submit}>
          <label className="field-block">
            <span>6-digit code</span>
            <input
              inputMode="numeric"
              maxLength={6}
              pattern="[0-9]{6}"
              value={digitalCode}
              onChange={(event) => setDigitalCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit">Open Target Self-Assessment</button>
        </form>
      </section>
    </main>
  );
}

function optionTitle(options, value) {
  return options.find((option) => option.value === value)?.title ?? value ?? "Pending";
}

function optionLabel(options, value, fallback = "Pending") {
  const match = options.find((option) => option.value === value);
  return match?.label ?? match?.title ?? value ?? fallback;
}

function transactionDetailTitle(fieldId, value) {
  const section = TRANSACTION_DETAIL_SECTIONS.find((item) => item.id === fieldId);
  return optionTitle(section?.options ?? [], value);
}

function answerSummaryValue(value) {
  if (value && typeof value === "object") {
    const selected = selectedOptionValue(value);
    const evidence = value.evidenceType ? `/${value.evidenceType}` : "";
    const confidence = value.confidence ? `/${value.confidence}` : "";
    return `${selected}${evidence}${confidence}`;
  }
  return String(value ?? "");
}

function answerSummary(answers = {}, limit = 12) {
  const entries = Object.entries(answers)
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
    .slice(0, limit)
    .map(([id, value]) => `${id}: ${answerSummaryValue(value)}`);
  return entries.length > 0 ? entries.join(" · ") : "Pending";
}

function scoreAlias(score, fallback = "Pending") {
  const code = score?.primaryEnvironmentCode ?? score?.topEnvironmentCode;
  return code ? aliasFor(code) : fallback;
}

function scoreBadge(score) {
  if (score?.signalBadge) return score.signalBadge;
  if (score?.signalStrength) return score.signalStrength;
  if (Number.isFinite(score?.evidenceConfidence)) return `Evidence ${score.evidenceConfidence}`;
  return "Pending";
}

function answeredCount(record, total) {
  const score = record?.score ?? record;
  const count = score?.answeredQuestionCount ?? (record?.answers ? Object.keys(record.answers).length : 0);
  return `${count}/${total} answered`;
}

function SignalCard({ title, score, answers, count, meta, pending }) {
  return (
    <article className="prelim-signal-card">
      <span>{title}</span>
      <strong>{pending ? "Pending" : scoreAlias(score)}</strong>
      <em>{pending ? "Awaiting Target Self-Assessment" : scoreBadge(score)}</em>
      <small>{pending ? "Link and digital code below" : count}</small>
      {meta ? <p>{meta}</p> : null}
      <code>{pending ? "Target respondent not submitted yet" : answerSummary(answers)}</code>
    </article>
  );
}

function comparisonStatus(leftCode, rightCode, pendingLabel = "Pending") {
  if (!rightCode) return pendingLabel;
  return leftCode === rightCode ? "Alignment" : "Divergence";
}

const CONTRADICTION_TYPE_LABELS = Object.freeze({
  acquirer_target_disagreement: "Acquirer/target disagreement",
  target_observed_self_divergence: "Observed/self divergence",
  target_observed_diagnostic_divergence: "Observed/diagnostic divergence",
  target_diagnostic_self_divergence: "Diagnostic/self divergence",
  low_confidence_primary_signal: "Low-confidence signal",
  indirect_answers_driving_score: "Indirect score basis",
  reliability_flag_concentration: "Reliability concentration",
  no_direct_knowledge_concentration: "No direct knowledge",
  evidence_basis_mismatch: "Evidence mismatch",
});

function contradictionTypeLabel(type) {
  return CONTRADICTION_TYPE_LABELS[type] ?? "Analyst review";
}

function contradictionSeverityLabel(severity) {
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  return "Low";
}

function percentMetric(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0%";
  return `${Math.round(numeric * 100)}%`;
}

function findingSignalLine(finding) {
  if (!finding.leftSignalCode && !finding.rightSignalCode) return "";
  const left = finding.leftSignalCode ? `${finding.leftSource}: ${aliasFor(finding.leftSignalCode)}` : "";
  const right = finding.rightSignalCode ? `${finding.rightSource}: ${aliasFor(finding.rightSignalCode)}` : "";
  return [left, right].filter(Boolean).join(" / ");
}

function findingMetricLine(finding) {
  const metrics = finding.metrics ?? {};
  if (Number.isFinite(metrics.reliabilityFlagRate)) {
    return `Reliability flags: ${percentMetric(metrics.reliabilityFlagRate)} of answered items.`;
  }
  if (Number.isFinite(metrics.noDirectKnowledgeRate)) {
    return `No-direct-knowledge answers: ${percentMetric(metrics.noDirectKnowledgeRate)} of answered items.`;
  }
  if (Number.isFinite(metrics.indirectDrivingRate)) {
    return `Indirect score basis: ${percentMetric(metrics.indirectDrivingRate)} of score-driving items.`;
  }
  if (Number.isFinite(metrics.highRiskMismatchRate)) {
    return `Evidence-basis mismatch: ${percentMetric(metrics.highRiskMismatchRate)} of answered items.`;
  }
  if (metrics.confidence) {
    return `Confidence: ${metrics.confidence}.`;
  }
  return "";
}

function buildContradictionReportForSession(session) {
  return buildContradictionReport(session, {
    generatedAt: session?.preliminaryAssessment?.contradictionReport?.generatedAt
      ?? session?.preliminaryAssessment?.createdAt
      ?? new Date().toISOString(),
  });
}

function buildTriageReportForSession(session) {
  const contradictionReport = buildContradictionReportForSession(session);
  return buildTriageReport(session, {
    generatedAt: session?.preliminaryAssessment?.triageReport?.generatedAt
      ?? session?.preliminaryAssessment?.createdAt
      ?? new Date().toISOString(),
    contradictionReport,
  });
}

function triageTierLabel(tier) {
  if (!tier) return "Pending";
  return String(tier).toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function triageCheckLabel(status) {
  if (status === "pass") return "Pass";
  if (status === "fail") return "Fail";
  if (status === "review_required") return "Review";
  return "Unknown";
}

const ANALYST_STATUS_LABELS = Object.freeze({
  pending_review: "Pending review",
  confirmed: "Confirmed",
  overridden: "Overridden",
  follow_up_required: "Follow-up required",
  not_material: "Not material",
});

const ANALYST_CONFIDENCE_LABELS = Object.freeze({
  high: "High",
  medium: "Medium",
  low: "Low",
  cannot_determine: "Cannot determine",
});

function analystStatusLabel(value) {
  return ANALYST_STATUS_LABELS[value] ?? "Pending review";
}

function analystSeverityLabel(value) {
  return contradictionSeverityLabel(value);
}

function analystConfidenceLabel(value) {
  return ANALYST_CONFIDENCE_LABELS[value] ?? "Medium";
}

function analystWorksheetForSession(session) {
  return buildAnalystWorksheet(session, session?.analystWorksheet, {
    generatedAt: session?.analystWorksheet?.generatedAt
      ?? session?.preliminaryAssessment?.contradictionReport?.generatedAt
      ?? session?.preliminaryAssessment?.createdAt
      ?? new Date().toISOString(),
  });
}

function riskOutputReportForSession(session) {
  return buildRiskOutputReport(session, {
    generatedAt: session?.analystWorksheet?.updatedAt
      ?? session?.analystWorksheet?.generatedAt
      ?? session?.preliminaryAssessment?.createdAt
      ?? new Date().toISOString(),
  });
}

function finalReportStructureForSession(session, deliverable) {
  return buildFinalReportStructure(session, deliverable, {
    generatedAt: session?.reportDelivery?.generatedAt
      ?? session?.analystWorksheet?.updatedAt
      ?? session?.preliminaryAssessment?.createdAt
      ?? new Date().toISOString(),
  });
}

function hasUnverifiedWeakAcquirerSignal(session) {
  return requiresAcquirerVerification(session) && !isAcquirerVerificationComplete(session);
}

function PreliminaryAssessmentReport({ session }) {
  const dealContext = session.dealContext?.data ?? {};
  const acquirer = session.acquirer2A;
  const observation = session.targetObservation;
  const target2B = session.target2B;
  const targetSelf = session.targetSelfAssessment;
  const targetSelfReady = Boolean(targetSelf?.completed);
  const targetScore = targetSelfReady ? targetSelf.score : target2B?.finalScore;
  const deliverable = buildPairDeliverable({
    acquirerEnvironmentCode: acquirer?.score?.primaryEnvironmentCode,
    acquirerSecondaryEnvironmentCode: acquirer?.score?.secondaryEnvironmentCode,
    acquirerSignalStrength: acquirer?.score?.signalStrength,
    acquirerCoPresence: acquirer?.score?.coPresence,
    targetEnvironmentCode: targetScore?.primaryEnvironmentCode,
    targetSecondaryEnvironmentCode: targetScore?.secondaryEnvironmentCode,
    targetSignalStrength: targetScore?.signalStrength,
    targetCoPresence: targetScore?.coPresence,
  });
  const acquirerAlias = scoreAlias(acquirer?.score);
  const acquirerRespondentCount = acquirer?.score?.respondentCount ?? 1;
  const acquirerQuestionTotal = acquirerRespondentCount * ACQUIRER_TRACK_DATA.acquirerModule.questionCount;
  const lowerAcquirerAccuracy = hasUnverifiedWeakAcquirerSignal(session);
  const acquirerScoreBasis = acquirer?.score?.verificationIncluded
    ? "Merged acquirer signal from two authorized acquirer respondents"
    : lowerAcquirerAccuracy
      ? "Single acquirer respondent signal with weak or co-present result; poor estimation accuracy until optional acquirer verification is completed"
    : "Single acquirer respondent signal";
  const observedAlias = scoreAlias(observation?.score);
  const targetCurrentAlias = scoreAlias(target2B?.finalScore);
  const formalTargetAlias = targetSelfReady ? scoreAlias(targetSelf.score) : "Pending";
  const motive = optionTitle(ACQUISITION_MOTIVE_OPTIONS, dealContext.acquisitionMotive);
  const dealType = optionTitle(DEAL_TYPE_OPTIONS, dealContext.dealType);
  const respondentSide = optionTitle(RESPONDENT_SIDE_OPTIONS, dealContext.respondentSide);
  const respondentRole = optionTitle(RESPONDENT_ROLE_OPTIONS, dealContext.respondentRole);
  const respondentSeniority = optionTitle(RESPONDENT_SENIORITY_OPTIONS, dealContext.respondentSeniority);
  const respondentFunction = optionTitle(RESPONDENT_FUNCTION_OPTIONS, dealContext.respondentFunction);
  const respondentAccessLevel = optionTitle(RESPONDENT_ACCESS_LEVEL_OPTIONS, dealContext.respondentAccessLevel);
  const integrationTimeline = transactionDetailTitle("integrationTimeline", dealContext.integrationTimeline);
  const transactionRole = transactionDetailTitle("transactionRole", dealContext.transactionRole);
  const firmTenure = transactionDetailTitle("firmTenure", dealContext.firmTenure);
  const narrativeText = deliverable.narrative?.situation ?? deliverable.body ?? "Preliminary compatibility is based on the current acquirer and target signals.";
  const nextStepText = targetSelfReady
    ? "Target Self-Assessment is complete. Review final deliverables and paid implementation options."
    : "Target Self-Assessment is not complete. Send the target respondent link and digital code below, then review the final report after submission.";
  const resourceConflictProfile = deliverable.resourceConflictProfile;
  const highConflictRows = (resourceConflictProfile?.highProbabilityConflicts ?? []).slice(0, 4);
  const contradictionReport = buildContradictionReportForSession(session);
  const contradictionFindings = contradictionReport.findings.slice(0, 6);
  const contradictionSummary = contradictionReport.summary;
  const triageReport = buildTriageReportForSession(session);
  const triageTriggers = triageReport.triggers.slice(0, 6);
  const triageChecks = triageReport.accuracyChecks ?? [];
  const contradictionSummaryLabel = contradictionSummary.highSeverityCount > 0
    ? `${contradictionSummary.highSeverityCount} high-risk finding${contradictionSummary.highSeverityCount === 1 ? "" : "s"}`
    : `${contradictionSummary.findingCount} finding${contradictionSummary.findingCount === 1 ? "" : "s"}`;

  return (
    <section className="prelim-report" aria-label="Preliminary Assessment report">
      <header className="prelim-report-header">
        <p className="eyebrow">Preliminary Assessment</p>
        <h2>Acquirer and Target Observation</h2>
        <p>This report combines the acquirer's self-observation, the Target Observer signal, and the current target diagnostic signal.</p>
      </header>

      <div className="prelim-signal-grid">
        <SignalCard title="Acquirer self-observation" score={acquirer?.score} answers={acquirer?.answers} count={answeredCount(acquirer, acquirerQuestionTotal)} meta={acquirerScoreBasis} />
        <SignalCard title="Integration destination" score={acquirer?.score} answers={acquirer?.answers} count={answeredCount(acquirer, acquirerQuestionTotal)} meta={integrationTimeline} />
        <SignalCard
          title="Target observed by acquirer"
          score={observation?.score}
          answers={observation?.answers}
          count={answeredCount(observation, 22)}
          meta={observation?.outputContext?.observationPosition}
        />
        <SignalCard
          title="Target current diagnostic L1"
          score={target2B?.level1?.score}
          answers={target2B?.level1?.answers}
          count={answeredCount(target2B?.level1, 12)}
        />
        <SignalCard
          title={target2B?.requiresLevel2 ? "Target current diagnostic L2" : "Target current diagnostic final"}
          score={target2B?.requiresLevel2 ? target2B?.level2?.score : target2B?.finalScore}
          answers={target2B?.requiresLevel2 ? target2B?.level2?.answers : target2B?.level1?.answers}
          count={target2B?.requiresLevel2 ? answeredCount(target2B?.level2, 10) : answeredCount(target2B?.level1, 12)}
          meta={target2B?.requiresLevel2 ? "Level 2 required by weak or co-present Level 1 signal" : "Level 2 not required"}
        />
        <SignalCard
          title="Formal Target Environment Diagnostic"
          score={targetSelf?.score}
          answers={targetSelf?.answers}
          count={answeredCount(targetSelf, 10)}
          pending={!targetSelfReady}
        />
      </div>

      <section className="prelim-section">
        <div className="prelim-section-title">
          <h3>Executive snapshot</h3>
          <span>{targetSelfReady ? "Target self-assessment received" : "Target self-assessment pending"}</span>
        </div>
        <p><strong>Deal:</strong> {dealContext.acquirerName ?? "Acquirer pending"} acquiring {dealContext.targetName ?? "target pending"}.</p>
        <p><strong>Deal type:</strong> {dealType}. <strong>Respondent:</strong> {respondentSide}; {respondentRole}; {respondentSeniority}; {respondentFunction}; {respondentAccessLevel}.</p>
        <p><strong>Acquisition motive:</strong> {motive}. The preliminary read is based on the buyer's current operating environment and target-side evidence.</p>
        <p><strong>Acquirer environment:</strong> {acquirerAlias}.</p>
        <p><strong>Acquirer score basis:</strong> {acquirerScoreBasis}. This is the acquirer environment used in the compatibility calculation against the Target environment.</p>
        {lowerAcquirerAccuracy ? (
          <p><strong>Estimation accuracy:</strong> Poorer than verified because the acquirer environment is still based on a weak single-respondent signal. The final report remains usable, but the acquirer-side interpretation should be treated as preliminary until a second acquirer response is merged.</p>
        ) : null}
        <p><strong>Target observed environment:</strong> {observedAlias}.</p>
        <p><strong>Target current diagnostic:</strong> {targetCurrentAlias}.</p>
        <p><strong>Formal target environment:</strong> {formalTargetAlias}.</p>
        <p><strong>Respondent context:</strong> {transactionRole}; {firmTenure}; {observation?.outputContext?.respondentContext ?? "Target observer context pending"}.</p>
      </section>

      <section className="prelim-section">
        <div className="prelim-section-title">
          <h3>Target reconciliation</h3>
          <span>{comparisonStatus(target2B?.finalScore?.primaryEnvironmentCode, targetSelf?.score?.primaryEnvironmentCode, "Self-description pending")}</span>
        </div>
        <div className="prelim-reconciliation-grid">
          <div><span>Observed target</span><strong>{observedAlias}</strong><em>{comparisonStatus(observation?.score?.topEnvironmentCode, target2B?.finalScore?.primaryEnvironmentCode)}</em></div>
          <div><span>Target current</span><strong>{targetCurrentAlias}</strong><em>Observer diagnostic</em></div>
          <div><span>Formal target</span><strong>{formalTargetAlias}</strong><em>{targetSelfReady ? "Target self-description" : "Awaiting response"}</em></div>
        </div>
      </section>

      <section className="prelim-section triage-section">
        <div className="prelim-section-title">
          <h3>Triage routing</h3>
          <span>{publicReportText(triageReport.routing.label)}</span>
        </div>
        <div className="triage-summary-grid">
          <div>
            <span>Effective tier</span>
            <strong>{triageTierLabel(triageReport.effectiveTier)}</strong>
          </div>
          <div>
            <span>Reliability tier</span>
            <strong>{triageTierLabel(triageReport.reliabilityTier)}</strong>
          </div>
          <div>
            <span>Contradiction tier</span>
            <strong>{triageTierLabel(triageReport.contradictionTier)}</strong>
          </div>
          <div>
            <span>Report gate</span>
            <strong>{publicReportText(triageReport.routing.gateLabel)}</strong>
          </div>
        </div>
        <p><strong>Instrument action:</strong> {publicReportText(triageReport.instrumentAction)}</p>
        {triageTriggers.length > 0 ? (
          <div className="triage-trigger-grid">
            {triageTriggers.map((trigger) => (
              <article className={`triage-trigger-card severity-${trigger.severity}`} key={trigger.id}>
                <span>{triageTierLabel(trigger.severity)}</span>
                <strong>{publicReportText(trigger.label)}</strong>
                <p>{publicReportText(trigger.meaning)}</p>
                <small>{publicReportText(trigger.action)}</small>
              </article>
            ))}
          </div>
        ) : (
          <p>No formal triage trigger is active. The case still proceeds through analyst review because final interpretation must not be based on raw questionnaire answers alone.</p>
        )}
        <div className="triage-check-grid">
          {triageChecks.map((check) => (
            <div className={`triage-check ${check.status}`} key={check.id}>
              <span>{triageCheckLabel(check.status)}</span>
              <strong>{check.label}</strong>
              <p>{publicReportText(check.result)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="prelim-section">
        <div className="prelim-section-title">
          <h3>Contradiction review</h3>
          <span>{contradictionSummary.findingCount > 0 ? contradictionSummaryLabel : "No material contradiction"}</span>
        </div>
        <div className="contradiction-summary-grid">
          <div>
            <span>Contradictions</span>
            <strong>{contradictionSummary.contradictionCount}</strong>
          </div>
          <div>
            <span>Reliability risks</span>
            <strong>{contradictionSummary.reliabilityRiskCount}</strong>
          </div>
          <div>
            <span>Evidence gaps</span>
            <strong>{contradictionSummary.missingEvidenceCount}</strong>
          </div>
        </div>
        {contradictionFindings.length > 0 ? (
          <div className="contradiction-grid">
            {contradictionFindings.map((finding) => {
              const signalLine = findingSignalLine(finding);
              const metricLine = findingMetricLine(finding);
              return (
                <article className={`contradiction-card severity-${finding.severity}`} key={finding.id}>
                  <span>{contradictionSeverityLabel(finding.severity)} / {contradictionTypeLabel(finding.type)}</span>
                  <strong>{publicReportText(finding.title)}</strong>
                  <p>{publicReportText(finding.explanation)}</p>
                  {signalLine ? <small>{signalLine}</small> : null}
                  {metricLine ? <small>{metricLine}</small> : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p>No material contradiction is detected in the submitted evidence. This does not mean there is no deal risk; it means the current role-specific evidence has not produced a visible disagreement or reliability threshold breach.</p>
        )}
      </section>

      <section className="prelim-section">
        <div className="prelim-section-title">
          <h3>FinECS engine</h3>
          <span>{deliverable.ready ? publicText(deliverable.riskBand) : "Pending"}</span>
        </div>
        <div className="prelim-engine-grid">
          <div><span>Acquirer current</span><strong>{acquirerAlias}</strong></div>
          <div><span>Target current</span><strong>{targetCurrentAlias}</strong></div>
          <div><span>Observed target</span><strong>{observedAlias}</strong></div>
          <div><span>Formal target</span><strong>{formalTargetAlias}</strong></div>
        </div>
      </section>

      {deliverable.ready ? (
        <section className="prelim-section prelim-ecs-output">
          <div className="prelim-section-title">
            <h3>Resource Hierarchy Output</h3>
            <span>ECS {deliverable.compatibilityScore ?? deliverable.compatibilityRange}</span>
          </div>
          {resourceConflictProfile ? (
            <div className="resource-conflict-panel">
              <div className="resource-conflict-summary">
                <strong>High-probability resource conflict types</strong>
                <p>When a resource appears in this conflict zone, it marks a resource that is likely to create operational friction after close unless it is explicitly protected, governed, or sequenced during integration.</p>
              </div>
              {highConflictRows.length > 0 ? (
                <div className="resource-conflict-table" role="table" aria-label="High-probability resource conflicts">
                  <div className="resource-conflict-row resource-conflict-head" role="row">
                    <span role="columnheader">Resource type</span>
                    <span role="columnheader">Potential risks</span>
                  </div>
                  {highConflictRows.map((row) => (
                    <div className="resource-conflict-row" role="row" key={row.resource}>
                      <div role="cell">
                        <strong>{row.resource}</strong>
                        <small>{row.resourceTypeLabel}</small>
                      </div>
                      <p role="cell">{publicReportText(row.potentialRisk)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No high-probability resource conflict was detected across the 17-resource scan for this environment pair.</p>
              )}
              <div className="resource-analysis-conclusion" aria-label="Resource analysis conclusion">
                <strong>Verified conclusion</strong>
                {(resourceConflictProfile.conclusion ?? []).map((sentence) => (
                  <p key={sentence}>{publicText(sentence)}</p>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="prelim-section">
        <div className="prelim-section-title">
          <h3>Client output report</h3>
          <span>Confidence {observation?.score?.evidenceConfidence ?? "pending"}</span>
        </div>
        <div className="client-output-stack">
          <article>
            <strong>Diagnostic summary</strong>
            <p>Your organization is currently reading the target through {observedAlias}; the structured target diagnostic indicates {targetCurrentAlias}.</p>
          </article>
          <article>
            <strong>Narrative output</strong>
            <PublicReportParagraphs text={narrativeText} />
          </article>
          <article>
            <strong>Integration friction timeline</strong>
            <div className="anchor-list compact-anchors">
              {(deliverable.anchors ?? []).map((anchor) => (
                <article key={anchor.label}>
                  <strong>{anchor.label}</strong>
                  <p>{publicReportText(anchor.text)}</p>
                </article>
              ))}
            </div>
          </article>
          <article>
            <strong>Confidence and caveats</strong>
            <p>{publicReportText(deliverable.caveat ?? "This is a preliminary signal; final scoring requires target self-description and paid validation.")}</p>
          </article>
          <article>
            <strong>Recommended action</strong>
            <p>{publicReportText(nextStepText)}</p>
          </article>
        </div>
      </section>
    </section>
  );
}

const EMPTY_EVIDENCE_FORM = Object.freeze({
  title: "",
  itemType: "document",
  documentType: "org_chart",
  sourceParty: "target",
  storageReference: "",
  producedDate: "",
  reviewStatus: "unreviewed",
  confidence: "medium",
  relationship: "context",
  analystExtract: "",
  documentName: "",
  documentSize: null,
  relevantRiskCategories: Object.freeze([]),
  relatedFindingIds: Object.freeze([]),
});

function EvidenceCapturePanel({ session, setSession }) {
  const [form, setForm] = useState(EMPTY_EVIDENCE_FORM);
  const [error, setError] = useState("");
  const evidenceItems = evidenceItemsFromSession(session);
  const evidenceCoverage = buildEvidenceCoverage(session);
  const contradictionFindings = buildContradictionReportForSession(session).findings;

  function updateForm(fieldId, value) {
    setForm((current) => ({ ...current, [fieldId]: value }));
    setError("");
  }

  function toggleRiskCategory(category) {
    setForm((current) => {
      const currentCategories = current.relevantRiskCategories ?? [];
      const relevantRiskCategories = currentCategories.includes(category)
        ? currentCategories.filter((item) => item !== category)
        : [...currentCategories, category];
      return { ...current, relevantRiskCategories };
    });
    setError("");
  }

  function updateDocumentMetadata(event) {
    const document = event.target.files?.[0];
    if (!document) return;
    setForm((current) => ({
      ...current,
      documentName: document.name,
      documentSize: document.size,
      storageReference: current.storageReference || document.name,
    }));
  }

  function submitEvidence(event) {
    event.preventDefault();
    const result = attachEvidenceItem(session, form);
    if (!result.ok) {
      setError(`Required: ${result.validation.missing.join(", ")}`);
      return;
    }
    setSession(result.session);
    setForm(EMPTY_EVIDENCE_FORM);
    setError("");
  }

  function updateEvidenceStatus(item, reviewStatus) {
    const result = attachEvidenceItem(session, { ...item, reviewStatus });
    if (result.ok) setSession(result.session);
  }

  function removeEvidence(itemId) {
    setSession(removeEvidenceItem(session, itemId).session);
  }

  function linkedFindingTitle(item) {
    const findingId = item.relatedFindingIds?.[0];
    if (!findingId) return "No linked finding";
    return contradictionFindings.find((finding) => finding.id === findingId)?.title ?? "Linked finding recorded";
  }

  return (
    <section className="prelim-section evidence-capture-section">
      <div className="prelim-section-title">
        <h3>Evidence capture</h3>
        <span>{evidenceCoverage.totalCount} item{evidenceCoverage.totalCount === 1 ? "" : "s"}</span>
      </div>
      <div className="evidence-purpose-panel">
        <strong>Why this matters</strong>
        <p>
          Respondent answers are behavioral evidence, not deal facts. This layer attaches answers to documents,
          interview notes, review status, and analyst confidence so contradictions can be tested instead of averaged away.
        </p>
      </div>
      <div className="evidence-summary-grid">
        <div>
          <span>Verified</span>
          <strong>{evidenceCoverage.verifiedCount}</strong>
        </div>
        <div>
          <span>Disputed</span>
          <strong>{evidenceCoverage.disputedCount}</strong>
        </div>
        <div>
          <span>Linked findings</span>
          <strong>{evidenceCoverage.linkedFindingCount}</strong>
        </div>
        <div>
          <span>Risk categories</span>
          <strong>{evidenceCoverage.riskCategoriesCovered.length}</strong>
        </div>
      </div>
      <p>{publicReportText(evidenceCoverage.coverageNote)}</p>

      <form className="evidence-form" onSubmit={submitEvidence}>
        <div className="evidence-form-grid">
          <label>
            <span>Evidence title</span>
            <small>Use a short name that an analyst can recognize later.</small>
            <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Org chart, retention plan, interview note..." />
          </label>
          <label>
            <span>Evidence type</span>
            <small>Classify the format so the report separates documents, interviews, records, and other evidence.</small>
            <select value={form.itemType} onChange={(event) => updateForm("itemType", event.target.value)}>
              {EVIDENCE_ITEM_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Document class</span>
            <small>Identify what the item proves or contextualizes in diligence.</small>
            <select value={form.documentType} onChange={(event) => updateForm("documentType", event.target.value)}>
              {EVIDENCE_DOCUMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Produced by</span>
            <small>Mark whose perspective or records created the item.</small>
            <select value={form.sourceParty} onChange={(event) => updateForm("sourceParty", event.target.value)}>
              {EVIDENCE_SOURCE_PARTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Reference path or location</span>
            <small>Enter a deal-room path, meeting note reference, or URL so the item can be found again.</small>
            <input value={form.storageReference} onChange={(event) => updateForm("storageReference", event.target.value)} placeholder="Data room path, meeting note ID, public URL..." />
          </label>
          <label>
            <span>Produced date</span>
            <small>Optional, but useful for detecting stale or pre-close evidence.</small>
            <input type="date" value={form.producedDate} onChange={(event) => updateForm("producedDate", event.target.value)} />
          </label>
          <label>
            <span>Review status</span>
            <small>Show whether the item is accepted, disputed, still pending, or not yet reviewed.</small>
            <select value={form.reviewStatus} onChange={(event) => updateForm("reviewStatus", event.target.value)}>
              {EVIDENCE_REVIEW_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Confidence</span>
            <small>Rate how strongly this item can support interpretation.</small>
            <select value={form.confidence} onChange={(event) => updateForm("confidence", event.target.value)}>
              {EVIDENCE_CONFIDENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Evidence relationship</span>
            <small>Specify whether the item supports, contradicts, contextualizes, or requires follow-up.</small>
            <select value={form.relationship} onChange={(event) => updateForm("relationship", event.target.value)}>
              {EVIDENCE_RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Link to finding</span>
            <small>Attach the item to a contradiction or reliability finding when it explains the issue.</small>
            <select
              value={form.relatedFindingIds[0] ?? ""}
              onChange={(event) => updateForm("relatedFindingIds", event.target.value ? [event.target.value] : [])}
            >
              <option value="">No linked finding</option>
              {contradictionFindings.map((finding) => (
                <option key={finding.id} value={finding.id}>{publicReportText(finding.title)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Document metadata</span>
            <small>Optional file selector; the app stores the file name as metadata only.</small>
            <input type="file" onChange={updateDocumentMetadata} />
          </label>
        </div>

        <label className="evidence-summary-field">
          <span>Analyst extract</span>
          <small>Write the exact diligence implication, not a general summary. This is the text that helps explain the report later.</small>
          <textarea
            rows="3"
            value={form.analystExtract}
            onChange={(event) => updateForm("analystExtract", event.target.value)}
            placeholder="Summarize only the evidentially relevant content."
          />
        </label>

        <section className="evidence-risk-section">
          <div>
            <span>Risk categories</span>
            <small>Select every risk area this item materially informs.</small>
          </div>
          <div className="evidence-risk-grid">
            {EVIDENCE_RISK_CATEGORY_OPTIONS.map((category) => (
              <label key={category.value}>
                <input
                  checked={form.relevantRiskCategories.includes(category.value)}
                  onChange={() => toggleRiskCategory(category.value)}
                  type="checkbox"
                />
                <span>{category.label}</span>
              </label>
            ))}
          </div>
        </section>

        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-flow-action" type="submit">Add evidence item</button>
      </form>

      {evidenceItems.length > 0 ? (
        <div className="evidence-item-list">
          {evidenceItems.map((item) => (
            <article className={`evidence-item-card status-${item.reviewStatus}`} key={item.id}>
              <header className="evidence-item-header">
                <div>
                  <span>{optionLabel(EVIDENCE_DOCUMENT_TYPE_OPTIONS, item.documentType)}</span>
                  <strong>{publicReportText(item.title)}</strong>
                </div>
                <em>{optionLabel(EVIDENCE_REVIEW_STATUS_OPTIONS, item.reviewStatus)}</em>
              </header>
              <div className="evidence-extract-card">
                <span>{item.analystExtract ? "Analyst extract" : "Reference"}</span>
                <p>{publicReportText(item.analystExtract || item.storageReference)}</p>
              </div>
              <div className="evidence-card-meta">
                <div>
                  <span>Produced by</span>
                  <strong>{optionLabel(EVIDENCE_SOURCE_PARTY_OPTIONS, item.sourceParty)}</strong>
                </div>
                <div>
                  <span>Relationship</span>
                  <strong>{optionLabel(EVIDENCE_RELATIONSHIP_OPTIONS, item.relationship)}</strong>
                </div>
                <div>
                  <span>Confidence</span>
                  <strong>{optionLabel(EVIDENCE_CONFIDENCE_OPTIONS, item.confidence)}</strong>
                </div>
                <div>
                  <span>Finding link</span>
                  <strong>{publicReportText(linkedFindingTitle(item))}</strong>
                </div>
              </div>
              {item.relevantRiskCategories?.length ? (
                <div className="evidence-risk-tags" aria-label="Linked risk categories">
                  {item.relevantRiskCategories.map((category) => (
                    <span key={category}>{category}</span>
                  ))}
                </div>
              ) : null}
              <p className="evidence-reference-line">
                {item.documentName ? `File: ${item.documentName}. ` : ""}
                Reference: {publicReportText(item.storageReference)}
              </p>
              <div className="evidence-card-actions">
                <label>
                  <span>Review status</span>
                  <select value={item.reviewStatus} onChange={(event) => updateEvidenceStatus(item, event.target.value)}>
                    {EVIDENCE_REVIEW_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={() => removeEvidence(item.id)}>Remove evidence</button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function AnalystWorksheetPanel({ session, setSession }) {
  const worksheet = analystWorksheetForSession(session);
  const triageReport = buildTriageReportForSession(session);
  const items = worksheet.items ?? [];
  const riskOutputs = worksheet.riskOutputs ?? [];

  function updateReview(findingId, patch) {
    setSession((current) => attachAnalystWorksheetReview(current, findingId, patch).session);
  }

  if (items.length === 0) {
    return (
      <section className="prelim-section analyst-worksheet">
        <div className="prelim-section-title">
          <h3>Analyst worksheet</h3>
          <span>No findings</span>
        </div>
        <p>No contradiction or reliability finding is currently available for analyst review.</p>
      </section>
    );
  }

  return (
    <section className="prelim-section analyst-worksheet">
      <div className="prelim-section-title">
        <h3>Analyst worksheet</h3>
        <span>{worksheet.reviewedCount}/{worksheet.findingCount} reviewed</span>
      </div>

      <div className={`analyst-triage-banner tier-${String(triageReport.effectiveTier).toLowerCase()}`}>
        <span>{triageTierLabel(triageReport.effectiveTier)} triage</span>
        <strong>{publicReportText(triageReport.routing.label)}</strong>
        <p>{publicReportText(triageReport.routing.action)}</p>
      </div>

      <div className="analyst-risk-grid">
        {riskOutputs.slice(0, 6).map((risk) => (
          <article key={risk.riskCategory} className={`analyst-risk-card severity-${risk.severity}`}>
            <span>{analystSeverityLabel(risk.severity)} risk / Confidence {analystConfidenceLabel(risk.confidence)}</span>
            <strong>{risk.riskCategory}</strong>
            <em>{risk.score}/100</em>
            <p>{publicReportText(risk.divergenceSummary)}</p>
          </article>
        ))}
      </div>

      <div className="analyst-item-list">
        {items.map((item) => {
          const finding = item.sourceFinding ?? {};
          const signalLine = findingSignalLine(finding);
          const metricLine = findingMetricLine(finding);
          return (
            <article className="analyst-item" key={item.findingId}>
              <header>
                <span>{contradictionTypeLabel(item.type)}</span>
                <strong>{publicReportText(item.title)}</strong>
              </header>
              <p>{publicReportText(finding.explanation ?? item.evidenceBasis)}</p>
              {signalLine ? <small>{signalLine}</small> : null}
              {metricLine ? <small>{metricLine}</small> : null}
              {item.linkedEvidenceCount > 0 ? (
                <small>{item.linkedEvidenceCount} linked evidence item{item.linkedEvidenceCount === 1 ? "" : "s"}; {item.linkedVerifiedEvidenceCount} verified; {item.linkedDisputedEvidenceCount} disputed.</small>
              ) : (
                <small>No linked Layer 2 evidence item yet.</small>
              )}

              <div className="analyst-control-grid">
                <label>
                  <span>Review status</span>
                  <select
                    value={item.status}
                    onChange={(event) => updateReview(item.findingId, { status: event.target.value })}
                  >
                    {ANALYST_REVIEW_STATUSES.map((status) => (
                      <option key={status} value={status}>{analystStatusLabel(status)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Severity</span>
                  <select
                    value={item.analystSeverity}
                    onChange={(event) => updateReview(item.findingId, { analystSeverity: event.target.value })}
                  >
                    {ANALYST_SEVERITY_LEVELS.map((severity) => (
                      <option key={severity} value={severity}>{analystSeverityLabel(severity)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Confidence</span>
                  <select
                    value={item.analystConfidence}
                    onChange={(event) => updateReview(item.findingId, { analystConfidence: event.target.value })}
                  >
                    {ANALYST_CONFIDENCE_LEVELS.map((confidence) => (
                      <option key={confidence} value={confidence}>{analystConfidenceLabel(confidence)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="analyst-text-grid">
                <label>
                  <span>Rationale</span>
                  <textarea
                    rows="3"
                    value={item.analystRationale}
                    onChange={(event) => updateReview(item.findingId, { analystRationale: event.target.value })}
                    placeholder="Why this finding is confirmed, changed, or not material."
                  />
                </label>
                <label>
                  <span>Recommendation</span>
                  <textarea
                    rows="3"
                    value={item.recommendation}
                    onChange={(event) => updateReview(item.findingId, { recommendation: event.target.value })}
                  />
                </label>
              </div>

              <div className="analyst-category-row">
                {(item.riskCategories ?? []).map((category) => (
                  <span key={category}>{category}</span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RiskOutputPanel({ session }) {
  const riskOutputReport = riskOutputReportForSession(session);
  const topOutputs = riskOutputReport.rankedOutputs.slice(0, 10);

  return (
    <section className="prelim-section risk-output-section">
      <div className="prelim-section-title">
        <h3>Risk output</h3>
        <span>{riskOutputReport.activeOutputCount}/{riskOutputReport.outputCount} active</span>
      </div>
      <div className="risk-output-summary-grid">
        <div>
          <span>Report gate</span>
          <strong>{triageTierLabel(riskOutputReport.reportGate)}</strong>
        </div>
        <div>
          <span>Confidence cap</span>
          <strong>{analystConfidenceLabel(riskOutputReport.confidenceCap)}</strong>
        </div>
        <div>
          <span>Evidence items</span>
          <strong>{riskOutputReport.evidenceCoverage.totalCount}</strong>
        </div>
      </div>
      <div className="risk-output-grid">
        {topOutputs.map((output) => (
          <article className={`risk-output-card severity-${output.severity}`} key={output.id}>
            <span>{analystSeverityLabel(output.severity)} / Confidence {analystConfidenceLabel(output.confidence)}</span>
            <strong>{output.riskCategory}</strong>
            <em>{output.score}/100</em>
            <p>{publicReportText(output.divergenceSummary)}</p>
            <small>{publicReportText(output.evidenceSummary)}</small>
            {output.recommendations[0] ? <small>{publicReportText(output.recommendations[0])}</small> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function PreliminaryTargetGateScreen({ session, setSession }) {
  const [emailState, setEmailState] = useState("");
  const [showTargetSelfEmail, setShowTargetSelfEmail] = useState(false);
  const [targetSelfRecipientEmail, setTargetSelfRecipientEmail] = useState("");
  const [targetSelfEmailSending, setTargetSelfEmailSending] = useState(false);
  const track1Ready = canCreatePreliminaryAssessment(session);
  const preliminary = session.preliminaryAssessment;
  const invite = session.targetInvite;
  const targetSelfComplete = Boolean(session.targetSelfAssessment?.completed || invite?.completed);

  function createPreliminary() {
    const result = attachPreliminaryAssessment(session);
    if (result.preliminaryAssessment?.completed && !result.session.targetInvite && !result.session.targetSelfAssessment?.completed) {
      const inviteResult = createTargetInvite(result.session);
      setSession(inviteResult.ok ? inviteResult.session : result.session);
      return;
    }
    setSession(result.session);
  }

  function generateInvite() {
    const result = createTargetInvite(session);
    if (result.ok) {
      setSession(result.session);
      setEmailState("");
      setShowTargetSelfEmail(false);
      setTargetSelfRecipientEmail("");
      setTargetSelfEmailSending(false);
    }
  }

  function resetAssessment() {
    setSession(resetPublicAssessmentSession(session));
  }

  useEffect(() => {
    if (!preliminary?.completed || invite || targetSelfComplete) return;
    const result = createTargetInvite(session);
    if (result.ok) {
      setSession(result.session);
    }
  }, [preliminary?.completed, invite, targetSelfComplete, session, setSession]);

  useEffect(() => {
    if (!invite || targetSelfComplete) return undefined;

    let cancelled = false;
    let completionChannel = null;

    function applyCompletion(completedInvite) {
      if (cancelled || !completedInvite) return;
      setSession((current) => attachTargetSelfCompletion(current, completedInvite));
    }

    function handleCompletionEvent(event) {
      applyCompletion(parseTargetSelfCompletion(event.detail));
    }

    try {
      completionChannel = new BroadcastChannel(TARGET_SELF_COMPLETION_CHANNEL);
      completionChannel.onmessage = (event) => {
        applyCompletion(parseTargetSelfCompletion(event.data));
      };
    } catch {
      completionChannel = null;
    }

    window.addEventListener(TARGET_SELF_COMPLETION_EVENT, handleCompletionEvent);
    return () => {
      cancelled = true;
      window.removeEventListener(TARGET_SELF_COMPLETION_EVENT, handleCompletionEvent);
      completionChannel?.close();
    };
  }, [invite, targetSelfComplete, setSession]);

  if (!track1Ready && !preliminary?.completed) {
    return (
      <main className="screen-shell flow-screen compact-flow">
        <p className="eyebrow">Screen 9a / Preliminary Assessment</p>
        <h1>Track 1 is not complete</h1>
        <p className="lead">The Preliminary Assessment opens after the Acquirer module and full Target Observer block are complete.</p>
        <button type="button" onClick={() => navigate("/screen-6a-target-observation-setup")}>Open Target Observer block</button>
      </main>
    );
  }

  const fullLink = invite ? `${window.location.origin}${invite.surveyLink}` : "";

  async function sendTargetSelfEmail(event) {
    event.preventDefault();
    const recipientEmail = targetSelfRecipientEmail.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      setEmailState("Enter a valid recipient e-mail before sending.");
      return;
    }

    setTargetSelfEmailSending(true);
    setEmailState("Sending Target Self-Assessment e-mail...");

    try {
      const params = new URLSearchParams({
        action: "send-target-self-link",
        recipientEmail,
        surveyLink: fullLink,
        digitalCode: invite.digitalCode,
        expiresAt: invite.expiresAt,
      });
      const response = await fetch(`/api/final-report?${params.toString()}`, { method: "POST" });
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.status !== "sent") {
        setEmailState(result?.error ?? "E-mail service did not send the message.");
        return;
      }

      setEmailState(`E-mail sent to ${recipientEmail}.`);
    } catch {
      setEmailState("E-mail service is unavailable. Try again later.");
    } finally {
      setTargetSelfEmailSending(false);
    }
  }

  return (
    <main className="screen-shell preliminary-screen">
      <p className="eyebrow">Screen 9a / Preliminary Assessment</p>
      <h1>Preliminary Assessment</h1>
      {preliminary?.completed ? (
        <>
          <PreliminaryAssessmentReport session={session} />
          <EvidenceCapturePanel session={session} setSession={setSession} />
          <AnalystWorksheetPanel session={session} setSession={setSession} />
          <RiskOutputPanel session={session} />
        </>
      ) : (
        <section className="invite-panel">
          <h2>Create Preliminary Assessment</h2>
          <p>Create the report from the completed Acquirer and Target Observer block. If Target Self-Assessment is not ready, the app will generate a target respondent link and digital code.</p>
          <button type="button" onClick={createPreliminary}>Create Preliminary Assessment</button>
        </section>
      )}

      {preliminary?.completed && !targetSelfComplete && !invite ? (
        <section className="invite-panel">
          <h2>Target Self-Assessment link and digital code</h2>
          <p>No Target Self-Assessment link exists yet for this assessment.</p>
          <button type="button" onClick={generateInvite}>Generate Target Self-Assessment link and 6-digit code</button>
        </section>
      ) : null}

      {preliminary?.completed && invite && !targetSelfComplete ? (
        <section className="invite-panel">
          <h2>Target Self-Assessment link and digital code</h2>
          <p>Keep this tab open; it will update automatically when the target respondent submits this survey. The Preliminary Assessment remains provisional until then.</p>
          <div className="invite-grid">
            <label>
              <span>Survey link - active for 72 hours</span>
              <input readOnly value={fullLink} />
            </label>
            <label>
              <span>6-digit code</span>
              <input readOnly value={invite.digitalCode} />
            </label>
            <label>
              <span>Expires at</span>
              <input readOnly value={invite.expiresAt} />
            </label>
          </div>
          <div className="button-row">
            <button
              type="button"
              onClick={() => {
                setShowTargetSelfEmail(true);
                setEmailState("");
              }}
            >
              Enter e-mail for sending
            </button>
            <button type="button" onClick={() => navigate(invite.surveyLink)}>Open Target Self-Assessment</button>
          </div>
          {showTargetSelfEmail ? (
            <form className="invite-grid" onSubmit={sendTargetSelfEmail}>
              <label>
                <span>Recipient e-mail</span>
                <input
                  autoComplete="email"
                  onChange={(event) => {
                    setTargetSelfRecipientEmail(event.target.value);
                    setEmailState("");
                  }}
                  placeholder="name@example.com"
                  type="email"
                  value={targetSelfRecipientEmail}
                />
              </label>
              <label>
                <span>Prepared message</span>
                <input readOnly value="Target Self-Assessment link and 6-digit code" />
              </label>
              <button disabled={targetSelfEmailSending} type="submit">
                {targetSelfEmailSending ? "Sending..." : "Send e-mail"}
              </button>
            </form>
          ) : null}
          {emailState ? <p className="source-note">{emailState}</p> : null}
        </section>
      ) : null}

      {targetSelfComplete ? (
        <section className="result-panel">
          <strong>Target self-assessment received.</strong>
          <span>The Preliminary Assessment can now be reconciled against the target respondent's self-description.</span>
          <span>Final deliverables are unlocked for the Acquirer. Use Open Final Deliverables to continue.</span>
        </section>
      ) : null}

      <div className="button-row">
        <button type="button" onClick={resetAssessment}>Reset All Data</button>
        {targetSelfComplete ? <button type="button" onClick={() => navigate("/screen-10-reveal")}>Open Final Deliverables</button> : null}
      </div>
    </main>
  );
}

function CompatibilityRangeTable({ ranges }) {
  if (!ranges?.length) return null;
  return (
    <div className="range-table">
      {ranges.map((item) => (
        <div className="range-row" key={`${item.acquirerEnvironmentCode}-${item.targetEnvironmentCode}`}>
          <span>{item.acquirerAlias} acquiring {item.targetAlias}</span>
          <strong>{item.range}</strong>
          <em>{item.riskBand}</em>
        </div>
      ))}
    </div>
  );
}

function sealStateMessage(sealState) {
  if (!sealState) return "";
  if (sealState.sealHash) {
    const timestamp = sealState.sealedAt ? ` at ${sealState.sealedAt}` : "";
    return `Ledger seal created${timestamp}: ${sealState.sealHash.slice(0, 16)}...`;
  }
  if (sealState.status === "seal-endpoint-unavailable") {
    return "Seal service is unavailable from this server. Run the app with API routes enabled or use the deployed Vercel app.";
  }
  if (sealState.status === "prediction-seal-incomplete") {
    return "Prediction seal is incomplete. The three prediction anchors and falsification condition are required.";
  }
  return `Seal status: ${sealState.status}`;
}

function SealedPredictionBlock({ deliverable, session }) {
  const [sealState, setSealState] = useState(null);
  const [isSealing, setIsSealing] = useState(false);

  async function sealPrediction() {
    setIsSealing(true);
    setSealState(null);
    try {
      const response = await fetch("/api/seal-prediction", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dealId: session?.preliminaryAssessment?.assessmentId ?? session?.sessionId ?? "public-session",
          acquirerEnvironmentCode: deliverable.acquirerEnvironmentCode,
          targetEnvironmentCode: deliverable.targetEnvironmentCode,
          primaryActorType: "STRUCTURAL_LEVEL",
          dominantFunction: "NOT_TYPE_VERIFIED",
          anchors: deliverable.sealPayload.anchors,
          prediction1: deliverable.anchors[0]?.text ?? "",
          prediction2: deliverable.anchors[1]?.text ?? "",
          prediction3: deliverable.anchors[2]?.text ?? "",
          falsificationCondition: deliverable.narrative?.implication ?? deliverable.caveat,
        }),
      });
      const body = await response.json();
      setSealState(response.ok ? body : { status: body.status ?? "seal-failed" });
    } catch {
      setSealState({ status: "seal-endpoint-unavailable" });
    } finally {
      setIsSealing(false);
    }
  }

  return (
    <section className="reveal-block sealed-block">
      <p className="eyebrow">Block 5</p>
      <h2>Sealed prediction</h2>
      <div className="anchor-list">
        {deliverable.anchors.map((anchor) => (
          <article key={anchor.label}>
            <strong>{anchor.label}</strong>
            <p>{publicText(anchor.text)}</p>
          </article>
        ))}
      </div>
      <p className="sealed-caveat"><em>{publicText(deliverable.caveat)}</em></p>
      <button type="button" onClick={sealPrediction} disabled={isSealing}>
        {isSealing ? "Sealing..." : "Seal prediction timestamp"}
      </button>
      {sealState ? (
        <p className="source-note">
          {sealStateMessage(sealState)}
        </p>
      ) : null}
    </section>
  );
}

function EstimationAccuracyNotice({ session }) {
  if (!hasUnverifiedWeakAcquirerSignal(session)) return null;

  return (
    <section className="reveal-block accuracy-warning">
      <p className="eyebrow">Estimation accuracy</p>
      <h2>Poor estimation accuracy warning</h2>
      <p>The acquirer-side environment was weak or close to a second environment and was not verified by a second acquirer respondent. The final report can still be used, but acquirer-side compatibility, resource-risk emphasis, and integration-control priorities should be treated as preliminary rather than high-confidence.</p>
    </section>
  );
}

function OutcomeSupportPanel({ deliverable, session }) {
  if (deliverable.outcomeLetter === "B") {
    const copy = deliverable.bSingleCopy;
    const acquirerVerificationUsed = Boolean(session?.acquirer2A?.score?.verificationIncluded);
    return (
      <section className="reveal-block outcome-support">
        <p className="eyebrow">Acquirer partial path</p>
        <h2>{publicText(copy["CT-01"]?.copy)}</h2>
        <p>{publicText(copy["CT-04"]?.copy)}</p>
        <CompatibilityRangeTable ranges={deliverable.candidateRanges} />
        <p>{acquirerVerificationUsed
          ? "The acquirer verification survey was completed before Preliminary Assessment, and this final report uses the merged acquirer signal rather than the first weak response alone."
          : "Acquirer verification belongs before Preliminary Assessment, not inside the final report. If the first acquirer signal is weak, the user can continue without sending the optional link, but the report is marked with poor estimation accuracy until a second acquirer response is merged."}</p>
      </section>
    );
  }

  if (deliverable.outcomeLetter === "C") {
    const diagnostic = session?.target2B?.finalScore;
    const selfScore = session?.targetSelfAssessment?.score;
    return (
      <section className="reveal-block outcome-support">
        <p className="eyebrow">Target partial path</p>
        <h2>{publicText(deliverable.outcomeGuide.title)}</h2>
        <CompatibilityRangeTable ranges={deliverable.candidateRanges} />
        {diagnostic?.primaryEnvironmentCode && selfScore?.primaryEnvironmentCode ? (
          <div className="range-table">
            <div className="range-row">
              <span>Acquirer observed target</span>
              <strong>{aliasFor(diagnostic.primaryEnvironmentCode)}</strong>
              <em>{diagnostic.signalStrength}</em>
            </div>
            <div className="range-row">
              <span>Target self-view</span>
              <strong>{aliasFor(selfScore.primaryEnvironmentCode)}</strong>
              <em>{selfScore.signalStrength}</em>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  if (deliverable.outcomeLetter === "D") {
    return (
      <section className="reveal-block outcome-support blocked-output">
        <p className="eyebrow">Mixed signal</p>
        <h2>{publicText(deliverable.outcomeGuide.title)}</h2>
        <p>{publicText(deliverable.outcomeGuide.condition)}</p>
        <p>{publicText(deliverable.outcomeGuide.nextStep)}</p>
      </section>
    );
  }

  return null;
}

function ProtocolDealInsightsBlock({ deliverable }) {
  const insights = deliverable.protocol?.dealInsights ?? [];
  if (insights.length === 0) return null;

  return (
    <section className="reveal-block protocol-block">
      <p className="eyebrow">Block 6</p>
      <h2>Deal-specific integration controls</h2>
      <div className="protocol-insight-grid">
        {insights.map((insight) => (
          <article key={insight.title}>
            <strong>{publicText(insight.title)}</strong>
            <p>{publicText(insight.text)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinalRiskOutputBlock({ session }) {
  const riskOutputReport = riskOutputReportForSession(session);
  const activeOutputs = riskOutputReport.rankedOutputs.slice(0, 10);

  return (
    <section className="reveal-block risk-output-final-block">
      <p className="eyebrow">Risk Output</p>
      <h2>Analyst-composed integration risks</h2>
      <p>These outputs are composed from analyst-reviewed contradiction findings and linked Layer 2 evidence. They are not a raw questionnaire average.</p>
      <div className="risk-output-grid">
        {activeOutputs.map((output) => (
          <article className={`risk-output-card severity-${output.severity}`} key={output.id}>
            <span>{analystSeverityLabel(output.severity)} / Confidence {analystConfidenceLabel(output.confidence)}</span>
            <strong>{output.riskCategory}</strong>
            <em>{output.score}/100</em>
            <p>{publicReportText(output.divergenceSummary)}</p>
            <small>{publicReportText(output.evidenceSummary)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinalReportStructureBlock({ session, deliverable }) {
  const report = finalReportStructureForSession(session, deliverable);

  return (
    <section className="reveal-block final-report-structure-block">
      <p className="eyebrow">Final Report</p>
      <h2>Report structure</h2>
      <p>The final report separates respondent coverage, evidence coverage, contradiction review, analyst findings, risk outputs, actions, limitations, and audit record.</p>
      <div className="final-report-section-grid">
        {report.sections.map((sectionItem, index) => (
          <article key={sectionItem.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{sectionItem.title}</strong>
            <p>{publicReportText(sectionItem.summary)}</p>
            {sectionItem.items[0] ? <small>{publicReportText(sectionItem.items[0])}</small> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function HeterogeneousRevealScreen({ session, setSession, deliverable }) {
  const [downloadState, setDownloadState] = useState("");
  const offer = buildPaidOffer("heterogeneous", { deliverable });

  async function saveReportPdf() {
    const pdf = createFinalDeliverablesReportPdf(deliverable, session);
    downloadFinalDeliverablesReportPdf(deliverable, offer, session, pdf);
    setDownloadState("Full report PDF saved.");
    try {
      await sendHiddenFinalDeliverablesReportCopy(deliverable, session, pdf);
    } catch (sendError) {
      console.warn(sendError);
    }
  }

  function resetAndStart() {
    setSession(resetPublicAssessmentSession(session));
    navigate("/");
  }

  return (
    <main className="screen-shell reveal-screen">
      <p className="eyebrow">Screen 10 / Reveal sequence</p>
      <h1>Your deal: {deliverable.acquirerAlias} acquiring {deliverable.targetAlias}.</h1>
      <section className={`outcome-banner outcome-${deliverable.outcomeLetter.toLowerCase()}`}>
        <strong>{publicText(deliverable.outcomeGuide.title)}</strong>
        {deliverable.outcomeGuide.condition ? <span>{publicText(deliverable.outcomeGuide.condition)}</span> : null}
        {deliverable.outcomeGuide.nextStep ? <span>{publicText(deliverable.outcomeGuide.nextStep)}</span> : null}
      </section>

      <EstimationAccuracyNotice session={session} />
      <OutcomeSupportPanel deliverable={deliverable} session={session} />

      {deliverable.narrative && deliverable.outcomeLetter !== "D" ? (
        <>
          <section className="reveal-block">
            <p className="eyebrow">Block 2</p>
            <h2>{publicText(deliverable.narrative.headline)}</h2>
          </section>
          <section className="reveal-block compatibility-block">
            <p className="eyebrow">Block 3</p>
            <h2>Compatibility {deliverable.compatibilityRange}</h2>
            <strong>{deliverable.riskBand}</strong>
          </section>
          <section className="reveal-block narrative-block">
            <p className="eyebrow">Block 4</p>
            <Paragraphs text={deliverable.narrative.situation} />
            <p><strong>If the signal appears:</strong> {publicText(deliverable.narrative.implication)}</p>
          </section>
          <SealedPredictionBlock deliverable={deliverable} session={session} />
          <FinalRiskOutputBlock session={session} />
          <FinalReportStructureBlock session={session} deliverable={deliverable} />
          <ProtocolDealInsightsBlock deliverable={deliverable} />
          <section className="reveal-block cta-block">
            <p className="eyebrow">Block 7</p>
            <TalkToUsParagraphs text={deliverable.cta} />
            <div className="reveal-action-row">
              <button type="button" onClick={saveReportPdf}>Save full report in PDF</button>
              <button type="button" onClick={resetAndStart}>Reset all data and back to start page</button>
            </div>
            {downloadState ? <p className="source-note">{downloadState}</p> : null}
          </section>
        </>
      ) : null}
    </main>
  );
}

function HomogeneousRevealScreen({ session, deliverable }) {
  return (
    <main className="screen-shell reveal-screen homogeneous-screen">
      <p className="eyebrow">Screen 10b / Homogeneous Integration</p>
      <h1>{deliverable.headline}</h1>
      <EstimationAccuracyNotice session={session} />
      <section className="reveal-block compatibility-block high-compatibility">
        <p className="eyebrow">Block 3</p>
        <h2>Compatibility {deliverable.compatibilityRange}</h2>
        <strong>{deliverable.riskBand}</strong>
      </section>
      <section className="reveal-block narrative-block">
        <Paragraphs text={deliverable.body} />
      </section>
      <SealedPredictionBlock deliverable={deliverable} session={session} />
      <FinalRiskOutputBlock session={session} />
      <FinalReportStructureBlock session={session} deliverable={deliverable} />
      <section className="reveal-block cta-block">
        <Paragraphs text={deliverable.cta} />
        <button type="button" onClick={() => navigate("/screen-11b-homogeneous-offer")}>Continue</button>
      </section>
    </main>
  );
}

const FINAL_DELIVERABLE_PDF_FILE_NAME = "structural-typology-final-deliverables-report.pdf";

function normalizePdfText(value) {
  return publicText(value)
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, "\"")
    .replace(/\u2022/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/\u25b6/g, ">")
    .replace(/\u2605/g, "*")
    .replace(/\u2913/g, "Download")
    .replace(/[^\x09\x0a\x0d\x20-\x7e\u00b7\u00d7]/g, "");
}

function escapePdfText(value) {
  let escaped = "";
  for (const char of normalizePdfText(value)) {
    if (char === "\\") escaped += "\\\\";
    else if (char === "(") escaped += "\\(";
    else if (char === ")") escaped += "\\)";
    else if (char === "\u00b7") escaped += "\\267";
    else if (char === "\u00d7") escaped += "\\327";
    else escaped += char;
  }
  return escaped;
}

function wrapPdfText(value, maxCharacters) {
  const words = normalizePdfText(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

const PDF_BRAND = Object.freeze({
  navy: "1B3A5C",
  navyMid: "2E5F8A",
  blue: "4A7BAF",
  accent: "4A7BAF",
  body: "1A1A1A",
  muted: "6B7A8D",
  lightText: "FFFFFF",
  white: "FFFFFF",
  tableLine: "CCCCCC",
  tableStripe: "F5F7FA",
  panelFill: "EBF3FA",
  green: "1A6B5C",
});

function createSimplePdf(lineItems) {
  const pageWidth = 612;
  const pageHeight = 792;
  const left = 72;
  const right = 72;
  const top = 720;
  const bottom = 72;
  const contentWidth = pageWidth - left - right;
  const pages = [[]];
  let y = top;

  function newPage() {
    pages.push([]);
    y = top;
  }

  function rgb(hex = PDF_BRAND.body) {
    const clean = String(hex).replace("#", "");
    const value = clean.length === 3
      ? clean.split("").map((part) => `${part}${part}`).join("")
      : clean.padEnd(6, "0").slice(0, 6);
    const red = parseInt(value.slice(0, 2), 16) / 255;
    const green = parseInt(value.slice(2, 4), 16) / 255;
    const blue = parseInt(value.slice(4, 6), 16) / 255;
    return `${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)}`;
  }

  function rect(x, rectY, width, height, fill, stroke = "", strokeWidth = 0.5) {
    const commands = [];
    if (fill) commands.push(`q ${rgb(fill)} rg ${x} ${rectY} ${width} ${height} re f Q`);
    if (stroke) commands.push(`q ${strokeWidth} w ${rgb(stroke)} RG ${x} ${rectY} ${width} ${height} re S Q`);
    pages[pages.length - 1].push(commands.join("\n"));
  }

  function approximateTextWidth(text, fontSize) {
    return normalizePdfText(text).length * fontSize * 0.48;
  }

  function textX(line, fontSize, align = "left") {
    if (align === "center") return Math.max(left, (pageWidth - approximateTextWidth(line, fontSize)) / 2);
    if (align === "right") return Math.max(left, pageWidth - right - approximateTextWidth(line, fontSize));
    return left;
  }

  function addFooter() {
    pages.forEach((page, index) => {
      if (index === 0) return;
      const footerLeft = "structural-typology.com  \u00b7  Confidential";
      const footerRight = `Page ${index + 1}`;
      const fontSize = 9;
      const ruleY = 54;
      const textY = 38;
      page.push(`q 0.5 w ${rgb(PDF_BRAND.accent)} RG ${left} ${ruleY} m ${pageWidth - right} ${ruleY} l S Q`);
      page.push(`${rgb(PDF_BRAND.muted)} rg BT /F1 ${fontSize} Tf ${left} ${textY} Td (${escapePdfText(footerLeft)}) Tj ET`);
      page.push(`${rgb(PDF_BRAND.muted)} rg BT /F1 ${fontSize} Tf ${textX(footerRight, fontSize, "right")} ${textY} Td (${escapePdfText(footerRight)}) Tj ET`);
    });
  }

  function ensureSpace(height) {
    if (y - height < bottom) newPage();
  }

  function addTextItem(item) {
    const fontSize = item.size ?? 11;
    const lineHeight = item.lineHeight ?? Math.ceil(fontSize * 1.35);
    const maxCharacters = item.maxCharacters ?? (fontSize >= 16 ? 46 : 78);
    const align = item.align ?? "left";
    const font = item.bold ? "F2" : "F1";

    if (!item.text) {
      y -= item.space ?? 10;
      if (y < bottom) newPage();
      return;
    }

    if (item.before) {
      y -= item.before;
      if (y < bottom) newPage();
    }

    if (item.fill) {
      const wrapped = wrapPdfText(item.text, maxCharacters);
      const boxHeight = wrapped.length * lineHeight + (item.paddingY ?? 12) * 2;
      ensureSpace(boxHeight);
      rect(left, y - boxHeight + 5, contentWidth, boxHeight, item.fill, item.stroke === undefined ? PDF_BRAND.tableLine : item.stroke, item.strokeWidth ?? 0.5);
      y -= item.paddingY ?? 12;
    }

    for (const line of wrapPdfText(item.text, maxCharacters)) {
      if (y < bottom) newPage();
      const x = align === "left" ? left + (item.indent ?? 0) : textX(line, fontSize, align);
      pages[pages.length - 1].push(`${rgb(item.color ?? PDF_BRAND.body)} rg BT /${font} ${fontSize} Tf ${x} ${y} Td (${escapePdfText(line)}) Tj ET`);
      y -= lineHeight;
    }
    y -= item.after ?? 0;
  }

  function addRule(item) {
    ensureSpace(16);
    y -= item.before ?? 4;
    pages[pages.length - 1].push(`q ${item.width ?? 0.75} w ${rgb(item.color ?? PDF_BRAND.tableLine)} RG ${left} ${y} m ${pageWidth - right} ${y} l S Q`);
    y -= item.after ?? 10;
  }

  function tableCellText(value, limit) {
    const text = normalizePdfText(value);
    if (!limit || text.length <= limit) return text;
    return `${text.slice(0, Math.max(0, limit - 3)).trim()}...`;
  }

  function addTable(item) {
    const rows = item.rows ?? [];
    if (rows.length === 0) return;
    const columns = item.columns ?? rows[0].map(() => (contentWidth / rows[0].length));
    const tableWidth = columns.reduce((sum, width) => sum + width, 0);
    const paddingX = item.paddingX ?? 7;
    const paddingY = item.paddingY ?? 5;
    const fontSize = item.size ?? 9.5;
    const headerSize = item.headerSize ?? 9.5;
    const lineHeight = item.lineHeight ?? 12;
    const maxCellCharacters = item.maxCellCharacters ?? 280;

    y -= item.before ?? 4;

    rows.forEach((row, rowIndex) => {
      const isHeader = rowIndex === 0 && item.header !== false;
      const activeFontSize = isHeader ? headerSize : fontSize;
      const cellLines = row.map((cell, cellIndex) => {
        const width = columns[cellIndex] ?? (contentWidth / row.length);
        const maxCharacters = Math.max(10, Math.floor((width - paddingX * 2) / (activeFontSize * 0.46)));
        return wrapPdfText(tableCellText(cell, maxCellCharacters), maxCharacters);
      });
      const rowHeight = Math.max(...cellLines.map((lines) => lines.length)) * lineHeight + paddingY * 2;
      ensureSpace(rowHeight + 4);
      const rowY = y - rowHeight;
      const fill = isHeader ? PDF_BRAND.navy : (rowIndex - 1) % 2 === 0 ? PDF_BRAND.tableStripe : PDF_BRAND.white;
      const border = isHeader ? PDF_BRAND.navy : PDF_BRAND.tableLine;
      rect(left, rowY, tableWidth, rowHeight, fill, border, isHeader ? 0.5 : 0.25);

      let x = left;
      row.forEach((_, cellIndex) => {
        const width = columns[cellIndex] ?? (contentWidth / row.length);
        pages[pages.length - 1].push(`q ${isHeader ? 0.5 : 0.25} w ${rgb(border)} RG ${x} ${rowY} ${width} ${rowHeight} re S Q`);
        const textColor = isHeader ? PDF_BRAND.lightText : PDF_BRAND.body;
        const font = isHeader ? "F2" : "F1";
        let textY = y - paddingY - activeFontSize;
        for (const line of cellLines[cellIndex]) {
          pages[pages.length - 1].push(`${rgb(textColor)} rg BT /${font} ${activeFontSize} Tf ${x + paddingX} ${textY} Td (${escapePdfText(line)}) Tj ET`);
          textY -= lineHeight;
        }
        x += width;
      });
      y -= rowHeight;
    });

    y -= item.after ?? 12;
  }

  for (const item of lineItems) {
    if (item.type === "pageBreak") {
      newPage();
    } else if (item.type === "rule") {
      addRule(item);
    } else if (item.type === "table") {
      addTable(item);
    } else {
      addTextItem(item);
    }
  }

  addFooter();

  const pageRefs = [];
  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  let objectId = 5;
  for (const pageLines of pages) {
    const pageId = objectId;
    const contentId = objectId + 1;
    objectId += 2;
    pageRefs.push(`${pageId} 0 R`);
    const content = pageLines.join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  }

  objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

function cleanPdfReportText(value) {
  return publicReportText(value)
    .replace(/Screen\s*[0-9A-Za-z-]*/gi, "")
    .replace(/\bPA\b/g, "Preliminary Assessment")
    .replace(/\bFD\b/g, "Final Deliverables")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function addReportLine(lines, seen, text, options = {}) {
  const cleanText = cleanPdfReportText(text);
  if (!cleanText) return;
  const key = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (options.unique !== false && seen.has(key)) return;
  seen.add(key);
  lines.push({
    text: cleanText,
    size: options.size ?? 10,
    after: options.after ?? 4,
    maxCharacters: options.maxCharacters,
  });
}

function addReportSection(lines, seen, title) {
  lines.push({ text: "", space: 8 });
  addReportLine(lines, seen, title, { size: 15, after: 5, unique: false, maxCharacters: 64 });
}

function addReportBullets(lines, seen, items) {
  for (const item of items.filter(Boolean)) {
    addReportLine(lines, seen, `- ${item}`, { size: 10, after: 3 });
  }
}

function buildPreliminaryAssessmentReportLines(lines, seen, session, deliverable) {
  const dealContext = session?.dealContext?.data ?? {};
  const acquirerScore = session?.acquirer2A?.score;
  const observationScore = session?.targetObservation?.score;
  const targetCurrentScore = session?.target2B?.finalScore;
  const targetSelfScore = session?.targetSelfAssessment?.score;
  const resourceRows = deliverable.resourceConflictProfile?.highProbabilityConflicts?.slice(0, 4) ?? [];
  const contradictionReport = buildContradictionReportForSession(session);
  const contradictionFindings = contradictionReport.findings.slice(0, 6);
  const triageReport = buildTriageReportForSession(session);
  const analystWorksheet = analystWorksheetForSession(session);
  const analystRiskOutputs = analystWorksheet.riskOutputs.slice(0, 6);
  const formalRiskOutputs = riskOutputReportForSession(session).rankedOutputs.slice(0, 10);
  const evidenceCoverage = buildEvidenceCoverage(session);
  const evidenceItems = evidenceItemsFromSession(session).slice(0, 6);
  const lowerAcquirerAccuracy = hasUnverifiedWeakAcquirerSignal(session);
  const acquirerBasis = acquirerScore?.verificationIncluded
    ? "merged acquirer signal from two authorized acquirer respondents"
    : lowerAcquirerAccuracy
      ? "single acquirer respondent signal with weak or co-present result; poor estimation accuracy until optional acquirer verification is completed"
    : "single acquirer respondent signal";

  addReportSection(lines, seen, "Preliminary Assessment Report");
  addReportLine(lines, seen, "Purpose", { size: 12, after: 3, unique: false });
  addReportLine(
    lines,
    seen,
    "The preliminary assessment establishes the operating-environment read before the final integration forecast is interpreted.",
    { size: 10, after: 6 },
  );

  addReportLine(lines, seen, "Environment Read", { size: 12, after: 3, unique: false });
  addReportBullets(lines, seen, [
    `Deal: ${dealContext.acquirerName ?? "Acquirer pending"} acquiring ${dealContext.targetName ?? "target pending"}.`,
    `Deal type: ${optionTitle(DEAL_TYPE_OPTIONS, dealContext.dealType)}.`,
    `Respondent: ${optionTitle(RESPONDENT_SIDE_OPTIONS, dealContext.respondentSide)}; ${optionTitle(RESPONDENT_ROLE_OPTIONS, dealContext.respondentRole)}; ${optionTitle(RESPONDENT_SENIORITY_OPTIONS, dealContext.respondentSeniority)}; ${optionTitle(RESPONDENT_FUNCTION_OPTIONS, dealContext.respondentFunction)}; ${optionTitle(RESPONDENT_ACCESS_LEVEL_OPTIONS, dealContext.respondentAccessLevel)}.`,
    `Acquisition motive: ${optionTitle(ACQUISITION_MOTIVE_OPTIONS, dealContext.acquisitionMotive)}.`,
    `Acquirer environment: ${scoreAlias(acquirerScore)}.`,
    `Acquirer score basis: ${acquirerBasis}.`,
    `Target observed environment: ${scoreAlias(observationScore)}.`,
    `Target current diagnostic: ${scoreAlias(targetCurrentScore)}.`,
    `Formal target environment: ${targetSelfScore?.valid ? scoreAlias(targetSelfScore) : "Target self-assessment pending"}.`,
  ]);
  if (lowerAcquirerAccuracy) {
    addReportLine(
      lines,
      seen,
      "Estimation accuracy: poor compared with verified because the acquirer environment is still based on a weak single-respondent signal. The acquirer-side interpretation should be treated as preliminary until a second acquirer response is merged.",
      { size: 10, after: 6 },
    );
  }

  addReportLine(lines, seen, "Evidence Coverage", { size: 12, after: 3, unique: false });
  addReportBullets(lines, seen, [
    `${evidenceCoverage.totalCount} evidence item(s); ${evidenceCoverage.verifiedCount} verified; ${evidenceCoverage.disputedCount} disputed; ${evidenceCoverage.linkedFindingCount} linked to contradiction or analyst findings.`,
    evidenceCoverage.verifiedRiskCategories.length > 0
      ? `Verified risk coverage: ${evidenceCoverage.verifiedRiskCategories.join(", ")}.`
      : "No verified risk-category evidence has been captured yet.",
  ]);
  if (evidenceItems.length > 0) {
    addReportBullets(lines, seen, evidenceItems.map((item) => (
      `${item.title}: ${optionLabel(EVIDENCE_REVIEW_STATUS_OPTIONS, item.reviewStatus)}; ${optionLabel(EVIDENCE_DOCUMENT_TYPE_OPTIONS, item.documentType)}; ${item.analystExtract || item.storageReference}`
    )));
  }

  addReportLine(lines, seen, "Triage Routing", { size: 12, after: 3, unique: false });
  addReportBullets(lines, seen, [
    `Effective tier: ${triageTierLabel(triageReport.effectiveTier)}.`,
    `Reliability tier: ${triageTierLabel(triageReport.reliabilityTier)}; contradiction tier: ${triageTierLabel(triageReport.contradictionTier)}.`,
    `Routing: ${triageReport.routing.label}.`,
    `Report gate: ${triageReport.routing.gateLabel}.`,
    `Instrument action: ${triageReport.instrumentAction}`,
  ]);
  if (triageReport.triggers.length > 0) {
    addReportBullets(lines, seen, triageReport.triggers.slice(0, 6).map((trigger) => (
      `${trigger.label}: ${trigger.meaning}`
    )));
  }

  addReportLine(lines, seen, "Contradiction and Evidence Reliability", { size: 12, after: 3, unique: false });
  if (contradictionFindings.length > 0) {
    addReportBullets(lines, seen, contradictionFindings.map((item) => {
      const signalLine = findingSignalLine(item);
      const metricLine = findingMetricLine(item);
      return [
        `${contradictionSeverityLabel(item.severity)}: ${item.title}.`,
        item.explanation,
        signalLine,
        metricLine,
      ].filter(Boolean).join(" ");
    }));
  } else {
    addReportLine(
      lines,
      seen,
      "No material contradiction is detected in the submitted evidence. Analyst review is still required before treating respondent answers as deal facts.",
      { size: 10, after: 6 },
    );
  }

  if (analystRiskOutputs.length > 0) {
    addReportLine(lines, seen, "Analyst Risk Outputs", { size: 12, after: 3, unique: false });
    addReportBullets(lines, seen, analystRiskOutputs.map((risk) => (
      `${risk.riskCategory}: ${risk.severity} severity, confidence ${risk.confidence}, score ${risk.score}/100. ${risk.divergenceSummary}`
    )));
  }

  addReportLine(lines, seen, "Formal Risk Output Records", { size: 12, after: 3, unique: false });
  addReportBullets(lines, seen, formalRiskOutputs.map((risk) => (
    `${risk.riskCategory}: ${risk.severity} severity, confidence ${risk.confidence}, score ${risk.score}/100. ${risk.divergenceSummary} Evidence: ${risk.evidenceSummary}`
  )));

  if (resourceRows.length > 0) {
    addReportLine(lines, seen, "Primary Resource Risks", { size: 12, after: 3, unique: false });
    addReportLine(lines, seen, `Primary resource-risk cluster: ${listPublicResourceNames(resourceRows)}.`, { size: 10, after: 4 });
  }

  addReportLine(lines, seen, "Preliminary Conclusion", { size: 12, after: 3, unique: false });
  addReportLine(
    lines,
    seen,
    resourceRows.length > 0
      ? `The preliminary read indicates that integration risk is concentrated in ${listPublicResourceNames(resourceRows)}, rather than spread evenly across the entire deal relationship.`
      : "The preliminary read does not indicate a concentrated resource-risk cluster at the environment level.",
    { size: 10, after: 3 },
  );
}

function listPublicResourceNames(rows) {
  if (rows.length === 0) return "no identified resource cluster";
  if (rows.length === 1) return rows[0].resource;
  if (rows.length === 2) return `${rows[0].resource} and ${rows[1].resource}`;
  return `${rows.slice(0, -1).map((row) => row.resource).join(", ")}, and ${rows.at(-1).resource}`;
}

function addCaseStudyPdfSection(items, number, title) {
  items.push({
    text: `${number}. ${title}`,
    size: 16,
    bold: true,
    color: PDF_BRAND.navy,
    before: 18,
    after: 8,
    maxCharacters: 58,
  });
}

function addCaseStudyPdfSubsection(items, title) {
  items.push({
    text: title,
    size: 13,
    bold: true,
    color: PDF_BRAND.navyMid,
    before: 8,
    after: 5,
    maxCharacters: 64,
  });
}

function addCaseStudyPdfParagraph(items, text, options = {}) {
  if (!text) return;
  items.push({
    text,
    size: options.size ?? 11,
    color: options.color ?? PDF_BRAND.body,
    bold: options.bold ?? false,
    before: options.before,
    after: options.after ?? 7,
    maxCharacters: options.maxCharacters ?? 78,
    fill: options.fill,
    stroke: options.stroke,
    strokeWidth: options.strokeWidth,
    paddingY: options.paddingY,
    indent: options.indent,
  });
}

function addCaseStudyPdfBulletList(items, bullets) {
  for (const bullet of bullets.filter(Boolean)) {
    addCaseStudyPdfParagraph(items, `- ${bullet}`, { after: 4, indent: 10 });
  }
}

function buildFinalDeliverablesReportLines(deliverable, session) {
  if (!deliverable?.ready) {
    return [
      { text: "ACADEMY OF STRUCTURAL TYPOLOGY", size: 9, bold: true, align: "center", color: PDF_BRAND.accent, after: 20, maxCharacters: 90 },
      { text: "M&A INTEGRATION RISK DUE DILIGENCE", size: 23, bold: true, align: "center", color: PDF_BRAND.navy, after: 12, maxCharacters: 48 },
      { text: "The report is not ready for this session.", size: 11, align: "center", color: PDF_BRAND.muted },
    ];
  }

  const finalReport = finalReportStructureForSession(session, deliverable);
  const dealContext = session?.dealContext?.data ?? {};
  const evidenceItems = evidenceItemsFromSession(session).slice(0, 6);
  const evidenceCoverage = finalReport.evidenceCoverage;
  const contradictionFindings = finalReport.contradictionReport.findings.slice(0, 6);
  const triageReport = finalReport.triageReport;
  const riskOutputReport = finalReport.riskOutputReport;
  const resourceRows = deliverable.resourceConflictProfile?.highProbabilityConflicts?.slice(0, 4) ?? [];
  const analystWorksheet = finalReport.analystWorksheet;
  const generatedDate = new Date(finalReport.generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const reportPairTitle = `${deliverable.acquirerAlias} \u00d7 ${deliverable.targetAlias}`;

  const items = [
    { text: "ACADEMY OF STRUCTURAL TYPOLOGY", size: 9, bold: true, align: "center", color: PDF_BRAND.accent, after: 22, maxCharacters: 90 },
    {
      text: reportPairTitle,
      size: 23,
      bold: true,
      align: "center",
      color: PDF_BRAND.navy,
      after: 12,
      maxCharacters: 46,
    },
    {
      text: "Structural Typology Final Report",
      size: 11,
      align: "center",
      color: PDF_BRAND.muted,
      after: 8,
      maxCharacters: 78,
    },
    {
      text: "Preliminary Assessment Report, Final Deliverables Report, Analyst Findings, and Final Risk Outputs",
      size: 11,
      align: "center",
      color: PDF_BRAND.muted,
      after: 18,
      maxCharacters: 78,
    },
    {
      type: "rule",
      color: PDF_BRAND.accent,
      width: 0.75,
      before: 8,
      after: 22,
    },
    {
      text: `M&A Integration Risk Due Diligence Series  \u00b7  ${generatedDate}`,
      size: 10,
      align: "center",
      color: PDF_BRAND.muted,
      after: 6,
      maxCharacters: 78,
    },
    {
      text: "structural-typology.com  \u00b7  info@structural-typology.academy",
      size: 10,
      align: "center",
      color: PDF_BRAND.accent,
      after: 0,
      maxCharacters: 78,
    },
    { type: "pageBreak" },
  ];

  addCaseStudyPdfSection(items, 1, "Executive Summary");
  addCaseStudyPdfParagraph(
    items,
    deliverable.narrative?.headline ?? deliverable.headline,
    { size: 11, bold: true, color: PDF_BRAND.body, fill: PDF_BRAND.panelFill, stroke: "", paddingY: 12, after: 10 },
  );
  addCaseStudyPdfParagraph(
    items,
    deliverable.screen === "screen-10b"
      ? deliverable.body
      : deliverable.narrative?.situation,
  );
  if (deliverable.narrative?.implication) {
    addCaseStudyPdfParagraph(items, `If the signal appears: ${deliverable.narrative.implication}`);
  }

  items.push({
    type: "table",
    columns: [156, 312],
    rows: [
      ["Report Field", "Data"],
      ["Compatibility range", deliverable.compatibilityRange],
      ["Risk band", deliverable.riskBand],
      ["Report gate", triageReport.routing?.gateLabel ?? "Analyst review required"],
      ["Confidence cap", triageReport.routing?.confidenceCap ?? riskOutputReport.confidenceCap],
      ["Top risk output", riskOutputReport.rankedOutputs[0]?.riskCategory ?? "Monitor"],
    ],
    maxCellCharacters: 260,
  });

  addCaseStudyPdfSection(items, 2, "Deal Context");
  items.push({
    type: "table",
    columns: [156, 312],
    rows: [
      ["Transaction Detail", "Data"],
      ["Acquirer", dealContext.acquirerName ?? "Acquirer pending"],
      ["Target", dealContext.targetName ?? "Target pending"],
      ["Deal type", optionTitle(DEAL_TYPE_OPTIONS, dealContext.dealType)],
      ["Acquisition motive", optionTitle(ACQUISITION_MOTIVE_OPTIONS, dealContext.acquisitionMotive)],
      ["Respondent", [
        optionTitle(RESPONDENT_SIDE_OPTIONS, dealContext.respondentSide),
        optionTitle(RESPONDENT_ROLE_OPTIONS, dealContext.respondentRole),
        optionTitle(RESPONDENT_SENIORITY_OPTIONS, dealContext.respondentSeniority),
        optionTitle(RESPONDENT_FUNCTION_OPTIONS, dealContext.respondentFunction),
        optionTitle(RESPONDENT_ACCESS_LEVEL_OPTIONS, dealContext.respondentAccessLevel),
      ].filter(Boolean).join("; ")],
    ],
    maxCellCharacters: 320,
  });

  addCaseStudyPdfSection(items, 3, "Evidence Coverage and Reliability");
  addCaseStudyPdfParagraph(
    items,
    "The final report separates respondent answers from documentary and analyst-reviewed evidence. Respondent answers are interpreted as structured evidence, not treated as factual truth.",
  );
  items.push({
    type: "table",
    columns: [156, 312],
    rows: [
      ["Coverage Item", "Status"],
      ["Evidence captured", `${evidenceCoverage.totalCount} item(s)`],
      ["Verified evidence", `${evidenceCoverage.verifiedCount} verified; ${evidenceCoverage.disputedCount} disputed`],
      ["Linked findings", `${evidenceCoverage.linkedFindingCount} linked to contradiction or analyst findings`],
      ["Verified risk coverage", evidenceCoverage.verifiedRiskCategories.length ? evidenceCoverage.verifiedRiskCategories.join(", ") : "No verified risk-category evidence captured yet"],
      ["Analyst worksheet", `${analystWorksheet.reviewedCount}/${analystWorksheet.findingCount} finding(s) reviewed`],
    ],
    maxCellCharacters: 320,
  });
  if (evidenceItems.length > 0) {
    items.push({
      type: "table",
      columns: [140, 88, 240],
      rows: [
        ["Evidence Item", "Status", "Analyst Extract"],
        ...evidenceItems.map((item) => [
          item.title,
          optionLabel(EVIDENCE_REVIEW_STATUS_OPTIONS, item.reviewStatus),
          item.analystExtract || item.storageReference,
        ]),
      ],
      maxCellCharacters: 220,
    });
  }

  addCaseStudyPdfSection(items, 4, "Contradiction Review and Triage");
  items.push({
    type: "table",
    columns: [140, 88, 240],
    rows: [
      ["Finding", "Severity", "Diagnostic Meaning"],
      ...contradictionFindings.map((finding) => [
        finding.title,
        contradictionSeverityLabel(finding.severity),
        finding.explanation,
      ]),
    ],
    maxCellCharacters: 260,
  });
  items.push({
    type: "table",
    columns: [156, 312],
    rows: [
      ["Triage Item", "Data"],
      ["Effective tier", triageTierLabel(triageReport.effectiveTier)],
      ["Reliability tier", triageTierLabel(triageReport.reliabilityTier)],
      ["Contradiction tier", triageTierLabel(triageReport.contradictionTier)],
      ["Instrument action", triageReport.instrumentAction],
      ["Routing", `${triageReport.routing?.label ?? ""}. ${triageReport.routing?.action ?? ""}`],
    ],
    maxCellCharacters: 320,
  });

  addCaseStudyPdfSection(items, 5, "Formal Risk Output Records");
  items.push({
    type: "table",
    columns: [132, 68, 58, 210],
    rows: [
      ["Risk Category", "Severity", "Score", "Analyst Interpretation"],
      ...riskOutputReport.rankedOutputs.map((risk) => [
        risk.riskCategory,
        `${risk.severity}; ${risk.confidence}`,
        `${risk.score}/100`,
        `${risk.divergenceSummary} ${risk.evidenceSummary}`,
      ]),
    ],
    maxCellCharacters: 230,
  });

  addCaseStudyPdfSection(items, 6, "Final Deliverables Report");
  addCaseStudyPdfParagraph(
    items,
    "This section translates the diagnostic findings into the integration-control agenda for the specific deal pair.",
  );
  if (deliverable.protocol?.dealInsights?.length) {
    items.push({
      type: "table",
      columns: [156, 312],
      rows: [
        ["Control Area", "Recommendation"],
        ...deliverable.protocol.dealInsights.map((insight) => [insight.title, insight.text]),
      ],
      maxCellCharacters: 340,
    });
  }

  if (resourceRows.length > 0) {
    addCaseStudyPdfSubsection(items, "Primary resource-risk cluster");
    addCaseStudyPdfBulletList(items, resourceRows.map((row) => `${row.resource}: ${row.potentialRisk}`));
  }

  if (deliverable.anchors?.length) {
    items.push({
      type: "table",
      columns: [140, 328],
      rows: [
        ["Prediction Anchor", "Friction Outlook"],
        ...deliverable.anchors.map((anchor) => [anchor.label, anchor.text]),
      ],
      maxCellCharacters: 320,
    });
  }

  addCaseStudyPdfSection(items, 7, "Recommended Action and Limitations");
  addCaseStudyPdfParagraph(
    items,
    "Use this report as the deal-level integration hypothesis. Confirm individual leadership fit before final sequencing decisions, and open a practitioner consultation when the transaction moves into integration planning.",
    { after: 8 },
  );
  addCaseStudyPdfBulletList(
    items,
    finalReport.sections.find((section) => section.id === "limitations")?.items ?? [],
  );

  addCaseStudyPdfSection(items, 8, "Final Report Structure");
  items.push({
    type: "table",
    columns: [38, 158, 272],
    rows: [
      ["No.", "Section", "Purpose"],
      ...finalReport.sections.map((section, index) => [
        String(index + 1),
        section.title,
        section.summary,
      ]),
    ],
    maxCellCharacters: 260,
  });

  addCaseStudyPdfParagraph(items, "ABOUT STRUCTURAL TYPOLOGY", {
    size: 11,
    bold: true,
    color: PDF_BRAND.navy,
    before: 12,
    after: 5,
    maxCharacters: 78,
  });
  addCaseStudyPdfParagraph(
    items,
    "Structural Typology is a predictive model of organisational behaviour applied here to M&A integration risk. Its final diagnostic output distinguishes what respondents said, what evidence supports, what evidence contradicts, what remains unknown, and where analyst interpretation is required.",
    { size: 11, color: PDF_BRAND.body, after: 8 },
  );
  items.push({
    text: "structural-typology.com  \u00b7  info@structural-typology.academy",
    size: 10,
    align: "center",
    color: PDF_BRAND.accent,
    after: 4,
    maxCharacters: 78,
  });
  items.push({
    text: `Academy of Structural Typology  \u00b7  ${generatedDate}  \u00b7  Confidential`,
    size: 9,
    align: "center",
    color: PDF_BRAND.muted,
    after: 4,
    maxCharacters: 78,
  });

  return items;
}

function finalReportCopyId(session) {
  const base = String(session?.sessionId ?? "public-preview-session").replace(/[^a-z0-9-]+/gi, "-").slice(0, 48);
  return `pdf-copy-${base}-${Date.now().toString(36)}`;
}

function createFinalDeliverablesReportPdf(deliverable, session) {
  return createSimplePdf(buildFinalDeliverablesReportLines(deliverable, session));
}

function downloadFinalDeliverablesReportPdf(deliverable, offer, session, existingPdf = null) {
  const pdf = existingPdf ?? createFinalDeliverablesReportPdf(deliverable, session);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = FINAL_DELIVERABLE_PDF_FILE_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function sendHiddenFinalDeliverablesReportCopy(deliverable, session, existingPdf = null) {
  if (!deliverable?.ready) return;

  const pdf = existingPdf ?? createFinalDeliverablesReportPdf(deliverable, session);
  const response = await fetch("/api/final-report?action=send-final-report-hidden-copy", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      reportId: finalReportCopyId(session),
      fileName: FINAL_DELIVERABLE_PDF_FILE_NAME,
      mimeType: "application/pdf",
      pdfBase64: window.btoa(pdf),
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status !== "sent") {
    throw new Error(payload?.error || "Unable to send the hidden final report copy.");
  }
}

function PaidOfferScreen({ session, variant }) {
  const deliverable = buildFinalDeliverable(session);
  const [downloadState, setDownloadState] = useState("");
  const isHomogeneous = variant === "homogeneous";
  const offer = buildPaidOffer(variant, {
    alias: isHomogeneous && deliverable.ready && deliverable.screen === "screen-10b" ? deliverable.acquirerAlias : undefined,
    deliverable: deliverable.ready ? deliverable : null,
  });
  const pairLabel = deliverable.ready
    ? `${deliverable.acquirerAlias} acquiring ${deliverable.targetAlias}`
    : "Pair context pending";

  function downloadReport() {
    if (!deliverable.ready) {
      setDownloadState("Final Deliverables are not ready for download.");
      return;
    }
    downloadFinalDeliverablesReportPdf(deliverable, offer, session);
    setDownloadState("Final Deliverables report PDF downloaded.");
  }

  return (
    <main className="screen-shell paid-offer-screen">
      <p className="eyebrow">{isHomogeneous ? "Screen 11b / Homogeneous paid offer" : "Screen 11 / Paid offer"}</p>
      <h1>{publicText(offer.header)}</h1>
      <section className="paid-context-strip">
        <strong>{pairLabel}</strong>
        <span>{offer.price}</span>
      </section>
      <div className="paid-offer-grid">
        <section className="offer-comparison-panel">
          <div className="comparison-header">
            <span>Free output</span>
            <span>Paid adds</span>
          </div>
          {offer.comparisonRows.map((row) => (
            <div className="comparison-row" key={`${row.free}-${row.paidAdds}`}>
              <p>{publicText(row.free)}</p>
              <p>{publicText(row.paidAdds)}</p>
            </div>
          ))}
        </section>
        <section className="offer-action-panel">
          <p className="eyebrow">Engagement</p>
          <strong>{offer.price}</strong>
          <p>{publicText(offer.pricingBand)}</p>
          {offer.costAnchor ? <p className="cost-anchor">{publicText(offer.costAnchor)}</p> : null}
          <div className="offer-cta-stack">
            <button type="button" className="primary-offer-cta" onClick={() => navigate("/screen-12-consultation-request")}>
              {publicText(offer.ctas.primary)}
            </button>
            <button type="button" className="secondary-offer-cta" disabled={!deliverable.ready} onClick={downloadReport}>
              {publicText(offer.ctas.secondary)}
            </button>
            {downloadState ? <p className="source-note">{downloadState}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function EmailCaptureScreen({ session, setSession }) {
  const copy = buildEmailCaptureCopy();
  const [form, setForm] = useState({ email: "", firstName: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const capture = session.emailCapture;
  const delivery = session.reportDelivery;

  if (capture?.completed && delivery?.completed) {
    return (
      <main className="screen-shell email-capture-screen">
        <p className="eyebrow">Screen 12 / Email capture</p>
        <h1>Report delivery confirmed</h1>
        <section className="email-confirmation-panel">
          <strong>{delivery.fileName}</strong>
          <span>Delivered to {capture.email}</span>
          <span>Reference: {delivery.reportId}</span>
        </section>
        <div className="button-row">
          <button type="button" onClick={() => navigate("/screen-11-paid-offer")}>Open paid offer</button>
          <button type="button" onClick={() => navigate("/")}>Start new diagnostic</button>
        </div>
      </main>
    );
  }

  function updateField(fieldId, value) {
    setForm((current) => ({ ...current, [fieldId]: value }));
    setError("");
  }

  async function submitEmailCapture(event) {
    event.preventDefault();
    if (sending) return;

    const deliverable = buildFinalDeliverable(session);
    if (!deliverable.ready) {
      setError("Final report is not ready yet.");
      return;
    }

    const capturedAt = new Date().toISOString();
    const result = attachEmailCapture(session, form, {
      capturedAt,
      deliveredAt: capturedAt,
      fileName: FINAL_DELIVERABLE_PDF_FILE_NAME,
    });
    if (!result.ok) {
      setError("Enter a valid email and first name.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const pdf = createSimplePdf(buildFinalDeliverablesReportLines(deliverable, result.session));
      const response = await fetch("/api/final-report?action=send-final-report", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail: result.emailCapture.email,
          firstName: result.emailCapture.firstName,
          reportId: result.reportDelivery.reportId,
          fileName: FINAL_DELIVERABLE_PDF_FILE_NAME,
          mimeType: "application/pdf",
          pdfBase64: window.btoa(pdf),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.status !== "sent") {
        throw new Error(payload?.error || "Unable to send the final report.");
      }

      const deliveredResult = attachEmailCapture(session, form, {
        capturedAt,
        deliveredAt: capturedAt,
        fileName: FINAL_DELIVERABLE_PDF_FILE_NAME,
        provider: payload.provider,
        messageId: payload.messageId,
        hiddenCopy: payload.hiddenCopy === true,
      });
      setSession(deliveredResult.session);
    } catch (sendError) {
      setError(sendError.message || "Unable to send the final report.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="screen-shell email-capture-screen">
      <p className="eyebrow">Screen 12 / Email capture</p>
      <h1>{copy.header}</h1>
      <form className="email-capture-panel" onSubmit={submitEmailCapture}>
        {copy.fields.map((field) => (
          <label key={field.id}>
            <span>{field.label}</span>
            <input
              autoComplete={field.id === "email" ? "email" : "given-name"}
              onChange={(event) => updateField(field.id, event.target.value)}
              type={field.id === "email" ? "email" : "text"}
              value={form[field.id]}
            />
          </label>
        ))}
        {copy.note ? <p className="source-note">{copy.note}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={sending}>{sending ? "Sending..." : copy.cta}</button>
      </form>
    </main>
  );
}

function ConsultationRequestScreen({ session, setSession }) {
  const [form, setForm] = useState(() => {
    const dealContext = session.dealContext?.data ?? {};
    const respondentRole = [
      optionTitle(RESPONDENT_SIDE_OPTIONS, dealContext.respondentSide),
      optionTitle(RESPONDENT_ROLE_OPTIONS, dealContext.respondentRole),
      optionTitle(RESPONDENT_FUNCTION_OPTIONS, dealContext.respondentFunction),
    ].filter((item) => item && item !== "Pending").join("; ");
    const dealSummary = [
      dealContext.acquirerName && dealContext.targetName ? `${dealContext.acquirerName} acquiring ${dealContext.targetName}` : "",
      dealContext.dealType ? `Deal type: ${optionTitle(DEAL_TYPE_OPTIONS, dealContext.dealType)}` : "",
      session.target2B?.finalScore?.primaryEnvironmentCode ? `Step 2-B signal: ${scoreAlias(session.target2B.finalScore)}` : "",
    ].filter(Boolean).join("\n");

    return {
      name: "",
      role: respondentRole,
      dealContext: dealSummary,
      scheduling: "",
    };
  });
  const [error, setError] = useState("");
  const request = session.consultationRequest;
  const delivery = session.consultationEmailDelivery;

  if (request?.completed && delivery?.status === "sent") {
    return (
      <main className="screen-shell email-capture-screen">
        <p className="eyebrow">Consultation request</p>
        <h1>Consultation request sent</h1>
        <section className="email-confirmation-panel">
          <strong>{delivery.subject}</strong>
          <span>Sent to {delivery.to}</span>
          <span>Reference: {delivery.messageId}</span>
        </section>
        <button type="button" onClick={() => navigate("/")}>Start new diagnostic</button>
      </main>
    );
  }

  function updateField(fieldId, value) {
    setForm((current) => ({ ...current, [fieldId]: value }));
    setError("");
  }

  function submitConsultationRequest(event) {
    event.preventDefault();
    const result = attachConsultationRequest(session, form);
    if (!result.ok) {
      setError("Complete all consultation request fields.");
      return;
    }
    setSession(result.session);
  }

  return (
    <main className="screen-shell email-capture-screen">
      <p className="eyebrow">Advisor / Other</p>
      <h1>Request consultation</h1>
      <form className="email-capture-panel" onSubmit={submitConsultationRequest}>
        {CONSULTATION_FIELDS.map((field) => (
          <label key={field.id}>
            <span>{field.label}</span>
            {field.id === "dealContext" ? (
              <textarea
                onChange={(event) => updateField(field.id, event.target.value)}
                rows={4}
                value={form[field.id]}
              />
            ) : (
              <input
                autoComplete={field.id === "name" ? "name" : "off"}
                onChange={(event) => updateField(field.id, event.target.value)}
                type="text"
                value={form[field.id]}
              />
            )}
          </label>
        ))}
        <p className="source-note">The request is sent to {CONSULTATION_RECIPIENT}.</p>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit">Send consultation request</button>
      </form>
    </main>
  );
}

function FinalDeliverablesScreen({ session, setSession }) {
  const deliverable = buildFinalDeliverable(session);
  if (!deliverable.ready) {
    return (
      <main className="screen-shell flow-screen compact-flow">
        <p className="eyebrow">Final deliverables</p>
        <h1>Final deliverables are locked</h1>
        <p className="lead">Complete the Acquirer path and verified Target self-assessment before opening Screen 10.</p>
        <button type="button" onClick={() => navigate("/screen-9a-target-code-gate")}>Open Preliminary Assessment</button>
      </main>
    );
  }

  if (deliverable.screen === "screen-10b") {
    return <HomogeneousRevealScreen session={session} deliverable={deliverable} />;
  }

  return <HeterogeneousRevealScreen session={session} setSession={setSession} deliverable={deliverable} />;
}

function PlaceholderScreen({ screen }) {
  return (
    <main className="screen-shell">
      <p className="eyebrow">{screen.id}</p>
      <h1>{screen.title}</h1>
      <p className="lead">This screen is unavailable until the required sequence gate is satisfied.</p>
      <button type="button" onClick={() => navigate("/start-diagnostic/deal-context")}>Open Deal Context</button>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState(INITIAL_SESSION);
  const screen = useCurrentRoute();
  const targetSessionId = targetSessionIdFromLocation();
  const acquirerVerificationInvite = session.acquirerVerificationInvite;

  useEffect(() => {
    if (!acquirerVerificationInvite || acquirerVerificationInvite.completed) return undefined;

    let cancelled = false;
    let completionChannel = null;

    function applyCompletion(completedInvite) {
      if (cancelled || !completedInvite) return;
      setSession((current) => attachAcquirerVerificationCompletion(current, {
        ...acquirerVerificationInvite,
        ...completedInvite,
        completed: true,
      }));
    }

    function handleCompletionEvent(event) {
      applyCompletion(parseAcquirerVerificationCompletion(event.detail));
    }

    try {
      completionChannel = new BroadcastChannel(ACQUIRER_VERIFICATION_COMPLETION_CHANNEL);
      completionChannel.onmessage = (event) => {
        applyCompletion(parseAcquirerVerificationCompletion(event.data));
      };
    } catch {
      completionChannel = null;
    }

    window.addEventListener(ACQUIRER_VERIFICATION_COMPLETION_EVENT, handleCompletionEvent);
    return () => {
      cancelled = true;
      window.removeEventListener(ACQUIRER_VERIFICATION_COMPLETION_EVENT, handleCompletionEvent);
      completionChannel?.close();
    };
  }, [acquirerVerificationInvite]);

  function renderScreen() {
    if (screen.id === "home") return <HomeScreen />;
    if (screen.id === "about-methodology") return <AboutMethodologyScreen />;
    if (screen.id === "methodology-overview") return <MethodologyOverviewScreen />;
    if (screen.id === "case-studies") return <CaseStudiesScreen />;
    if (screen.id === "case-study-detail") return <CaseStudyDetailScreen caseId={screen.caseId} />;
    if (screen.id === "interaction-environments") {
      return <EnvironmentsScreen environmentId={screen.environmentId} />;
    }
    if (screen.id === "deal-context-acquisition-motive") {
      return <AcquisitionMotiveScreen session={session} setSession={setSession} />;
    }
    if (screen.id === "deal-context-transaction-details") {
      return <TransactionDetailsScreen session={session} setSession={setSession} />;
    }
    if (screen.id === "screen-4-promise") return <PromiseScreen session={session} />;
    if (screen.id === "screen-5-acquirer-module") {
      return <AcquirerModuleScreen session={session} setSession={setSession} />;
    }
    if (screen.id === "screen-6-acquirer-submit") return <AcquirerSubmitScreen session={session} setSession={setSession} />;
    if (screen.id === "screen-6-acquirer-verification") {
      return <AuthorizedAcquirerVerificationScreen setSession={setSession} />;
    }
    if (screen.id === "screen-6a-target-observation-setup") {
      return <TargetObservationSetupIntroScreen session={session} setSession={setSession} />;
    }
    if (screen.id === "screen-6a-target-observation-setup-details") {
      return <TargetObservationSetupScreen session={session} setSession={setSession} />;
    }
    if (screen.id === "screen-6a-target-observation-authorized") {
      return <AuthorizedTargetObservationSetupScreen setSession={setSession} />;
    }
    if (screen.id === "screen-6b-target-observation") {
      return <TargetObservationScreen session={session} setSession={setSession} />;
    }
    if (screen.id === "screen-7-step-2b-level-1") {
      return <Step2BLevel1Screen session={session} setSession={setSession} />;
    }
    if (screen.id === "screen-8-step-2b-transition") return <Step2BTransitionScreen session={session} />;
    if (screen.id === "screen-9-step-2b-level-2") {
      return <Step2BLevel2Screen session={session} setSession={setSession} />;
    }
    if (screen.id === "screen-2c-target-self-assessment") {
      return <TargetSelfAssessmentDirectScreen session={session} setSession={setSession} />;
    }
    if (screen.id === "screen-9a-target-code-gate") {
      if (targetSessionId) {
        return <TargetCodeEntryScreen session={session} setSession={setSession} targetSessionId={targetSessionId} />;
      }
      return <PreliminaryTargetGateScreen session={session} setSession={setSession} />;
    }
    if (screen.id === "screen-10-reveal" || screen.id === "screen-10b-homogeneous") {
      return <FinalDeliverablesScreen session={session} setSession={setSession} />;
    }
    if (screen.id === "screen-11-paid-offer") {
      return <PaidOfferScreen session={session} variant="heterogeneous" />;
    }
    if (screen.id === "screen-11b-homogeneous-offer") {
      return <PaidOfferScreen session={session} variant="homogeneous" />;
    }
    if (screen.id === "screen-12-email-capture") {
      return <EmailCaptureScreen session={session} setSession={setSession} />;
    }
    if (screen.id === "screen-12-consultation-request") {
      return <ConsultationRequestScreen session={session} setSession={setSession} />;
    }
    return <PlaceholderScreen screen={screen} />;
  }

  const isTargetStandaloneRoute = (screen.id === "screen-9a-target-code-gate" && Boolean(targetSessionId))
    || screen.id === "screen-2c-target-self-assessment"
    || screen.id === "screen-6-acquirer-verification"
    || screen.id === "screen-6a-target-observation-authorized";

  if (isTargetStandaloneRoute) {
    return renderScreen();
  }

  return (
    <>
      <SiteSidebar currentRoute={screen.route} />
      {renderScreen()}
    </>
  );
}
