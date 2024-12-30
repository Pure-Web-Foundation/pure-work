import { html, nothing, LitElement } from "lit";
import { EventTargetMixin } from "../common";
import { FlowStepState } from "./step.js";

customElements.define(
  "flow-ui-step",
  class FlowUIStep extends EventTargetMixin(LitElement) {
    #flow;

    static get properties() {
      return {
        step: { type: Object },
        isActive: { type: Boolean, reflect: true },
      };
    }

    createRenderRoot() {
      return this;
    }

    get flow() {
      return this.#flow;
    }

    render() {
      if (!this.step) return nothing;

      const step = this.step;
      this.#flow = this.step.flow;
      const lastIndex = this.#flow.steps.length - 1;
      const isLast = step.index === lastIndex;

      this.removeAttribute("class");
      this.setAttribute("data-step", step.key);
      this.setStepClasses(step, isLast);

      try {
        return step.render();
      } finally {
        if (isLast) {
          setTimeout(() => {
            this.#flow.currentStep.rendered();
            this.#flow.fire("step-rendered", this.#flow.currentStep);
          }, 50);
        }
      }
    }

    setStepClasses(step, isLast) {
      this.classList.add("flow-step");
      if (step.options.stepClass) {
        this.classList.add(...step.options.stepClass.split(" "));
      }

      if (isLast) this.classList.add("current-step");

      for (const state of Object.values(FlowStepState)) {
        if (state === step.state) this.classList.add(state);
        else this.classList.remove(state);
      }
    }
  }
);
