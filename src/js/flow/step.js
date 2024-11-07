import { EventTargetMixin } from "../common";

export const FlowStepState = Object.freeze({
  Unknown: "unknown",
  Initialized: "initialized",
  Started: "started",
  Running: "running",
  Completing: "completing",
  Completed: "completed",
  Replayed: "replayed",
});

export class FlowStep extends EventTargetMixin(EventTarget) {
  #options;
  #completedAt;
  #value;
  #index;
  #flow;
  #id;
  #name;
  #isGivenName;
  #hasChangedValue = false;
  #key;
  #state = FlowStepState.Unknown;
  #resolve = () => {};
  #render = () => {};
  #rendered = () => {};
  __rerunValue;

  /**
   *
   * @param {Flow} flow
   * @param {*} topic
   * @param {FlowStepOptions} options
   * @param {*} fn
   */
  constructor(flow, topic, options, fn) {
    super();
    this.#flow = flow;

    this.#id = `wf${this.#flow.stepIndex.toString(16)}`;

    this.#options = {
      topic,
      backTarget: true,
      ...(options ?? {}),
    };

    this.#name = this.#getStepName(fn);

    this.#key = this.#getActionKey(fn);

    Object.seal(this); // Seal the instance
  }

  static async factory(flow, topic, options, fn) {
    const step = new FlowStep(flow, topic, options, fn);
    await step.initialize();
    step._setState(FlowStepState.Initialized);
    return step;
  }

  async initialize() {
    let value = await this.#flow.options.state.loadStep(this);

    if (value ?? null) {
      if (this.options.transform?.in)
        value = this.options.transform.in.bind(this)(value);

      this.#value = value;
    }
  }

  get resolve() {
    return this.#resolve;
  }

  set resolve(fn) {
    this.#resolve = fn;
  }

  // get a name (either from given options, or generated from the function name)
  #getStepName(fn) {
    if (this.#options.name) {
      this.#isGivenName = true;
      return this.#options.name;
    }
    return fn.name.split(" ").pop();
  }

  // internal method
  _setIndex(index) {
    if (typeof this.#index !== "undefined")
      throw new Error(`Step ${this} already has an index`);

    this.#index = index;
  }

  get options() {
    return this.#options;
  }

  get id() {
    return this.#id;
  }

  get flow() {
    return this.#flow;
  }

  get index() {
    return this.#index;
  }

  get name() {
    return this.#name ?? `Anonymous step`;
  }

  get key() {
    return this.#key;
  }

  get topic() {
    return this.options?.topic;
  }

  get value() {
    return this.#value;
  }

  get state() {
    return this.#state;
  }

  /**
   * Gets the completion time
   */
  get completedAt() {
    return this.#completedAt;
  }

  /**
   * Gets the completion state of the step
   */
  get complete() {
    return this.#state === FlowStepState.Completed;
  }

  /**
   * Returns the async function to be used for rendering the step.
   */
  get render() {
    return this.#render;
  }

  /**
   * Sets the async function to be used for rendering the step.
   */
  set render(renderFunction) {
    this.#render = renderFunction;
  }

  /**
   * Returns the function to be used when the step has been rendered.
   */
  get rendered() {
    return this.#rendered;
  }

  /**
   * Sets the function to be used when the step has been rendered.
   */
  set rendered(renderFunction) {
    this.#rendered = renderFunction;
  }

  #getActionKey() {
    let key = `${this.#flow.options.id}.${this.name}`;
    if (!this.#isGivenName) key = `${key}.${this.id}`;

    return key;
  }

  /**
   * Sets the state
   * @param {FlowStepState} state
   */
  _setState(state) {
    if (!Object.values(FlowStepState).includes(state))
      throw new Error(`Invalid state`);

    this.#state = state;
  }

  async _doComplete(stepResult, resolve, isReplay) {
    if (!isReplay) {
      if (this.options.transform?.out)
        stepResult = this.options.transform.out(stepResult);

      this.#hasChangedValue = this.#value != stepResult;

      this.#value = stepResult;

      resolve(stepResult);
    }

    this._setState(isReplay ? FlowStepState.Replayed : FlowStepState.Completed);

    this.#completedAt = new Date().toJSON();
    if (!isReplay) await this.#flow.options.state.saveStep(this);
  }

  /**
   * Returns true if the value has been modified.
   */
  get hasChangedValue() {
    return this.#hasChangedValue;
  }

  /**
   * Triggers a "continue-request" event on the flow step.
   */
  requestResolve() {
    const event = new FlowStep.StepResolveEvent(this);
    this.dispatchEvent(event);
  }

  toString() {
    const val =
      typeof this.value !== "undefined" ? ` (result: ${this.value})` : "";
    return `Step ${this.index + 1}: ${this.name}${val}`;
  }

  /**
   * Event for resolving
   */
  static get StepResolveEvent() {
    return class extends CustomEvent {
      #step;

      constructor(step) {
        super("continue-request");
        this.#step = step;
      }

      continue() {
        if (this.#step.state === FlowStepState.Running) this.#step.resolve();
        else throw new Error(`Cannot resolve step, it is not running`);
      }
    };
  }
}
