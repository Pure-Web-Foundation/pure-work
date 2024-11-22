export class FlowOptions {
  #id;
  #run;
  #initFn;
  #strings = {};

  /**
   * Creates a new instance of FlowOptions.
   * @param {String} id unique identifier for the flow
   * @param {Function} run function that kicks off the flow
   * @param {Function} initFn function that is called to allow for custom initialization
   */
  constructor(id, run, initFn) {
    this.#id = id;
    this.#run = run;
    this.#initFn = initFn;
  }

  /**
   * The ID of the flow.
   */
  get id() {
    return this.#id;
  }

  /**
   * Gets the method that kicks off the flow.
   */
  get run() {
    return this.#run;
  }

  get initFn() {
    return this.#initFn ?? (() => {});
  }

  /**
   * Set to true to use Broker 
   */
  useBroker = false;

  get strings (){
    return this.#strings;
  }

  /**
   * The time to pause before resolving a step and continuing with the next one.
   */
  resolveDelay = 200;
}
