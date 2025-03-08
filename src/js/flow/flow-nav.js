export class FlowNav {
  constructor({ onStepChange, baseUrl = window.location.pathname }) {
    this.onStepChange = onStepChange; // Callback function to restore state
    this.baseUrl = baseUrl;
    this.steps = [];
    this.currentStep = null;
    this.init();
  }

  init() {
    window.addEventListener("popstate", this.popHandler.bind(this));

    // Capture the initial step from the URL or default to the first step
    const urlStep = this.getStepFromUrl();
    if (urlStep) {
      this.restoreStep(urlStep);
    } else if (this.steps.length > 0) {
      // Ensure the initial step is pushed into history
      this.goToStep(this.steps[0], {}, false);
    }
  }

  popHandler(event) {
    if (event.state && typeof event.state.step !== "undefined") {
      this.restoreStep(event.state.step);
    }
  }

  registerStep(stepId) {
    if (!this.steps.includes(stepId)) {
      this.steps.push(stepId);
      this.goToStep(stepId, undefined, true, false);
    }
  }

  goToStep(
    stepId,
    stateData = {},
    pushToHistory = true,
    signalStepChange = true
  ) {
    if (!this.steps.includes(stepId)) {
      return;
    }

    this.currentStep = stepId;
    const newUrl = `${this.baseUrl}?step=${encodeURIComponent(stepId)}`;

    if (pushToHistory) {
      history.pushState({ step: stepId, ...stateData }, "", newUrl);
    } else {
      history.replaceState({ step: stepId, ...stateData }, "", newUrl);
    }

    if (signalStepChange && typeof this.onStepChange === "function") {
      this.onStepChange(stepId, stateData);
    }
  }

  restoreStep(stepId) {
    if (!this.steps.includes(stepId)) {
      return;
    }

    this.currentStep = stepId;
    if (typeof this.onStepChange === "function") {
      this.onStepChange(stepId);
    }
  }

  getStepFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("step");
  }
}
