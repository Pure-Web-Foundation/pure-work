import { EventTargetMixin } from "../common";

/**
 * Broker class. Acts as a pub-sub broker for app-wide messaging.
 */
export class Broker extends EventTargetMixin(EventTarget) {
  static #instance;

  #listeners = {};

  constructor() {
    super();
    if (Broker.#instance) return Broker.#instance; // singleton

    console.log("Creating singleton Broker...");
    Broker.#instance = this;
  }

  /**
   * Gets the singleton instance of the broker class.
   */
  static get instance() {
    if (!this.#instance) new Broker();
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

  // /**
  //  * Publishes a message on the broker.
  //  * @param {String} topicName
  //  * @param {Object} details
  //  */
  // publish(topicName, details) {
  //   return this.fire(`pub-${topicName}`, details);
  // }

  // /**
  //  * Subscribes to a topic on the broker.
  //  * @param {String} topicName
  //  * @param {Function} callback
  //  * @returns {Broker} instance (for easy chaining)
  //  */
  // subscribe(topicName, callback) {
  //   return this.on(`pub-${topicName}`, async (e) => {
  //     await callback(e.detail);
  //   });
  // }
}
