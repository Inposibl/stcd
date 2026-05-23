/* @jsxRuntime classic */
// @ts-ignore This JavaScript-first repo does not install @types/react.
import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: string]: any;
    }
  }
}

export interface ReportData {
  meta: {
    org: string;
    reportType: string;
    subtitle: string;
    date: string;
    dealOneLiner: string;
    site: string;
    contactEmail: string;
    confidentiality: string;
    confidenceDisclaimer: string;
    nonMoralizationNote?: string;
  };
  title: {
    acquirerPattern: string;
    targetEnv: string;
  };
  score: {
    value: number;
    band: string;
    note: string;
  };
  executiveSummary: {
    lead?: string;
    body: string;
    oneThingToWatch: string;
    headlineRisk: string;
  };
  dealScenario: {
    acquirer: string;
    target: string;
    dealType: string;
    motive: string;
    whyItMatters: string;
  };
  environments: {
    acquirer: {
      name: string;
      description: string;
    };
    target: {
      name: string;
      description: string;
    };
  };
  collision: {
    point: string;
    interpretation: string;
  }[];
  timeline: {
    window: string;
    whatSurfaces: string;
    inTheRoom: string;
  }[];
  watch: {
    day30Signal: string;
    day90: string[];
    day180: string[];
  };
  actions: {
    beforeClose: string[];
    afterClose: string[];
  };
  fullEngagement: {
    addition: string;
    whatChanges: string;
  }[];
  closingLine?: string;
}

type BandTone = {
  accent: string;
  background: string;
};

export type ReportDiagnostics = {
  dedupedTimelineItems: string[];
  dataDefectFields: string[];
};

const BAND_TONES: Record<string, BandTone> = {
  LOW: { accent: "#2E6B3E", background: "#E6F0E8" },
  MODERATE: { accent: "#1F5B86", background: "#E4EEF6" },
  "MODERATE-HIGH": { accent: "#9A6A12", background: "#F4ECDD" },
  HIGH: { accent: "#9A3324", background: "#F6E5E1" },
};

