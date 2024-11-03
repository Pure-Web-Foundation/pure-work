// eslint-disable-next-line no-unused-vars
import { FlowStep } from "./flow-step";

/**
 * FlowState class -  This class is used to store flow state information.
 */
export class FlowState {
  /**
   * Loads a step
   * @param {FlowStep} step
   * @returns { Object }
   */
  async loadStep(step) {
    return sessionStorage.getItem(step.key);
  }

  /**
   * Saves a step
   * @param {FlowStep} step
   */
  async saveStep(step) {
    const value = step.value ?? null;
    if (value !== null) sessionStorage.setItem(step.key, value);
  }
}
