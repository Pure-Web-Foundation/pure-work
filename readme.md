# Pure Work

Pure JavaScript Work Modules

# Install

```shell
npm install @pwf/pure-work --save
```

# What is it?

Pure Work is a set of standards-based modules that help in developing web apps.

## Flow

Flow is a Workflow Engine with no dependencies, that enables you to run workflows by chaining JavaScript _Promises_.

Flow can be used to build complex workflows that are triggered by user actions or other events.

### Features

1. Simplicity (just chain async methods/promises)
2. Customizaability (extend the flow with custom methods and hooks)
3. Extensibility (use existing modules or create new ones)
4. 100% separation of workflow running (`Flow`) and UI handling (`<flow-ui>` web component).

```js
import { Flow } from "pure-work/flow";

const options = new FlowOptions("test", this.test1.bind(this), (flow) => {
  this.flow = flow;
});

const flow = Flow.factory(options);
```

## <flow-ui> Web Component

The `flow-ui` Web Component can be used to run visual workflows.

It wraps the `Flow` class and provides a UI for running flows.

```js
  render(){
    return html`<flow-ui type="full-page" .options=${this.options}></flow-ui>`
  }

  get options() {
    return new FlowOptions("test", this.runFlow.bind(this), (flow) => {
      this.flow = flow;
    });
  }

  async runFlow(){
    const f = this.flow;

    const person = {
      name: await f.ask("What's your name?", UI.text),
      email: await f.ask("And your email address?", UI.email);

    }

  }
```

### Demo

See [the demo page](https://pwfworkflow.z6.web.core.windows.net/) for a live demo.
