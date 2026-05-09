import json
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path


APP_ROOT = Path.cwd() if Path.cwd().name == "framer-vercel-public" else Path(__file__).resolve().parents[1]
SOURCE_DIR = APP_ROOT / "NewLogic 03.05.2026"
OUTPUT_DIR = APP_ROOT / "src" / "generated" / "newlogic"

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

ENV_ALIASES = {
    "NF/NT": "The Idea Lab",
    "NT/STJ": "The Performance Arena",
    "NT/STP": "The Disruption Lab",
    "NF/SFJ": "The Mission Field",
    "NF/SFP": "The Creative Commons",
    "SFJ/SFP": "The Hometown Network",
    "SFP/SFJ": "The Franchise Machine",
    "STJ/STP": "The Power Racket",
    "STP/STJ": "The Enforcer Network",
}

ENV_CODES = tuple(sorted(ENV_ALIASES.keys(), key=len, reverse=True))
OPTION_VALUES = ("A", "B", "C", "D", "E", "F")


def column_number(cell_ref):
    match = re.match(r"([A-Z]+)", cell_ref or "")
    if not match:
        return 0
    number = 0
    for char in match.group(1):
        number = number * 26 + ord(char) - 64
    return number


def normalize_sheet_target(target):
    target = (target or "").replace("\\", "/")
    if target.startswith("/"):
        target = target.lstrip("/")
    elif not target.startswith("xl/"):
        target = f"xl/{target}"

    parts = []
    for part in target.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            if parts:
                parts.pop()
            continue
        parts.append(part)
    return "/".join(parts)


def clean_text(value):
    text = str(value or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    text = re.sub(r"\bSource document:\s*[^\n]*?\.docx\b", "", text, flags=re.IGNORECASE)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def normalize_env_code(value):
    text = clean_text(value)
    return "SFP/SFJ" if text == "SP/SJ" else text


def extract_environment_signals(value):
    text = clean_text(value)
    return [code for code in ENV_CODES if re.search(rf"(?<![A-Z]){re.escape(code)}(?![A-Z])", text)]


def to_key(value):
    text = clean_text(value)
    text = re.sub(r"\(.*?\)", "", text)
    pieces = re.findall(r"[A-Za-z0-9]+", text)
    if not pieces:
        return ""
    return pieces[0].lower() + "".join(piece[:1].upper() + piece[1:].lower() for piece in pieces[1:])


def comparable_header(value):
    return re.sub(r"[^a-z0-9]+", "", clean_text(value).lower())


def number_or_text(value):
    text = clean_text(value)
    if text == "":
        return ""
    try:
        number = float(text)
    except ValueError:
        return text
    return int(number) if number.is_integer() else number


class Workbook:
    def __init__(self, path):
        self.path = Path(path)
        self._archive = zipfile.ZipFile(self.path)
        self._shared_strings = self._load_shared_strings()
        self._sheet_paths = self._load_sheet_paths()

    def close(self):
        self._archive.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()

    @property
    def sheet_names(self):
        return list(self._sheet_paths.keys())

    def _load_shared_strings(self):
        if "xl/sharedStrings.xml" not in self._archive.namelist():
            return []
        root = ET.fromstring(self._archive.read("xl/sharedStrings.xml"))
        strings = []
        for item in root.findall("a:si", NS):
            strings.append("".join(text.text or "" for text in item.iter(f"{{{NS['a']}}}t")))
        return strings

    def _load_sheet_paths(self):
        workbook = ET.fromstring(self._archive.read("xl/workbook.xml"))
        rels = ET.fromstring(self._archive.read("xl/_rels/workbook.xml.rels"))
        relmap = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels.findall("rel:Relationship", NS)}
        sheet_paths = {}
        for sheet in workbook.find("a:sheets", NS):
            rel_id = sheet.attrib[f"{{{NS['r']}}}id"]
            sheet_paths[sheet.attrib["name"]] = normalize_sheet_target(relmap[rel_id])
        return sheet_paths

    def _cell_value(self, cell):
        if cell.attrib.get("t") == "inlineStr":
            return "".join(text.text or "" for text in cell.iter(f"{{{NS['a']}}}t"))

        value = cell.find("a:v", NS)
        if value is None:
            return ""

        raw = value.text or ""
        if cell.attrib.get("t") == "s":
            return self._shared_strings[int(raw)]
        return raw

    def read_rows(self, sheet_name):
        root = ET.fromstring(self._archive.read(self._sheet_paths[sheet_name]))
        rows = []
        for row in root.findall(".//a:row", NS):
            values = {}
            for cell in row.findall("a:c", NS):
                value = clean_text(self._cell_value(cell))
                if value != "":
                    values[column_number(cell.attrib.get("r", ""))] = value
            if values:
                rows.append((int(row.attrib.get("r", "0")), values))
        return rows


