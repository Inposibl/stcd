import assert from "node:assert/strict";
import { ROLE_TRACKS, isDiagnosticRole, routeForRole } from "../src/flow/roleRouting.js";

const expected = {
  acquirer: {
    route: "/start-diagnostic/deal-context",
    diagnostic: true,
    track: "track-1",
  },
  target: {
    route: "/screen-9a-target-code-gate",
    diagnostic: true,
    track: "track-2",
  },
  advisor: {
    route: "/screen-12-consultation-request",
    diagnostic: false,
    track: "consultation",
  },
};

for (const [role, expectation] of Object.entries(expected)) {
  assert.equal(routeForRole(role), expectation.route, `${role} route mismatch`);
  assert.equal(isDiagnosticRole(role), expectation.diagnostic, `${role} diagnostic flag mismatch`);
  assert.equal(ROLE_TRACKS[role].track, expectation.track, `${role} track mismatch`);
}

assert.equal(isDiagnosticRole("advisor"), false, "Advisor / Other must not run a diagnostic");
assert.equal(routeForRole("unknown"), expected.advisor.route, "Unknown roles must route to consultation");

console.log("G-2 role-routing smoke test passed");
