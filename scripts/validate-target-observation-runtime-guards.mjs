import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const checks = [];

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function addCheck(label, fn) {
  checks.push({ label, fn });
}

function includesAll(source, patterns) {
  return patterns.every((pattern) => source.includes(pattern));
}

function section(source, startPattern, endPattern) {
  const start = source.indexOf(startPattern);
  assert.notEqual(start, -1, `Missing section start: ${startPattern}`);
  const end = source.indexOf(endPattern, start + startPattern.length);
  assert.notEqual(end, -1, `Missing section end after ${startPattern}: ${endPattern}`);
  return source.slice(start, end);
}

function functionSection(source, functionName) {
  const startPattern = `function ${functionName}`;
  const start = source.indexOf(startPattern);
  assert.notEqual(start, -1, `Missing function: ${functionName}`);
  const nextFunction = source.indexOf("\nfunction ", start + startPattern.length);
  return source.slice(start, nextFunction === -1 ? source.length : nextFunction);
}

function routeHasNodeResponseContract(path) {
  const source = read(path);
  const label = path;
  assert.match(
    source,
    /export default async function handler\(\s*req(?:\s*:\s*NodeApiRequest)?\s*,\s*res(?:\s*:\s*NodeApiResponse)?\s*\)/,
    `${label} must use handler(req, res) or typed NodeApiRequest/NodeApiResponse parameters`,
  );
  assert.match(source, /res\.status\([^)]*\)\.json\(/, `${label} must send JSON through res.status(...).json(...)`);
  assert.equal(source.includes("jsonResponse"), false, `${label} must not use jsonResponse`);
  assert.equal(source.includes("methodNotAllowed"), false, `${label} must not use methodNotAllowed`);
  assert.equal(source.includes("new Response"), false, `${label} must not create Web Response objects`);
}

const app = read("src/App.jsx");
const ledger = read("api/_sessionLedger.ts");
const packageJson = JSON.parse(read("package.json"));

addCheck("External respondent receipt is blocked until server save succeeds", () => {
  const submitCompletion = functionSection(app, "submitAuthorizedObservationCompletion");
  assert.match(submitCompletion, /const response = await fetch\("\/api\/submit-target-observation"/);
  assert.match(submitCompletion, /if \(!response\.ok\) \{\s*throw new Error/s);
  assert.match(submitCompletion, /if \(!body\?\.targetObservation\?\.completed \|\| !body\?\.target2B\?\.completed\) \{\s*throw new Error/s);
  assert.match(submitCompletion, /completed: true/);
});

addCheck("Authorized observation refresh helper exists", () => {
  assert.match(app, /function useAuthorizedObservationCompletionRefresh\(invite,\s*setSession\)/);
});

addCheck("Screen 6a uses authorized observation completion refresh", () => {
  const screen6a = section(app, "function TargetObservationSetupIntroScreen", "function sendAuthorizedEmail");
  assert.match(screen6a, /const invite = session\.targetObservationSetupInvite;/);
  assert.match(screen6a, /useAuthorizedObservationCompletionRefresh\(invite,\s*setSession\);/);
});

addCheck("Screen 9a locked state uses targetObservationSetupInvite refresh", () => {
  const screen9a = functionSection(app, "PreliminaryTargetGateScreen");
  assert.match(screen9a, /const authorizedObservationInvite = session\.targetObservationSetupInvite;/);
  assert.match(screen9a, /useAuthorizedObservationCompletionRefresh\(authorizedObservationInvite,\s*setSession\);/);
});

addCheck("target-observation-state API uses Node response contract", () => {
  routeHasNodeResponseContract("api/target-observation-state.ts");
});

addCheck("submit-target-observation API uses Node response contract", () => {
  routeHasNodeResponseContract("api/submit-target-observation.ts");
});

addCheck("save-target-observation-setup API uses Node response contract", () => {
  routeHasNodeResponseContract("api/save-target-observation-setup.ts");
});

addCheck("Persistent ledger uses KV/Redis in production with explicit missing-env failure", () => {
  assert.equal(includesAll(ledger, [
    "KV_REST_API_URL",
    "KV_REST_API_TOKEN",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "persistent-storage-not-configured",
    "isLocalDevelopmentRuntime()",
    "target-observation-session:",
    "const TARGET_OBSERVATION_SESSION_TTL_SECONDS = 259200;",
  ]), true);
});

addCheck("Redis REST operation has bounded timeout through body parsing", () => {
  const redisCommand = functionSection(ledger, "redisCommand");
  assert.match(ledger, /const REDIS_REST_TIMEOUT_MS = 4000;/);
  assert.match(redisCommand, /new AbortController\(\)/);
  assert.match(redisCommand, /signal: controller\.signal/);
  assert.match(redisCommand, /setTimeout\(\(\) => controller\.abort\(\), REDIS_REST_TIMEOUT_MS\)/);
  assert.match(redisCommand, /payload = await response\.json\(\)\.catch/);
  assert.match(redisCommand, /finally \{\s*clearTimeout\(timeout\);/s);
  assert.ok(
    redisCommand.indexOf("payload = await response.json()") < redisCommand.indexOf("clearTimeout(timeout);"),
    "Redis timeout must remain active through response.json()",
  );
});

addCheck("Legacy questionnaire exporters are disabled", () => {
  for (const path of [
    "scripts/export_track1_data.py",
    "scripts/export_step2b_data.py",
    "scripts/export_target_self_data.py",
  ]) {
    const source = read(path);
    assert.match(source, /raise RuntimeError\(/, `${path} must raise RuntimeError`);
    assert.match(source, /legacy exporter is disabled/, `${path} must state that the exporter is disabled`);
    assert.match(source, /npm run export:newlogic/, `${path} must point to npm run export:newlogic`);
    assert.match(source, /NewLogic 03\.05\.2026\/ST_Form_Binding_Prompt\.xlsx/, `${path} must name canonical binding source`);
  }
});

addCheck("package.json keeps canonical validation and export commands", () => {
  assert.equal(
    packageJson.scripts?.["validate:questionnaire-bindings"],
    "node scripts/validate-questionnaire-bindings.mjs",
  );
  assert.equal(packageJson.scripts?.["export:newlogic"], "python scripts/export_newlogic_json.py");
  assert.equal(
    packageJson.scripts?.["validate:target-observation-runtime"],
    "node scripts/validate-target-observation-runtime-guards.mjs",
  );
});

const failures = [];
for (const check of checks) {
  try {
    check.fn();
    console.log(`PASS ${check.label}`);
  } catch (error) {
    failures.push({ label: check.label, error });
    console.error(`FAIL ${check.label}`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length) {
  console.error(`Target Observation runtime guard validation failed: ${failures.length} invariant(s) failed.`);
  process.exit(1);
}

console.log("Target Observation runtime guard validation passed");
