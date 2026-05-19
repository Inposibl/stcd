export const SCREEN_REGISTRY = Object.freeze([
  { id: "deal-context-acquisition-motive", title: "Deal Context / Acquisition Motive", route: "/start-diagnostic/deal-context" },
  { id: "deal-context-transaction-details", title: "Acquirer Transaction Context", route: "/start-diagnostic/deal-context/details" },
  { id: "screen-4-promise", title: "Promise and time anchor", route: "/screen-4-promise" },
  { id: "screen-5-acquirer-module", title: "Acquirer module", route: "/screen-5-acquirer-module" },
  { id: "screen-6-acquirer-submit", title: "Acquirer module submit", route: "/screen-6-acquirer-submit" },
  { id: "screen-6-acquirer-verification", title: "Authorized Acquirer Verification", route: "/screen-6-acquirer-verification" },
  { id: "screen-6a-target-observation-setup", title: "Target Observation Setup", route: "/screen-6a-target-observation-setup" },
  { id: "screen-6a-target-observation-setup-details", title: "Target Observation Setup Details", route: "/screen-6a-target-observation-setup/details" },
  { id: "screen-6a-target-observation-authorized", title: "Authorized Target Observation Setup", route: "/screen-6a-target-observation-setup/authorized" },
  { id: "screen-6b-target-observation", title: "Target Observation", route: "/screen-6b-target-observation" },
  { id: "screen-7-step-2b-level-1", title: "Step 2-B Level 1", route: "/screen-7-step-2b-level-1" },
  { id: "screen-8-step-2b-transition", title: "Step 2-B transition", route: "/screen-8-step-2b-transition" },
  { id: "screen-9-step-2b-level-2", title: "Step 2-B Level 2", route: "/screen-9-step-2b-level-2" },
  { id: "screen-2c-target-self-assessment", title: "Step 2-C Target Self-Assessment", route: "/screen-2c-target-self-assessment" },
  { id: "screen-9a-target-code-gate", title: "Preliminary Target Link + Digital Code Gate", route: "/screen-9a-target-code-gate" },
  { id: "screen-10-reveal", title: "Reveal sequence", route: "/screen-10-reveal" },
  { id: "screen-10b-homogeneous", title: "Homogeneous Integration", route: "/screen-10b-homogeneous" },
  { id: "screen-11-paid-offer", title: "Paid offer", route: "/screen-11-paid-offer" },
  { id: "screen-11b-homogeneous-offer", title: "Homogeneous paid offer", route: "/screen-11b-homogeneous-offer" },
  { id: "screen-12-email-capture", title: "Email capture", route: "/screen-12-email-capture" },
  { id: "screen-12-consultation-request", title: "Consultation request", route: "/screen-12-consultation-request" },
]);

export function screenByRoute(route) {
  if (route === "/" || route === "/home") {
    return { id: "home", title: "Post-Deal Behavior Forecast", route };
  }
  if (route === "/about-methodology") {
    return { id: "about-methodology", title: "The ST Framework", route };
  }
  if (route === "/about-methodology/overview") {
    return { id: "methodology-overview", title: "Post-Deal Behavior Forecast Methodology Overview", route };
  }
  if (route === "/case-studies") {
    return { id: "case-studies", title: "Case Studies", route };
  }
  if (route.startsWith("/case-studies/")) {
    const caseId = route.slice("/case-studies/".length).replace(/\/$/, "");
    return { id: "case-study-detail", title: "Case Study", route, caseId };
  }
  if (route === "/environments" || route.startsWith("/environments/")) {
    const environmentId = route.startsWith("/environments/") ? route.slice("/environments/".length) : undefined;
    return { id: "interaction-environments", title: "The 9 Interaction Environments", route, environmentId };
  }
  if (route === "/start-diagnostic" || route === "/screen-2-role") {
    return { id: "deal-context-acquisition-motive", title: "Deal Context / Acquisition Motive", route: "/start-diagnostic/deal-context" };
  }
  return SCREEN_REGISTRY.find((screen) => screen.route === route) ?? SCREEN_REGISTRY[0];
}
