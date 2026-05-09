/* Generated from ST_Environment_Diagnostic_v2.xlsx. Do not edit manually. */
export const TARGET_DIAGNOSTIC_DATA = Object.freeze({
  "sources": [
    "ST_Environment_Diagnostic_v2.xlsx",
    "ST_Form_Binding_Prompt.xlsx"
  ],
  "positioningFields": [
    {
      "id": "targetRelationPosition",
      "label": "Your position in relation to this organisation",
      "sourceRef": "Block 0 - Positioning!A4:C8",
      "options": [
        {
          "value": "A",
          "text": "Owner, founder, or C-suite executive"
        },
        {
          "value": "B",
          "text": "Senior or mid-level manager (department head, HR lead, director)"
        },
        {
          "value": "C",
          "text": "External consultant, advisor, or M&A analyst"
        },
        {
          "value": "D",
          "text": "Other \u2014 specify in adjacent cell \u2192"
        }
      ]
    },
    {
      "id": "targetObservationTenure",
      "label": "How long have you been observing this organisation from your current vantage point?",
      "sourceRef": "Block 0 - Positioning!A10:C13",
      "options": [
        {
          "value": "A",
          "text": "Less than 12 months  \u26a0  (responses treated as supplementary data only)"
        },
        {
          "value": "B",
          "text": "1\u20133 years"
        },
        {
          "value": "C",
          "text": "More than 3 years"
        }
      ]
    }
  ],
  "level1": {
    "source": "ST_Environment_Diagnostic_v2.xlsx",
    "worksheet": "Level 1 - Screening",
    "questionCount": 12,
    "questions": [
      {
        "id": "Q1",
        "group": "Axis 1 \u2014 Authority Mechanism \u00b7 What is the actual basis of authority?",
        "text": "A senior leader is challenged by a junior employee who presents strong evidence that the leader's decision is wrong. What typically happens?",
        "options": [
          {
            "value": "A",
            "text": "The evidence is evaluated on its merits. If the argument is sound, the decision is revised \u2014 regardless of rank.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "B",
            "text": "The challenge is read as insubordination. The junior employee faces a visible consequence, regardless of argument quality.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "C",
            "text": "The challenge is absorbed and deflected. Decisions follow long-standing relationships and established authority, not new arguments.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "D",
            "text": "The challenge is reframed as a lack of commitment to the mission. The employee is questioned on loyalty, not answered on substance.",
            "signals": [
              "NF/SFJ"
            ]
          }
        ]
      },
      {
        "id": "Q2",
        "group": "Axis 1 \u2014 Authority Mechanism \u00b7 What is the actual basis of authority?",
        "text": "Think of the last significant decision that was initially contested but eventually resolved without a formal vote. Who determined the outcome?",
        "options": [
          {
            "value": "A",
            "text": "The person with the longest tenure and deepest relational trust among the group.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "B",
            "text": "The person who demonstrated the most control over relevant resources, information, or relationships at that moment.",
            "signals": [
              "STJ/STP",
              "STP/STJ"
            ]
          },
          {
            "value": "C",
            "text": "The person with the strongest track record of measurable results in the relevant domain.",
            "signals": [
              "NT/STJ",
              "NT/STP"
            ]
          },
          {
            "value": "D",
            "text": "The person most closely associated with the organisation's founding narrative, values, or mission.",
            "signals": [
              "NF/SFJ"
            ]
          }
        ]
      },
      {
        "id": "Q3",
        "group": "Axis 2 \u2014 Accountability Symmetry \u00b7 Do the same rules apply to everyone, or only downward?",
        "text": "A senior executive misses their primary annual target by more than 20%. What happens?",
        "options": [
          {
            "value": "A",
            "text": "Performance metrics are enforced downward but rarely upward. Leadership is protected; lower levels are exposed to standards they are exempt from.",
            "signals": [
              "SFP/SFJ"
            ]
          },
          {
            "value": "B",
            "text": "Depends on whether they still project strength. If failure signals weakness, they are displaced. If they maintain dominance, it is overlooked.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "C",
            "text": "Very little. Seniority and loyalty protect established figures. Any conversation happens privately and without formal consequence.",
            "signals": [
              "NF/SFJ",
              "SFJ/SFP"
            ]
          },
          {
            "value": "D",
            "text": "The same formal process applies as for any employee: review, consequences, or exit \u2014 based on the data. No exception for rank.",
            "signals": [
              "NT/STJ"
            ]
          }
        ]
      },
      {
        "id": "Q4",
        "group": "Axis 2 \u2014 Accountability Symmetry \u00b7 Do the same rules apply to everyone, or only downward?",
        "text": "An employee at any level repeatedly underperforms against their role requirements. What is the typical outcome over six months?",
        "options": [
          {
            "value": "A",
            "text": "A structured, data-driven process leads to a clear decision: improvement plan with defined metrics, or exit. Process is consistent and transparent.",
            "signals": [
              "NT/STJ",
              "NT/STP"
            ]
          },
          {
            "value": "B",
            "text": "They are publicly penalised or humiliated as weakness becomes visible, then either restored if still useful or discarded.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "C",
            "text": "They are managed around \u2014 given roles where they cause least harm \u2014 but rarely removed. Loyalty and tenure provide genuine shelter.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "D",
            "text": "High turnover at lower levels is treated as normal and acceptable. The system is optimised for throughput, not for development.",
            "signals": [
              "STP/STJ",
              "SFP/SFJ"
            ]
          }
        ]
      },
      {
        "id": "Q5",
        "group": "Axis 3 \u2014 Response to Dissent \u00b7 What happens to someone who questions the purpose of a core process?",
        "text": "An employee publicly questions not the method but the purpose of a core organisational process. What typically follows?",
        "options": [
          {
            "value": "A",
            "text": "A real debate opens. If the argument is substantive, the process may genuinely change. The question is treated as a contribution.",
            "signals": [
              "NT/STJ",
              "NF/NT"
            ]
          },
          {
            "value": "B",
            "text": "A formal warning or performance note is issued. The substance of the question is not engaged with \u2014 the act of raising it publicly is treated as the offence.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "C",
            "text": "No formal punishment. But the employee is subtly repositioned as someone who 'doesn't share our values.' Social isolation follows.",
            "signals": [
              "NF/SFJ"
            ]
          },
          {
            "value": "D",
            "text": "Nothing is said directly. But the person is gradually excluded from the informal circulation of information. Others observe this exclusion and understand it as instruction.",
            "signals": [
              "STP/STJ"
            ]
          }
        ]
      },
      {
        "id": "Q6",
        "group": "Axis 3 \u2014 Response to Dissent \u00b7 What happens to someone who questions the purpose of a core process?",
        "text": "New external evidence (e.g. research, market data, or a documented failure pattern) challenges an assumption that has guided the organisation for years. What is the response?",
        "options": [
          {
            "value": "A",
            "text": "The evidence is taken seriously. If it holds up, the founding assumption is revised. Truth takes precedence over institutional comfort.",
            "signals": [
              "NF/NT"
            ]
          },
          {
            "value": "B",
            "text": "The evidence is evaluated for competitive relevance. If it changes the landscape, strategy adapts. If not, it is noted and filed.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "C",
            "text": "The evidence is acknowledged at surface level but its implications are systematically neutralised \u2014 absorbed into the existing narrative rather than allowed to challenge it.",
            "signals": [
              "NF/SFJ",
              "SFJ/SFP"
            ]
          },
          {
            "value": "D",
            "text": "The question of revising strategic assumptions does not arise. The system processes external evidence only at the tactical level.",
            "signals": [
              "STJ/STP",
              "STP/STJ"
            ]
          }
        ]
      },
      {
        "id": "Q7",
        "group": "Axis 4 \u2014 Relationship to Innovation \u00b7 How does the organisation treat new ideas and change?",
        "text": "A new idea is proposed that would significantly change an existing process. What determines whether it is adopted?",
        "options": [
          {
            "value": "A",
            "text": "It gets tested immediately in real conditions. If it works, it replaces the old approach. The test result decides \u2014 not the hierarchy.",
            "signals": [
              "NT/STP"
            ]
          },
          {
            "value": "B",
            "text": "It is evaluated against strategic objectives, modelled for long-term impact, and piloted within a structured framework before full adoption.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "C",
            "text": "It depends on who proposes it. A trusted insider framing change as 'improving what we value' can succeed. An outsider faces rejection.",
            "signals": [
              "NF/SFJ",
              "SFJ/SFP"
            ]
          },
          {
            "value": "D",
            "text": "Change is welcome only if it provides an immediate tactical advantage. Structural innovation is resisted because it threatens existing power or stability.",
            "signals": [
              "STJ/STP",
              "SFP/SFJ"
            ]
          }
        ]
      },
      {
        "id": "Q8",
        "group": "Axis 4 \u2014 Relationship to Innovation \u00b7 How does the organisation treat new ideas and change?",
        "text": "How does the organisation treat failed attempts to try something new?",
        "options": [
          {
            "value": "A",
            "text": "Failure is treated as data. An intelligent failure \u2014 where the right question was tested \u2014 is valued. Not testing at all is penalised.",
            "signals": [
              "NT/STP"
            ]
          },
          {
            "value": "B",
            "text": "Failure is reviewed formally. Sound process with calculated risk: person is not penalised. Flawed process: accountability follows.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "C",
            "text": "Failure is penalised visibly. The environment makes no distinction between intelligent and unintelligent failure \u2014 failure is the problem.",
            "signals": [
              "STJ/STP",
              "SFP/SFJ"
            ]
          },
          {
            "value": "D",
            "text": "The person carries social stigma \u2014 not formal punishment, but a quiet loss of relational standing and trust within the community.",
            "signals": [
              "NF/SFJ",
              "SFJ/SFP"
            ]
          }
        ]
      },
      {
        "id": "Q9",
        "group": "Axis 5 \u2014 Resource Flow Direction \u00b7 Where do resources actually go?",
        "text": "The organisation generates a financial surplus this year. What typically happens to it?",
        "options": [
          {
            "value": "A",
            "text": "Deployed as competitive investment: talent acquisition, R&D, market positioning, or capability development at all levels.",
            "signals": [
              "NT/STJ",
              "NT/STP"
            ]
          },
          {
            "value": "B",
            "text": "Flows upward through the hierarchy. Lower levels do not see a proportionate share relative to their contribution.",
            "signals": [
              "STJ/STP",
              "STP/STJ"
            ]
          },
          {
            "value": "C",
            "text": "Distributed to preserve stability and the wellbeing of long-standing members. Insiders benefit; outsiders do not.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "D",
            "text": "Directed toward mission expression or creative output \u2014 with limited reinvestment in the operational sustainability of the people who generated it.",
            "signals": [
              "NF/SFJ",
              "NF/SFP"
            ]
          }
        ]
      },
      {
        "id": "Q10",
        "group": "Axis 5 \u2014 Resource Flow Direction \u00b7 Where do resources actually go?",
        "text": "A high-performing employee (2 years tenure) and a lower-performing employee (15 years tenure) both request a raise of 25% or more. What happens?",
        "options": [
          {
            "value": "A",
            "text": "The high performer receives the raise based on documented contribution. Tenure is not the deciding factor in formal compensation.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "B",
            "text": "The long-tenure employee has a strong structural advantage. Seniority and loyalty carry more weight than recent performance data.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "C",
            "text": "The decision depends on who has more leverage and visibility at the moment. Neither tenure nor performance alone decides.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "D",
            "text": "Neither negotiation produces a meaningful outcome. Compensation is set by the system and applied uniformly downward. Individual input has minimal impact.",
            "signals": [
              "SFP/SFJ"
            ]
          }
        ]
      },
      {
        "id": "Q11",
        "group": "Axis 6 \u2014 Retention Mechanism \u00b7 What actually keeps people inside this organisation?",
        "text": "An experienced employee is considering leaving. They have a comparable offer elsewhere. What primarily keeps them from accepting it?",
        "options": [
          {
            "value": "A",
            "text": "The sense that this place is their community \u2014 not just their employer. Accepting the offer would mean leaving people who genuinely know and value them, and that loss feels disproportionate to any financial gain.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "B",
            "text": "The calculation that accepting this offer specifically \u2014 from this competitor \u2014 will be seen as a defection by people who matter in their industry. The reputational cost in the market extends beyond this firm.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "C",
            "text": "The calculation that leaving now costs more than staying. They have participated in too much to exit cleanly without reputational damage.",
            "signals": [
              "STP/STJ"
            ]
          },
          {
            "value": "D",
            "text": "The work itself. Problems are genuinely interesting, the environment develops their capability, and the standards are high.",
            "signals": [
              "NT/STJ",
              "NF/NT"
            ]
          }
        ]
      },
      {
        "id": "Q12",
        "group": "Axis 6 \u2014 Retention Mechanism \u00b7 What actually keeps people inside this organisation?",
        "text": "The organisation has had consistently high staff turnover at lower levels for several years. How does leadership frame this?",
        "options": [
          {
            "value": "A",
            "text": "As normal, or even efficient. New people work harder, cost less, and fit the system better than those who stay too long.",
            "signals": [
              "STJ/STP",
              "SFP/SFJ"
            ]
          },
          {
            "value": "B",
            "text": "As a serious problem. Loss of people is experienced as a loss of community and produces genuine concern at leadership level.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "C",
            "text": "As a data point requiring diagnosis. High turnover is a systemic signal \u2014 either the environment is poorly calibrated, or selection is failing.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "D",
            "text": "As a sign that the wrong people are joining \u2014 those who lack commitment to the values. Fault attributed to those who leave, not to the environment.",
            "signals": [
              "NF/SFJ",
              "NF/SFP"
            ]
          }
        ]
      }
    ]
  },
  "level2": {
    "source": "ST_Environment_Diagnostic_v2.xlsx",
    "worksheet": "Level 2 - Deepening",
    "questionCount": 10,
    "questions": [
      {
        "id": "Q13",
        "group": "Pair \u00b7 STJ/STP vs STP/STJ",
        "text": "Managers at the middle level are promoted primarily because:",
        "options": [
          {
            "value": "A",
            "text": "They delivered the strongest personal results under pressure and demonstrated they can enforce compliance downward.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "B",
            "text": "They brought the most new people into the organisation and kept them long enough to deliver results upward.",
            "signals": [
              "STP/STJ"
            ]
          },
          {
            "value": "C",
            "text": "They built the most effective teams \u2014 their direct reports improved measurably under their leadership.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "D",
            "text": "They have been here long enough to be trusted by both their team and senior leadership.",
            "signals": [
              "SFJ/SFP"
            ]
          }
        ]
      },
      {
        "id": "Q14",
        "group": "Pair \u00b7 STJ/STP vs STP/STJ",
        "text": "An employee wants to leave the organisation. What actually holds them back?",
        "options": [
          {
            "value": "A",
            "text": "The organisation has made examples visible. There are known cases of people who left under difficult terms \u2014 and the aftermath of those departures is part of the institutional memory. The employee understands what exit looks like here.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "B",
            "text": "The recognition that they have been part of the system long enough that leaving now carries a personal cost they cannot easily absorb.",
            "signals": [
              "STP/STJ"
            ]
          },
          {
            "value": "C",
            "text": "They are mid-stream in commitments that matter to them personally \u2014 a team they feel responsible for, a person they are mentoring, a project they started. Exit now would break something live. There is always another reason to stay.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "D",
            "text": "Nothing structural. People leave when they find a better environment. Retention comes from the work quality, not from lock-in.",
            "signals": [
              "NT/STJ",
              "NF/NT"
            ]
          }
        ]
      },
      {
        "id": "Q15",
        "group": "Pair \u00b7 STJ/STP vs STP/STJ",
        "text": "A manager publicly asks: 'Should we be doing this at all?' about a core ongoing activity. What happens?",
        "options": [
          {
            "value": "A",
            "text": "A formal review of the manager's performance is initiated in the period following the question. The review is framed around competency or professional attitude, not around the question that was raised. The connection is visible to others but never stated explicitly.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "B",
            "text": "No consequence lands directly. But within weeks, the manager is no longer included in the informal discussions where real decisions are pre-made. Others observe this exclusion and understand it as instruction.",
            "signals": [
              "STP/STJ"
            ]
          },
          {
            "value": "C",
            "text": "The manager is repositioned as someone who 'lacks faith in the mission.' The question disappears into the culture's immunity system.",
            "signals": [
              "NF/SFJ"
            ]
          },
          {
            "value": "D",
            "text": "The question is welcomed. If it is substantive, it opens a real discussion. Leadership does not experience it as a threat.",
            "signals": [
              "NT/STJ",
              "NF/NT"
            ]
          }
        ]
      },
      {
        "id": "Q16",
        "group": "Pair \u00b7 SFJ/SFP vs SFP/SFJ",
        "text": "The organisation invests in employee wellbeing programmes (mental health support, development budget, flexible leave \u2014 investment with no direct productivity metric). When does this happen?",
        "options": [
          {
            "value": "A",
            "text": "When it demonstrably improves performance metrics. The investment is evaluated against measurable return and resourced accordingly.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "B",
            "text": "When it is commercially advantageous \u2014 as a branding or retention investment. The investment is reduced or stopped when the commercial case weakens.",
            "signals": [
              "SFP/SFJ"
            ]
          },
          {
            "value": "C",
            "text": "When it aligns with the mission narrative. Wellbeing is positioned as an expression of values, not as an operational or commercial tool.",
            "signals": [
              "NF/SFJ",
              "NF/SFP"
            ]
          },
          {
            "value": "D",
            "text": "Continuously and unconditionally \u2014 because people matter here, and care is expressed regardless of commercial cycles or business performance.",
            "signals": [
              "SFJ/SFP"
            ]
          }
        ]
      },
      {
        "id": "Q17",
        "group": "Pair \u00b7 SFJ/SFP vs SFP/SFJ",
        "text": "A long-standing employee who is no longer performing well. The organisation's response over the following six months:",
        "options": [
          {
            "value": "A",
            "text": "They are protected, reassigned, or managed around. Loyalty and tenure provide real shelter. The relationship matters more than the performance gap.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "B",
            "text": "They are replaced \u2014 quickly and without ceremony. High turnover at lower levels is a feature of the system, not a failure.",
            "signals": [
              "SFP/SFJ"
            ]
          },
          {
            "value": "C",
            "text": "A formal performance improvement process is initiated with clear metrics and a defined timeline. The relationship does not override the outcome.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "D",
            "text": "They are publicly diminished or displaced as their weakness becomes visible. Strength retention is the only structural criterion.",
            "signals": [
              "STJ/STP"
            ]
          }
        ]
      },
      {
        "id": "Q18",
        "group": "Pair \u00b7 SFJ/SFP vs SFP/SFJ",
        "text": "New employees are recruited primarily through:",
        "options": [
          {
            "value": "A",
            "text": "Referrals from existing employees. The key implicit criterion is 'will this person fit our community' \u2014 not skill profile or formal qualifications.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "B",
            "text": "Formal channels optimised for throughput. Volume matters more than fit. The system is built to process high turnover, not to select for long-term retention.",
            "signals": [
              "SFP/SFJ"
            ]
          },
          {
            "value": "C",
            "text": "Competitive selection based on demonstrable skills, track record, and capacity to perform under pressure in the relevant domain.",
            "signals": [
              "NT/STJ",
              "NT/STP"
            ]
          },
          {
            "value": "D",
            "text": "Targeting of specific profiles: flexible, adaptive individuals who can operate in complex hierarchies. The implicit offer includes protection and resource access.",
            "signals": [
              "STP/STJ"
            ]
          }
        ]
      },
      {
        "id": "Q19",
        "group": "Pair \u00b7 NT/STJ vs NT/STP",
        "text": "A disagreement between two departments about the best approach to a significant decision. How is it resolved?",
        "options": [
          {
            "value": "A",
            "text": "Each side is asked to run a quick test in real conditions. The one that produces better results within a defined timeframe wins. The test resolves it.",
            "signals": [
              "NT/STP"
            ]
          },
          {
            "value": "B",
            "text": "Structured analytical process: data review, modelling, stakeholder input, and a formal recommendation from the team with the most relevant domain expertise.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "C",
            "text": "Extended rigorous debate continues until one position is shown to be more epistemically sound. Speed is sacrificed for correctness.",
            "signals": [
              "NF/NT"
            ]
          },
          {
            "value": "D",
            "text": "Escalated to the most senior or most trusted person, whose preference resolves the impasse. Authority decides, not analysis.",
            "signals": [
              "NF/SFJ",
              "SFJ/SFP"
            ]
          }
        ]
      },
      {
        "id": "Q20",
        "group": "Pair \u00b7 NT/STJ vs NT/STP",
        "text": "The organisation is building a new capability it does not currently possess. What does the process look like?",
        "options": [
          {
            "value": "A",
            "text": "Small team, rapid prototypes, learn-by-doing in real conditions. Documentation follows iteration, not the reverse. Speed of learning is the metric.",
            "signals": [
              "NT/STP"
            ]
          },
          {
            "value": "B",
            "text": "Structured programme: capability mapping, targeted hire or development, staged build with defined milestones, measured at each phase before scaling.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "C",
            "text": "The capability is acquired through control \u2014 buying, pressuring, or absorbing those who already have it rather than building it internally.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "D",
            "text": "Capability development is not a strategic priority. The organisation runs on existing knowledge and does not allocate significant resources to building new competencies.",
            "signals": [
              "SFJ/SFP",
              "SFP/SFJ"
            ]
          }
        ]
      },
      {
        "id": "Q21",
        "group": "Pair \u00b7 NF/SFJ vs NF/NT",
        "text": "A core belief that has guided the organisation for years is challenged with new external evidence. What happens?",
        "options": [
          {
            "value": "A",
            "text": "The evidence is evaluated seriously. If it is sound, the belief is revised \u2014 even if that is uncomfortable for founding members or leadership.",
            "signals": [
              "NF/NT"
            ]
          },
          {
            "value": "B",
            "text": "The challenge triggers a reaffirmation rather than a review. Leadership uses the moment to reinforce the founding belief more explicitly than before \u2014 through communications, rituals, or direct statements from the most senior figures. The belief becomes more entrenched in response to the evidence, not less.",
            "signals": [
              "NF/SFJ"
            ]
          },
          {
            "value": "C",
            "text": "The belief is re-examined only if the challenge has competitive or commercial relevance. Abstract belief revision is not a priority here.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "D",
            "text": "The belief is not revisable \u2014 not because of dogma, but because tradition is the structure. The question of whether it is 'true' is not the relevant question.",
            "signals": [
              "SFJ/SFP"
            ]
          }
        ]
      },
      {
        "id": "Q22",
        "group": "Pair \u00b7 NF/SFJ vs NF/NT",
        "text": "Who has the most real authority in a strategic discussion \u2014 regardless of formal title?",
        "options": [
          {
            "value": "A",
            "text": "The person with the most precise, best-supported, most coherent argument \u2014 regardless of title, age, or tenure.",
            "signals": [
              "NF/NT"
            ]
          },
          {
            "value": "B",
            "text": "The person most closely associated with the organisation's founding vision or who controls the interpretation of its sacred narrative.",
            "signals": [
              "NF/SFJ"
            ]
          },
          {
            "value": "C",
            "text": "The person with the strongest relevant track record and the most credible domain expertise in the subject at hand.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "D",
            "text": "The person with the longest relationship history and the most relational trust among the group present.",
            "signals": [
              "SFJ/SFP"
            ]
          }
        ]
      }
    ]
  }
});