def table_records(workbook, sheet_name, required_header):
    rows = workbook.read_rows(sheet_name)
    header_index = None
    header_values = None
    required = comparable_header(required_header)
    for index, (_, values) in enumerate(rows):
        if required in {comparable_header(value) for value in values.values()}:
            header_index = index
            header_values = values
            break

    if header_index is None:
        return []

    records = []
    for row_number, values in rows[header_index + 1 :]:
        if not any(clean_text(value) for value in values.values()):
            continue
        record = {"sourceRow": row_number}
        for column, header in header_values.items():
            key = to_key(header)
            if key:
                record[key] = clean_text(values.get(column, ""))
        non_source_values = [value for key, value in record.items() if key != "sourceRow"]
        if any(non_source_values):
            records.append(record)
    return records


def compact_rows(workbook, sheet_name, max_rows=None):
    rows = []
    for row_number, values in workbook.read_rows(sheet_name):
        rows.append(
            {
                "sourceRow": row_number,
                "cells": {str(column): clean_text(value) for column, value in values.items()},
            }
        )
        if max_rows and len(rows) >= max_rows:
            break
    return rows


def option_record(value, text, signal_text, source_row):
    signals = extract_environment_signals(signal_text)
    return {
        "value": value,
        "text": clean_text(text),
        "internalEnvironmentSignals": signals,
        "publicEnvironmentSignals": [ENV_ALIASES[code] for code in signals],
        "scoringNote": clean_text(signal_text),
        "excludedFromPrimaryScoring": value in ("E", "F") or "excluded from primary scoring" in clean_text(signal_text).lower(),
        "sourceRow": source_row,
    }


def parse_marker_questionnaire(workbook, sheet_name, module_id, source_workbook, side_applicability):
    rows = workbook.read_rows(sheet_name)
    questions = []
    active_group = ""

    for index, (row_number, values) in enumerate(rows):
        marker = clean_text(values.get(1, ""))
        code = clean_text(values.get(2, ""))
        if marker.startswith("──"):
            active_group = re.sub(r"\s+", " ", marker.replace("─", "").strip())
            continue

        if marker != "▶" or not re.fullmatch(r"Q\d+", code):
            continue

        gate = None
        inputs = []
        notes = []
        options = []

        for next_row_number, next_values in rows[index + 1 :]:
            next_marker = clean_text(next_values.get(1, ""))
            next_code = clean_text(next_values.get(2, ""))
            if next_marker == "▶" and re.fullmatch(r"Q\d+", next_code):
                break
            if next_marker.startswith("──"):
                break

            if next_marker == "Gate":
                gate = {
                    "prompt": clean_text(next_values.get(2, "")),
                    "validation": clean_text(next_values.get(5, "")),
                    "note": clean_text(next_values.get(6, "")),
                    "sourceRow": next_row_number,
                }
                continue

            if next_code in OPTION_VALUES and clean_text(next_values.get(3, "")):
                options.append(option_record(next_code, next_values.get(3, ""), next_values.get(6, ""), next_row_number))
                continue

            if next_marker == "Input":
                inputs.append(
                    {
                        "field": clean_text(next_values.get(2, "")),
                        "validation": clean_text(next_values.get(5, "")),
                        "note": clean_text(next_values.get(6, "")),
                        "sourceRow": next_row_number,
                    }
                )
                continue

            if next_marker.startswith("◆") or next_marker.startswith("◇"):
                notes.append({"text": next_marker, "sourceRow": next_row_number})

        signals = sorted({signal for option in options for signal in option["internalEnvironmentSignals"]})
        questions.append(
            {
                "id": f"{module_id}-{code}",
                "workbookQuestionId": code,
                "sourceWorkbook": source_workbook,
                "sourceSheet": sheet_name,
                "sourceRow": row_number,
                "diagnosticLayer": "respondent_questionnaire",
                "questionType": "single_choice",
                "sideApplicability": side_applicability,
                "group": active_group,
                "prompt": clean_text(values.get(3, "")),
                "directObservationGate": gate,
                "options": options,
                "answerFields": inputs,
                "requiresEvidenceClassification": any(
                    field["field"] in ("Evidence Type", "Knowledge Level", "Confidence", "Reliability Flags (free text, comma-separated)")
                    for field in inputs
                ),
                "allowsUnknown": any(option["value"] in ("E", "F") for option in options),
                "mapsToEnvironmentSignals": signals,
                "publicEnvironmentSignals": [ENV_ALIASES[code] for code in signals],
                "methodologyNotes": notes,
            }
        )

    return questions


