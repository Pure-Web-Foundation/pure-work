import { html, LitElement, nothing } from "lit";
import { FlowOptions } from "./flow/options";
import { repeat } from "lit/directives/repeat.js";
import { UI as baseUI } from "./flow/ui";

const wait = async (timeout)=> {
  return new Promise(resolve=>{
    setTimeout(() => {
      resolve()
    }, timeout);
  })
}


const UI = {
  ...baseUI,

  chatBox: {
    ...baseUI.longtext,
    class: "chat-box auto-grow",
    placeholder: "Type a message...",
    stepClass: "actor-user",
    on: {
      input: (e) => {
        e.target.parentNode.dataset.replicatedValue = e.target.value;
      },
      keydown: (e) => {
        if (e.key === "Enter")
          if (!e.shiftKey) {
            e.preventDefault();
          }
      },
      keyup: (e) => {
        if (e.key === "Enter")
          if (!e.shiftKey) {
            e.target.closest("form").requestSubmit();
          }
      },
    },
  },
};

customElements.define(
  "chat-flow",
  class ChatFlow extends LitElement {
    createRenderRoot() {
      return this;
    }

    render() {
      return html`
        <flow-ui
          id="${this.options.id}"
          type="${this.options.flowType ?? "full-page"}"
          .options=${this.options}
        ></flow-ui>
      `;
    }

    // returns options for a workflow
    get options() {
      const options = new FlowOptions(
        "thread",
        this.threadFlow.bind(this),
        (flow) => {
          this.flow = flow;

          // custom action
          this.flow.install("reply", this.reply.bind(this));

          flow.on("flow-ended", (e) => {
            this.load = null;
          });

          flow.on("step-ui-rendered", (e) => {
            // work with rendered ui
          });

          flow.on("step-completed-ui-render", (e) => {
            e.detail.render = (step) => {
              return html` <div data-completed-step>
                <div class="pre-wrap">${step.value || ""}</div>
                ${this.renderTime(new Date(step.completedAt))}
              </div>`;
            };
          });
        }
      );
      options.flowType = "chat";
      options.useBroker = true; // use Broker (pub-sub singleton message bus)
      options.strings.continue = "Send";
      options.strings.back = "";
      options.resolveDelay = 0;
      return options;
    }

    async reply(step) {

      await wait(1000)

      const question = step.topic;

      const answer = `You asked "${question}"`;

      const answerHtml = html`
        <div>
          <div class="pre-wrap">${answer}</div>
          ${this.renderTime(new Date())}
        </div>
      `;

      step.render = () => html`${answerHtml}`;
      step.resolve(answer);
    }

    async threadFlow(wf) {
      const thread = [];

      while (true) {
        const question = await wf.ask("", UI.chatBox);
        thread.push({
          me: question,
        });       

        const answer = await wf.reply(question);

        thread.push({
          ai: answer,
        });
      }
    }

    renderTime(date) {
      date = date ?? Date.now();
      return html`
        <time datetime="${date.toISOString()}"
          >${date.toLocaleTimeString()}</time
        >
      `;
    }
  }
);
