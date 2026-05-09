import assert from "node:assert/strict";
import resolvePairHandler from "../api/resolve-pair.ts";
import { FINAL_DELIVERABLE_DATA } from "../src/data/finalDeliverableData.js";
import {
  FINAL_ENVIRONMENT_CODES,
  buildPairDeliverable,
  buildPaidOffer,
  findFinalNarrative,
  isFinalDeliverableSourceLoaded,
  publicText,
} from "../src/flow/finalDeliverableFlow.js";
import { SCREEN_REGISTRY } from "../src/screenRegistry.js";

const ENV_CODE_PATTERN = /NF\/NT|NT\/STJ|NT\/STP|NF\/SFJ|NF\/SFP|SFJ\/SFP|SFP\/SFJ|STJ\/STP|STP\/STJ|SP\/SJ/;

function pairKey(left, right) {
  return `${left}::${right}`;
}

function assertPublicText(value) {
  assert.equal(ENV_CODE_PATTERN.test(String(value ?? "")), false, value);
}

assert.equal(isFinalDeliverableSourceLoaded(), true);
assert.equal(FINAL_DELIVERABLE_DATA.narratives.length, 72);
assert.equal(FINAL_DELIVERABLE_DATA.frictionPoints.length, 56);

const routeIds = new Set(SCREEN_REGISTRY.map((screen) => screen.id));
assert.equal(routeIds.has("screen-10-reveal"), true);
assert.equal(routeIds.has("screen-10b-homogeneous"), true);
assert.equal(routeIds.has("screen-11-paid-offer"), true);
assert.equal(routeIds.has("screen-11b-homogeneous-offer"), true);

const narrativePairs = new Set(
  FINAL_DELIVERABLE_DATA.narratives.map((record) => pairKey(record.acquirerEnvironmentCode, record.targetEnvironmentCode)),
);
assert.equal(narrativePairs.size, 72);

for (const acquirerEnvironmentCode of FINAL_ENVIRONMENT_CODES) {
  for (const targetEnvironmentCode of FINAL_ENVIRONMENT_CODES) {
    const deliverable = buildPairDeliverable({ acquirerEnvironmentCode, targetEnvironmentCode });
    assert.equal(deliverable.ready, true);
    if (acquirerEnvironmentCode === targetEnvironmentCode) {
      assert.equal(deliverable.screen, "screen-10b");
      assert.equal(deliverable.route, "/screen-10b-homogeneous");
      assert.equal(deliverable.compatibilityRange, "80\u201395");
      assert.equal(deliverable.anchors.length, 3);
      assert.ok(deliverable.anchors.every((anchor) => anchor.text !== "PENDING"));
      assertPublicText(deliverable.body);
    } else {
      assert.equal(deliverable.screen, "screen-10");
      assert.equal(deliverable.route, "/screen-10-reveal");
      assert.ok(findFinalNarrative(acquirerEnvironmentCode, targetEnvironmentCode));
      assert.equal(narrativePairs.has(pairKey(acquirerEnvironmentCode, targetEnvironmentCode)), true);
    }
  }
}

const outcomeA = buildPairDeliverable({
  acquirerEnvironmentCode: "NF/NT",
  targetEnvironmentCode: "NT/STJ",
});
assert.equal(outcomeA.outcomeLetter, "A");
assert.equal(outcomeA.isEcsIssued, true);
assert.notEqual(outcomeA.compatibilityRange, "PENDING");
assert.ok(outcomeA.anchors.every((anchor) => anchor.text !== "PENDING"));
assertPublicText(publicText(outcomeA.narrative.headline));
assertPublicText(publicText(outcomeA.narrative.situation));
assertPublicText(publicText(outcomeA.narrative.implication));

const outcomeB = buildPairDeliverable({
  acquirerEnvironmentCode: "NF/NT",
  acquirerSecondaryEnvironmentCode: "NT/STP",
  acquirerSignalStrength: "weak",
  targetEnvironmentCode: "NT/STJ",
});
assert.equal(outcomeB.outcomeLetter, "B");
assert.equal(outcomeB.outcomeKey, "acquirer-partial");
assert.equal(outcomeB.candidateRanges.length, 2);