def parse_positioning_fields(workbook, sheet_name, source_workbook):
    rows = workbook.read_rows(sheet_name)
    fields = []
    for index, (row_number, values) in enumerate(rows):
        label = clean_text(values.get(1, ""))
        if not re.match(r"P\d+\s", label):
            continue
        options = []
        for option_row_number, option_values in rows[index + 1 :]:
            option_value = clean_text(option_values.get(1, ""))
            if option_value in OPTION_VALUES:
                options.append(
                    {
                        "value": option_value,
                        "text": clean_text(option_values.get(2, "")),
                        "sourceRow": option_row_number,
                    }
                )
                continue
            if clean_text(option_values.get(1, "")).startswith(("P", "ℹ")):
                break
            if option_value == "":
                continue
            break
        fields.append(
            {
                "id": re.sub(r"\W+", "_", label.split("·", 1)[0].lower()).strip("_"),
                "label": label,
                "sourceWorkbook": source_workbook,
                "sourceSheet": sheet_name,
                "sourceRow": row_number,
                "options": options,
                "scored": False,
            }
        )
    return fields


def parse_target_observed_questionnaire(workbook):
    question_rows = table_records(workbook, "Questionnaire", "Question_ID")
    answer_key_rows = table_records(workbook, "Answer_Key", "Question_ID")
    answer_key = {
        (row.get("questionId", ""), row.get("option", "")): row
        for row in answer_key_rows
        if row.get("questionId") and row.get("option")
    }

    questions = []
    for row in question_rows:
        question_id = row.get("questionId", "")
        if not question_id:
            continue

        options = []
        for option in OPTION_VALUES:
            text = row.get(f"option{option}", "")
            if not text:
                continue
            key_row = answer_key.get((question_id, option), {})
            env_code = normalize_env_code(row.get(f"{option.lower()}Environment", "") or row.get(f"{option}Environment", ""))
            signals = extract_environment_signals(env_code)
            options.append(
                {
                    "value": option,
                    "text": text,
                    "internalEnvironmentSignals": signals,
                    "publicEnvironmentSignals": [ENV_ALIASES[code] for code in signals],
                    "environmentName": key_row.get("environmentName", ""),
                    "diagnosticRationale": key_row.get("diagnosticRationale", ""),
                    "resourceSignal": key_row.get("resourceSignal", ""),
                    "confidenceImpact": key_row.get("confidenceImpact", ""),
                }
            )

        signals = sorted({signal for option in options for signal in option["internalEnvironmentSignals"]})
        questions.append(
            {
                "id": f"TGT-OBS-{question_id.replace(' ', '-')}",
                "workbookQuestionId": question_id,
                "sourceWorkbook": "ST_Target_Observed_Environment_Diagnostic.xlsx",
                "sourceSheet": "Questionnaire",
                "sourceRow": row["sourceRow"],
                "diagnosticLayer": "respondent_questionnaire",
                "questionType": "evidence_calibration" if question_id.startswith("EVID") else "single_choice",
                "sideApplicability": ["acquirer"],
                "section": row.get("section", ""),
                "prompt": row.get("questionText", ""),
                "options": options,
                "primaryDomain": row.get("primaryDomain", ""),
                "secondaryDomain": row.get("secondaryDomain", ""),
                "legacyEvidenceType": row.get("evidenceType", ""),
                "surveyDesignNote": row.get("surveyDesignNote", ""),
                "directObservationGate": row.get("directobservationGate", ""),
                "answerFields": {
                    "evidenceType": row.get("evidencetype", ""),
                    "knowledgeLevel": row.get("knowledgelevel", ""),
                    "confidence": row.get("confidence", ""),
                    "reliabilityFlags": row.get("reliabilityflags", ""),
                    "observedRoles": row.get("observedRoles", ""),
                    "evidenceReference": row.get("evidenceReference", ""),
                    "respondentNotes": row.get("respondentNotes", ""),
                },
                "requiresEvidenceClassification": True,
                "allowsUnknown": any(option["value"] in ("E", "F") for option in options),
                "mapsToEnvironmentSignals": signals,
                "publicEnvironmentSignals": [ENV_ALIASES[code] for code in signals],
            }
        )

    return questions