const REPORT_STYLES = `
.st-public-report {
  --st-report-ink: #1A2332;
  --st-report-body: #23262B;
  --st-report-muted: #6B7178;
  --st-report-paper: #FAFAF8;
  --st-report-panel: #FFFFFF;
  --st-report-rule: rgba(26, 35, 50, .12);
  --st-report-backdrop: #ECEBE7;
  --st-report-accent: #9A6A12;
  --st-report-accent-bg: #F4ECDD;
  background: var(--st-report-backdrop);
  color: var(--st-report-body);
  font-family: Helvetica, "Helvetica Neue", Arial, sans-serif;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.6;
  padding: 32px 18px;
}

.st-public-report,
.st-public-report * {
  box-sizing: border-box;
}

.st-public-report__page {
  background: var(--st-report-paper);
  box-shadow: 0 18px 55px rgba(26, 35, 50, .14);
  display: flex;
  flex-direction: column;
  margin: 0 auto 32px;
  min-height: 297mm;
  padding: 22mm;
  position: relative;
  width: min(100%, 210mm);
}

.st-public-report__page:last-of-type {
  margin-bottom: 0;
}

.st-public-report__cover {
  justify-content: space-between;
}

.st-public-report__measure {
  max-width: 70ch;
}

.st-public-report__cover-top {
  border-top: 1px solid var(--st-report-ink);
  padding-top: 28px;
}

.st-public-report__eyebrow,
.st-public-report__section-kicker,
.st-public-report__small-label {
  color: var(--st-report-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .14em;
  line-height: 1.35;
  text-transform: uppercase;
}

.st-public-report h1,
.st-public-report h2,
.st-public-report h3,
.st-public-report p {
  margin: 0;
}

.st-public-report h1 {
  color: var(--st-report-ink);
  font-size: clamp(38px, 6vw, 64px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: .98;
  margin-top: 24px;
  max-width: 12ch;
}

.st-public-report__title-link {
  color: var(--st-report-muted);
  display: block;
  font-size: .46em;
  font-weight: 400;
  line-height: 1.25;
  margin: 12px 0;
}

.st-public-report__subtitle {
  color: var(--st-report-muted);
  font-size: 14px;
  line-height: 1.5;
  margin-top: 22px;
}

.st-public-report__deal-line {
  border-top: 1px solid var(--st-report-rule);
  color: var(--st-report-body);
  font-size: 18px;
  line-height: 1.45;
  margin-top: 40px;
  max-width: 34ch;
  padding-top: 22px;
}

.st-public-report__score-hero {
  align-items: flex-start;
  border-bottom: 1px solid var(--st-report-rule);
  border-top: 1px solid var(--st-report-rule);
  display: flex;
  gap: 24px;
  justify-content: space-between;
  margin-top: 48px;
  padding: 24px 0;
}

.st-public-report__score-number {
  color: var(--st-report-accent);
  font-size: 88px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: .86;
}

.st-public-report__score-number--inline {
  font-size: 34px;
  line-height: 1;
}

.st-public-report__score-label {
  color: var(--st-report-muted);
  font-size: 11px;
  letter-spacing: .13em;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.st-public-report__band-pill {
  background: var(--st-report-accent-bg);
  border: 1px solid color-mix(in srgb, var(--st-report-accent), transparent 55%);
  color: var(--st-report-accent);
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  line-height: 1;
  padding: 9px 12px;
  text-transform: uppercase;
}

.st-public-report__cover-note {
  color: var(--st-report-muted);
  font-size: 12px;
  margin-top: 18px;
  max-width: 58ch;
}

.st-public-report__footer {
  border-top: 1px solid var(--st-report-rule);
  color: var(--st-report-muted);
  display: flex;
  font-size: 11px;
  gap: 12px;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 14px;
}

.st-public-report__print-footer {
  display: none;
}

.st-public-report__section {
  break-inside: auto;
  margin-bottom: 36px;
}

.st-public-report__section:last-child {
  margin-bottom: 0;
}

.st-public-report__section-header {
  break-after: avoid;
  margin-bottom: 18px;
}

.st-public-report h2 {
  color: var(--st-report-ink);
  font-size: 25px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.18;
  margin-top: 7px;
}

.st-public-report h3 {
  color: var(--st-report-ink);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.35;
}

.st-public-report__body-copy,
.st-public-report__body-copy p {
  color: var(--st-report-body);
  max-width: 70ch;
}

.st-public-report__body-copy p + p {
  margin-top: 12px;
}

.st-public-report__callout,
.st-public-report__pull-line,
.st-public-report__signal,
.st-public-report__panel,
.st-public-report__timeline-card {
  break-inside: avoid;
}

.st-public-report__callout {
  border-left: 3px solid var(--st-report-accent);
  margin-top: 24px;
  padding: 3px 0 3px 18px;
}

.st-public-report__callout-title {
  color: var(--st-report-ink);
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 5px;
}

.st-public-report__pull-line {
  border-bottom: 1px solid var(--st-report-rule);
  border-top: 1px solid var(--st-report-rule);
  color: var(--st-report-ink);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.5;
  margin-top: 26px;
  padding: 16px 0;
}

.st-public-report__field-table,
.st-public-report__comparison-table,
.st-public-report__engagement-table {
  border-collapse: collapse;
  width: 100%;
}

.st-public-report__field-table th,
.st-public-report__field-table td,
.st-public-report__comparison-table th,
.st-public-report__comparison-table td,
.st-public-report__engagement-table th,
.st-public-report__engagement-table td {
  padding: 12px 0;
  text-align: left;
  vertical-align: top;
}

.st-public-report__field-table th {
  color: var(--st-report-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  padding-right: 28px;
  text-transform: uppercase;
  width: 30%;
}

.st-public-report__field-table td {
  border-bottom: 1px solid var(--st-report-rule);
  color: var(--st-report-body);
}

.st-public-report__comparison-table thead th,
.st-public-report__engagement-table thead th {
  border-bottom: 1px solid var(--st-report-ink);
  color: var(--st-report-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
  padding-bottom: 9px;
  text-transform: uppercase;
}

.st-public-report__comparison-table tbody th,
.st-public-report__comparison-table tbody td,
.st-public-report__engagement-table tbody th,
.st-public-report__engagement-table tbody td {
  border-bottom: 1px solid var(--st-report-rule);
}

.st-public-report__comparison-table tbody th {
  color: var(--st-report-ink);
  font-weight: 700;
  padding-right: 24px;
  width: 31%;
}

.st-public-report__engagement-table tbody th {
  color: var(--st-report-ink);
  font-weight: 700;
  padding-right: 24px;
  width: 30%;
}

.st-public-report__environment-stack {
  display: grid;
  gap: 16px;
}

.st-public-report__panel {
  background: var(--st-report-panel);
  border: 1px solid var(--st-report-rule);
  padding: 20px;
}

.st-public-report__panel-label {
  color: var(--st-report-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
  margin-bottom: 7px;
  text-transform: uppercase;
}

.st-public-report__panel p {
  margin-top: 10px;
}

.st-public-report__score-inline {
  align-items: center;
  display: flex;
  gap: 16px;
  margin-bottom: 14px;
}

.st-public-report__timeline {
  display: grid;
  gap: 0;
  margin-top: 6px;
}

.st-public-report__timeline-item {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  position: relative;
}

.st-public-report__timeline-marker {
  position: relative;
}

.st-public-report__timeline-marker::before {
  background: var(--st-report-accent);
  border: 3px solid var(--st-report-paper);
  box-shadow: 0 0 0 1px var(--st-report-accent);
  content: "";
  height: 10px;
  left: 3px;
  position: absolute;
  top: 22px;
  width: 10px;
}

.st-public-report__timeline-marker::after {
  background: var(--st-report-rule);
  content: "";
  left: 7px;
  position: absolute;
  top: 36px;
  bottom: -22px;
  width: 1px;
}

.st-public-report__timeline-item:last-child .st-public-report__timeline-marker::after {
  display: none;
}

.st-public-report__timeline-card {
  background: var(--st-report-panel);
  border: 1px solid var(--st-report-rule);
  margin-bottom: 18px;
  padding: 18px;
}

.st-public-report__timeline-window {
  color: var(--st-report-ink);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .08em;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.st-public-report__timeline-label {
  color: var(--st-report-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  margin: 14px 0 4px;
  text-transform: uppercase;
}

.st-public-report__signal {
  background: var(--st-report-accent-bg);
  border-left: 4px solid var(--st-report-accent);
  margin-bottom: 22px;
  padding: 16px 18px;
}

.st-public-report__columns {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.st-public-report__list-block {
  background: var(--st-report-panel);
  border-top: 1px solid var(--st-report-rule);
  padding-top: 15px;
}

.st-public-report ul {
  margin: 10px 0 0;
  padding-left: 18px;
}

.st-public-report li + li {
  margin-top: 8px;
}

.st-public-report__closing-line {
  border-top: 1px solid var(--st-report-rule);
  color: var(--st-report-ink);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
  margin-top: 22px;
  padding-top: 16px;
}

.st-public-report__disclaimer {
  color: var(--st-report-muted);
  font-size: 12px;
  margin-top: 14px;
}

@media (max-width: 760px) {
  .st-public-report {
    padding: 0;
  }

  .st-public-report__page {
    box-shadow: none;
    margin-bottom: 0;
    min-height: auto;
    padding: 28px 20px;
    width: 100%;
  }

  .st-public-report h1 {
    font-size: 38px;
    max-width: 100%;
  }

  .st-public-report__score-hero,
  .st-public-report__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .st-public-report__score-number {
    font-size: 70px;
  }

  .st-public-report__columns {
    grid-template-columns: 1fr;
  }

  .st-public-report__field-table th,
  .st-public-report__field-table td,
  .st-public-report__comparison-table th,
  .st-public-report__comparison-table td,
  .st-public-report__engagement-table th,
  .st-public-report__engagement-table td {
    display: block;
    width: 100%;
  }

  .st-public-report__field-table th,
  .st-public-report__comparison-table tbody th,
  .st-public-report__engagement-table tbody th {
    padding-bottom: 4px;
  }

  .st-public-report__comparison-table thead,
  .st-public-report__engagement-table thead {
    display: none;
  }
}

@page {
  size: A4;
  margin: 20mm;
}

@media print {
  .st-public-report {
    background: var(--st-report-paper);
    padding: 0;
  }

  .st-public-report__page {
    box-shadow: none;
    margin: 0;
    min-height: auto;
    padding: 0;
    width: auto;
  }

  .st-public-report__page + .st-public-report__page {
    break-before: page;
    page-break-before: always;
  }

  .st-public-report__section-header,
  .st-public-report h2,
  .st-public-report h3 {
    break-after: avoid;
    page-break-after: avoid;
  }

  .st-public-report__callout,
  .st-public-report__pull-line,
  .st-public-report__panel,
  .st-public-report__timeline-card,
  .st-public-report__signal,
  .st-public-report__list-block {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .st-public-report p {
    orphans: 3;
    widows: 3;
  }

  .st-public-report__footer {
    display: none;
  }

  .st-public-report__print-footer {
    border-top: 1px solid var(--st-report-rule);
    bottom: 0;
    color: var(--st-report-muted);
    display: block;
    font-size: 10px;
    left: 0;
    padding-top: 4px;
    position: fixed;
    right: 0;
  }

  /* True per-page numbering requires a server-side PDF render or paged-media counter support. */
}
`;

