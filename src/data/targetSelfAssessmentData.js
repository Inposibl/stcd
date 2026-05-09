/* Generated from ST_Target_Self_Assessment_Module.xlsx. Do not edit manually. */
export const TARGET_SELF_ASSESSMENT_DATA = Object.freeze({
  "sources": [
    "ST_Target_Self_Assessment_Module.xlsx",
    "ST_Form_Binding_Prompt.xlsx"
  ],
  "positioningFields": [
    {
      "id": "targetRole",
      "label": "Your role in this organisation",
      "sourceRef": "Positioning!A3:C7",
      "options": [
        {
          "value": "A",
          "text": "CEO, Founder, President, or C-suite executive"
        },
        {
          "value": "B",
          "text": "VP, Senior Director, or Managing Director"
        },
        {
          "value": "C",
          "text": "Director, Department Head, or Manager"
        },
        {
          "value": "D",
          "text": "Other \u2014 specify in adjacent cell \u2192"
        }
      ]
    },
    {
      "id": "targetTenure",
      "label": "How long have you been inside this organisation in your current role?",
      "sourceRef": "Positioning!A10:C14",
      "options": [
        {
          "value": "A",
          "text": "Less than 18 months  \u26a0  (responses treated as supplementary only)"
        },
        {
          "value": "B",
          "text": "18 months to 3 years"
        },
        {
          "value": "C",
          "text": "More than 3 years"
        },
        {
          "value": "D",
          "text": "Founder or pre-institutional \u2014 observed from inception"
        }
      ]
    }
  ],
  "targetSelfAssessment": {
    "source": "ST_Target_Self_Assessment_Module.xlsx",
    "worksheet": "Screening",
    "questionCount": 10,
    "questions": [
      {
        "id": "Q1",
        "axis": "AXIS 1 \u00b7 Authority Mechanism",
        "text": "Think of the last significant decision in your organisation that was challenged by someone below the decision-maker in seniority \u2014 and the challenge was substantive, not procedural. What actually determined the outcome?",
        "options": [
          {
            "value": "A",
            "text": "The quality of the argument. If the challenger's case was analytically stronger, the decision was revised \u2014 regardless of seniority.",
            "signals": [
              "NT/STJ",
              "NF/NT"
            ]
          },
          {
            "value": "B",
            "text": "The seniority of the decision-maker. The challenge was heard, considered, and ultimately did not change the outcome. Rank decided.",
            "signals": [
              "NF/SFJ",
              "SFJ/SFP"
            ]
          },
          {
            "value": "C",
            "text": "Who had more leverage or visibility at that moment \u2014 not rank, not argument quality, but demonstrated control over resources, relationships, or information.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "D",
            "text": "Whether the challenge aligned with how things have historically been done here. Challenges that fit the established direction moved forward; those that complicated it did not.",
            "signals": [
              "STP/STJ",
              "SFP/SFJ"
            ]
          }
        ]
      },
      {
        "id": "Q2",
        "axis": "AXIS 2 \u00b7 Accountability Symmetry",
        "text": "A senior person in your organisation \u2014 at director level or above \u2014 significantly misses a performance commitment that would trigger formal review for a junior employee in the same situation. What actually happened in the last instance you observed this?",
        "options": [
          {
            "value": "A",
            "text": "The same formal process applied. Review, documented consequences, or exit \u2014 applied at senior level exactly as it would be at junior level. No exception for rank.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "B",
            "text": "The situation was handled privately and informally. Seniority provided shelter. There was no formal consequence, and the matter was not institutionally recorded.",
            "signals": [
              "NF/SFJ",
              "SFJ/SFP"
            ]
          },
          {
            "value": "C",
            "text": "The outcome depended on whether the person still projected strength and credibility. If they did, the miss was absorbed. If they appeared weakened, they were repositioned.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "D",
            "text": "The performance framework does not apply at senior level in the same way. Senior accountability is measured differently \u2014 or not at all through the same metrics as junior staff.",
            "signals": [
              "STP/STJ",
              "SFP/SFJ"
            ]
          }
        ]
      },
      {
        "id": "Q3",
        "axis": "AXIS 3 \u00b7 Response to Dissent",
        "text": "A member of your team or a peer raises a substantive objection to an initiative that has already received approval from senior leadership. The objection is analytically sound. What typically follows?",
        "options": [
          {
            "value": "A",
            "text": "The objection is taken seriously on its merits. If it holds up under scrutiny, it changes the outcome \u2014 regardless of how far the initiative has progressed.",
            "signals": [
              "NT/STJ",
              "NF/NT"
            ]
          },
          {
            "value": "B",
            "text": "The objection is heard. But the process has its own momentum. The initiative proceeds unless the objection surfaces something catastrophic. Analytical soundness alone is not sufficient to reverse course.",
            "signals": [
              "SFJ/SFP",
              "SFP/SFJ"
            ]
          },
          {
            "value": "C",
            "text": "The person who raises it is noted as someone who does not understand how decisions work here. The objection does not stop the initiative, and the person's standing in future planning processes is quietly reduced.",
            "signals": [
              "NF/SFJ",
              "STJ/STP"
            ]
          },
          {
            "value": "D",
            "text": "The objection is absorbed and reframed by leadership as a risk flag to manage, not a reason to reconsider. The initiative proceeds with additional documentation around the flagged point.",
            "signals": [
              "STP/STJ",
              "SFP/SFJ"
            ]
          }
        ]
      },
      {
        "id": "Q4",
        "axis": "AXIS 4 \u00b7 Innovation Relationship",
        "text": "Your organisation has an established way of operating \u2014 a process, a governance mechanism, or an analytical framework that has delivered results. A senior person proposes replacing or significantly modifying it based on a compelling but unproven argument. What actually determines whether it gets adopted?",
        "options": [
          {
            "value": "A",
            "text": "It is piloted in a structured way. If the pilot produces measurable evidence that it outperforms the existing approach, it is adopted. Evidence decides.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "B",
            "text": "It is tested immediately in a live context. If it works faster or better in practice, it replaces the old approach. The empirical result is the authority.",
            "signals": [
              "NT/STP"
            ]
          },
          {
            "value": "C",
            "text": "It depends on who proposes it and their standing in the organisation. A trusted senior voice can move it through. An outsider with the same idea cannot.",
            "signals": [
              "NF/SFJ",
              "SFJ/SFP"
            ]
          },
          {
            "value": "D",
            "text": "It is unlikely to be adopted unless it solves an immediate operational problem. The existing approach works. The bar for change is very high \u2014 and that bar is not primarily evidence-based.",
            "signals": [
              "STJ/STP",
              "SFP/SFJ"
            ]
          }
        ]
      },
      {
        "id": "Q5",
        "axis": "AXIS 5 \u00b7 Resource Flow Direction",
        "text": "Your organisation has discretionary capacity this year \u2014 time, budget, and senior attention that is not committed to existing work. How does that capacity actually get allocated in practice?",
        "options": [
          {
            "value": "A",
            "text": "To the people and teams with the strongest track record of measurable results in the current period. Performance data drives the allocation.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "B",
            "text": "To whoever is generating the most visible activity and momentum at this moment. Current visibility matters more than historical track record.",
            "signals": [
              "NT/STP",
              "STJ/STP"
            ]
          },
          {
            "value": "C",
            "text": "To the most senior and longest-established people and relationships first. The internal hierarchy determines access. Performance is a secondary factor.",
            "signals": [
              "SFJ/SFP",
              "SFP/SFJ"
            ]
          },
          {
            "value": "D",
            "text": "According to the agreed strategic priorities and direction of the organisation. Allocation follows the plan, not individual performance data or visibility.",
            "signals": [
              "NF/SFJ",
              "STP/STJ"
            ]
          }
        ]
      },
      {
        "id": "Q6",
        "axis": "AXIS 6 \u00b7 Retention Mechanism",
        "text": "A high-performing senior person in your organisation receives a competitive offer that is financially comparable to their current package. What primarily determines whether they stay?",
        "options": [
          {
            "value": "A",
            "text": "The quality of the work and the people they work with. The intellectual and relational environment is more compelling than the alternative \u2014 not the structural constraints.",
            "signals": [
              "NT/STJ",
              "NF/NT"
            ]
          },
          {
            "value": "B",
            "text": "The vesting schedule, equity stake, or other financial mechanisms that make leaving now structurally costly regardless of the offer quality.",
            "signals": [
              "STP/STJ",
              "SFP/SFJ"
            ]
          },
          {
            "value": "C",
            "text": "The relationships and loyalties built inside the organisation. Leaving feels like a betrayal of people who matter \u2014 not primarily a financial calculation.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "D",
            "text": "The reputational cost of leaving in a visible way or mid-cycle. The market interpretation of an exit here carries more weight than the financial comparison between options.",
            "signals": [
              "NF/SFJ",
              "STJ/STP"
            ]
          }
        ]
      },
      {
        "id": "Q7",
        "axis": "CONFIRMATORY \u00b7 NT/STJ vs NT/STP",
        "text": "When your organisation faces a significant strategic disagreement internally \u2014 two credible views on how to proceed \u2014 what resolves it?",
        "options": [
          {
            "value": "A",
            "text": "Structured analytical process: both positions are modelled, relevant experts are consulted, and a formal recommendation is documented before a decision is taken.",
            "signals": [
              "NT/STJ"
            ]
          },
          {
            "value": "B",
            "text": "A fast empirical test. Both positions are run in real conditions over a defined short period, and the one that produces better results wins.",
            "signals": [
              "NT/STP"
            ]
          },
          {
            "value": "C",
            "text": "Extended debate until one position is clearly more correct. Speed is explicitly subordinated to epistemic quality.",
            "signals": [
              "NF/NT"
            ]
          },
          {
            "value": "D",
            "text": "The most senior or most trusted voice resolves it. Analysis informs but does not determine \u2014 authority makes the final call.",
            "signals": [
              "SFJ/SFP",
              "STJ/STP"
            ]
          }
        ]
      },
      {
        "id": "Q8",
        "axis": "CONFIRMATORY \u00b7 SFJ/SFP vs SFP/SFJ",
        "text": "Your organisation went through a commercially difficult period \u2014 pressure to reduce costs and improve returns. How did the people dimension of that decision actually play out?",
        "options": [
          {
            "value": "A",
            "text": "We protected people investments \u2014 development, wellbeing, relationships \u2014 even when they did not directly contribute to the commercial recovery. Those commitments were not conditional on performance.",
            "signals": [
              "SFJ/SFP"
            ]
          },
          {
            "value": "B",
            "text": "We were disciplined about what we could sustain commercially. People investments were maintained where they had clear ROI and reduced where they did not.",
            "signals": [
              "NT/STJ",
              "SFP/SFJ"
            ]
          },
          {
            "value": "C",
            "text": "The commercial logic drove the people decisions. The cost structure was the primary variable. People considerations were secondary and managed accordingly.",
            "signals": [
              "STJ/STP",
              "SFP/SFJ"
            ]
          },
          {
            "value": "D",
            "text": "The difficult period produced a natural alignment test. People who reaffirmed their commitment to the organisation's direction were protected and resourced. People who questioned direction were not \u2014 regardless of their performance history.",
            "signals": [
              "NF/SFJ"
            ]
          }
        ]
      },
      {
        "id": "Q9",
        "axis": "CONFIRMATORY \u00b7 STJ/STP vs NT/STJ (departure mechanism)",
        "text": "Think of the last person who left your organisation who you considered genuinely talented. What was the actual mechanism of their departure?",
        "options": [
          {
            "value": "A",
            "text": "They found a better environment for their capability. We could not match what they needed \u2014 intellectually or structurally. Their departure was acknowledged internally as a loss.",
            "signals": [
              "NT/STJ",
              "NF/NT"
            ]
          },
          {
            "value": "B",
            "text": "They became visible as someone who was not going to rise here. Once that was clear \u2014 to them and to us \u2014 their departure was the logical conclusion. The environment selects for certain profiles.",
            "signals": [
              "STJ/STP"
            ]
          },
          {
            "value": "C",
            "text": "They left because the pace of decision-making and the approval requirements were incompatible with how they operate. Iteration speed mattered more to them than anything else we could offer.",
            "signals": [
              "NT/STP"
            ]
          },
          {
            "value": "D",
            "text": "They departed after a relationship rupture \u2014 with a manager, with the culture, or with the direction of a specific initiative. The trigger was relational, not structural.",
            "signals": [
              "NF/SFJ",
              "SFJ/SFP"
            ]
          }
        ]
      },
      {
        "id": "Q10",
        "axis": "CONFIRMATORY \u00b7 NF/SFJ vs NF/NT",
        "text": "Your organisation has a clearly articulated purpose, philosophy, or set of core values that guides decisions. A senior analytical person produces rigorous work that contradicts a core assumption of that philosophy. What happens?",
        "options": [
          {
            "value": "A",
            "text": "The work is evaluated on its analytical merits. If it holds up, the assumption is revised \u2014 even if that is uncomfortable for the people who built it.",
            "signals": [
              "NT/STJ",
              "NF/NT"
            ]
          },
          {
            "value": "B",
            "text": "The work is taken seriously but the core philosophy is not directly challenged. It is absorbed as a refinement or a risk flag \u2014 not as a fundamental revision.",
            "signals": [
              "NT/STJ",
              "SFJ/SFP"
            ]
          },
          {
            "value": "C",
            "text": "The work is noted. But the person is quietly repositioned as someone who does not fully understand how we think here. The philosophy continues unchanged.",
            "signals": [
              "NF/SFJ",
              "STP/STJ"
            ]
          },
          {
            "value": "D",
            "text": "The philosophy is not something that gets revised by analytical work. It reflects our values and our view of the world. Analysis informs execution \u2014 it does not determine direction.",
            "signals": [
              "NF/SFJ",
              "STJ/STP"
            ]
          }
        ]
      }
    ]
  },
  "receipt": {
    "title": "Your responses have been received.",
    "body": "Thank you for the time spent on this survey.",
    "close": "You can close this page."
  }
});
