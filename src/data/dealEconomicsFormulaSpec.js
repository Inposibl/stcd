export const DEAL_ECONOMICS_FORMULA_SPEC_METADATA = Object.freeze({
  sourceWorkbookName: "ST_ECS_to_Valuation_Bridge_v1_1.xlsx",
  sourceWorkbookPath: "NewLogic 03.05.2026/ST_ECS_to_Valuation_Bridge_v1_1.xlsx",
  sourceWorkbookSha256: "9DC0B85F194B7A48873EA9407706CDEE99E367FA376043E13C751016FE0FA637",
  sourceWorkbookSizeBytes: 25216,
  sourceWorkbookStatus: "canonical_untracked_source",
  unitConvention: "millions",
  runtimeEnabled: false,
  publicReportCalculationAllowed: false,
});

export const DEAL_ECONOMICS_SOURCE_SHEETS = Object.freeze([
  "ECS_Valuation_Bridge",
  "Benchmark_Library",
  "Deal_Pricing_Calculator",
]);

export const DEAL_ECONOMICS_FORMULA_DETAILS = Object.freeze({
  formulaName: "ECS-to-Valuation Risk Envelope",
  formulaStatus: "canonical_spec_not_runtime_enabled",
  formulaScope: "public_base_ecs_only",
  excludes: Object.freeze([
    "potentialECS",
    "ecsDelta",
    "postProtocolFigure",
  ]),
});

export const DEAL_ECONOMICS_FORMULA_SCHEMA = Object.freeze({
  evDiscountLow: "enterpriseValueMillions * evDiscountLowRate",
  evDiscountHigh: "enterpriseValueMillions * evDiscountHighRate",
  discountedEvLow: "enterpriseValueMillions - evDiscountLow",
  discountedEvHigh: "enterpriseValueMillions - evDiscountHigh",
  earnOutExposureLow: "enterpriseValueMillions * earnOutExposureLowRate",
  earnOutExposureHigh: "enterpriseValueMillions * earnOutExposureHighRate",
  talentCostLow: "keyPersonnelAtRisk * averageAnnualCompensationPerKeyPersonMillions * 2",
  talentCostHigh: "keyPersonnelAtRisk * averageAnnualCompensationPerKeyPersonMillions * 4",
  riskEnvelopeLow: "evDiscountLow + talentCostLow + earnOutExposureLow",
  riskEnvelopeHigh: "evDiscountHigh + talentCostHigh + earnOutExposureHigh",
});

export const DEAL_ECONOMICS_FORMULA_NOTES = Object.freeze({
  riskEnvelopeHigh:
    "riskEnvelopeHigh is derived from the workbook displayed value because Deal_Pricing_Calculator!B22 has no stored XML formula but its cached value matches B12 + B18 + B20.",
});

export const DEAL_ECONOMICS_TALENT_MULTIPLIERS = Object.freeze({
  replacementCostLowMultiplier: 2,
  replacementCostHighMultiplier: 4,
  source: "Deal_Pricing_Calculator!B17 = B7*B8*2 and B18 = B7*B8*4",
});

export const DEAL_ECONOMICS_DISCLAIMER = "Order-of-magnitude estimates only. Not financial advice.";

export const DEAL_ECONOMICS_TERMINOLOGY = Object.freeze({
  use: "EV Multiple",
  doNotUse: "EV Multiply",
});

export const DEAL_ECONOMICS_WORKBOOK_EXAMPLE = Object.freeze({
  bandName: "MODERATE-LOW",
  sourceCells: Object.freeze({
    enterpriseValueMillions: "Deal_Pricing_Calculator!B4",
    baseEcsScore: "Deal_Pricing_Calculator!B5",
    potentialEcsScore: "Deal_Pricing_Calculator!B6",
    keyPersonnelAtRisk: "Deal_Pricing_Calculator!B7",
    averageAnnualCompensationPerKeyPersonMillions: "Deal_Pricing_Calculator!B8",
  }),
  inputs: Object.freeze({
    enterpriseValueMillions: 500,
    baseEcsScore: 38,
    potentialEcsScore: 57,
    keyPersonnelAtRisk: 4,
    averageAnnualCompensationPerKeyPersonMillions: 1,
  }),
  expected: Object.freeze({
    ecsDelta: 19,
    ecsDeltaPublicRuntimeExcluded: true,
    evDiscountLow: 75,
    evDiscountHigh: 125,
    discountedEvLow: 425,
    discountedEvHigh: 375,
    synergyCaptureLow: 0.15,
    synergyCaptureHigh: 0.39,
    talentCostLow: 8,
    talentCostHigh: 16,
    earnOutExposureLow: 40,
    earnOutExposureHigh: 100,
    riskEnvelopeLow: 123,
    riskEnvelopeHigh: 241,
  }),
});