function normalizeBandKey(band: string): string {
  const normalized = String(band ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s*[–—-]\s*/g, "-")
    .replace(/\s+/g, "-");

  if (normalized === "MODERATE-HIGH") return "MODERATE-HIGH";
  if (normalized.includes("MODERATE-HIGH")) return "MODERATE-HIGH";
  if (normalized.includes("MODERATE")) return "MODERATE";
  if (normalized.includes("LOW")) return "LOW";
  if (normalized.includes("HIGH")) return "HIGH";
  return "MODERATE";
}

function toneForBand(band: string): BandTone {
  return BAND_TONES[normalizeBandKey(band)] ?? BAND_TONES.MODERATE;
}

function textHasLikelyTemplateMergeArtifact(value: string): boolean {
  const text = String(value ?? "").trim();
  if (!text) return false;

  const patterns = [
    /interpreted through\s+Decisions are made by/i,
    /\b(?:through|by|with|from|to|for|of|as|when|while|because|where|that|which)\s*$/i,
    /\b(?:through|by|with)\s+(?:Decisions|Decision-making|Authority|Leadership|Trust|Innovation)\s+(?:are|is|belongs|feels|follows)\b/i,
    /[a-z,]\s+(?:Decisions are made by|Decisions are made through|Authority belongs to|Leadership feels normal when)\b/,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

function collectDataDefects(data: ReportData): string[] {
  const defects: string[] = [];
  const check = (path: string, value: string) => {
    if (textHasLikelyTemplateMergeArtifact(value)) defects.push(path);
  };

  check("environments.acquirer.description", data.environments.acquirer.description);
  check("environments.target.description", data.environments.target.description);
  check("executiveSummary.body", data.executiveSummary.body);
  data.collision.forEach((item, index) => check(`collision[${index}].interpretation`, item.interpretation));
  data.timeline.forEach((item, index) => {
    check(`timeline[${index}].whatSurfaces`, item.whatSurfaces);
    check(`timeline[${index}].inTheRoom`, item.inTheRoom);
  });

  return defects;
}

function collectTimelineDedupes(data: ReportData): string[] {
  return data.timeline
    .map((item, index) => (
      item.whatSurfaces.trim() === item.inTheRoom.trim()
        ? `timeline[${index}]`
        : ""
    ))
    .filter(Boolean);
}

export function getReportDiagnostics(data: ReportData): ReportDiagnostics {
  return {
    dedupedTimelineItems: collectTimelineDedupes(data),
    dataDefectFields: collectDataDefects(data),
  };
}

const warnedReports = new WeakSet<ReportData>();

function emitDataDefectWarnings(data: ReportData, diagnostics: ReportDiagnostics) {
  if (warnedReports.has(data)) return;
  warnedReports.add(data);

  for (const fieldPath of diagnostics.dataDefectFields) {
    console.warn(`[PublicFinalDeliverablesReport] Possible data defect at ${fieldPath}. Rendering source text unchanged.`);
  }
}

function splitParagraphs(value: string) {
  return String(value ?? "")
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="st-public-report__body-copy">
      {splitParagraphs(text).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

function BandPill({ band }: { band: string }) {
  return <span className="st-public-report__band-pill">{band}</span>;
}

function SectionHeader({ id, number, title }: { id: string; number: string; title: string }) {
  return (
    <div className="st-public-report__section-header">
      <div className="st-public-report__section-kicker">{number}</div>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function Footer({ data }: { data: ReportData }) {
  return (
    <footer className="st-public-report__footer">
      <span>{data.meta.site} · {data.meta.contactEmail}</span>
      <span>{data.meta.confidentiality}</span>
    </footer>
  );
}

function PrintFooter({ data }: { data: ReportData }) {
  return (
    <div className="st-public-report__print-footer" aria-hidden="true">
      {data.meta.site} · {data.meta.confidentiality}
    </div>
  );
}

function ScoreHero({ data }: { data: ReportData }) {
  return (
    <div className="st-public-report__score-hero" aria-label="Compatibility score">
      <div>
        <div className="st-public-report__score-label">Compatibility score</div>
        <div className="st-public-report__score-number">{data.score.value}</div>
      </div>
      <BandPill band={data.score.band} />
    </div>
  );
}

function Cover({ data }: { data: ReportData }) {
  return (
    <header className="st-public-report__page st-public-report__cover">
      <div className="st-public-report__cover-top">
        <div className="st-public-report__eyebrow">{data.meta.org}</div>
        <h1>
          {data.title.acquirerPattern}
          <span className="st-public-report__title-link">acquiring</span>
          {data.title.targetEnv}
        </h1>
        <p className="st-public-report__subtitle">
          {data.meta.reportType} · {data.meta.subtitle} · {data.meta.date}
        </p>
        <p className="st-public-report__deal-line">{data.meta.dealOneLiner}</p>
        <ScoreHero data={data} />
        {data.meta.nonMoralizationNote ? (
          <p className="st-public-report__cover-note">{data.meta.nonMoralizationNote}</p>
        ) : null}
      </div>
      <Footer data={data} />
    </header>
  );
}

function ExecutiveSummary({ data }: { data: ReportData }) {
  return (
    <section className="st-public-report__section" aria-labelledby="st-public-report-executive-summary">
      <SectionHeader
        id="st-public-report-executive-summary"
        number="01"
        title={data.executiveSummary.lead ?? "Executive Summary"}
      />
      <Paragraphs text={data.executiveSummary.body} />
      <aside className="st-public-report__callout">
        <div className="st-public-report__callout-title">The one thing to watch</div>
        <p>{data.executiveSummary.oneThingToWatch}</p>
      </aside>
      <p className="st-public-report__pull-line">{data.executiveSummary.headlineRisk}</p>
    </section>
  );
}

function DealScenario({ data }: { data: ReportData }) {
  const rows = [
    ["Acquirer", data.dealScenario.acquirer],
    ["Target", data.dealScenario.target],
    ["Deal type", data.dealScenario.dealType],
    ["Acquisition motive", data.dealScenario.motive],
    ["Why this matters", data.dealScenario.whyItMatters],
  ];

  return (
    <section className="st-public-report__section" aria-labelledby="st-public-report-deal-scenario">
      <SectionHeader id="st-public-report-deal-scenario" number="02" title="Deal Scenario" />
      <table className="st-public-report__field-table" aria-label="Deal scenario">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Environments({ data }: { data: ReportData }) {
  const panels = [
    ["Acquirer environment", data.environments.acquirer],
    ["Target environment", data.environments.target],
  ] as const;

  return (
    <section className="st-public-report__section" aria-labelledby="st-public-report-environments">
      <SectionHeader id="st-public-report-environments" number="03" title="The Two Environments" />
      <div className="st-public-report__environment-stack">
        {panels.map(([label, environment]) => (
          <div className="st-public-report__panel" key={label}>
            <div className="st-public-report__panel-label">{label}</div>
            <h3>{environment.name}</h3>
            <p>{environment.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Collision({ data }: { data: ReportData }) {
  return (
    <section className="st-public-report__section" aria-labelledby="st-public-report-collision">
      <SectionHeader id="st-public-report-collision" number="04" title="Why These Two Environments Collide" />
      <table className="st-public-report__comparison-table">
        <thead>
          <tr>
            <th scope="col">Point</th>
            <th scope="col">Interpretation</th>
          </tr>
        </thead>
        <tbody>
          {data.collision.map((row) => (
            <tr key={row.point}>
              <th scope="row">{row.point}</th>
              <td>{row.interpretation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CompatibilityScore({ data }: { data: ReportData }) {
  return (
    <section className="st-public-report__section" aria-labelledby="st-public-report-score">
      <SectionHeader id="st-public-report-score" number="05" title="Compatibility Score" />
      <div className="st-public-report__score-inline">
        <div className="st-public-report__score-number st-public-report__score-number--inline">{data.score.value}</div>
        <BandPill band={data.score.band} />
      </div>
      <Paragraphs text={data.score.note} />
    </section>
  );
}

function Timeline({ data }: { data: ReportData }) {
  return (
    <section className="st-public-report__section" aria-labelledby="st-public-report-timeline">
      <SectionHeader id="st-public-report-timeline" number="06" title="What Will Happen After Close" />
      <div className="st-public-report__timeline">
        {data.timeline.map((item, index) => {
          const isDeduped = item.whatSurfaces.trim() === item.inTheRoom.trim();
          return (
            <article className="st-public-report__timeline-item" key={`${item.window}-${index}`}>
              <div className="st-public-report__timeline-marker" aria-hidden="true" />
              <div className="st-public-report__timeline-card">
                <div className="st-public-report__timeline-window">{item.window}</div>
                {isDeduped ? (
                  <p>{item.whatSurfaces}</p>
                ) : (
                  <>
                    <div className="st-public-report__timeline-label">What surfaces</div>
                    <p>{item.whatSurfaces}</p>
                    <div className="st-public-report__timeline-label">In the room</div>
                    <p>{item.inTheRoom}</p>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function WatchList({ data }: { data: ReportData }) {
  return (
    <section className="st-public-report__section" aria-labelledby="st-public-report-watch">
      <SectionHeader id="st-public-report-watch" number="07" title="What to Watch — and When" />
      <div className="st-public-report__signal">
        <div className="st-public-report__small-label">30-day decisive signal</div>
        <p>{data.watch.day30Signal}</p>
      </div>
      <div className="st-public-report__columns">
        <div className="st-public-report__list-block">
          <h3>90-day checks</h3>
          <BulletList items={data.watch.day90} />
        </div>
        <div className="st-public-report__list-block">
          <h3>180-day checks</h3>
          <BulletList items={data.watch.day180} />
        </div>
      </div>
    </section>
  );
}

function Actions({ data }: { data: ReportData }) {
  return (
    <section className="st-public-report__section" aria-labelledby="st-public-report-actions">
      <SectionHeader id="st-public-report-actions" number="08" title="Recommended Actions" />
      <div className="st-public-report__columns">
        <div className="st-public-report__list-block">
          <h3>Before close</h3>
          <BulletList items={data.actions.beforeClose} />
        </div>
        <div className="st-public-report__list-block">
          <h3>After close</h3>
          <BulletList items={data.actions.afterClose} />
        </div>
      </div>
    </section>
  );
}

function FullEngagement({ data }: { data: ReportData }) {
  return (
    <section className="st-public-report__section" aria-labelledby="st-public-report-full-engagement">
      <SectionHeader id="st-public-report-full-engagement" number="09" title="What the Full Engagement Adds" />
      <table className="st-public-report__engagement-table">
        <thead>
          <tr>
            <th scope="col">Addition</th>
            <th scope="col">What changes</th>
          </tr>
        </thead>
        <tbody>
          {data.fullEngagement.map((row) => (
            <tr key={row.addition}>
              <th scope="row">{row.addition}</th>
              <td>{row.whatChanges}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.closingLine ? <p className="st-public-report__closing-line">{data.closingLine}</p> : null}
      <p className="st-public-report__disclaimer">{data.meta.confidenceDisclaimer}</p>
    </section>
  );
}

export function ReportDocument({ data }: { data: ReportData }) {
  const tone = toneForBand(data.score.band);
  const diagnostics = getReportDiagnostics(data);
  emitDataDefectWarnings(data, diagnostics);

  const rootStyle = {
    "--st-report-accent": tone.accent,
    "--st-report-accent-bg": tone.background,
  } as Record<string, string>;

  return (
    <article className="st-public-report" style={rootStyle} aria-label={data.meta.reportType}>
      <style>{REPORT_STYLES}</style>
      <PrintFooter data={data} />
      <Cover data={data} />
      <main>
        <div className="st-public-report__page">
          <ExecutiveSummary data={data} />
          <DealScenario data={data} />
          <Environments data={data} />
          <Footer data={data} />
        </div>
        <div className="st-public-report__page">
          <Collision data={data} />
          <CompatibilityScore data={data} />
          <Timeline data={data} />
          <Footer data={data} />
        </div>
        <div className="st-public-report__page">
          <WatchList data={data} />
          <Actions data={data} />
          <FullEngagement data={data} />
          <Footer data={data} />
        </div>
      </main>
    </article>
  );
}

export const mockReport: ReportData = {
  meta: {
    org: "Academy of Structural Typology",
    reportType: "Public Final Deliverables Report",
    subtitle: "M&A Post-Deal Behavior Forecast",
    date: "May 22, 2026",
    dealOneLiner: "your organisation acquiring your target",
    site: "www.structural-typology.com",
    contactEmail: "info@structural-typology.academy",
    confidentiality: "Confidential",
    confidenceDisclaimer: "Preliminary, structure-based forecast; medium confidence; confirm individual leadership fit before final sequencing.",
  },
  title: {
    acquirerPattern: "Enforcement-Dominance Operating Pattern",
    targetEnv: "The Disruption Lab",
  },
  score: {
    value: 74,
    band: "Moderate-High",
    note: "A score of 74 is a specification, not a verdict. It identifies where integration pressure is most likely to surface and where management action should be focused first.",
  },
  executiveSummary: {
    lead: "Force authority eliminating the empirical test authority that makes The Disruption Lab work.",
    body: "Your target's authority belongs to whoever's solution works in a live test — a fundamentally symmetric mechanism where the data decides. Your authority belongs to whoever can enforce compliance through demonstrated strength. When these meet, your target's test-result authority is subordinated to your force authority. Results that challenge your position are overridden. The empirical mechanism stops functioning — not because people stop running experiments, but because experiments stop mattering.",
    oneThingToWatch: "Within 30 days: observe how you respond to the first empirical test result that contradicts a position held by a senior figure in your governance structure. If the test result is overridden by authority assertion rather than counter-evidence, the empirical mechanism has been eliminated.",
    headlineRisk: "The Disruption Lab's highest-value practitioners — those who joined specifically because the data decides — will exit within 9 months of the first overridden result.",
  },
  dealScenario: {
    acquirer: "your organisation",
    target: "your target",
    dealType: "Not specified",
    motive: "Not specified",
    whyItMatters: "The deal depends on whether your organisation can preserve the target capability while changing the operating environment around it.",
  },
  environments: {
    acquirer: {
      name: "Enforcement-Dominance Operating Pattern",
      description: "Decision-making follows enforcement priority, risk containment, and protection of the chain of command. It rewards Authority, territory, status, security, money, and will. It resists moves that undermine this role: Hardens boundaries and prevents leakage when the system believes control is more important than adaptation. Authority belongs to those who control access, sanctions, territory, and institutional permissions.",
    },
    target: {
      name: "The Disruption Lab",
      description: "Leadership feels normal when Authority belongs to the person who can solve the live problem fastest and expose the useful lever. Trust, loyalty, conflict, and pressure are interpreted through Decisions are made by testing, pressure, and immediate feedback from the operating reality. Innovation is native; untested assumptions are challenged through rapid trials and direct intervention. Prevents stagnation by attacking constraints and forcing the system to adapt quickly.",
    },
  },
  collision: [
    {
      point: "Where they fit naturally",
      interpretation: "Enforcement-Dominance Operating Pattern can still create value with The Disruption Lab when the deal protects knowledge, trust, and creativity instead of forcing immediate operating sameness.",
    },
    {
      point: "Where they misread each other",
      interpretation: "Empirical authority versus force authority. The Disruption Lab grants authority to whoever's solution works in a live test. Enforcement-Dominance Operating Pattern grants authority through demonstrated force.",
    },
    {
      point: "The post-deal behavioural risk",
      interpretation: "The Disruption Lab's highest-value practitioners — those who joined specifically because the data decides — will exit within 9 months of the first overridden result.",
    },
    {
      point: "Same management action, two opposite readings",
      interpretation: "The same control action can read as normal discipline inside Enforcement-Dominance Operating Pattern and as a loss of legitimate operating space inside The Disruption Lab.",
    },
  ],
  timeline: [
    {
      window: "Days 30-60",
      whatSurfaces: "Empirical authority versus force authority. The Disruption Lab grants authority to whoever's solution works in a live test. Enforcement-Dominance Operating Pattern grants authority through demonstrated force. Enforcement-Dominance Operating Pattern acquirers cannot operate inside The Disruption Lab's empirical test mechanism — the test result does not carry authority in Enforcement-Dominance Operating Pattern terms unless it also demonstrates power. The Disruption Lab participants who win empirical tests but cannot project dominance find their results ignored.",
      inTheRoom: "Within 30 days: observe how Enforcement-Dominance Operating Pattern management responds to the first empirical test result that contradicts a senior figure's position. If the test result is overridden by authority assertion rather than counter-evidence, the empirical test mechanism — The Disruption Lab's core decision authority — has been eliminated.",
    },
    {
      window: "Months 2-6",
      whatSurfaces: "Failure tolerance elimination. The Disruption Lab's highest value is not-testing as failure. Enforcement-Dominance Operating Pattern makes no distinction between intelligent and unintelligent failure — failure is weakness, and weakness is the primary selection criterion for elimination. Enforcement-Dominance Operating Pattern governance eliminates The Disruption Lab's failure-tolerance infrastructure within months, making experimentation too personally costly to sustain.",
      inTheRoom: "Enforcement-Dominance Operating Pattern makes no distinction between intelligent and unintelligent failure — failure is weakness, and weakness is the primary selection criterion for elimination. Enforcement-Dominance Operating Pattern governance eliminates The Disruption Lab's failure-tolerance infrastructure within months, making experimentation too personally costly to sustain.",
    },
    {
      window: "Months 6-18",
      whatSurfaces: "Technical expertise devaluation. The Disruption Lab's authority hierarchy is built on demonstrated technical and physical competence — the person who can actually do the thing. Enforcement-Dominance Operating Pattern's hierarchy is built on demonstrated dominance. These are different selection criteria that produce different people at the top. Enforcement-Dominance Operating Pattern acquirers systematically displace The Disruption Lab's technical leadership with dominance-based leadership, producing organisations that maintain the appearance of technical competence while losing its substance.",
      inTheRoom: "The Disruption Lab's authority hierarchy is built on demonstrated technical and physical competence — the person who can actually do the thing. Enforcement-Dominance Operating Pattern's hierarchy is built on demonstrated dominance. These are different selection criteria that produce different people at the top. Enforcement-Dominance Operating Pattern acquirers systematically displace The Disruption Lab's technical leadership with dominance-based leadership, producing organisations that maintain the appearance of technical competence while losing its substance.",
    },
  ],
  watch: {
    day30Signal: "Within 30 days: observe how Enforcement-Dominance Operating Pattern management responds to the first empirical test result that contradicts a senior figure's position. If the test result is overridden by authority assertion rather than counter-evidence, the empirical test mechanism — The Disruption Lab's core decision authority — has been eliminated.",
    day90: [
      "Failure tolerance elimination.",
      "The Disruption Lab's highest value is not-testing as failure.",
      "Enforcement-Dominance Operating Pattern makes no distinction between intelligent and unintelligent failure — failure is weakness, and weakness is the primary selection criterion for elimination.",
    ],
    day180: [
      "Technical expertise devaluation.",
      "The Disruption Lab's authority hierarchy is built on demonstrated technical and physical competence — the person who can actually do the thing.",
      "Enforcement-Dominance Operating Pattern's hierarchy is built on demonstrated dominance.",
    ],
  },
  actions: {
    beforeClose: [
      "Confirm whether this signal is already visible in diligence: Within 30 days: observe how Enforcement-Dominance Operating Pattern management responds to the first empirical test result that contradicts a senior figure's position.",
      "Name the owner for knowledge, trust, and creativity before the first integration decisions are announced.",
      "Separate what must be standardised immediately from what should remain locally stable through the first operating cycle.",
    ],
    afterClose: [
      "Run the first signal review before day 30 and treat silence, delay, or defensive agreement as data.",
      "Protect knowledge, trust, and creativity until the combined leadership team has a shared decision rhythm.",
      "Convert the forecast into decision rights, escalation rules, and review cadence before routines are merged.",
    ],
  },
  fullEngagement: [
    {
      addition: "Confirmation",
      whatChanges: "The environment read is confirmed against the full evidence record and the leadership context of the actual deal.",
    },
    {
      addition: "Named people",
      whatChanges: "The forecast is translated into which leaders are likely to thrive, stall, resist, or leave under the planned operating model.",
    },
    {
      addition: "A protocol",
      whatChanges: "The forecast becomes sequencing, decision rights, escalation rules, and monitoring cadence for the first integration cycle.",
    },
  ],
  closingLine: "The logical next step is to confirm the forecast against named leadership roles before final sequencing.",
};