const outcomeC = buildPairDeliverable({
  acquirerEnvironmentCode: "NF/NT",
  targetEnvironmentCode: "NT/STJ",
  targetSecondaryEnvironmentCode: "NT/STP",
  targetSignalStrength: "weak",
  targetCoPresence: true,
});
assert.equal(outcomeC.outcomeLetter, "C");
assert.equal(outcomeC.outcomeKey, "target-partial");
assert.equal(outcomeC.candidateRanges.length, 2);

const outcomeD = buildPairDeliverable({
  acquirerEnvironmentCode: "NF/NT",
  targetEnvironmentCode: "NT/STJ",
  mixedSignal: true,
});
assert.equal(outcomeD.outcomeLetter, "D");
assert.equal(outcomeD.outcomeKey, "mixed");
assert.equal(outcomeD.isEcsIssued, false);

const missingFriction = buildPairDeliverable({
  acquirerEnvironmentCode: "STP/STJ",
  targetEnvironmentCode: "NF/NT",
});
assert.equal(missingFriction.ready, true);
assert.equal(Boolean(missingFriction.narrative), true);
assert.equal(Boolean(missingFriction.friction), false);
assert.ok(missingFriction.anchors.every((anchor) => anchor.text === "PENDING"));

const resolveResponse = await resolvePairHandler(new Request("http://127.0.0.1/api/resolve-pair", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    acquirerEnvironmentCode: "NF/NT",
    targetEnvironmentCode: "NF/NT",
  }),
}));
const resolveBody = await resolveResponse.json();
assert.equal(resolveResponse.status, 200);
assert.equal(resolveBody.route, "/screen-10b-homogeneous");
assert.equal(resolveBody.screen, "screen-10b");
assertPublicText(`${resolveBody.acquirerAlias} ${resolveBody.targetAlias}`);

const heterogeneousOffer = buildPaidOffer("heterogeneous");
assert.equal(heterogeneousOffer.screen, "screen-11");
assert.equal(heterogeneousOffer.route, "/screen-11-paid-offer");
assert.equal(heterogeneousOffer.header, "What the structural-level forecast cannot tell you");
assert.equal(heterogeneousOffer.comparisonRows.length, 5);
assert.equal(heterogeneousOffer.price, "$90K\u2013$200K");
assert.ok(heterogeneousOffer.pricingBand.includes("$90K\u2013$200K"));
assert.ok(heterogeneousOffer.costAnchor.includes("213%"));
assert.ok(heterogeneousOffer.costAnchor.includes("8\u201314 months"));
assert.ok(heterogeneousOffer.ctas.primary.includes("Book a 30-minute scoping call"));
assert.ok(heterogeneousOffer.ctas.secondary.includes("Download full Final Deliverables report PDF"));

const homogeneousOffer = buildPaidOffer("homogeneous", { alias: "The Research Commons" });
assert.equal(homogeneousOffer.screen, "screen-11b");
assert.equal(homogeneousOffer.route, "/screen-11b-homogeneous-offer");
assert.equal(homogeneousOffer.header, "What the homogeneous-pair forecast cannot tell you");
assert.equal(homogeneousOffer.comparisonRows.length, 5);
assert.equal(homogeneousOffer.price, "$90K\u2013$200K");
assert.equal(homogeneousOffer.costAnchor, "");
assert.equal(homogeneousOffer.comparisonRows[0].free.includes("The Research Commons"), true);
assert.equal(homogeneousOffer.comparisonRows.some((row) => row.free.includes("{alias}") || row.paidAdds.includes("{alias}")), false);
assert.ok(homogeneousOffer.ctas.primary.includes("Book a 30-minute scoping call"));
assert.ok(homogeneousOffer.ctas.secondary.includes("Download full Final Deliverables report PDF"));

console.log("G-3 Screen 10/10b final deliverable and Screen 11/11b paid-offer smoke test passed");
