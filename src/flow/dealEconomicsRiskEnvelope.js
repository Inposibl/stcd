import {
  DEAL_ECONOMICS_TALENT_MULTIPLIERS,
  ECS_VALUATION_BANDS,
} from "../data/dealEconomicsFormulaSpec.js";

const RAW_CURRENCY_UNITS_PER_MILLION = 1_000_000;
const SUPPORTED_FORMAT_CURRENCIES = Object.freeze(["USD", "EUR"]);
const ECS_BANDS_BY_MIN_ASC = Object.freeze([...ECS_VALUATION_BANDS].sort((left, right) => left.ecsMin - right.ecsMin));

function isFiniteNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isFiniteNonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function invalidResult(reason, missing) {
  return Object.freeze({
    calculated: false,
    reason,
    missing: Object.freeze(missing),
  });
}

export function getEcsValuationBand(baseEcsScore) {
  if (typeof baseEcsScore !== "number" || !Number.isFinite(baseEcsScore) || baseEcsScore < 0 || baseEcsScore > 100) {
    return null;
  }

  for (let index = 0; index < ECS_BANDS_BY_MIN_ASC.length; index += 1) {
    const band = ECS_BANDS_BY_MIN_ASC[index];
    const nextBand = ECS_BANDS_BY_MIN_ASC[index + 1];
    const upperExclusive = nextBand ? nextBand.ecsMin : 101;
    if (baseEcsScore >= band.ecsMin && baseEcsScore < upperExclusive) {
      return band;
    }
  }

  return null;
}

export function normalizeMoneyToMillions(value) {
  if (!isFiniteNonNegativeNumber(value)) return null;
  return value / RAW_CURRENCY_UNITS_PER_MILLION;
}

export function calculateDealEconomicsRiskEnvelope(input = {}) {
  const enterpriseValueMillions = normalizeMoneyToMillions(input.enterpriseValue);
  const averageAnnualCompensationPerKeyPersonMillions = normalizeMoneyToMillions(input.averageAnnualCompensationPerKeyPerson);
  const keyPersonnelAtRisk = isFiniteNonNegativeInteger(input.keyPersonnelAtRisk) ? input.keyPersonnelAtRisk : null;
  const band = getEcsValuationBand(input.baseEcsScore);
  const missing = [];

  if (enterpriseValueMillions === null) missing.push("enterpriseValue");
  if (keyPersonnelAtRisk === null) missing.push("keyPersonnelAtRisk");
  if (averageAnnualCompensationPerKeyPersonMillions === null) missing.push("averageAnnualCompensationPerKeyPerson");
  if (!band) missing.push("baseEcsScore");

  if (missing.length > 0) {
    return invalidResult(
      missing.includes("baseEcsScore")
        ? "Invalid baseEcsScore."
        : "Missing or invalid required Deal Economics inputs.",
      missing,
    );
  }

  const evDiscountLow = enterpriseValueMillions * band.evDiscountLowRate;
  const evDiscountHigh = enterpriseValueMillions * band.evDiscountHighRate;
  const discountedEvLow = enterpriseValueMillions - evDiscountLow;
  const discountedEvHigh = enterpriseValueMillions - evDiscountHigh;
  const earnOutExposureLow = enterpriseValueMillions * band.earnOutExposureLowRate;
  const earnOutExposureHigh = enterpriseValueMillions * band.earnOutExposureHighRate;
  const talentCostLow = (
    keyPersonnelAtRisk
    * averageAnnualCompensationPerKeyPersonMillions
    * DEAL_ECONOMICS_TALENT_MULTIPLIERS.replacementCostLowMultiplier
  );
  const talentCostHigh = (
    keyPersonnelAtRisk
    * averageAnnualCompensationPerKeyPersonMillions
    * DEAL_ECONOMICS_TALENT_MULTIPLIERS.replacementCostHighMultiplier
  );

  return Object.freeze({
    calculated: true,
    unit: "millions",
    bandName: band.name,
    baseEcsScore: input.baseEcsScore,
    enterpriseValueMillions,
    keyPersonnelAtRisk,
    averageAnnualCompensationPerKeyPersonMillions,
    evDiscountLow,
    evDiscountHigh,
    discountedEvLow,
    discountedEvHigh,
    earnOutExposureLow,
    earnOutExposureHigh,
    talentCostLow,
    talentCostHigh,
    riskEnvelopeLow: evDiscountLow + talentCostLow + earnOutExposureLow,
    riskEnvelopeHigh: evDiscountHigh + talentCostHigh + earnOutExposureHigh,
    evDiscountHighOpenEnded: Boolean(band.evDiscountHighOpenEnded),
    earnOutExposureHighOpenEnded: Boolean(band.earnOutExposureHighOpenEnded),
    costPerDepartureHighOpenEnded: Boolean(band.costPerDepartureHighOpenEnded),
    estimatedTalentLossHighOpenEnded: Boolean(band.estimatedTalentLossHighOpenEnded),
    openEnded: Object.freeze({
      evDiscountHigh: Boolean(band.evDiscountHighOpenEnded),
      earnOutExposureHigh: Boolean(band.earnOutExposureHighOpenEnded),
      costPerDepartureHigh: Boolean(band.costPerDepartureHighOpenEnded),
      estimatedTalentLossHigh: Boolean(band.estimatedTalentLossHighOpenEnded),
    }),
  });
}

export function formatMillions(value, currency) {
  if (!SUPPORTED_FORMAT_CURRENCIES.includes(currency)) return "Unsupported currency";
  if (!isFiniteNonNegativeNumber(value)) return "Invalid amount";
  return `${currency} ${Math.round(value).toLocaleString("en-US")}M`;
}

export function describeOpenEndedHigh(valueTextOrValue, isOpenEnded) {
  const valueText = String(valueTextOrValue ?? "");
  return isOpenEnded ? `>= ${valueText}` : valueText;
}