def parse_ecs_matrix(workbook):
    rows = workbook.read_rows("ECS_Matrix")
    header = None
    for _, values in rows:
        if clean_text(values.get(1, "")).startswith("Acq"):
            header = values
            break
    if not header:
        return []

    target_codes = {column: normalize_env_code(value) for column, value in header.items() if column > 1 and clean_text(value)}
    matrix = []
    for row_number, values in rows:
        acquirer_code = normalize_env_code(values.get(1, ""))
        if acquirer_code not in ENV_ALIASES:
            continue
        scores = {}
        for column, target_code in target_codes.items():
            value = clean_text(values.get(column, ""))
            if value:
                scores[target_code] = number_or_text(value)
        matrix.append(
            {
                "sourceRow": row_number,
                "acquirerEnvironmentCode": acquirer_code,
                "acquirerEnvironmentName": ENV_ALIASES[acquirer_code],
                "targetScores": scores,
            }
        )
    return matrix


def parse_canonical_schema():
    with Workbook(SOURCE_DIR / "ST_Canonical_Schema.xlsx") as workbook:
        return {
            "sourceWorkbook": "ST_Canonical_Schema.xlsx",
            "sides": table_records(workbook, "1_Sides", "Code"),
            "roles": table_records(workbook, "2_Roles", "Role Code"),
            "evidenceTypes": table_records(workbook, "3_EvidenceType", "Code"),
            "knowledgeLevels": table_records(workbook, "4_KnowledgeLevel", "Code"),
            "confidenceLevels": table_records(workbook, "5_Confidence", "Code"),
            "reliabilityFlags": table_records(workbook, "6_ReliabilityFlags", "Code"),
            "recordSchemas": {
                "answer": table_records(workbook, "7_Answer_Record", "Field"),
                "respondent": table_records(workbook, "8_Respondent_Record", "Field"),
                "evidenceItem": table_records(workbook, "9_EvidenceItem_Record", "Field"),
                "analystAssessment": table_records(workbook, "10_AnalystAssessment", "Field"),
                "contradiction": table_records(workbook, "11_Contradiction_Record", "Field"),
                "riskOutput": table_records(workbook, "12_RiskOutput_Record", "Field"),
            },
            "riskCategories": table_records(workbook, "13_RiskCategories", "Code"),
            "roleCoverageMatrix": table_records(workbook, "14_RoleCoverageMatrix", "Tier"),
            "confidenceGate": table_records(workbook, "15_ConfidenceGate", "Threshold"),
            "overridePrecedence": table_records(workbook, "16_OverridePrecedence", "Scenario"),
            "analystGate": table_records(workbook, "17_AnalystGate", "Output type"),
        }


