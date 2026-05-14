import questionnairesArtifact from "../generated/newlogic/questionnaires.json" with { type: "json" };

const MODULES = Object.freeze(Object.fromEntries(
  questionnairesArtifact.modules.map((module) => [module.id, module]),
));

const LANDING_COPY = Object.freeze({
  headline: "70% of M&A integrations that destroy value fail for the same reason.",
  body: Object.freeze([
    "M&A deals are bought for different reasons: to acquire a team, enter a new market, hit strategic KPIs, or remove a competitor. But integration value is lost for the same reason: the organizations cannot operate together in reality.",
    "The model may close. The strategy may look right. The transaction may satisfy the board. But after close, value breaks down when leaders clash over decisions, resources, speed, accountability, power, and conflict.",
    "Our product identifies these risks before they become post-deal failures.",
    "Whether the goal is to retain the acquired team, scale into a new market, protect KPI-driven deal value, or absorb a former competitor, we show where the integration will fracture and what must be changed before months 6-18, when the acquired management team often stops performing.",
    "Run the diagnostic. Twenty minutes. No account. No card.",
  ]),
  footnote: "Used by PE and VC firms managing post-close integration of companies with 50-500 employees.",
});

const PROMISE_COPY = Object.freeze({
  headline: "The first useful Preliminary Assessment is calculated from the Acquirer module and the completed Target Observer block.",
  deliverables: Object.freeze([
    "Your environment pair - the operational architecture of the deal in plain language",
    "Compatibility range with risk classification - how compatible the two environments are",
    "Three behavioural anchors at 30 days, 6 months, and 18 months - what to watch for, sealed and timestamped",
  ]),
  body: "The app calculates the live question count from the loaded Acquirer, Target Observation, and Target Diagnostic instruments.",
  footnote: "The diagnostic is forward-only by design: answers reflect operational reality, not aspiration. Time shown is active answer time; respondent waiting time is separate.",
});

const TARGET_SELF_RECEIPT = Object.freeze({
  title: "Your responses have been received.",
  body: "Thank you for the time spent on this survey.",
  close: "You can close this page.",
});

function moduleById(id) {
  const module = MODULES[id];
  if (!module) throw new Error(`Missing NewLogic questionnaire module: ${id}`);
  return module;
}

function freezeOptions(options = [], questionType = "single_choice") {
  return Object.freeze(options.map((option) => {
    const signals = Object.freeze([...(option.internalEnvironmentSignals ?? option.signals ?? [])]);
    return Object.freeze({
      ...option,
      signals,
      internalEnvironmentSignals: signals,
      environment: questionType === "evidence_calibration" ? "N/A" : option.environment,
      environmentName: option.environmentName ?? (questionType === "evidence_calibration" ? "Evidence calibration" : ""),
      excludedFromPrimaryScoring: option.excludedFromPrimaryScoring === true || signals.length === 0,
    });
  }));
}

function normalizeGate(question) {
  if (question.directObservationGate && typeof question.directObservationGate === "object") {
    return Object.freeze(question.directObservationGate);
  }

  if (typeof question.directObservationGate === "string" && question.directObservationGate.trim()) {
    return Object.freeze({
      prompt: question.directObservationGate.trim(),
      validation: "yes / no / document_supported",
      note: "Answer this before selecting an option.",
      sourceRow: question.sourceRow,
    });
  }

  if (question.questionType === "single_choice" && question.workbookQuestionId?.startsWith("TED")) {
    return Object.freeze({
      prompt: "Direct Observation Gate - did your diligence team produce direct, observable evidence on this dimension?",
      validation: "yes / no / document_supported",
      note: "Answer this before selecting an option.",
      sourceRow: question.sourceRow,
    });
  }

  return null;
}

function freezeQuestions(questions = []) {
  return Object.freeze(questions.map((question) => {
    const questionId = question.workbookQuestionId ?? question.id;
    const group = question.group ?? question.section ?? "";
    return Object.freeze({
      ...question,
      id: questionId,
      axis: group,
      group,
      section: question.section ?? group,
      text: question.prompt ?? question.text ?? "",
      directObservationGate: normalizeGate(question),
      options: freezeOptions(question.options, question.questionType),
    });
  }));
}

function freezePositioningFields(fields = []) {
  return Object.freeze(fields.map((field) => Object.freeze({
    ...field,
    options: Object.freeze((field.options ?? []).map((option) => Object.freeze({ ...option }))),
  })));
}

function runtimeQuestionnaireModule(id, worksheet) {
  const module = moduleById(id);
  const questions = freezeQuestions(module.questions);
  return Object.freeze({
    source: module.sourceWorkbook,
    worksheet,
    questionCount: questions.length,
    questions,
  });
}

export function buildAcquirerTrackData() {
  const module = moduleById("acquirerEnvironment");
  return Object.freeze({
    sources: Object.freeze(["ST_Acquirer_Environment_Module.xlsx", "ST_Form_Binding_Prompt.xlsx", "ST_Consulting_Pages_v2.xlsx"]),
    landing: LANDING_COPY,
    promise: PROMISE_COPY,
    dealContextFields: Object.freeze([]),
    positioningFields: freezePositioningFields(module.positioningFields),
    acquirerModule: runtimeQuestionnaireModule("acquirerEnvironment", "3_Screening"),
  });
}

export function buildTargetDiagnosticData() {
  const level1 = moduleById("environmentLevel1");
  const level2 = moduleById("environmentLevel2");
  return Object.freeze({
    sources: Object.freeze(["ST_Environment_Diagnostic_v2.xlsx", "ST_Form_Binding_Prompt.xlsx"]),
    positioningFields: freezePositioningFields(level1.positioningFields),
    level1: runtimeQuestionnaireModule("environmentLevel1", "3_Level_1_Screening"),
    level2: runtimeQuestionnaireModule("environmentLevel2", "4_Level_2_Deepening"),
  });
}

export function buildTargetSelfAssessmentData() {
  const module = moduleById("targetSelfAssessment");
  return Object.freeze({
    sources: Object.freeze(["ST_Target_Self_Assessment_Module.xlsx", "ST_Form_Binding_Prompt.xlsx"]),
    positioningFields: freezePositioningFields(module.positioningFields),
    targetSelfAssessment: runtimeQuestionnaireModule("targetSelfAssessment", "3_Screening"),
    receipt: TARGET_SELF_RECEIPT,
  });
}

export function buildTargetObservationDiagnosticData() {
  const module = runtimeQuestionnaireModule("targetObservedEnvironment", "Questionnaire");
  return Object.freeze({
    source: module.source,
    worksheet: module.worksheet,
    questionCount: module.questionCount,
    questions: module.questions,
  });
}
