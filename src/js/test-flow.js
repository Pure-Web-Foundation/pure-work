
import { Flow, FlowOptions } from "./flow/flow";

let _flow;

const options = new FlowOptions("testflow", run, (flow) => {
  _flow = flow;
  flow.install("go", go);
  flow.on("starting", (e) => {
    alert(6);
  });
});

async function run() {
  console.log("Running", _flow);
}

async function go(step) {
  console.log("Go", step);
}

const flow = Flow.factory(options);

flow.start();