def parse_questionnaires():
    modules = []

    marker_sources = [
        (
            "acquirerEnvironment",
            "ST_Acquirer_Environment_Module.xlsx",
            "2_Positioning",
            "3_Screening",
            ["acquirer"],
        ),
        (
            "targetSelfAssessment",
            "ST_Target_Self_Assessment_Module.xlsx",
            "2_Positioning",
            "3_Screening",
            ["target"],
        ),
        (
            "environmentLevel1",
            "ST_Environment_Diagnostic_v2.xlsx",
            "2_Block_0_Positioning",
            "3_Level_1_Screening",
            ["acquirer", "target", "advisor", "board", "external", "other"],
        ),
        (
            "environmentLevel2",
            "ST_Environment_Diagnostic_v2.xlsx",
            "2_Block_0_Positioning",
            "4_Level_2_Deepening",
            ["acquirer", "target", "advisor", "board", "external", "other"],
        ),
    ]

    for module_id, filename, positioning_sheet, question_sheet, sides in marker_sources:
        with Workbook(SOURCE_DIR / filename) as workbook:
            modules.append(
                {
                    "id": module_id,
                    "sourceWorkbook": filename,
                    "positioningFields": parse_positioning_fields(workbook, positioning_sheet, filename),
                    "questions": parse_marker_questionnaire(workbook, question_sheet, module_id.upper(), filename, sides),
                }
            )

    with Workbook(SOURCE_DIR / "ST_Target_Observed_Environment_Diagnostic.xlsx") as workbook:
        modules.append(
            {
                "id": "targetObservedEnvironment",
                "sourceWorkbook": "ST_Target_Observed_Environment_Diagnostic.xlsx",
                "respondentMetadataFields": table_records(workbook, "0_Respondent_Metadata", "Field"),
                "questions": parse_target_observed_questionnaire(workbook),
                "answerKey": table_records(workbook, "Answer_Key", "Question_ID"),
                "scoringModel": table_records(workbook, "Scoring_Model", "Environment_Code"),
                "evidenceConfidence": table_records(workbook, "Evidence_Confidence", "Evidence_Question"),
            }
        )

    return {"modules": modules}


def parse_form_bindings():
    with Workbook(SOURCE_DIR / "ST_Form_Binding_Prompt.xlsx") as workbook:
        return {
            "sourceWorkbook": "ST_Form_Binding_Prompt.xlsx",
            "masterPromptRows": compact_rows(workbook, "MASTER PROMPT"),
            "step1Rows": compact_rows(workbook, "STEP-1"),
            "bindings": {
                "step2A": table_records(workbook, "STEP-2A", "Q #"),
                "step2C": table_records(workbook, "STEP-2C", "Q #"),
                "step2BLevel1": table_records(workbook, "STEP-2B-L1", "Q #"),
                "step2BLevel2": table_records(workbook, "STEP-2B-L2", "Q #"),
                "stepTargetObserved": table_records(workbook, "STEP-TOD", "Q #"),
            },
            "routingRows": compact_rows(workbook, "STEP-2B ROUTING"),
        }


def parse_scoring_and_triage():
    with Workbook(SOURCE_DIR / "ST_Dual_Respondent_Axis_Comparison_v1.xlsx") as dual:
        dual_artifact = {
            "sourceWorkbook": "ST_Dual_Respondent_Axis_Comparison_v1.xlsx",
            "answerEnvironmentMap": table_records(dual, "1_Answer_Env_Map", "Question"),
            "pairSpecificWeights": table_records(dual, "2_Pair_Specific_Weights", "Pair"),
            "comparisonEngine": table_records(dual, "3_Comparison_Engine", "Question"),
            "evidenceQualityLayer": table_records(dual, "4_Evidence_Quality_Layer", "Evidence variable"),
            "divergenceClassification": table_records(dual, "5_Divergence_Classification", "State"),
            "contradictionOutput": table_records(dual, "6_Contradiction_Output", "Divergence State"),
            "edgeCases": table_records(dual, "7_Edge_Cases", "Case"),
        }

    with Workbook(SOURCE_DIR / "ST_Triage_Framework.xlsx") as triage:
        triage_artifact = {
            "sourceWorkbook": "ST_Triage_Framework.xlsx",
            "triggerConditions": table_records(triage, "1_Trigger_Conditions", "Trigger"),
            "accuracyChecks": table_records(triage, "2_Accuracy_Check", "Check"),
            "reliabilityFlagTiers": table_records(triage, "3_Reliability_Flag_Count", "Tier"),
            "reliabilityFlagRules": table_records(triage, "3_Reliability_Flag_Count", "Flag"),
            "contradictionTiers": table_records(triage, "4_Contradiction_Count", "Tier"),
            "instrumentSelection": table_records(triage, "5_Instrument_Selection", "Trigger"),
            "verificationOutput": compact_rows(triage, "6_Verification_Output"),
            "practitionerEscalation": compact_rows(triage, "7_Practitioner_Escalation"),
            "decisionTree": table_records(triage, "8_Decision_Tree", "Step"),
        }

    return {"dualRespondentComparison": dual_artifact, "triage": triage_artifact}


