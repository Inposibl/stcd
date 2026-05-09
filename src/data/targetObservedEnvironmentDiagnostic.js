/* Generated from ST_Target_Observed_Environment_Diagnostic.xlsx. Do not edit manually. */
export const TARGET_OBSERVATION_DIAGNOSTIC = Object.freeze({
  "source": "ST_Target_Observed_Environment_Diagnostic.xlsx",
  "worksheet": "Questionnaire",
  "questionCount": 22,
  "questions": [
    {
      "id": "EVID Q1",
      "section": "Evidence Calibration",
      "text": "How many direct interactions did your team have with the target company's senior leadership (C-suite and direct reports) during diligence?",
      "options": [
        {
          "value": "A",
          "text": "Six or more structured sessions across multiple functions",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "High direct contact depth",
          "resourceSignal": "Evidence depth +3",
          "confidenceImpact": "Confidence +3"
        },
        {
          "value": "B",
          "text": "Three to five sessions, at least two of which involved substantive discussion beyond prepared materials",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Moderate direct contact",
          "resourceSignal": "Evidence depth +2",
          "confidenceImpact": "Confidence +2"
        },
        {
          "value": "C",
          "text": "One or two introductory meetings; limited unscripted interaction",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Limited unscripted interaction",
          "resourceSignal": "Evidence depth +1",
          "confidenceImpact": "Confidence +1"
        },
        {
          "value": "D",
          "text": "No direct leadership interaction; assessment based on secondary materials only",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Secondary materials only",
          "resourceSignal": "Evidence depth +0",
          "confidenceImpact": "Confidence +0"
        }
      ],
      "primaryDomain": "Evidence Depth",
      "secondaryDomain": "Leadership Access",
      "evidenceType": "Management meetings \u00b7 Functional leader interviews",
      "surveyDesignNote": "Single-dimension evidence-depth question. TDM: clear ordinal scale from richest to weakest. AAPOR: specific and unambiguous."
    },
    {
      "id": "EVID Q2",
      "section": "Evidence Calibration",
      "text": "Which of the following best describes the range of data room and documentary evidence your team reviewed?",
      "options": [
        {
          "value": "A",
          "text": "Reviewed financials, KPI history, org charts, compensation data, and process documentation in full",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Full data breadth",
          "resourceSignal": "Evidence breadth +3",
          "confidenceImpact": "Confidence +3"
        },
        {
          "value": "B",
          "text": "Reviewed financials and org charts; partial access to KPI history or compensation data",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Moderate data breadth",
          "resourceSignal": "Evidence breadth +2",
          "confidenceImpact": "Confidence +2"
        },
        {
          "value": "C",
          "text": "Reviewed summary financials only; limited or no access to operational or people data",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Limited documentary basis",
          "resourceSignal": "Evidence breadth +1",
          "confidenceImpact": "Confidence +1"
        },
        {
          "value": "D",
          "text": "No meaningful data room access; relying on management-provided narrative only",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Insufficient documentary basis",
          "resourceSignal": "Evidence breadth +0",
          "confidenceImpact": "Confidence +0"
        }
      ],
      "primaryDomain": "Evidence Breadth",
      "secondaryDomain": "Documentary Coverage",
      "evidenceType": "Data room materials \u00b7 Financial model \u00b7 Org chart \u00b7 Compensation data",
      "surveyDesignNote": "Covers range of evidence types. TDM: options are mutually exclusive and ordered. AAPOR: avoids technical jargon; accessible to deal professionals."
    },
    {
      "id": "EVID Q3",
      "section": "Evidence Calibration",
      "text": "During diligence, did your team observe any episode where the target company faced unexpected pressure \u2014 a missed target, a bad-news disclosure, a disagreement, or an unanticipated question?",
      "options": [
        {
          "value": "A",
          "text": "Yes \u2014 multiple pressure episodes observed, with clear behavioral data on how the target responded",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Behavioral data under pressure",
          "resourceSignal": "Pressure exposure +3",
          "confidenceImpact": "Confidence +3"
        },
        {
          "value": "B",
          "text": "Yes \u2014 at least one pressure episode observed; response behavior partially visible",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Partial behavioral observation",
          "resourceSignal": "Pressure exposure +2",
          "confidenceImpact": "Confidence +2"
        },
        {
          "value": "C",
          "text": "Indirectly \u2014 we heard about pressure episodes but did not observe target behavior firsthand",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Indirect pressure signal",
          "resourceSignal": "Pressure exposure +1",
          "confidenceImpact": "Confidence +1"
        },
        {
          "value": "D",
          "text": "No \u2014 diligence was smooth and scripted; no unplanned situations arose",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Scripted diligence only",
          "resourceSignal": "Pressure exposure +0",
          "confidenceImpact": "Confidence +0"
        }
      ],
      "primaryDomain": "Pressure Exposure",
      "secondaryDomain": "Conflict Observation",
      "evidenceType": "Negotiation behavior \u00b7 Bad-news episode \u00b7 Conflict handling",
      "surveyDesignNote": "Critical behavioral signal question. TDM: grounded in observable episode. AAPOR: does not lead respondent toward any specific interpretation."
    },
    {
      "id": "EVID Q4",
      "section": "Evidence Calibration",
      "text": "How closely did the target company's observable behavior during diligence match the official narrative they presented about their culture and values?",
      "options": [
        {
          "value": "A",
          "text": "Strong match \u2014 observable behavior consistently aligned with stated culture across multiple situations",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Low facade risk",
          "resourceSignal": "Facade/core gap: low",
          "confidenceImpact": "Confidence: narrative reliable"
        },
        {
          "value": "B",
          "text": "Partial match \u2014 most behavior aligned, but at least one notable inconsistency was observed",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Moderate facade risk",
          "resourceSignal": "Facade/core gap: moderate",
          "confidenceImpact": "Confidence: moderate; flag gap"
        },
        {
          "value": "C",
          "text": "Notable gap \u2014 observable behavior and stated culture diverged in more than one situation",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "High facade risk",
          "resourceSignal": "Facade/core gap: high",
          "confidenceImpact": "Confidence: reduced; environment may be masked"
        },
        {
          "value": "D",
          "text": "Clear gap \u2014 the official narrative appeared to be a deliberate presentation disconnected from operating behavior",
          "environment": "N/A",
          "environmentName": "Evidence calibration",
          "rationale": "Severe facade risk",
          "resourceSignal": "Facade/core gap: severe",
          "confidenceImpact": "Confidence: significantly reduced; Irresolvable risk"
        }
      ],
      "primaryDomain": "Facade vs Operating Core",
      "secondaryDomain": "Narrative Validity",
      "evidenceType": "Management meetings \u00b7 Negotiation behavior \u00b7 Employee interviews",
      "surveyDesignNote": "Facade/core distinction question. TDM: specific behavioral contrast avoids social desirability. AAPOR: graduated scale with concrete anchors."
    },
    {
      "id": "TED Q1",
      "section": "Decision Logic",
      "text": "Based on what you observed during management meetings and diligence sessions, when the target company faced a significant strategic disagreement, what most reliably determined the final outcome?",
      "options": [
        {
          "value": "A",
          "text": "The position supported by the strongest analysis or most rigorous evidence prevailed, regardless of who held it",
          "environment": "NF/NT",
          "environmentName": "The Idea Lab",
          "rationale": "Maps to NF/NT (The Idea Lab) via Decision Logic",
          "resourceSignal": "NF/NT resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "The position held by the most senior person in the room was adopted, even when other evidence pointed differently",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Decision Logic",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "The position that best aligned with the company's stated mission or values was chosen, even at the cost of analytical clarity",
          "environment": "NF/SFJ",
          "environmentName": "The Mission Field",
          "rationale": "Maps to NF/SFJ (The Mission Field) via Decision Logic",
          "resourceSignal": "NF/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "The position favored by whoever controlled the most critical resources or relationships was adopted",
          "environment": "STP/STJ",
          "environmentName": "The Enforcer Network",
          "rationale": "Maps to STP/STJ (The Enforcer Network) via Decision Logic",
          "resourceSignal": "STP/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Decision Logic",
      "secondaryDomain": "Authority Signal",
      "evidenceType": "Management meetings \u00b7 Negotiation behavior",
      "surveyDesignNote": "Covers how authority and evidence interact in decisions. Four options are mutually exclusive and capture distinct environment signals."
    },
    {
      "id": "TED Q2",
      "section": "Promotion and Protection Logic",
      "text": "Based on diligence data \u2014 including org charts, tenure records, and any compensation or retention information available \u2014 what pattern best described who received advancement or protection in the target organization?",
      "options": [
        {
          "value": "A",
          "text": "People who delivered the most clearly measurable results, tracked against transparent metrics",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Promotion Logic",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "People who demonstrated the strongest loyalty to senior leadership or longest organizational tenure",
          "environment": "SFJ/SFP",
          "environmentName": "The Hometown Network",
          "rationale": "Maps to SFJ/SFP (The Hometown Network) via Promotion Logic",
          "resourceSignal": "SFJ/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "People who visibly embodied the company's values, mission narrative, or cultural identity",
          "environment": "NF/SFJ",
          "environmentName": "The Mission Field",
          "rationale": "Maps to NF/SFJ (The Mission Field) via Promotion Logic",
          "resourceSignal": "NF/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "People who proved they could generate revenue, enforce compliance, or extract value from the system",
          "environment": "SFP/SFJ",
          "environmentName": "The Franchise Machine",
          "rationale": "Maps to SFP/SFJ (The Franchise Machine) via Promotion Logic",
          "resourceSignal": "SFP/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Promotion Logic",
      "secondaryDomain": "Retention Signal",
      "evidenceType": "Compensation data \u00b7 Org chart \u00b7 Promotion/retention data",
      "surveyDesignNote": "Promotion pattern is one of the most diagnostic signals for environment type. Options cover four distinct logics."
    },
    {
      "id": "TED Q3",
      "section": "Resource Allocation",
      "text": "Based on what you observed in the financial model, KPI history, and management discussions, how did the target company appear to allocate discretionary resources (budget, headcount, attention) at the margin?",
      "options": [
        {
          "value": "A",
          "text": "Toward experimental or prototype initiatives with unclear payoff but high learning potential",
          "environment": "NT/STP",
          "environmentName": "The Disruption Lab",
          "rationale": "Maps to NT/STP (The Disruption Lab) via Resource Allocation",
          "resourceSignal": "NT/STP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "Toward activities that protected or expanded compliance, regulatory standing, or customer volume",
          "environment": "SFP/SFJ",
          "environmentName": "The Franchise Machine",
          "rationale": "Maps to SFP/SFJ (The Franchise Machine) via Resource Allocation",
          "resourceSignal": "SFP/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "Toward projects with the clearest measurable return and the most rigorous business case",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Resource Allocation",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "Toward creative, aesthetic, or values-expressive initiatives with qualitative rather than quantitative justification",
          "environment": "NF/SFP",
          "environmentName": "The Creative Commons",
          "rationale": "Maps to NF/SFP (The Creative Commons) via Resource Allocation",
          "resourceSignal": "NF/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Resource Allocation",
      "secondaryDomain": "Capital Deployment",
      "evidenceType": "Data room \u00b7 Financial model \u00b7 KPI history",
      "surveyDesignNote": "Resource allocation reveals revealed preference, not stated values. Options are operationally distinct."
    },
    {
      "id": "TED Q4",
      "section": "Conflict Handling",
      "text": "When the target company encountered internal disagreement or conflict during diligence \u2014 whether observed directly or described by management \u2014 how did they characteristically handle it?",
      "options": [
        {
          "value": "A",
          "text": "Disagreement was absorbed and resolved through structured process; outcomes were documented and enforced",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Conflict Handling",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "Disagreement was surfaced and resolved intellectually; the better argument was expected to win",
          "environment": "NF/NT",
          "environmentName": "The Idea Lab",
          "rationale": "Maps to NF/NT (The Idea Lab) via Conflict Handling",
          "resourceSignal": "NF/NT resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "Disagreement was suppressed or re-framed in values language; dissent was treated as a cultural problem",
          "environment": "NF/SFJ",
          "environmentName": "The Mission Field",
          "rationale": "Maps to NF/SFJ (The Mission Field) via Conflict Handling",
          "resourceSignal": "NF/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "Disagreement was resolved by whoever held the stronger positional power or controlled the most critical dependencies",
          "environment": "STJ/STP",
          "environmentName": "The Power Racket",
          "rationale": "Maps to STJ/STP (The Power Racket) via Conflict Handling",
          "resourceSignal": "STJ/STP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Conflict Handling",
      "secondaryDomain": "Dissent Response",
      "evidenceType": "Management meetings \u00b7 Negotiation behavior \u00b7 Bad-news episode",
      "surveyDesignNote": "Conflict resolution pattern distinguishes NT/STJ (procedural), NF/NT (intellectual), NF/SFJ (moral suppression), STJ/STP (power)."
    },
    {
      "id": "TED Q5",
      "section": "Authority and Status",
      "text": "Based on how the target company's leadership conducted themselves in management presentations and diligence interactions, how was authority most visibly established or demonstrated?",
      "options": [
        {
          "value": "A",
          "text": "Through demonstrated command of data, metrics, and competitive position",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Authority Signal",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "Through control of relationships, enforcement capacity, or visible punishment of deviation",
          "environment": "STJ/STP",
          "environmentName": "The Power Racket",
          "rationale": "Maps to STJ/STP (The Power Racket) via Authority Signal",
          "resourceSignal": "STJ/STP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "Through personal loyalty networks and tenure-based trust",
          "environment": "SFJ/SFP",
          "environmentName": "The Hometown Network",
          "rationale": "Maps to SFJ/SFP (The Hometown Network) via Authority Signal",
          "resourceSignal": "SFJ/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "Through moral or ideological framing \u2014 the leader as the embodiment of the company's purpose",
          "environment": "NF/SFJ",
          "environmentName": "The Mission Field",
          "rationale": "Maps to NF/SFJ (The Mission Field) via Authority Signal",
          "resourceSignal": "NF/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Authority Signal",
      "secondaryDomain": "Leadership Behavior",
      "evidenceType": "Management meetings \u00b7 Founder interview",
      "surveyDesignNote": "Authority demonstration is a key environment marker. Options are behaviorally grounded and mutually exclusive."
    },
    {
      "id": "TED Q6",
      "section": "Failure Response",
      "text": "Based on what you observed or were told about how the target company responded to a significant internal failure \u2014 a missed target, a product that did not perform, or a market that did not materialize \u2014 what response pattern was most evident?",
      "options": [
        {
          "value": "A",
          "text": "The failure was analyzed rigorously; accountability was assigned and consequences followed",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Failure Response",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "The failure was reinterpreted as learning; the team was given latitude to experiment again",
          "environment": "NT/STP",
          "environmentName": "The Disruption Lab",
          "rationale": "Maps to NT/STP (The Disruption Lab) via Failure Response",
          "resourceSignal": "NT/STP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "The failure was minimized or attributed to external factors; internal relationships were protected",
          "environment": "SFJ/SFP",
          "environmentName": "The Hometown Network",
          "rationale": "Maps to SFJ/SFP (The Hometown Network) via Failure Response",
          "resourceSignal": "SFJ/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "The failure resulted in visible punishment, exclusion, or resource withdrawal targeting the person who fell short",
          "environment": "STJ/STP",
          "environmentName": "The Power Racket",
          "rationale": "Maps to STJ/STP (The Power Racket) via Failure Response",
          "resourceSignal": "STJ/STP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Failure Response",
      "secondaryDomain": "Accountability Signal",
      "evidenceType": "Management meetings \u00b7 Financial model \u00b7 Bad-news episode",
      "surveyDesignNote": "Failure response directly reveals whether environment is performance-accountable, experimental, relational, or coercive."
    },
    {
      "id": "TED Q7",
      "section": "Trust and Belonging",
      "text": "Based on how target-company employees and leaders spoke about their organization during interviews or informal interactions, what appeared to be the primary basis for belonging and trust within the company?",
      "options": [
        {
          "value": "A",
          "text": "Shared belief in a mission, cause, or set of values that defined the organization's identity",
          "environment": "NF/SFJ",
          "environmentName": "The Mission Field",
          "rationale": "Maps to NF/SFJ (The Mission Field) via Trust Mechanism",
          "resourceSignal": "NF/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "Demonstrated intellectual contribution or expertise within the team's domain",
          "environment": "NF/NT",
          "environmentName": "The Idea Lab",
          "rationale": "Maps to NF/NT (The Idea Lab) via Trust Mechanism",
          "resourceSignal": "NF/NT resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "Personal relationship history, loyalty, and shared experience over time",
          "environment": "SFJ/SFP",
          "environmentName": "The Hometown Network",
          "rationale": "Maps to SFJ/SFP (The Hometown Network) via Trust Mechanism",
          "resourceSignal": "SFJ/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "Compliance with the system \u2014 producing results, generating revenue, or meeting specified behavioral expectations",
          "environment": "SFP/SFJ",
          "environmentName": "The Franchise Machine",
          "rationale": "Maps to SFP/SFJ (The Franchise Machine) via Trust Mechanism",
          "resourceSignal": "SFP/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Trust Mechanism",
      "secondaryDomain": "Belonging Signal",
      "evidenceType": "Employee interviews \u00b7 Functional leader interviews",
      "surveyDesignNote": "Trust basis is highly diagnostic. Options cover the four dominant belonging logics across the environment spectrum."
    },
    {
      "id": "TED Q8",
      "section": "Execution Rhythm",
      "text": "Based on process documentation, KPI history, and what management described as their operating cadence, how did the target company characteristically execute against its goals?",
      "options": [
        {
          "value": "A",
          "text": "Through rapid iteration cycles \u2014 test, measure, adjust \u2014 with tolerance for failure as part of the learning process",
          "environment": "NT/STP",
          "environmentName": "The Disruption Lab",
          "rationale": "Maps to NT/STP (The Disruption Lab) via Execution Rhythm",
          "resourceSignal": "NT/STP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "Through standardized systems, compliance processes, and volume-based metrics tracked consistently",
          "environment": "SFP/SFJ",
          "environmentName": "The Franchise Machine",
          "rationale": "Maps to SFP/SFJ (The Franchise Machine) via Execution Rhythm",
          "resourceSignal": "SFP/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "Through relationship-mediated coordination \u2014 people relied on trusted colleagues to manage handoffs and exceptions",
          "environment": "SFJ/SFP",
          "environmentName": "The Hometown Network",
          "rationale": "Maps to SFJ/SFP (The Hometown Network) via Execution Rhythm",
          "resourceSignal": "SFJ/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "Through structured planning cycles tied to measurable targets and formal review processes",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Execution Rhythm",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Execution Rhythm",
      "secondaryDomain": "Operational Cadence",
      "evidenceType": "Process documentation \u00b7 KPI history \u00b7 Data room",
      "surveyDesignNote": "Execution pattern distinguishes NT/STP (iteration), SFP/SFJ (system compliance), SFJ/SFP (relational), NT/STJ (structured metrics)."
    },
    {
      "id": "TED Q9",
      "section": "Integration Reaction",
      "text": "When integration planning discussions arose during diligence \u2014 whether formal or informal \u2014 how did the target company's leadership characteristically respond to the prospect of change?",
      "options": [
        {
          "value": "A",
          "text": "With intellectual curiosity \u2014 they engaged with structural questions and wanted to understand the acquirer's reasoning",
          "environment": "NF/NT",
          "environmentName": "The Idea Lab",
          "rationale": "Maps to NF/NT (The Idea Lab) via Integration Reaction",
          "resourceSignal": "NF/NT resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "With values-protection framing \u2014 they consistently raised culture, mission, and people preservation as non-negotiables",
          "environment": "NF/SFJ",
          "environmentName": "The Mission Field",
          "rationale": "Maps to NF/SFJ (The Mission Field) via Integration Reaction",
          "resourceSignal": "NF/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "With performance-data framing \u2014 they wanted to know how integration would affect metrics and accountability",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Integration Reaction",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "With territorial caution \u2014 key leaders appeared to protect specific relationships, roles, or resource domains",
          "environment": "STP/STJ",
          "environmentName": "The Enforcer Network",
          "rationale": "Maps to STP/STJ (The Enforcer Network) via Integration Reaction",
          "resourceSignal": "STP/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Integration Reaction",
      "secondaryDomain": "Change Response",
      "evidenceType": "Integration planning discussions \u00b7 Negotiation behavior",
      "surveyDesignNote": "Integration reaction reveals what the environment actually values when change is threatened. Options are mutually distinct."
    },
    {
      "id": "TED Q10",
      "section": "Loyalty vs Performance",
      "text": "Based on what you could infer from the org chart, tenure patterns, and any compensation or retention data available, how did the target company appear to handle people who were long-tenured and loyal but clearly underperforming against measurable standards?",
      "options": [
        {
          "value": "A",
          "text": "They were retained and protected; tenure and loyalty outweighed performance shortfalls",
          "environment": "SFJ/SFP",
          "environmentName": "The Hometown Network",
          "rationale": "Maps to SFJ/SFP (The Hometown Network) via Loyalty vs Performance",
          "resourceSignal": "SFJ/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "They were retained in adjusted roles; the system found ways to extract value without confrontation",
          "environment": "NF/SFP",
          "environmentName": "The Creative Commons",
          "rationale": "Maps to NF/SFP (The Creative Commons) via Loyalty vs Performance",
          "resourceSignal": "NF/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "They were held to the same performance standards as new employees; accountability was symmetric",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Loyalty vs Performance",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "They were retained as long as they remained compliant and did not disrupt key relationships or revenue flows",
          "environment": "SFP/SFJ",
          "environmentName": "The Franchise Machine",
          "rationale": "Maps to SFP/SFJ (The Franchise Machine) via Loyalty vs Performance",
          "resourceSignal": "SFP/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Loyalty vs Performance",
      "secondaryDomain": "Accountability Asymmetry",
      "evidenceType": "Compensation data \u00b7 Org chart \u00b7 Promotion/retention data",
      "surveyDesignNote": "Underperformer handling is a critical signal for environment type. SFJ/SFP protects tenure; NT/STJ maintains accountability; SFP/SFJ retains compliance."
    },
    {
      "id": "TED Q11",
      "section": "Speed vs Control",
      "text": "Based on diligence materials and management discussions, when the target company faced a decision requiring a trade-off between moving quickly and establishing controls or approvals, which pattern prevailed?",
      "options": [
        {
          "value": "A",
          "text": "Speed consistently won \u2014 the company moved first and built controls afterward if they proved necessary",
          "environment": "NT/STP",
          "environmentName": "The Disruption Lab",
          "rationale": "Maps to NT/STP (The Disruption Lab) via Speed vs Control",
          "resourceSignal": "NT/STP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "Control consistently won \u2014 decisions required clear authorization and documentation before execution",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Speed vs Control",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "Speed and control varied by who was asking \u2014 senior insiders moved fast; others faced higher approval hurdles",
          "environment": "STJ/STP",
          "environmentName": "The Power Racket",
          "rationale": "Maps to STJ/STP (The Power Racket) via Speed vs Control",
          "resourceSignal": "STJ/STP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "The company moved quickly within established systems; speed operated through compliance infrastructure, not around it",
          "environment": "SFP/SFJ",
          "environmentName": "The Franchise Machine",
          "rationale": "Maps to SFP/SFJ (The Franchise Machine) via Speed vs Control",
          "resourceSignal": "SFP/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Speed vs Control",
      "secondaryDomain": "Decision Rights",
      "evidenceType": "Management meetings \u00b7 Process documentation \u00b7 Negotiation behavior",
      "surveyDesignNote": "Speed/control trade-off is operationally concrete and reveals accountability structure. Options are mutually exclusive patterns."
    },
    {
      "id": "TED Q12",
      "section": "Bad-News Behavior",
      "text": "When the target company disclosed or encountered a negative finding during diligence \u2014 a financial miss, a litigation matter, a personnel issue \u2014 how did they characteristically handle the disclosure?",
      "options": [
        {
          "value": "A",
          "text": "They disclosed proactively and with full detail, treating transparency as a professional standard",
          "environment": "NF/NT",
          "environmentName": "The Idea Lab",
          "rationale": "Maps to NF/NT (The Idea Lab) via Bad-News Behavior",
          "resourceSignal": "NF/NT resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "They disclosed the issue but emphasized the emotional or creative difficulty behind it \u2014 framing disclosure through authenticity and good faith rather than through data or accountability",
          "environment": "NF/SFP",
          "environmentName": "The Creative Commons",
          "rationale": "Maps to NF/SFP (The Creative Commons) via Bad-News Behavior \u2014 authentic expression even under pressure",
          "resourceSignal": "NF/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "They used mission or values language to contextualize the problem \u2014 emphasizing commitment and intention over data",
          "environment": "NF/SFJ",
          "environmentName": "The Mission Field",
          "rationale": "Maps to NF/SFJ (The Mission Field) via Bad-News Behavior",
          "resourceSignal": "NF/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "Disclosure was strategic \u2014 timed and framed to minimize acquirer leverage rather than to provide accurate information",
          "environment": "STP/STJ",
          "environmentName": "The Enforcer Network",
          "rationale": "Maps to STP/STJ (The Enforcer Network) via Bad-News Behavior",
          "resourceSignal": "STP/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Bad-News Behavior",
      "secondaryDomain": "Disclosure Signal",
      "evidenceType": "Negotiation behavior \u00b7 Bad-news episode \u00b7 Management meetings",
      "surveyDesignNote": "Disclosure behavior under pressure is one of the most revealing diligence signals. Options cover transparency, defensiveness, values-framing, and strategic concealment."
    },
    {
      "id": "TED Q13",
      "section": "Status and Territory",
      "text": "Based on how the target company's leadership behaved in multi-function diligence meetings \u2014 where different departments were represented \u2014 which dynamic was most visible?",
      "options": [
        {
          "value": "A",
          "text": "Leaders competed for acquirer attention and resource commitments; protecting their domain was a visible priority",
          "environment": "STJ/STP",
          "environmentName": "The Power Racket",
          "rationale": "Maps to STJ/STP (The Power Racket) via Status and Territory",
          "resourceSignal": "STJ/STP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "Leaders deferred to a clear hierarchy \u2014 seniority determined who spoke, and others followed the lead",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Status and Territory",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "Leaders presented collectively and shared credit; no individual appeared to be protecting territory",
          "environment": "NF/NT",
          "environmentName": "The Idea Lab",
          "rationale": "Maps to NF/NT (The Idea Lab) via Status and Territory",
          "resourceSignal": "NF/NT resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "Leaders used moral or mission framing to claim importance \u2014 departments were positioned as critical to the cause",
          "environment": "NF/SFJ",
          "environmentName": "The Mission Field",
          "rationale": "Maps to NF/SFJ (The Mission Field) via Status and Territory",
          "resourceSignal": "NF/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Status and Territory",
      "secondaryDomain": "Leadership Dynamic",
      "evidenceType": "Management meetings \u00b7 Founder interview \u00b7 Functional leader interviews",
      "surveyDesignNote": "Status behavior in cross-functional settings reveals hierarchy type. Options cover coercive (STJ/STP), structured (NT/STJ), collaborative (NF/NT), and mission-hierarchy (NF/SFJ)."
    },
    {
      "id": "TED Q14",
      "section": "Culture Preservation",
      "text": "During integration planning discussions, what was the target company's primary framing when raising concerns about cultural preservation?",
      "options": [
        {
          "value": "A",
          "text": "They emphasized specific operational practices or decision-making processes they wanted to preserve",
          "environment": "NF/NT",
          "environmentName": "The Idea Lab",
          "rationale": "Maps to NF/NT (The Idea Lab) via Culture Preservation",
          "resourceSignal": "NF/NT resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "They emphasized relationships \u2014 specific people and teams they considered essential to the company's functioning",
          "environment": "SFJ/SFP",
          "environmentName": "The Hometown Network",
          "rationale": "Maps to SFJ/SFP (The Hometown Network) via Culture Preservation",
          "resourceSignal": "SFJ/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "They emphasized identity, mission, or values \u2014 abstract principles they considered non-negotiable",
          "environment": "NF/SFJ",
          "environmentName": "The Mission Field",
          "rationale": "Maps to NF/SFJ (The Mission Field) via Culture Preservation",
          "resourceSignal": "NF/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "They did not raise culture as a concern; the conversation focused on terms, conditions, and commercial arrangements",
          "environment": "SFP/SFJ",
          "environmentName": "The Franchise Machine",
          "rationale": "Maps to SFP/SFJ (The Franchise Machine) via Culture Preservation",
          "resourceSignal": "SFP/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Culture Preservation",
      "secondaryDomain": "Integration Framing",
      "evidenceType": "Integration planning discussions \u00b7 Management meetings",
      "surveyDesignNote": "Culture framing during integration reveals what the environment actually treats as valuable. Each option maps to a distinct environment logic."
    },
    {
      "id": "TED Q15",
      "section": "Technical Experimentation",
      "text": "Based on what you observed in R&D documentation, product development records, or technical team discussions, how did the target company characteristically approach technical or product uncertainty?",
      "options": [
        {
          "value": "A",
          "text": "Through rapid deployment of minimum viable solutions, accepting failure as part of the process",
          "environment": "NT/STP",
          "environmentName": "The Disruption Lab",
          "rationale": "Maps to NT/STP (The Disruption Lab) via Technical Experimentation",
          "resourceSignal": "NT/STP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "Through extended analysis and design before execution, minimizing uncertainty before commitment",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Technical Experimentation",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "Through collaborative creative development where aesthetic and functional quality were co-equal",
          "environment": "NF/SFP",
          "environmentName": "The Creative Commons",
          "rationale": "Maps to NF/SFP (The Creative Commons) via Technical Experimentation",
          "resourceSignal": "NF/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "Through consensus-driven development where social alignment within the team was a prerequisite",
          "environment": "NF/NT",
          "environmentName": "The Idea Lab",
          "rationale": "Maps to NF/NT (The Idea Lab) via Technical Experimentation",
          "resourceSignal": "NF/NT resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Technical Experimentation",
      "secondaryDomain": "Innovation Signal",
      "evidenceType": "Data room \u00b7 Process documentation \u00b7 Functional leader interviews",
      "surveyDesignNote": "Technical approach is diagnostic for NT/STP (speed), NT/STJ (rigor), NF/SFP (creative), NF/NT (consensus through convergence)."
    },
    {
      "id": "TED Q16",
      "section": "Enforcement and Consequences",
      "text": "Based on what you observed during diligence about how the target company handled deviation from expected behavior \u2014 whether policy violation, missed commitment, or visible defection \u2014 what consequence pattern was most evident?",
      "options": [
        {
          "value": "A",
          "text": "Structured consequences applied consistently according to documented policy, regardless of the individual's status",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Enforcement Logic",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "Consequences were relational \u2014 the person's standing in key networks determined the severity of the response",
          "environment": "SFJ/SFP",
          "environmentName": "The Hometown Network",
          "rationale": "Maps to SFJ/SFP (The Hometown Network) via Enforcement Logic",
          "resourceSignal": "SFJ/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "Consequences were public and punitive; visible examples were made to reinforce the authority of the enforcement structure",
          "environment": "STJ/STP",
          "environmentName": "The Power Racket",
          "rationale": "Maps to STJ/STP (The Power Racket) via Enforcement Logic",
          "resourceSignal": "STJ/STP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "Consequences involved removal from the reward and protection structure \u2014 the person lost access rather than faced direct punishment",
          "environment": "STP/STJ",
          "environmentName": "The Enforcer Network",
          "rationale": "Maps to STP/STJ (The Enforcer Network) via Enforcement Logic",
          "resourceSignal": "STP/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Enforcement Logic",
      "secondaryDomain": "Consequence Pattern",
      "evidenceType": "Management meetings \u00b7 Compensation data \u00b7 Negotiation behavior",
      "surveyDesignNote": "Consequence pattern distinguishes NT/STJ (policy), SFJ/SFP (relational), STJ/STP (coercive punishment), STP/STJ (exclusion from network)."
    },
    {
      "id": "TED Q17",
      "section": "Mission vs Results Language",
      "text": "When the target company's leadership described what made their organization successful, which framing dominated their narrative?",
      "options": [
        {
          "value": "A",
          "text": "Measurable performance \u2014 specific metrics, market position, competitive benchmarks, and financial results",
          "environment": "NT/STJ",
          "environmentName": "The Performance Arena",
          "rationale": "Maps to NT/STJ (The Performance Arena) via Success Narrative",
          "resourceSignal": "NT/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "Authentic expression \u2014 the quality, creativity, or uniqueness of what they produce",
          "environment": "NF/SFP",
          "environmentName": "The Creative Commons",
          "rationale": "Maps to NF/SFP (The Creative Commons) via Success Narrative",
          "resourceSignal": "NF/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "Mission and belief \u2014 the organization's commitment to a cause larger than commercial success",
          "environment": "NF/SFJ",
          "environmentName": "The Mission Field",
          "rationale": "Maps to NF/SFJ (The Mission Field) via Success Narrative",
          "resourceSignal": "NF/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "Relationship and belonging \u2014 the strength of the team, the loyalty of their people, and the trust they have built",
          "environment": "SFJ/SFP",
          "environmentName": "The Hometown Network",
          "rationale": "Maps to SFJ/SFP (The Hometown Network) via Success Narrative",
          "resourceSignal": "SFJ/SFP resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Success Narrative",
      "secondaryDomain": "Leadership Framing",
      "evidenceType": "Founder interview \u00b7 Management meetings",
      "surveyDesignNote": "Success narrative is a reliable self-reveal. Options are distinct framings unlikely to overlap. Note: NT/STP would also use performance language but with emphasis on experimentation \u2014 this question captures the dominant narrative style."
    },
    {
      "id": "TED Q18",
      "section": "Facade vs Operating Core",
      "text": "Based on your overall diligence experience, how would you characterize the relationship between the target company's public-facing organizational identity and its actual operating behavior?",
      "options": [
        {
          "value": "A",
          "text": "Strong alignment \u2014 the company operated consistently with how it described itself; no meaningful gap was observed",
          "environment": "NF/NT",
          "environmentName": "The Idea Lab",
          "rationale": "Maps to NF/NT (The Idea Lab) via Facade vs Core",
          "resourceSignal": "NF/NT resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "B",
          "text": "Aspirational gap \u2014 the company described a more sophisticated or evolved culture than it actually demonstrated; the gap appeared unintentional",
          "environment": "NF/SFJ",
          "environmentName": "The Mission Field",
          "rationale": "Maps to NF/SFJ (The Mission Field) via Facade vs Core",
          "resourceSignal": "NF/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "C",
          "text": "Strategic gap \u2014 the official narrative appeared designed to manage acquirer perception; observable behavior followed a different logic",
          "environment": "STP/STJ",
          "environmentName": "The Enforcer Network",
          "rationale": "Maps to STP/STJ (The Enforcer Network) via Facade vs Core",
          "resourceSignal": "STP/STJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        },
        {
          "value": "D",
          "text": "Compliance gap \u2014 the company maintained compliance with external standards while operating internally under a different set of rules",
          "environment": "SFP/SFJ",
          "environmentName": "The Franchise Machine",
          "rationale": "Maps to SFP/SFJ (The Franchise Machine) via Facade vs Core",
          "resourceSignal": "SFP/SFJ resource pattern",
          "confidenceImpact": "Confirmed if \u22652 corroborating answers in same environment"
        }
      ],
      "primaryDomain": "Facade vs Core",
      "secondaryDomain": "Narrative Integrity",
      "evidenceType": "Management meetings \u00b7 Negotiation behavior \u00b7 Employee interviews",
      "surveyDesignNote": "Facade/core distinction is the highest-leverage signal for environment accuracy. Alignment maps to NF/NT; aspirational gap to NF/SFJ; strategic gap to STP/STJ; compliance gap to SFP/SFJ."
    }
  ]
});
