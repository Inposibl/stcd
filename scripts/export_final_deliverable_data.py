import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


APP_ROOT = Path.cwd() if Path.cwd().name == "framer-vercel-public" else Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = APP_ROOT.parent
OUTPUT_FILE = APP_ROOT / "src" / "data" / "finalDeliverableData.js"

NARRATIVES_FILE = WORKSPACE_ROOT / "ST_Free_Tier_Output_Narratives_updated.xlsx"
FRICTION_FILE = WORKSPACE_ROOT / "ST_Friction_Point_Lookup_updated.xlsx"
SPEC_FILE = WORKSPACE_ROOT / "ST_UI_Track_Coder_Agent_Specification_v1.xlsx"
CLIENT_JOURNEY_FILE = WORKSPACE_ROOT / "ST_Client_Journey_v5.xlsx"
BSINGLE_FILE = WORKSPACE_ROOT / "ST_B_Single_Output_Template_v1.xlsx"
INVESTMENT_MEMO_FILE = WORKSPACE_ROOT / "Proposition for the potential Investors" / "ST_Investment_Memorandum_final.docx"

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


def normalize_env_code(code):
    stripped = str(code).strip()
    return "SFP/SFJ" if stripped == "SP/SJ" else stripped


def is_env_pair(values):
    left = values.get(1, "")
    right = values.get(2, "")
    return bool(re.fullmatch(r"[A-Z]{2,3}/[A-Z]{2,3}", left) and re.fullmatch(r"[A-Z]{2,3}/[A-Z]{2,3}", right))


