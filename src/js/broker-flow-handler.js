import { FlowState } from "./flow/state";
import { Broker } from "./broker/index";

export class BrokerFlowStateHandler extends FlowState {
  async loadStep(step) {
    if (step.options.store) {
      const details = {
        scope: step.flow.id,
        key: step.options.store,
        value: step.value,
      };
      await Broker.instance.publish(`flow-step-load`, details);

      return details.value;
    }
  }

  /**
   * Saves a step
   * @param {FlowStep} step
   */
  async saveStep(step) {
    if (step.options.store) {
      await Broker.instance.publish(`flow-step-save`, {
        scope: step.flow.id,
        key: step.options.store,
        value: step.value,
      });
    }
  }
}