def parse_narratives_and_friction():
    with Workbook(SOURCE_DIR / "ST_Free_Tier_Output_Narratives_updated.xlsx") as narratives:
        narrative_rows = []
        for row in table_records(narratives, "All_72_Narratives", "Acquirer Env."):
            row["acquirerEnvironmentCode"] = normalize_env_code(row.pop("acquirerEnv", ""))
            row["targetEnvironmentCode"] = normalize_env_code(row.pop("targetEnv", ""))
            if row["acquirerEnvironmentCode"] not in ENV_ALIASES or row["targetEnvironmentCode"] not in ENV_ALIASES:
                continue
            row["acquirerEnvironmentName"] = ENV_ALIASES.get(row["acquirerEnvironmentCode"], row["acquirerEnvironmentCode"])
            row["targetEnvironmentName"] = ENV_ALIASES.get(row["targetEnvironmentCode"], row["targetEnvironmentCode"])
            narrative_rows.append(row)
        narratives_artifact = {
            "sourceWorkbook": "ST_Free_Tier_Output_Narratives_updated.xlsx",
            "implementationGuideRows": compact_rows(narratives, "Implementation_Guide"),
            "freeTierNarratives": narrative_rows,
            "confidenceGateMapping": table_records(narratives, "Confidence_Gate_Mapping", "CONFIDENCE GATE"),
            "schemaMethodologyDependencies": compact_rows(narratives, "Schema_Methodology_Dependencies"),
        }

    with Workbook(SOURCE_DIR / "ST_Friction_Point_Lookup_updated.xlsx") as friction:
        friction_rows = []
        for row in table_records(friction, "Friction_Lookup", "Acquirer Env."):
            row["acquirerEnvironmentCode"] = normalize_env_code(row.pop("acquirerEnv", ""))
            row["targetEnvironmentCode"] = normalize_env_code(row.pop("targetEnv", ""))
            if row["acquirerEnvironmentCode"] not in ENV_ALIASES or row["targetEnvironmentCode"] not in ENV_ALIASES:
                continue
            row["acquirerEnvironmentName"] = ENV_ALIASES.get(row["acquirerEnvironmentCode"], row["acquirerEnvironmentCode"])
            row["targetEnvironmentName"] = ENV_ALIASES.get(row["targetEnvironmentCode"], row["targetEnvironmentCode"])
            friction_rows.append(row)
        friction_artifact = {
            "sourceWorkbook": "ST_Friction_Point_Lookup_updated.xlsx",
            "frictionLookup": friction_rows,
            "ecsMatrix": parse_ecs_matrix(friction),
            "derivationMethod": table_records(friction, "Derivation_Method", "Primary source"),
            "riskCategoryTagging": compact_rows(friction, "Risk_Category_Tagging"),
        }

    with Workbook(SOURCE_DIR / "ST_Prediction_Ledger_v1.xlsx") as prediction:
        prediction_artifact = {
            "sourceWorkbook": "ST_Prediction_Ledger_v1.xlsx",
            "sealedPredictionSchema": table_records(prediction, "SEALED_PREDICTIONS", "Deal ID"),
            "verificationLogSchema": table_records(prediction, "VERIFICATION_LOG", "Deal ID"),
            "calibrationLogSchema": table_records(prediction, "CALIBRATION_LOG", "Dom. Function"),
            "accuracyDashboardRows": compact_rows(prediction, "ACCURACY_DASHBOARD"),
            "agentReadInstructions": compact_rows(prediction, "AGENT_READ_INSTRUCTIONS"),
        }

    return {
        "narratives": narratives_artifact,
        "friction": friction_artifact,
        "predictionLedger": prediction_artifact,
    }


