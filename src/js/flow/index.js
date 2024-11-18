import { FlowStep, FlowStepState } from "./step";
import { FlowState } from "./state";
import { FlowOptions } from "./options";
import {
  takeSimpleProperties,
  TimeoutError,
  withTimeout,
  EventTargetMixin,
} from "../common";
import { BrokerFlowStateHandler } from "../broker-flow-handler";

const DEFAULT_RESOLVE_DELAY = 50;
const DEFAULT_STEP_TIMEOUT = 1000 * 60 * 30; // 30 minutes.

/**
 * Flow Engine, implemented using chained promises.
 */
export class Flow extends EventTargetMixin(EventTarget) {
  #steps = [];
  #stepIndex = -1;
  #options;
  static #internal;

  /**
   * Creates an instance of the Flow class.
   * @param {FlowOptions} options
   */
  constructor(options) {
    super();
    if (!Flow.#internal) {
      throw new Error("Use Flow.factory() to create an instance.");
    }
    this.#options = options ?? {};

    if (!this.options.id) throw new Error("Flow must have an id.");

    this.#installActions();

    this.#setupHooks();
  }

  /**
   * Factory method to instantiate a Flow instance.
   * @param {FlowOptions} options
   * @returns { Flow } - The flow instance.
   */
  static factory(options) {
    this.#internal = true;

    if (!(options instanceof FlowOptions))
      throw new Error("Invalid flow options.");

    const wf = new Flow(options);

    if (wf.options.useBroker) wf.options.state = new BrokerFlowStateHandler();

    if (!wf.options.state) wf.options.state = new FlowState();

    if (typeof options.initFn !== "function")
      throw new Error("initFn must be a function");

    options.initFn(wf);

    this.#internal = false;

    Object.seal(this);
    return wf;
  }

  #setupHooks() {
    this._keydown = (e) => {
      if (e.key === "Enter") {
        if (["TEXTAREA"].includes(e.target?.nodeName) || e.target.closest("[data-prevent-enter]")) return;

        this.fire("enter-detected");
      }
    };
    document.addEventListener("keypress", this._keydown);
  }

  #destroyHooks() {
    document.removeEventListener("keypress", this._keydown);
  }

  //Creates a flow step.
  static #action(fn, baseOptions) {
    /**
     * @type { Function}
     */
    const wrapperFunction = async function (topic, options) {
      if (this.steps.length === 0) {
        this.fire("flow-initialized");

        this.fire("flow-started");
      }

      const step = await FlowStep.factory(
        this,
        topic,
        { ...baseOptions, ...options },
        fn
      );

      this.currentStep = step;

      const promise = new Promise((resolve) => {
        Flow.#tryResolveRerun(step, resolve).then((isResolved) => {
          if (!isResolved) {
            step._setState(FlowStepState.Running);

            (step.resolve = (r) => {
              if (step.state === FlowStepState.Completed) return;

              this.fire("step-completing", {
                step,
              });

              setTimeout(async () => {
                await step._doComplete(r, resolve);
                this.fire("step-complete", {
                  step,
                });
              }, this.options.resolveDelay ?? DEFAULT_RESOLVE_DELAY);
            }),
              fn(step);
          }
        });
      });

      return withTimeout(
        promise,
        step.timeout ?? this.options.stepTimeout ?? DEFAULT_STEP_TIMEOUT
      );
    };
    return wrapperFunction;
  }

  /**
   * Installs a flow action (as a method on the worflow instance).
   * @param {String} actionName The name of the action.
   * @param {Function} fn method to execute.
   */
  install(actionName, fn, options = {}) {
    const promise = Flow.#action(fn, options);
    if (this[actionName]) throw new Error(`${actionName} is already in use.`);

    this[actionName] = promise;
    return this; // chaining
  }

  /**
   * Gets the flow options
   */
  get options() {
    return this.#options;
  }

  get id() {
    return this.#options.id;
  }

  /**
   * Gets the steps array
   * @returns {FlowStep[]}
   */
  get steps() {
    return this.#steps;
  }

  /**
   * Gets the current step index.
   */
  get stepIndex() {
    return this.#stepIndex;
  }

  /**
   * Gets the current step.
   */
  get currentStep() {
    return this.#steps[this.#stepIndex];
  }

  /**
   * Sets the current step.
   */
  set currentStep(step) {
    if (step.index ?? null) {
      this.#steps.length = step.index + 1;
    } else {
      this.#steps.push(step);
    }

    step._setIndex(this.#steps.length - 1);

    this.fire("step-started", {
      step,
    });

    this.#stepIndex = step.index;

    this.#tryRestoreRerun(step);
  }

  /**
   * Moves back to the previous step, or to a named step.
   */
  back(toStepName = null) {
    let gotoIndex = this.#steps.length - 2;

    if (toStepName) {
      gotoIndex = this.#steps.findIndex((i) => i.name === toStepName);
    }

    while (gotoIndex >= 0) {
      if (this.#steps[gotoIndex].options.backTarget) break;

      gotoIndex--;
    }

    if (gotoIndex < 0 || !this.#steps[gotoIndex]) gotoIndex = 0;

    this.#storeRerunData(gotoIndex);
    return this.start();
  }

  // stores data for rerunning the wokflow (back to previous step)
  #storeRerunData(gotoIndex) {
    const take = [...this.#steps];
    take.length = gotoIndex;

    this.__reRun = take.map((i) => {
      return {
        key: i.key,
        id: i.id,
        value: i.value,
        name: i.name,
        completedAt: i.completedAt,
        options: takeSimpleProperties(i.options),
      };
    });
  }

  // restore a value for a step that was rerun
  #tryRestoreRerun(step) {
    if (this.__reRun) {
      if (step.index < this.__reRun.length) {
        const oldStep = this.__reRun[step.index];
        const value = oldStep.value ?? null; // See 'undefined' check in #tryResolveRerun()
        step.__rerunValue = value;
      }
    }
  }

  static async #tryResolveRerun(step, resolve) {
    if (typeof step.__rerunValue !== "undefined") {
      // null is a value!
      const value = step.__rerunValue;

      try {
        resolve(value);
        return true;
      } finally {
        await step._doComplete(value, null, true); // don't pass resolve
        step.__rerunValue = null;
      }
    }
  }

  /**
   * Kicks off the flow.
   */
  async start() {
    this.#steps = [];
    this.#stepIndex = -1;

    try {
      return await this.options.run(this).then(() => {
        this.end();
      });
    } catch (ex) {
      if (ex instanceof TimeoutError) this.fire("flow-timeout");
      else throw ex;
    }
  }

  // installs the actual async methods that can be chained and form the flow
  #installActions() {
    this.install("end", (step) => {
      this.fire("flow-ended", {
        step,
      });

      step.resolve();
      this.#destroyHooks();
      this.#steps = [];
    });

    // delay method, makes flow wait
    // example use: wf.delay(200).then(() => { wf.myOtherMethod(); });
    this.install("delay", (step) => {
      setTimeout(() => {
        step.resolve(true);
      }, step.options.topic ?? 1000);
    });

    // install actions passed in contstructor
    if (this.options.actions) {
      for (const [name, action] of Object.entries(this.options.actions)) {
        this.install(name, action);
      }
    }
  }

  requestResolve() {
    const step = this.currentStep;
    if (step) step.requestResolve();
  }

  toString() {
    return `Flow '${this.options.id}'`;
  }
}

export { FlowOptions, FlowStep, FlowState, FlowStepState };
