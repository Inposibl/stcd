import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


raise RuntimeError(
    "This legacy exporter is disabled. It reads an unsafe parent-level ST_Form_Binding_Prompt.xlsx path and must not be used. Use `npm run export:newlogic` instead. Canonical source: NewLogic 03.05.2026/ST_Form_Binding_Prompt.xlsx."
)


WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
SOURCE_FILE = WORKSPACE_ROOT / "ST_Environment_Diagnostic_v2.xlsx"
FORM_BINDING_FILE = WORKSPACE_ROOT / "ST_Form_Binding_Prompt.xlsx"
OUTPUT_FILE = WORKSPACE_ROOT / "framer-vercel-public" / "src" / "data" / "targetDiagnosticData.js"

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


def normalize_group_label(value):
    return re.sub(r"\s+", " ", value.replace("\u2500", "").strip())


def build_questions(rows, group_prefix):
    row_map = {row: values for row, values in rows}
    questions = []
    active_group = ""

    for row, values in rows:
        group_text = values.get(1, "")
        if group_text.startswith(group_prefix):
            active_group = normalize_group_label(group_text)
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
                "group": active_group,
                "text": values[3],
                "options": options,
            }
        )

    return questions


def build_positioning(rows):
    row_by_number = {row: values for row, values in rows}
    return [
        {
            "id": "targetRelationPosition",
            "label": row_by_number[4][1].split("|", 1)[-1].strip(),
            "sourceRef": "Block 0 - Positioning!A4:C8",
            "options": [
                {"value": values[2], "text": values[3]}
                for row, values in rows
                if 5 <= row <= 8 and values.get(2) in {"A", "B", "C", "D"}
            ],
        },
        {
            "id": "targetObservationTenure",
            "label": row_by_number[10][1].split("|", 1)[-1].strip(),
            "sourceRef": "Block 0 - Positioning!A10:C13",
            "options": [
                {"value": values[2], "text": values[3]}
                for row, values in rows
                if 11 <= row <= 13 and values.get(2) in {"A", "B", "C"}
            ],
        },
    ]


def build_artifact():
    if not SOURCE_FILE.exists():
        raise FileNotFoundError(SOURCE_FILE)
    if not FORM_BINDING_FILE.exists():
        raise FileNotFoundError(FORM_BINDING_FILE)

    positioning_rows = read_rows(SOURCE_FILE, "Block 0 \u2014 Positioning")
    level1_rows = read_rows(SOURCE_FILE, "Level 1 \u2014 Screening")
    level2_rows = read_rows(SOURCE_FILE, "Level 2 \u2014 Deepening")

    return {
        "sources": [SOURCE_FILE.name, FORM_BINDING_FILE.name],
        "positioningFields": build_positioning(positioning_rows),
        "level1": {
            "source": SOURCE_FILE.name,
            "worksheet": "Level 1 - Screening",
            "questionCount": 12,
            "questions": build_questions(level1_rows, "\u2500\u2500 Axis"),
        },
        "level2": {
            "source": SOURCE_FILE.name,
            "worksheet": "Level 2 - Deepening",
            "questionCount": 10,
            "questions": build_questions(level2_rows, "Pair"),
        },
    }


def main():
    artifact = build_artifact()
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(artifact, ensure_ascii=True, indent=2)
    OUTPUT_FILE.write_text(
        "/* Generated from ST_Environment_Diagnostic_v2.xlsx. Do not edit manually. */\n"
        f"export const TARGET_DIAGNOSTIC_DATA = Object.freeze({payload});\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {OUTPUT_FILE.relative_to(WORKSPACE_ROOT)} "
        f"with {artifact['level1']['questionCount']} Level 1 and {artifact['level2']['questionCount']} Level 2 questions"
    )


if __name__ == "__main__":
    main()
