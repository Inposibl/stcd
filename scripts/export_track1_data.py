import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


raise RuntimeError(
    "This legacy exporter is disabled. It reads an unsafe parent-level ST_Form_Binding_Prompt.xlsx path and must not be used. Use `npm run export:newlogic` instead. Canonical source: NewLogic 03.05.2026/ST_Form_Binding_Prompt.xlsx."
)


WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_FILE = WORKSPACE_ROOT / "framer-vercel-public" / "src" / "data" / "acquirerTrackData.js"

ACQUIRER_FILE = WORKSPACE_ROOT / "ST_Acquirer_Environment_Module.xlsx"
FORM_BINDING_FILE = WORKSPACE_ROOT / "ST_Form_Binding_Prompt.xlsx"
CONSULTING_FILE = WORKSPACE_ROOT / "ST_Consulting_Pages_v2.xlsx"

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


def sheet_path(archive, sheet_name):
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
        root = ET.fromstring(archive.read(sheet_path(archive, sheet_name)))
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


def find_text(rows, row_number, column=2):
    for row_index, values in rows:
        if row_index == row_number:
            return values.get(column, "")
    return ""


def option_rows(rows, start_row, end_row):
    options = []
    for _, values in rows:
        option = values.get(2)
        if option in {"A", "B", "C", "D", "E"}:
            text = values.get(3, "")
            if text:
                options.append({"value": option, "text": text})
    return options[start_row:end_row]


def extract_codes(signal):
    found = []
    for code in ENV_CODES:
        if re.search(rf"(?<![A-Z]){re.escape(code)}(?![A-Z])", signal):
            found.append(code)
    return found


def build_positioning():
    rows = read_rows(ACQUIRER_FILE, "Positioning")
    return [
        {
            "id": "acquirerRole",
            "label": find_text(rows, 3, 1).split("|", 1)[-1].strip(),
            "sourceRef": "Positioning!A3:C7",
            "options": [
                {"value": values[2], "text": values[3]}
                for row, values in rows
                if 4 <= row <= 7 and values.get(2) in {"A", "B", "C", "D"}
            ],
        },
        {
            "id": "acquirerTenure",
            "label": find_text(rows, 9, 1).split("|", 1)[-1].strip(),
            "sourceRef": "Positioning!A9:C13",
            "options": [
                {"value": values[2], "text": values[3]}
                for row, values in rows
                if 10 <= row <= 13 and values.get(2) in {"A", "B", "C", "D"}
            ],
        },
    ]


def build_screening_questions():
    rows = read_rows(ACQUIRER_FILE, "Screening")
    questions = []
    active_axis = ""
    row_map = {row: values for row, values in rows}
    for row, values in rows:
        axis_text = values.get(1, "")
        if axis_text.startswith("\u2500\u2500 AXIS"):
            active_axis = axis_text.replace("\u2500", "").strip()
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


def build_deal_context_fields():
    return [
        {
            "id": "dealType",
            "label": "Deal type",
            "sourceRef": "ST_Form_Binding_Prompt.xlsx / STEP-1",
            "options": [
                "Platform Acquisition",
                "Operational Roll-Up",
                "Management Buyout",
                "Cross-Border Integration",
            ],
        },
        *build_positioning(),
    ]


def build_artifact():
    if not ACQUIRER_FILE.exists():
        raise FileNotFoundError(ACQUIRER_FILE)
    if not FORM_BINDING_FILE.exists():
        raise FileNotFoundError(FORM_BINDING_FILE)
    if not CONSULTING_FILE.exists():
        raise FileNotFoundError(CONSULTING_FILE)

    return {
        "sources": [
            ACQUIRER_FILE.name,
            FORM_BINDING_FILE.name,
            CONSULTING_FILE.name,
        ],
        "landing": {
            "headline": "70% of M&A integrations that destroy value fail for the same reason.",
            "body": [
                "M&A deals are bought for different reasons: to acquire a team, enter a new market, hit strategic KPIs, or remove a competitor. But integration value is lost for the same reason: the organizations cannot operate together in reality.",
                "The model may close. The strategy may look right. The transaction may satisfy the board. But after close, value breaks down when leaders clash over decisions, resources, speed, accountability, power, and conflict.",
                "Our product identifies these risks before they become post-deal failures.",
                "Whether the goal is to retain the acquired team, scale into a new market, protect KPI-driven deal value, or absorb a former competitor, we show where the integration will fracture and what must be changed before months 6-18, when the acquired management team often stops performing.",
                "Run the diagnostic. Twenty minutes. No account. No card.",
            ],
            "footnote": "Used by PE and VC firms managing post-close integration of companies with 50-500 employees.",
        },
        "promise": {
            "headline": "The first useful Preliminary Assessment is calculated from the Acquirer module and the completed Target Observer block.",
            "deliverables": [
                "Your environment pair - the operational architecture of the deal in plain language",
                "Compatibility range with risk classification - how compatible the two environments are",
                "Three behavioural anchors at 30 days, 6 months, and 18 months - what to watch for, sealed and timestamped",
            ],
            "body": "The diagnostic covers all 9 interaction environments in a single instrument. No need to pre-select which type to test for.",
            "footnote": "The diagnostic is forward-only by design: answers reflect operational reality, not aspiration.",
        },
        "dealContextFields": build_deal_context_fields(),
        "acquirerModule": {
            "source": ACQUIRER_FILE.name,
            "worksheet": "Screening",
            "questionCount": 10,
            "questions": build_screening_questions(),
        },
    }


def main():
    artifact = build_artifact()
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(artifact, ensure_ascii=True, indent=2)
    OUTPUT_FILE.write_text(
        "/* Generated from Track 1 source workbooks. Do not edit manually. */\n"
        f"export const ACQUIRER_TRACK_DATA = Object.freeze({payload});\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {OUTPUT_FILE.relative_to(WORKSPACE_ROOT)} "
        f"with {artifact['acquirerModule']['questionCount']} Acquirer questions"
    )


if __name__ == "__main__":
    main()
