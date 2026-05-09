import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
SOURCE_FILE = WORKSPACE_ROOT / "ST_Target_Observed_Environment_Diagnostic.xlsx"
OUTPUT_FILE = WORKSPACE_ROOT / "framer-vercel-public" / "src" / "data" / "targetObservedEnvironmentDiagnostic.js"

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def column_number(cell_ref):
    match = re.match(r"([A-Z]+)", cell_ref)
    if not match:
        return 0
    number = 0
    for char in match.group(1):
        number = number * 26 + ord(char) - 64
    return number


def load_shared_strings(archive):
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings = []
    for item in root.findall("a:si", NS):
        strings.append("".join(text.text or "" for text in item.iter(f"{{{NS['a']}}}t")))
    return strings


def load_workbook_sheet_paths(archive):
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    relmap = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    sheet_paths = {}
    for sheet in workbook.find("a:sheets", NS):
        rel_id = sheet.attrib[f"{{{NS['r']}}}id"]
        sheet_paths[sheet.attrib["name"]] = "xl/" + relmap[rel_id]
    return sheet_paths


def cell_value(cell, shared_strings):
    value = cell.find("a:v", NS)
    if value is None:
        return ""
    raw = value.text or ""
    if cell.attrib.get("t") == "s":
        return shared_strings[int(raw)]
    return raw


def read_rows(archive, sheet_path, shared_strings):
    sheet = ET.fromstring(archive.read(sheet_path))
    rows = []
    for row in sheet.findall(".//a:row", NS):
        values = {}
        for cell in row.findall("a:c", NS):
            values[column_number(cell.attrib.get("r", ""))] = cell_value(cell, shared_strings)
        if values:
            rows.append(values)
    return rows


def table_rows(rows):
    header_index = next(index for index, row in enumerate(rows) if row.get(1) == "Question_ID")
    headers = rows[header_index]
    out = []
    for row in rows[header_index + 1 :]:
        if not row.get(1):
            continue
        out.append({headers[col]: value for col, value in row.items() if headers.get(col)})
    return out


def answer_key_rows(rows):
    header_index = next(index for index, row in enumerate(rows) if row.get(1) == "Question_ID")
    headers = rows[header_index]
    out = {}
    for row in rows[header_index + 1 :]:
        question_id = row.get(1)
        option = row.get(2)
        if not question_id or not option:
            continue
        out[(question_id, option)] = {headers[col]: value for col, value in row.items() if headers.get(col)}
    return out


def build_artifact():
    if not SOURCE_FILE.exists():
        raise FileNotFoundError(f"Missing source file: {SOURCE_FILE}")

    with zipfile.ZipFile(SOURCE_FILE) as archive:
        shared_strings = load_shared_strings(archive)
        sheet_paths = load_workbook_sheet_paths(archive)
        questionnaire = table_rows(read_rows(archive, sheet_paths["Questionnaire"], shared_strings))
        answer_key = answer_key_rows(read_rows(archive, sheet_paths["Answer_Key"], shared_strings))

    questions = []
    for row in questionnaire:
        options = []
        for option in ["A", "B", "C", "D"]:
            option_key = answer_key.get((row["Question_ID"], option), {})
            options.append(
                {
                    "value": option,
                    "text": row[f"Option_{option}"],
                    "environment": row[f"{option}_Environment"],
                    "environmentName": option_key.get("Environment_Name", ""),
                    "rationale": option_key.get("Diagnostic_Rationale", ""),
                    "resourceSignal": option_key.get("Resource_Signal", ""),
                    "confidenceImpact": option_key.get("Confidence_Impact", ""),
                }
            )
        questions.append(
            {
                "id": row["Question_ID"],
                "section": row["Section"],
                "text": row["Question_Text"],
                "options": options,
                "primaryDomain": row.get("Primary_Domain", ""),
                "secondaryDomain": row.get("Secondary_Domain", ""),
                "evidenceType": row.get("Evidence_Type", ""),
                "surveyDesignNote": row.get("Survey_Design_Note", ""),
            }
        )

    return {
        "source": SOURCE_FILE.name,
        "worksheet": "Questionnaire",
        "questionCount": len(questions),
        "questions": questions,
    }


def main():
    artifact = build_artifact()
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(artifact, ensure_ascii=True, indent=2)
    OUTPUT_FILE.write_text(
        "/* Generated from ST_Target_Observed_Environment_Diagnostic.xlsx. Do not edit manually. */\n"
        f"export const TARGET_OBSERVATION_DIAGNOSTIC = Object.freeze({payload});\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_FILE.relative_to(WORKSPACE_ROOT)} with {artifact['questionCount']} questions")


if __name__ == "__main__":
    main()
