import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


raise RuntimeError(
    "This legacy exporter is disabled. It reads an unsafe parent-level ST_Form_Binding_Prompt.xlsx path and must not be used. Use `npm run export:newlogic` instead. Canonical source: NewLogic 03.05.2026/ST_Form_Binding_Prompt.xlsx."
)


WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
SOURCE_FILE = WORKSPACE_ROOT / "ST_Target_Self_Assessment_Module.xlsx"
FORM_BINDING_FILE = WORKSPACE_ROOT / "ST_Form_Binding_Prompt.xlsx"
OUTPUT_FILE = WORKSPACE_ROOT / "framer-vercel-public" / "src" / "data" / "targetSelfAssessmentData.js"

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

ENV_CODES = (
    "NT/STJ",
    "NT/STP",
    "NF/NT",
    "NF/SFJ",
    "NF/SFP",
    "SFJ/SFP",
    "STJ/STP",
    "STP/STJ",
    "SFP/SFJ",
)


def column_number(cell_ref):
    match = re.match(r"([A-Z]+)", cell_ref)
    if not match:
        return 0
    number = 0
    for char in match.group(1):
        number = number * 26 + ord(char) - 64
    return number


def resolve_sheet_path(target):
    target = target.lstrip("/")
    return target if target.startswith("xl/") else f"xl/{target}"


def load_shared_strings(archive):
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings = []
    for item in root.findall("a:si", NS):
        strings.append("".join(text.text or "" for text in item.iter(f"{{{NS['a']}}}t")))
    return strings


def cell_value(cell, shared_strings):
    if cell.attrib.get("t") == "inlineStr":
        return "".join(text.text or "" for text in cell.iter(f"{{{NS['a']}}}t"))
    value = cell.find("a:v", NS)
    if value is None:
        return ""
    raw = value.text or ""
    if cell.attrib.get("t") == "s":
        return shared_strings[int(raw)]
    return raw


def workbook_sheet_path(archive, sheet_name):
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    relmap = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    for sheet in workbook.find("a:sheets", NS):
        if sheet.attrib["name"] == sheet_name:
            return resolve_sheet_path(relmap[sheet.attrib[f"{{{NS['r']}}}id"]])
    raise KeyError(f"Sheet not found: {sheet_name}")


def read_rows(workbook_path, sheet_name):
    with zipfile.ZipFile(workbook_path) as archive:
        shared_strings = load_shared_strings(archive)
        root = ET.fromstring(archive.read(workbook_sheet_path(archive, sheet_name)))
        rows = []
        for row in root.findall(".//a:row", NS):
            values = {}
            for cell in row.findall("a:c", NS):
                value = cell_value(cell, shared_strings)
                if value != "":
                    values[column_number(cell.attrib.get("r", ""))] = value
            if values:
                rows.append((int(row.attrib.get("r", "0")), values))
        return rows


def extract_codes(signal):
    found = []
    for code in ENV_CODES:
        if re.search(rf"(?<![A-Z]){re.escape(code)}(?![A-Z])", signal):
            found.append(code)
    return found


def normalize_axis_label(value):
    return re.sub(r"\s+", " ", value.replace("\u2500", "").strip())


def build_positioning(rows):
    row_by_number = {row: values for row, values in rows}
    return [
        {
            "id": "targetRole",
            "label": row_by_number[3][1].split("|", 1)[-1].strip(),
            "sourceRef": "Positioning!A3:C7",
            "options": [
                {"value": values[2], "text": values[3]}
                for row, values in rows
                if 4 <= row <= 7 and values.get(2) in {"A", "B", "C", "D"}
            ],
        },
        {
            "id": "targetTenure",
            "label": row_by_number[10][1].split("|", 1)[-1].strip(),
            "sourceRef": "Positioning!A10:C14",
            "options": [
                {"value": values[2], "text": values[3]}
                for row, values in rows
                if 11 <= row <= 14 and values.get(2) in {"A", "B", "C", "D"}
            ],
        },
    ]


def build_questions(rows):
    row_map = {row: values for row, values in rows}
    questions = []
    active_axis = ""

    for row, values in rows:
        axis_text = values.get(1, "")
        if axis_text.startswith("\u2500\u2500 AXIS") or axis_text.startswith("\u2500\u2500 CONFIRMATORY"):
            active_axis = normalize_axis_label(axis_text)
            continue

        question_id = values.get(2, "")
        if not re.fullmatch(r"Q\d+", question_id):
            continue

        options = []
        for offset in range(1, 5):
            option_values = row_map[row + offset]
            signal = option_values.get(5, "")
            options.append(
                {
                    "value": option_values[2],
                    "text": option_values[3],
                    "signals": extract_codes(signal),
                }
            )

        questions.append(
            {
                "id": question_id,
                "axis": active_axis,
                "text": values[3],
                "options": options,
            }
        )

    return questions


def build_artifact():
    if not SOURCE_FILE.exists():
        raise FileNotFoundError(SOURCE_FILE)
    if not FORM_BINDING_FILE.exists():
        raise FileNotFoundError(FORM_BINDING_FILE)

    positioning_rows = read_rows(SOURCE_FILE, "Positioning")
    screening_rows = read_rows(SOURCE_FILE, "Screening")
    questions = build_questions(screening_rows)
    return {
        "sources": [SOURCE_FILE.name, FORM_BINDING_FILE.name],
        "positioningFields": build_positioning(positioning_rows),
        "targetSelfAssessment": {
            "source": SOURCE_FILE.name,
            "worksheet": "Screening",
            "questionCount": len(questions),
            "questions": questions,
        },
        "receipt": {
            "title": "Your responses have been received.",
            "body": "Thank you for the time spent on this survey.",
            "close": "You can close this page.",
        },
    }


def main():
    artifact = build_artifact()
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(artifact, ensure_ascii=True, indent=2)
    OUTPUT_FILE.write_text(
        "/* Generated from ST_Target_Self_Assessment_Module.xlsx. Do not edit manually. */\n"
        f"export const TARGET_SELF_ASSESSMENT_DATA = Object.freeze({payload});\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {OUTPUT_FILE.relative_to(WORKSPACE_ROOT)} "
        f"with {artifact['targetSelfAssessment']['questionCount']} Target self-assessment questions"
    )


if __name__ == "__main__":
    main()