def number_or_none(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def public_text(value):
    return (
        str(value or "")
        .replace("project corpus", "project record")
        .replace("SP/SJ", "SFP/SFJ")
    )


def build_narratives():
    rows = read_rows(NARRATIVES_FILE, "All_72_Narratives")
    records = []
    for row_number, values in rows:
        if not is_env_pair(values):
            continue
        records.append(
            {
                "sourceRow": row_number,
                "acquirerEnvironmentCode": normalize_env_code(values[1]),
                "targetEnvironmentCode": normalize_env_code(values[2]),
                "ecs": number_or_none(values.get(3)),
                "riskBand": public_text(values.get(4, "")),
                "headline": public_text(values.get(5, "")),
                "situation": public_text(values.get(6, "")),
                "prediction": public_text(values.get(7, "")),
                "implication": public_text(values.get(8, "")),
                "cta": public_text(values.get(9, "")),
            }
        )
    return records


def build_friction_points():
    rows = read_rows(FRICTION_FILE, "Friction_Lookup")
    records = []
    for row_number, values in rows:
        if not is_env_pair(values):
            continue
        records.append(
            {
                "sourceRow": row_number,
                "acquirerEnvironmentCode": normalize_env_code(values[1]),
                "targetEnvironmentCode": normalize_env_code(values[2]),
                "ecs": number_or_none(values.get(3)),
                "riskBand": public_text(values.get(4, "")),
                "fp1": public_text(values.get(5, "")),
                "fp2": public_text(values.get(6, "")),
                "fp3": public_text(values.get(7, "")),
                "earlyWarningSignal": public_text(values.get(8, "")),
                "primaryConflictedResources": public_text(values.get(9, "")),
            }
        )
    return records


def row_cell(rows, row_number, column):
    for row, values in rows:
        if row == row_number:
            return values.get(column, "")
    return ""


def offer_cta_text(value):
    text = public_text(value).replace(" (captures " + "email)", "")
    return text.replace("Download this report as a " + "PDF", "Download full Final Deliverables report PDF")


def build_screen_copy():
    rows = read_rows(SPEC_FILE, "APPENDIX_B SCREEN_SPEC")
    return {
        "screen10HeaderTemplate": public_text(row_cell(rows, 13, 4)),
        "screen10BlockCopy": public_text(row_cell(rows, 13, 5)),
        "screen10CtaLabel": public_text(row_cell(rows, 13, 6)),
        "homogeneousHeaderTemplate": public_text(row_cell(rows, 14, 4)),
        "homogeneousBody": public_text(row_cell(rows, 14, 5)),
        "homogeneousCtaLabel": public_text(row_cell(rows, 14, 6)),
        "screen11Header": public_text(row_cell(rows, 15, 4)),
        "screen11Body": public_text(row_cell(rows, 15, 5)),
        "screen11Cta": offer_cta_text(row_cell(rows, 15, 6)),
        "screen11bHeader": public_text(row_cell(rows, 16, 4)),
        "screen11bBody": public_text(row_cell(rows, 16, 5)),
        "screen11bCta": offer_cta_text(row_cell(rows, 16, 6)),
        "screen12Header": public_text(row_cell(rows, 17, 4)),
        "screen12Body": public_text(row_cell(rows, 17, 5)),
        "screen12Cta": public_text(row_cell(rows, 17, 6)),
        "sealedCaveat": public_text(row_cell(rows, 18, 5)),
    }


def outcome_sections(step_text):
    outcomes = {}
    for key, heading in {
        "A": "OUTCOME A",
        "B": "OUTCOME B",
        "C": "OUTCOME C",
        "D": "OUTCOME D",
    }.items():
        pattern = rf"{heading}[\s\S]*?(?=\n\n━━━━━━━━|\n\n▶|\Z)"
        match = re.search(pattern, step_text)
        if not match:
            continue
        section = match.group(0).strip()
        lines = [line.strip() for line in section.splitlines() if line.strip()]
        condition = next((line for line in lines if line.startswith("Condition:")), "")
        next_step = next((line for line in lines if line.startswith("Next step:")), "")
        outcomes[key] = {
            "section": public_text(section),
            "title": public_text(lines[0]),
            "condition": public_text(condition),
            "nextStep": public_text(next_step),
        }
    return outcomes


def build_client_journey_copy():
    rows = read_rows(CLIENT_JOURNEY_FILE, "Client Journey")
    step3 = row_cell(rows, 19, 5)
    return {
        "step3": public_text(step3),
        "outcomes": outcome_sections(step3),
    }


def build_bsingle_copy():
    rows = read_rows(BSINGLE_FILE, "COPY_TEMPLATES")
    templates = {}
    for _, values in rows:
        template_id = values.get(1, "")
        if re.fullmatch(r"CT-[0-9A-Za-z-]+", template_id):
            templates[template_id] = {
                "screen": public_text(values.get(2, "")),
                "block": public_text(values.get(3, "")),
                "element": public_text(values.get(4, "")),
                "copy": public_text(values.get(5, "")),
            }
    return templates


def build_artifact():
    for source in [NARRATIVES_FILE, FRICTION_FILE, SPEC_FILE, CLIENT_JOURNEY_FILE, BSINGLE_FILE, INVESTMENT_MEMO_FILE]:
        if not source.exists():
            raise FileNotFoundError(source)

    return {
        "sources": [
            NARRATIVES_FILE.name,
            FRICTION_FILE.name,
            SPEC_FILE.name,
            CLIENT_JOURNEY_FILE.name,
            BSINGLE_FILE.name,
            INVESTMENT_MEMO_FILE.name,
        ],
        "narratives": build_narratives(),
        "frictionPoints": build_friction_points(),
        "screenCopy": build_screen_copy(),
        "clientJourney": build_client_journey_copy(),
        "bSingleCopyTemplates": build_bsingle_copy(),
    }


def main():
    artifact = build_artifact()
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(artifact, ensure_ascii=True, indent=2)
    OUTPUT_FILE.write_text(
        "/* Generated from final deliverable source files. Do not edit manually. */\n"
        f"export const FINAL_DELIVERABLE_DATA = Object.freeze({payload});\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {OUTPUT_FILE.relative_to(WORKSPACE_ROOT)} "
        f"with {len(artifact['narratives'])} narratives and {len(artifact['frictionPoints'])} friction rows"
    )


if __name__ == "__main__":
    main()