def parse_reporting():
    with Workbook(SOURCE_DIR / "ST_B_Single_Output_Template_v1.xlsx") as report:
        section_sheets = []
        for sheet_name in report.sheet_names:
            if sheet_name.startswith("20_"):
                continue
            section_sheets.append(
                {
                    "sheetName": sheet_name,
                    "rows": compact_rows(report, sheet_name),
                }
            )
        report_artifact = {
            "sourceWorkbook": "ST_B_Single_Output_Template_v1.xlsx",
            "sectionSheets": section_sheets,
            "buyerFacingAliases": table_records(report, "Buyer_Facing_Aliases", "Internal term"),
        }

    with Workbook(SOURCE_DIR / "ST_Step3_Output_Screens_Spec.xlsx") as screens:
        screens_artifact = {
            "sourceWorkbook": "ST_Step3_Output_Screens_Spec.xlsx",
            "screen1WeakResultRows": compact_rows(screens, "SCREEN_1_WEAK_RESULT"),
            "screen2SecondSubmissionRows": compact_rows(screens, "SCREEN_2_SECOND_SUBMISSION"),
            "screen3FinalOutputRows": compact_rows(screens, "SCREEN_3_FINAL_OUTPUT"),
            "copyTemplates": table_records(screens, "COPY_TEMPLATES", "CT-ID"),
        }

    with Workbook(SOURCE_DIR / "ST_Client_Journey_v5.xlsx") as journey:
        journey_artifact = {
            "sourceWorkbook": "ST_Client_Journey_v5.xlsx",
            "clientJourney": table_records(journey, "Client Journey", "Step"),
            "dependencyRegister": table_records(journey, "Dependency_Register", "Dependency"),
            "buildNotes": compact_rows(journey, "v3_1_Build_Notes"),
        }

    return {"reportTemplate": report_artifact, "step3Screens": screens_artifact, "clientJourney": journey_artifact}


def build_source_manifest():
    workbooks = []
    for path in sorted(SOURCE_DIR.glob("*.xlsx")):
        with Workbook(path) as workbook:
            workbooks.append(
                {
                    "file": path.name,
                    "sizeBytes": path.stat().st_size,
                    "lastModified": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
                    "sheets": workbook.sheet_names,
                }
            )
    return {
        "sourcePackage": {
            "id": "newlogic-2026-05-03",
            "name": SOURCE_DIR.name,
            "path": str(SOURCE_DIR.relative_to(APP_ROOT)),
            "exportedAt": datetime.now(timezone.utc).isoformat(),
        },
        "environmentAliases": ENV_ALIASES,
        "workbooks": workbooks,
    }


def write_json(filename, payload):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / filename
    output_path.write_text(json.dumps(payload, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
    return output_path


def main():
    if not SOURCE_DIR.exists():
        raise FileNotFoundError(f"Missing NewLogic source folder: {SOURCE_DIR}")

    artifacts = {
        "sourceManifest.json": build_source_manifest(),
        "canonicalSchema.json": parse_canonical_schema(),
        "questionnaires.json": parse_questionnaires(),
        "formBindings.json": parse_form_bindings(),
        "scoringAndTriage.json": parse_scoring_and_triage(),
        "narrativesAndFriction.json": parse_narratives_and_friction(),
        "reporting.json": parse_reporting(),
    }

    written = []
    for filename, payload in artifacts.items():
        written.append(write_json(filename, payload))

    print(f"Wrote {len(written)} NewLogic JSON artifacts to {OUTPUT_DIR.relative_to(APP_ROOT)}")
    print(
        "Question modules:",
        ", ".join(
            f"{module['id']}={len(module.get('questions', []))}"
            for module in artifacts["questionnaires.json"]["modules"]
        ),
    )
    print(
        "Narratives:",
        len(artifacts["narrativesAndFriction.json"]["narratives"]["freeTierNarratives"]),
        "Friction rows:",
        len(artifacts["narrativesAndFriction.json"]["friction"]["frictionLookup"]),
    )


if __name__ == "__main__":
    main()