export const ECS_VALUATION_BANDS = Object.freeze([
  Object.freeze({
    name: "HIGH COMPATIBILITY",
    ecsMin: 80,
    ecsMax: 100,
    evDiscountLowRate: 0,
    evDiscountHighRate: 0.02,
    synergyCaptureLowRate: 0.85,
    synergyCaptureHighRate: 1.0,
    expectedKeyDepartures: "0 – 1",
    costPerDeparture: "$0.5M – $2.0M",
    estimatedTalentLossAt500M: "$0M – $2M",
    earnOutExposureAt500M: "$0M – $5M",
    earnOutExposureLowRate: 0,
    earnOutExposureHighRate: 0.01,
    protocolRecommendation: "Standard integration protocol.\nNo structural intervention required.",
  }),
  Object.freeze({
    name: "MODERATE-HIGH",
    ecsMin: 65,
    ecsMax: 79,
    evDiscountLowRate: 0.02,
    evDiscountHighRate: 0.07,
    synergyCaptureLowRate: 0.65,
    synergyCaptureHighRate: 0.84,
    expectedKeyDepartures: "1 – 2",
    costPerDeparture: "$1.0M – $3.0M",
    estimatedTalentLossAt500M: "$1M – $6M",
    earnOutExposureAt500M: "$5M – $20M",
    earnOutExposureLowRate: 0.01,
    earnOutExposureHighRate: 0.04,
    protocolRecommendation: "Selective Integration Protocol.\nRing-fence 1–2 critical sub-units.",
  }),
  Object.freeze({
    name: "MODERATE",
    ecsMin: 50,
    ecsMax: 64,
    evDiscountLowRate: 0.07,
    evDiscountHighRate: 0.15,
    synergyCaptureLowRate: 0.40,
    synergyCaptureHighRate: 0.64,
    expectedKeyDepartures: "2 – 4",
    costPerDeparture: "$1.5M – $4.0M",
    estimatedTalentLossAt500M: "$3M – $16M",
    earnOutExposureAt500M: "$15M – $50M",
    earnOutExposureLowRate: 0.03,
    earnOutExposureHighRate: 0.10,
    protocolRecommendation: "Resource Hierarchy Quality Assessment\nrequired pre-close.\nEarn-out milestone review.",
  }),
  Object.freeze({
    name: "MODERATE-LOW",
    ecsMin: 35,
    ecsMax: 49,
    evDiscountLowRate: 0.15,
    evDiscountHighRate: 0.25,
    synergyCaptureLowRate: 0.15,
    synergyCaptureHighRate: 0.39,
    expectedKeyDepartures: "3 – 6",
    costPerDeparture: "$2.0M – $6.0M",
    estimatedTalentLossAt500M: "$6M – $36M",
    earnOutExposureAt500M: "$40M – $100M",
    earnOutExposureLowRate: 0.08,
    earnOutExposureHighRate: 0.20,
    protocolRecommendation: "Structural separation of leadership\nlayers mandatory.\nEarn-out restructuring required.\nRing-Fence Architecture.",
  }),
  Object.freeze({
    name: "HIGH RISK",
    ecsMin: 0,
    ecsMax: 34,
    evDiscountLowRate: 0.35,
    evDiscountHighRate: 0.60,
    evDiscountHighOpenEnded: true,
    synergyCaptureLowRate: 0,
    synergyCaptureHighRate: 0.14,
    expectedKeyDepartures: "Full senior team",
    costPerDeparture: "$3.0M – $8.0M+",
    costPerDepartureHighOpenEnded: true,
    estimatedTalentLossAt500M: "$20M – $100M+",
    estimatedTalentLossHighOpenEnded: true,
    earnOutExposureAt500M: "$100M – $400M+",
    earnOutExposureLowRate: 0.20,
    earnOutExposureHighRate: 0.80,
    earnOutExposureHighOpenEnded: true,
    protocolRecommendation: "Renegotiate price or ABORT.\nFull structural separation only.\nNo protocol mitigates this band.",
  }),
]);

export const DEAL_ECONOMICS_FORMULA_SPEC = Object.freeze({
  metadata: DEAL_ECONOMICS_FORMULA_SPEC_METADATA,
  sourceSheets: DEAL_ECONOMICS_SOURCE_SHEETS,
  details: DEAL_ECONOMICS_FORMULA_DETAILS,
  formulaSchema: DEAL_ECONOMICS_FORMULA_SCHEMA,
  formulaNotes: DEAL_ECONOMICS_FORMULA_NOTES,
  talentMultipliers: DEAL_ECONOMICS_TALENT_MULTIPLIERS,
  disclaimer: DEAL_ECONOMICS_DISCLAIMER,
  terminology: DEAL_ECONOMICS_TERMINOLOGY,
  workbookExample: DEAL_ECONOMICS_WORKBOOK_EXAMPLE,
  ecsValuationBands: ECS_VALUATION_BANDS,
});
