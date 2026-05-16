import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACQUIRER_TRACK_DATA } from "../src/data/acquirerTrackData.js";
import {
  ACQUISITION_MOTIVE_OPTIONS,
  CANONICAL_DEAL_CONTEXT_FIELD_IDS,
  COMPETITOR_PRESERVATION_OPTIONS,
  DEAL_TYPE_OPTIONS,
  RESPONDENT_ACCESS_LEVEL_OPTIONS,
  RESPONDENT_FUNCTION_OPTIONS,
  RESPONDENT_ROLE_OPTIONS,
  RESPONDENT_SENIORITY_OPTIONS,
  RESPONDENT_SIDE_OPTIONS,
  TRANSACTION_DETAIL_SECTIONS,
  acquisitionMotiveForDealType,
  attachAcquirerModuleResult,
  attachAcquisitionMotive,
  attachDealContext,
  canContinueToTargetObservationSetup,
  canStartAcquirerModule,
  isAcquirerModuleSourceLoaded,
  nextRouteForDealStart,
  scoreAcquirerModule,
  validateAcquisitionMotive,
  validateDealContext,
  validateDealIdentity,
  validateDealStartContext,
  validateTransactionDetails,
} from "../src/flow/acquirerTrackFlow.js";
import { evidenceClassifiedAnswer } from "../src/flow/evidenceClassification.js";
import { SCREEN_REGISTRY } from "../src/screenRegistry.js";

function routeIndex(route) {
  return SCREEN_REGISTRY.findIndex((screen) => screen.route === route);
}

assert.deepEqual(ACQUIRER_TRACK_DATA.sources, [
  "ST_Acquirer_Environment_Module.xlsx",
  "ST_Form_Binding_Prompt.xlsx",
  "ST_Consulting_Pages_v2.xlsx",
]);
assert.equal(ACQUISITION_MOTIVE_OPTIONS.length, 4);
assert.deepEqual(ACQUISITION_MOTIVE_OPTIONS.map((option) => option.value), [
  "management_buyout",
  "cross_border_integration",
  "operational_roll_up",
  "platform_acquisition",
]);
assert.equal(COMPETITOR_PRESERVATION_OPTIONS.length, 2);
assert.deepEqual(TRANSACTION_DETAIL_SECTIONS.map((section) => section.id), [
  "transactionRole",
  "firmTenure",
  "integrationTimeline",
]);
assert.deepEqual(CANONICAL_DEAL_CONTEXT_FIELD_IDS, [
  "acquirerName",
  "targetName",
  "dealType",
  "respondentSide",
  "respondentRole",
  "respondentSeniority",
  "respondentFunction",
  "respondentAccessLevel",
]);
assert.equal(DEAL_TYPE_OPTIONS.length, 5);
assert.equal(acquisitionMotiveForDealType("team_acquisition"), "management_buyout");
assert.equal(acquisitionMotiveForDealType("market_entry"), "cross_border_integration");
assert.equal(acquisitionMotiveForDealType("kpi_driven_ma"), "operational_roll_up");
assert.equal(acquisitionMotiveForDealType("competitor_absorption"), "platform_acquisition");
assert.equal(acquisitionMotiveForDealType("other_integration_sensitive"), "platform_acquisition");
assert.deepEqual(RESPONDENT_SIDE_OPTIONS.map((option) => option.value), ["acquirer", "target", "advisor", "board", "other"]);
assert.ok(RESPONDENT_ROLE_OPTIONS.length >= 19);
assert.ok(RESPONDENT_SENIORITY_OPTIONS.length >= 7);
assert.ok(RESPONDENT_FUNCTION_OPTIONS.length >= 12);
assert.ok(RESPONDENT_ACCESS_LEVEL_OPTIONS.length >= 5);
assert.equal(ACQUIRER_TRACK_DATA.acquirerModule.worksheet, "3_Screening");
assert.equal(ACQUIRER_TRACK_DATA.acquirerModule.questionCount, 11);
assert.equal(ACQUIRER_TRACK_DATA.acquirerModule.questions.length, 11);
assert.equal(isAcquirerModuleSourceLoaded(), true);
assert.equal(ACQUIRER_TRACK_DATA.acquirerModule.questions.every((question) => question.options.length >= 5), true);
assert.equal(ACQUIRER_TRACK_DATA.acquirerModule.questions.every((question) => Boolean(question.directObservationGate)), true);
assert.equal(ACQUIRER_TRACK_DATA.acquirerModule.questions.every((question) => question.options.some((option) => option.value === "E")), true);

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
assert.match(appSource, /Go to final report page/);
assert.match(appSource, /finalDeliverable\.ready/);
assert.match(appSource, /navigate\(finalDeliverable\.route\)/);

const expectedOrder = [
  "/",
  "/start-diagnostic/deal-context",
  "/start-diagnostic/deal-context/details",
  "/screen-4-promise",
  "/screen-5-acquirer-module",
  "/screen-6-acquirer-submit",
  "/screen-6a-target-observation-setup",
  "/screen-6a-target-observation-setup/details",
  "/screen-6b-target-observation",
];
for (let index = 1; index < expectedOrder.length; index += 1) {
  assert.ok(routeIndex(expectedOrder[index - 1]) < routeIndex(expectedOrder[index]), `${expectedOrder[index - 1]} must precede ${expectedOrder[index]}`);
}

const emptyValidation = validateDealContext({});
assert.equal(emptyValidation.valid, false);
assert.deepEqual(emptyValidation.missing, [
  "acquirerName",
  "targetName",
  "dealType",
  "respondentSide",
  "respondentRole",
  "respondentSeniority",
  "respondentFunction",
  "respondentAccessLevel",
  "transactionRole",
  "firmTenure",
  "integrationTimeline",
]);

