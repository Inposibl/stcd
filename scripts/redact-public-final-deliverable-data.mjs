import { readFileSync, writeFileSync } from "node:fs";

const targetUrl = new URL("../src/data/finalDeliverableData.js", import.meta.url);
const INTERNAL_FILE_PATTERN = /\bST_[A-Za-z0-9_ -]+\.(?:xlsx|docx)\b/g;

let source = readFileSync(targetUrl, "utf8");

source = source
  .replace(/\n\s+"sourceRow":\s*\d+,\r?/g, "")
  .replace(/\\n\s+Source:\s*(?:ST_[^\\"]*|internal source)(?:\\(?!n)|[^\\"])*(?=\\n)/g, "")
  .replace(/\\nCross-reference:\s*(?:ST_[^\\"]*|internal source)(?:\\(?!n)|[^\\"])*(?=\\n)/g, "")
  .replace(/\\nCross-reference:\s*(?:ST_[^\\"]*|internal source)(?:\\(?!n)|[^\\"])*(?=")/g, "")
  .replace(/\\nFile authority:\s*(?:ST_[^\\"]*|internal source)(?:\\(?!n)|[^\\"])*(?=")/g, "")
  .replace(INTERNAL_FILE_PATTERN, "internal source")
  .replace(/  "sources": \[\r?\n(?:    "internal source",?\r?\n)+  \],/, '  "sources": [],');

writeFileSync(targetUrl, source);
