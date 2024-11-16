import { EventTargetMixin, scrollIntoView } from "../common";
import { LitElement, html, nothing } from "lit";
import { FlowStepState } from "./index";
import { Flow } from "./index";
import { repeat } from "lit/directives/repeat.js";
import "./ui-step";
const htmlElm = document.documentElement;

/**
 * @event flow-step-rendered - Fired when a step is rendered. Use preventDefault() to bypass default behavior
 */
export class FlowUI extends EventTargetMixin(LitElement) {
  #flow;

  static get properties() {
    return {
      options: { type: Object },
      type: { type: String, attribute: true },
      currentStep: { type: Object },
    };
  }

  createRenderRoot() {
    return this;
  }

  updated(changedProperties) {
    if (changedProperties.has("type")) {
      htmlElm.setAttribute("data-flow-ui-type", this.type);
    }

    if (changedProperties.has("options")) {
      if (!this.options) return;

      const wf = this.createFlow(this.options);

      wf.on("flow-ended", () => {
        htmlElm.removeAttribute("data-flow");
        htmlElm.removeAttribute("data-flow-ui-type");
        this.currentStep = null
      })
        .on("flow-started", () => {
          htmlElm.setAttribute("data-flow", wf.options.id);
        })
        .on("step-rendered", (e) => {
          const step = e.detail;

          const stepElement = this.querySelector(`[data-step="${step.key}"]`);

          if (stepElement) {
            scrollIntoView(stepElement).then(() => {
              stepElement.querySelector("[name]")?.focus();

              // remove completed steps unless 'step-ui-rendered' event is prevented.
              const renderedEvent = wf.fire("step-ui-rendered", {
                step: step,
                element: stepElement,
              });
              if (!renderedEvent.defaultPrevented) {
                this.querySelectorAll("flow-ui-step.completed").forEach((u) => {
                  u.remove();
                });
              }
            });
          }
        });

      wf.start();
    }
  }

