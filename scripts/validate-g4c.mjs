import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import exportPredictionLedgerHandler from "../api/export-prediction-ledger.ts";
import {
  PREDICTION_LEDGER_HEADERS,
  buildPredictionSealHash,
  exportSealedPredictionAuditRows,
  listSealedPredictionEntries,
  sha256Hex,
} from "../api/_predictionLedger.ts";
import sealPredictionHandler from "../api/seal-prediction.ts";

function fixturePayload(index) {
  return {
    dealId: `G4C-${Date.now()}-${index}`,
    acquirerEnvironmentCode: index % 2 === 0 ? "NT/STJ" : "NF/NT",
    targetEnvironmentCode: index % 3 === 0 ? "SFJ/SFP" : "STP/STJ",
    primaryActorType: "INTJ",
    dominantFunction: "Ni1",
    anchors: [
      `30-day first signal anchor ${index}`,
      `Months 2-6 integration anchor ${index}`,
      `Months 6-18 transition anchor ${index}`,
    ],
    prediction1: `J-05 in strategic meetings - expected weeks 6-10 post-close (${index})`,
    prediction2: `Transition NATURAL->FUNCTIONAL expected in 13.5-22.5 months (${index})`,
    prediction3: `Key departure window: months 19-30 post-close (${index})`,
    falsificationCondition: `If J-05 absent by week 12, reduce baseline multiplier (${index})`,
  };
}

async function postSeal(payload) {
  const startedAt = Date.now();
  const response = await sealPredictionHandler(new Request("http://127.0.0.1/api/seal-prediction", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }));
  const completedAt = Date.now();
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.status, "prediction-sealed");
  assert.equal(body.workbookRuntimeWrite, false);
  assert.equal(body.sealVersion, "sha256-v1");
  assert.ok(Date.parse(body.sealedAt) >= startedAt - 100);
  assert.ok(Date.parse(body.sealedAt) <= completedAt + 100);
  return body;
}

function runtimeFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...runtimeFiles(fullPath));
    } else if (/\.(js|jsx|ts)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function assertNoRuntimeWorkbookWrites() {
  const runtimeDirs = [
    fileURLToPath(new URL("../api", import.meta.url)),
    fileURLToPath(new URL("../src", import.meta.url)),
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
  for (const dir of runtimeDirs) {
    for (const file of runtimeFiles(dir)) {
      const text = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        if (pattern.test(text)) offenders.push(`${file}: ${pattern}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
}

assert.equal(
  sha256Hex("abc"),
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
);

const beforeCount = listSealedPredictionEntries().length;
const sealedResponses = [];
for (let index = 0; index < 10; index += 1) {
  sealedResponses.push(await postSeal(fixturePayload(index)));
}

const entries = listSealedPredictionEntries();
assert.equal(entries.length, beforeCount + 10);

for (const response of sealedResponses) {
  const entry = entries.find((item) => item.ledgerEntryId === response.ledgerEntryId);
  assert.ok(entry, `Missing ledger entry ${response.ledgerEntryId}`);
  assert.equal(entry.status, "SEALED");
  assert.equal(entry.sealHash, response.sealHash);
  assert.equal(entry.sealHash, buildPredictionSealHash(entry.canonicalHashInput));
  assert.equal(entry.anchors.length, 3);
}

const auditRows = exportSealedPredictionAuditRows();
assert.equal(PREDICTION_LEDGER_HEADERS[0], "Deal ID");
assert.equal(PREDICTION_LEDGER_HEADERS[8], "Sealed\n(timestamp)");
assert.equal(PREDICTION_LEDGER_HEADERS[9], "Status");
assert.equal(PREDICTION_LEDGER_HEADERS[10], "Seal Hash");
assert.ok(auditRows.length >= 10);
assert.ok(auditRows.some((row) => row[10] === sealedResponses.at(-1).sealHash));

const exportResponse = await exportPredictionLedgerHandler(new Request("http://127.0.0.1/api/export-prediction-ledger"));
const exportBody = await exportResponse.json();
assert.equal(exportResponse.status, 200);
assert.equal(exportBody.status, "audit-export-ready");
assert.equal(exportBody.workbookRuntimeWrite, false);
assert.deepEqual(exportBody.headers, PREDICTION_LEDGER_HEADERS);
assert.ok(exportBody.rows.some((row) => row[10] === sealedResponses[0].sealHash));

const forbiddenExport = await exportPredictionLedgerHandler(new Request("https://example.com/api/export-prediction-ledger"));
assert.equal(forbiddenExport.status, 403);

assertNoRuntimeWorkbookWrites();

console.log("G-4c prediction ledger append-only storage and audit export smoke test passed");
