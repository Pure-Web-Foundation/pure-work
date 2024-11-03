import { html, LitElement } from "lit";
import { FlowOptions } from "./flow/flow";
import { UI } from "./flow/flow-ui";

customElements.define(
  "my-app",
  class MyApp extends LitElement {
    static get properties() {
      return {
        load: { type: Object },
      };
    }

    createRenderRoot() {
      return this;
    }

    render() {
      if (this.load)
        return html`
          <flow-ui type="full-page" .options=${this.load}></flow-ui>
        `;

      return html`
        <h2>Select your flow</h2>
        <button @click=${() => (this.load = this.testFlow1)}>Test 1</button>
        <button @click=${() => (this.load = this.testFlow2)}>Test 2</button>
      `;
    }

    async go(step) {
      step.render = () => html`Loading...........`;

      setTimeout(() => {
        step.resolve(new Date());
      }, 1000);
    }

    get testFlow1() {
      return new FlowOptions("test", this.test1.bind(this), (flow) => {
        this.flow = flow;
        flow.install("go", this.go.bind(this), {
          backTarget: false,
        });
        flow.on("flow-ended", (e) => {
          this.load = null;
        });
      });
    }

    get testFlow2() {
      return new FlowOptions("test", this.test2.bind(this), (flow) => {
        this.flow = flow;
        flow.install("go", this.go.bind(this));
        flow.on("flow-ended", (e) => {
          this.load = null;
        });
      });
    }

    // test flow
    async test1() {
      const wf = this.flow;

      await wf.go();

      if (await wf.ask("Are you okay?", UI.boolean)) {
        await wf.ask("How much?", UI.number);
      }

      await wf.end();
    }

    // test flow
    async test2() {
      const wf = this.flow;

      await wf.go();

      if (await wf.ask("Are you okay?", UI.boolean)) {
        await wf.ask("How much?", UI.number);
      }

      await wf.end();
    }
  }
);