  render() {
    if (!this.options) return nothing;
    if (!this.#flow?.steps?.length) return nothing;

    return html`<div data-flow-inner>${this.renderFlow()}</div> `;
  }

  renderFlow() {

    return html`
      ${repeat(this.#flow.steps, (step, index) => {
        return html`<flow-ui-step
          .step="${step}"
          .isActive=${step === this.#flow.currentStep}
          .index="${index}"
        >
        </flow-ui-step>`;
      })}
    `;
  }

  createFlow(options) {
    const wf = Flow.factory(options);

    wf.install("ui", FlowUI.ui);
    wf.install("ask", FlowUI.ui);
    wf.install("show", async (step) => {
      step.render = () => {
        if (typeof step.options.show === "function")
          return step.options.show(step);

        return html`<span data-step-show>${step.topic}</span>`;
      };

      setTimeout(() => {
        step.resolve();
      }, step.options.wait ?? 500);
    });

    wf.on("step-started", () => {
      this.requestUpdate();
    })
      // .on("flow-ended", (e) => {
      //   const step = e.detail.step;
      //   step.render = () => html`${step.topic ?? ""}`;
      // })
      .on("enter-detected", () => {
        const form = this.querySelector(
          "[data-flow-inner] .flow-step:not(.completed) form"
        );
        if (form) form.requestSubmit(form.querySelector("[name='continue']"));
        else wf.requestResolve();
      });

    this.#flow = wf;
    return wf;
  }

  static async ui(step) {
    const form = new Form(step);
    step.render = form.render.bind(form);
  }
}

customElements.define("flow-ui", FlowUI);

class Form {
  constructor(step) {
    step.options.placeholder = step.options.placeholder ?? "Enter your answer";
    if ((step.options.maxlength ?? 80) > 80) step.options.type = "textarea";

    this.step = step;
  }

  submit(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target.closest("form");
    const data = new FormData(form);

    const value = this.step.options.isMany
      ? data.getAll("step")
      : data.get("step");

    form.closest(".flow-step")?.classList.add(FlowStepState.Completing);
    this.step._setState(FlowStepState.Completing);

    setTimeout(() => {
      this.step.resolve(value);
    }, 10);
  }

  renderControl() {
    return html`
      <fieldset class="control" data-control-type="${this.step.options.type}">
        <legend>${this.step.options.title ?? ""}</legend>
        ${this.renderInput()}
      </fieldset>
    `;
  }

  renderInput() {
    return html` <label for="${this.step.id}"
        >${this.step.options.label ?? this.step.options.topic}</label
      >
      ${renderInput(this.step)}`;
  }

  renderForm() {
    return html`<form
      method="post"
      action="/"
      @submit=${this.submit.bind(this)}
    >
      ${this.renderControl()}

      <fieldset data-flow-continue>
        <button name="continue" title="Continue" class="primary" type="submit">
          Continue
          <span class="arrow">↲</span>
        </button>

        ${this.renderBackButton()}
      </fieldset>

      ${this.renderFootnotes()}
    </form>`;
  }

  renderBackButton() {
    if (this.step.index === 0) return nothing;
    return html`<button
      @click=${this.backClick}
      name="back"
      title="Back"
      type="button"
      class="secondary"
      tabindex="-1"
    >
      Back
      <span class="arrow">↺</span>
    </button>`;
  }

  backClick() {
    this.step.flow.back();
  }

  renderFootnotes() {
    if (this.step.options.footnotes)
      return html`<section class="footnotes">
        ${repeat(Object.entries(this.step.options.footnotes), ([id, note]) => {
          return html`<dl><dt>${id}</dt><dd>${note}</dd></dl></p>`;
        })}
      </section>`;
  }

  renderValue() {
    return html`<dl>
      <dt>${this.step.options.topic}</dt>
      <dd>${this.step.value}</dd>
    </dl>`;
  }

  render() {
    return this.renderStep();
  }

  renderStep() {
    const step = this.step;
    if (step.options.autoContinue) {
      setTimeout(() => {
        step.resolve(1);
      }, this.calculateTime(step));
    }
    switch (step.options.type) {
      case "button":
        return html`<button @click=${() => step.resolve(1)}>
          ${step.options.topic}
        </button>`;

      case "dialog": {
        if (!step.options.items) step.options.items = ["OK", "Cancel"];

        const dialog = document.createElement("dialog");
        const buttons = [];
        step.options.items.forEach((button) => {
          buttons.push(`<button value="${button}">${button}</button>`);
        });
        dialog.innerHTML = /*html*/ `
            <form method="dialog">
                <h3>${step.options.topic}</h3>
                <main>${step.options.body}</main>
                <menu>
                    ${buttons.join("")}
                </menu>
            </form>
          </div>`;

        document.body.appendChild(dialog);
        dialog.addEventListener("close", () => {
          step.resolve(dialog.returnValue);
        });
        dialog.showModal();
        break;
      }
      default:
        return this.renderForm();
    }
  }

  calculateTime(step) {
    const wordCount = step.topic.split(" ").length;
    return 2000 + wordCount * 150;
  }
}

const input = (step) => {
  return html`<input
    id="${step.id}"
    required
    spellcheck="false"
    pattern="${step.options.pattern ?? nothing}"
    name="step"
    value="${step.value ?? ""}"
    placeholder=${step.options.placeholder}
    type="${step.options.type}"
  />`;
};

const longText = (step) => {
  return html`<textarea
    id="${step.id}"
    required
    spellcheck="false"
    name="step"
    rows="${step.options.rows ?? 6}"
    placeholder=${step.options.placeholder}
  >
${step.value ?? ""}</textarea
  >`;
};

const selectOne = (step) => {
  const defaultSelected = step.value ? -1 : 0;

  if (!step.options.items || !Array.isArray(step.options.items))
    throw new Error("No items array passed");

  return html`
    <fieldset data-tick>
      ${repeat(step.options.items, (item, index) => {
        return html`<label>
          <input
            type="radio"
            name="step"
            value="${item}"
            ?checked=${defaultSelected === index || step.value === item}
          />
          <span class="data-label">${item}</span>
        </label>`;
      })}
    </fieldset>
  `;
};

const selectMany = (step) => {
  const defaultSelected = [...(step.value ?? [])];
  return html`
    <fieldset data-tick>
      ${repeat(step.options.items, (item) => {
        return html`<label>
          <input
            type="checkbox"
            name="step"
            value="${item}"
            ?checked=${defaultSelected.includes(item)}
          />
          <span class="data-label">${item}</span>
        </label>`;
      })}
    </fieldset>
  `;
};

export const UI = {
  input: {
    renderInput: input,
  },
  selectOne: {
    renderInput: selectOne,
  },
  selectMany: {
    isMany: true,
    renderInput: selectMany,
    transform: {
      out: (value) => {
        return value;
      },
      in: (value) => {
        return Array.isArray(value) ? value : value?.split(",") ?? [];
      },
    },
  },
  boolean: {
    items: ["Yes", "No"],
    renderInput: selectOne,
    transform: {
      out: (value) => {
        return value === "Yes";
      },
      in: (text) => {
        return ["true", "Yes"].includes(text) ? "Yes" : "No";
      },
    },
  },
  number: {
    type: "number",
    renderInput: input,
  },
  date: {
    type: "date",
    renderInput: input,
  },
  longtext: {
    renderInput: longText,
  },
};

function renderInput(step) {
  if (step.options.renderInput) return step.options.renderInput(step);

  return input(step);
}
