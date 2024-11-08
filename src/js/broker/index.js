import { EventTargetMixin } from "../common";

/**
 * Singleton Broker class. Acts as a pub-sub broker for app-wide messaging.
 */
export class Broker extends EventTargetMixin(EventTarget) {
  static #instance;

  #listeners = {};

  constructor() {
    super();
    if (Broker.#instance) return Broker.#instance; // singleton
    Broker.#instance = this;
  }

  /**
   * Gets the singleton instance of the broker class.
   */
  static get instance() {
    if (!this.#instance) new this();
    return this.#instance;
  }

  subscribe(topicName, callback) {
    if (!this.#listeners[topicName]) {
      this.#listeners[topicName] = [];
    }
    this.#listeners[topicName].push(callback);
    return this;
  }

  async publish(topicName, data) {
    if (!this.#listeners[topicName]) {
      return;
    }

    const promises = this.#listeners[topicName].map((listener) =>
      listener(data)
    );
    await Promise.all(promises);
  }
}
