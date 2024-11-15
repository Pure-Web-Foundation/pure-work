# Pure Work

Pure JavaScript Work Modules

# Install

```shell
npm install @pwf/pure-work --save
```

# What is it?

A set of standards-based modules that help in developing web apps.

## 1. Flow

Flow is a Workflow Engine with no dependencies, that enables you to run workflows by chaining JavaScript _Promises_.

Flow can be used to build complex workflows that are triggered by user actions or other events.

Every step in the workflow represents a piece of work that can have a UI representation.

### 1.1 Features

1. Simplicity (just chain async methods/promises)
2. Customizability (the only requirement is for each step to be an async method)
3. Extensibility (hook into the event model, and extend each step with custom UI)
4. 100% separation of workflow running (`Flow`) and UI handling (`<flow-ui>` web component).

### 1.2 Basic Usage (`flow-ui` Web Component)

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

    await f.show(`name: ${person.name} (${person.email})`, {
      wait: 5000
    })

  }
```

### 1.3 Demo

See [the demo page](https://pwfworkflow.z6.web.core.windows.net/) for a live demo.

### 1.4 Advanced Usage (`Flow` class)

Where `flow-ui` is a UI wrapper around the `Flow` class, the `Flow` class is UI-independent, and can be used to build everywhere.

```js
import { Flow } from "pure-work/flow";

const options = new FlowOptions(
  "test",
  this.myFlowStartingpoint.bind(this),
  (flow) => {
    // flow.install("myMethod", this.myFlowMethod.bind(this))
  }
);

const flow = Flow.factory(options);
await flow.start();
```

## 2. Broker 

A simple singleton message broker based on regular, vanilla DOM eventing.

Acts a a pub/sub messaging system, where actors can publish messages in topics, and consumers can subscribe to topics and listen for new messages on them.

`Broker` is available as a global singleton.

### Subscribing to a topic
```js
Broker.instance
  .subscribe(`my-topic`, async (data) => {
    // do something with the data
  })
```

### Publishing on a topic
```js
Broker.instance.publish(`my-topic`, {
  my: "data"
})
```

