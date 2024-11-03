# Pure Flow

Pure JavaScript Workflow Engine

# Install

```shell
npm install pure-flow --save
```

# What is it?

Pure Flow is a standards-based Workflow Engine with no dependencies, that enables you to run workflows by chaining JavaScript *Promises*.

# Layers

## Flow

```js
import { Flow } from "pure-flow"

const options = new FlowOptions("testflow", this.run.bind(this), flow=>{
  flow.on("starting", e=>{
    alert(6)
  })
});

const flow = Flow.factory(options);

```

## <flow-ui> Web Component

The `flow-ui` Web Component can be used to run visual workflows.

## Default UI components


