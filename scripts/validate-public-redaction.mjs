import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const internalFilePattern = /\bST_[A-Za-z0-9_ -]+\.(?:xlsx|docx)\b/;
const textExtensions = new Set([".css", ".html", ".js", ".json", ".map", ".svg", ".txt"]);

function readTextFilesUnder(pathname) {
  if (!existsSync(pathname)) {
    return "";
  }

  const stats = statSync(pathname);
  if (stats.isFile()) {
    return readFileSync(pathname, "utf8");
  }

  return readdirSync(pathname, { withFileTypes: true })
    .map((entry) => {
      const child = join(pathname, entry.name);
      if (entry.isDirectory()) {
        return readTextFilesUnder(child);
      }
      if (entry.isFile() && textExtensions.has(extname(entry.name))) {
        return readFileSync(child, "utf8");
      }
      return "";
    })
    .join("\n");
}

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const publicQuestionnairesSource = readFileSync(
  new URL("../src/generated/newlogic/publicQuestionnaires.json", import.meta.url),
  "utf8",
);
const finalDeliverableSource = readFileSync(
  new URL("../src/data/finalDeliverableData.js", import.meta.url),
  "utf8",
);
const caseStudiesSource = readFileSync(new URL("../src/data/caseStudies.js", import.meta.url), "utf8");
const distSource = readTextFilesUnder(fileURLToPath(new URL("../dist", import.meta.url)));

assert.equal(
  /Source:\s*\{[^}]*\.source[^}]*\}/.test(appSource),
  false,
  "Public questionnaire screens must not render source workbook names",
);

assert.equal(
  internalFilePattern.test(publicQuestionnairesSource),
  false,
  "Public questionnaire artifact must not include internal workbook/document filenames",
);

assert.equal(
  /\bsource(?:Workbook|Sheet|Row)\b/.test(publicQuestionnairesSource),
  false,
  "Public questionnaire artifact must not include source workbook, sheet, or row metadata",
);

assert.equal(
  internalFilePattern.test(finalDeliverableSource),
  false,
  "Public final-deliverable client data must not include internal workbook/document filenames",
);

assert.equal(
  internalFilePattern.test(caseStudiesSource),
  false,
  "Public case-study client data must not include internal workbook/document filenames",
);

assert.equal(
  /Source:\s*ST_/.test(finalDeliverableSource),
  false,
  "Public final-deliverable client data must not include internal source-file lines",
);

assert.equal(
  /\binternal source\b/.test(`${publicQuestionnairesSource}\n${finalDeliverableSource}\n${caseStudiesSource}`),
  false,
  "Public client data must not expose internal-source placeholders",
);

assert.equal(
  internalFilePattern.test(distSource),
  false,
  "Production bundle must not include internal workbook/document filenames",
);

console.log("Public questionnaire redaction validation passed");
