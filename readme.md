# Pure Work

Pure JavaScript Work Modules 

# Install

```shell
npm install pure-work --save
```

# What is it?

Pure Work is a set of standards-based modules 

## Flow

Flow is a Workflow Engine with no dependencies, that enables you to run workflows by chaining JavaScript *Promises*.

```js
import { Flow } from "pure-work/flow"

const options = new FlowOptions("test", this.test1.bind(this), (flow) => {
  this.flow = flow;
})

const flow = Flow.factory(options);
```

## <flow-ui> Web Component

The `flow-ui` Web Component can be used to run visual workflows.

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

    const name = await f.ask("What's your name?");
  }
```




