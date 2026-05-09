export const ROLE_TRACKS = Object.freeze({
  acquirer: Object.freeze({
    id: "acquirer",
    label: "ROLE 1",
    title: "Acquirer",
    description: "You represent the company initiating and financing the acquisition.",
    route: "/start-diagnostic/deal-context",
    track: "track-1",
    diagnostic: true,
  }),
  target: Object.freeze({
    id: "target",
    label: "ROLE 2",
    title: "Target",
    description: "You represent the company being acquired and need the assessment link plus code.",
    route: "/screen-9a-target-code-gate",
    track: "track-2",
    diagnostic: true,
  }),
  advisor: Object.freeze({
    id: "advisor",
    label: "ROLE 3",
    title: "Advisor / Other",
    description: "You are not completing the principal diagnostic and should request consultation.",
    route: "/screen-12-consultation-request",
    track: "consultation",
    diagnostic: false,
  }),
});

export function routeForRole(roleId) {
  const role = ROLE_TRACKS[roleId];
  if (!role) return ROLE_TRACKS.advisor.route;
  return role.route;
}

export function isDiagnosticRole(roleId) {
  return Boolean(ROLE_TRACKS[roleId]?.diagnostic);
}

export function roleCards() {
  return Object.values(ROLE_TRACKS);
}