const dealIdentity = {
  acquirerName: "Acquirer Corp",
  targetName: "Target Inc.",
  dealType: "team_acquisition",
  respondentSide: "acquirer",
  respondentRole: "deal_lead",
  respondentSeniority: "executive_partner_md",
  respondentFunction: "ma_deal_team",
  respondentAccessLevel: "full_deal_room_leadership_access",
};
const identityValidation = validateDealIdentity(dealIdentity);
assert.equal(identityValidation.valid, true);

const motiveValidation = validateAcquisitionMotive({ dealType: "team_acquisition" });
assert.equal(motiveValidation.valid, true);
assert.deepEqual(motiveValidation.normalized, { acquisitionMotive: "management_buyout" });

const competitorWithoutPreservation = validateAcquisitionMotive({ dealType: "competitor_absorption" });
assert.equal(competitorWithoutPreservation.valid, true);
assert.deepEqual(competitorWithoutPreservation.normalized, { acquisitionMotive: "platform_acquisition" });

const competitorWithPreservation = validateAcquisitionMotive({
  dealType: "competitor_absorption",
  competitorPreservation: "partial_integration_required",
});
assert.equal(competitorWithPreservation.valid, true);
assert.deepEqual(competitorWithPreservation.normalized, {
  acquisitionMotive: "platform_acquisition",
  competitorPreservation: "partial_integration_required",
});

const otherDealMotiveValidation = validateAcquisitionMotive({ dealType: "other_integration_sensitive" });
assert.equal(otherDealMotiveValidation.valid, true);
assert.deepEqual(otherDealMotiveValidation.normalized, { acquisitionMotive: "platform_acquisition" });

const detailsValidation = validateTransactionDetails({
  transactionRole: "partner_md",
  firmTenure: "more_than_3_years",
  integrationTimeline: "standard",
});
assert.equal(detailsValidation.valid, true);

const dealContext = {
  ...dealIdentity,
  transactionRole: "partner_md",
  firmTenure: "more_than_3_years",
  integrationTimeline: "standard",
};
const normalizedDealContext = {
  ...dealContext,
  acquisitionMotive: "management_buyout",
};
const startValidation = validateDealStartContext(dealContext);
assert.equal(startValidation.valid, true);
assert.equal(startValidation.normalized.acquisitionMotive, "management_buyout");
const contextValidation = validateDealContext(dealContext);
assert.equal(contextValidation.valid, true);
assert.deepEqual(contextValidation.normalized, normalizedDealContext);

const initialSession = Object.freeze({ sessionId: "track1-smoke" });
assert.equal(canStartAcquirerModule(initialSession), false);
const withMotive = attachAcquisitionMotive(initialSession, {
  ...dealIdentity,
}).session;
assert.equal(withMotive.dealContext.completed, false);
assert.equal(withMotive.dealContext.nextRoute, "/start-diagnostic/deal-context/details");
assert.equal(withMotive.dealContext.data.acquisitionMotive, "management_buyout");
assert.equal(withMotive.dealContext.data.acquirerName, "Acquirer Corp");
assert.equal(nextRouteForDealStart({ respondentSide: "target" }), "/screen-2c-target-self-assessment");
assert.equal(nextRouteForDealStart({ respondentSide: "advisor" }), "/screen-7-step-2b-level-1");
const targetMotive = attachAcquisitionMotive(initialSession, {
  ...dealIdentity,
  respondentSide: "target",
  respondentRole: "ceo_founder_md",
  respondentFunction: "people_talent",
}).session;
assert.equal(targetMotive.dealContext.completed, true);
assert.equal(targetMotive.dealContext.nextRoute, "/screen-2c-target-self-assessment");
assert.equal(canStartAcquirerModule(targetMotive), false);
const advisorMotive = attachAcquisitionMotive(initialSession, {
  ...dealIdentity,
  respondentSide: "advisor",
  respondentRole: "advisor",
  respondentFunction: "external_advisory",
}).session;
assert.equal(advisorMotive.dealContext.completed, true);
assert.equal(advisorMotive.dealContext.nextRoute, "/screen-7-step-2b-level-1");
const withContext = attachDealContext(initialSession, dealContext).session;
assert.equal(withContext.dealContext.completed, true);
assert.deepEqual(withContext.dealContext.data, normalizedDealContext);
assert.equal(canStartAcquirerModule(withContext), true);

const allAAnswers = Object.fromEntries(
  ACQUIRER_TRACK_DATA.acquirerModule.questions.map((question) => [question.id, evidenceClassifiedAnswer("A")]),
);
const score = scoreAcquirerModule(allAAnswers);
assert.equal(score.valid, true);
assert.equal(score.answeredQuestionCount, 11);
assert.equal(score.scoringModelVersion, "newlogic-layered-evidence-v1");
assert.equal(score.outputKind, "weighted_signal_pattern");
assert.equal(score.requiresAnalystReview, true);
assert.equal(score.legacyAdditiveScoring, false);
assert.equal(score.confidence, "high");
assert.equal(score.evidenceQuality.legacyOptionOnlyCount, 0);
assert.equal(score.evidenceQuality.directObservationCount, 11);
assert.ok(score.primaryEnvironmentCode);
assert.ok(score.primarySignalScore > 0);
assert.ok(["strong", "confirmed", "weak"].includes(score.signalStrength));

const withAcquirer = attachAcquirerModuleResult(withContext, allAAnswers).session;
assert.equal(withAcquirer.acquirer2A.completed, true);
assert.equal(withAcquirer.acquirer2A.classificationValidation.valid, true);
assert.equal(canContinueToTargetObservationSetup(withAcquirer), true);

console.log("Track 1 Acquirer front-flow smoke test passed");
