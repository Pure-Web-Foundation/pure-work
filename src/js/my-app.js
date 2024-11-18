import { html, LitElement } from "lit";
import { FlowOptions } from "./flow/options";
import { repeat } from "lit/directives/repeat.js";
import { UI as baseUI } from "./flow/ui";
import { Broker } from "./broker/index";

const UI = {
  ...baseUI,
  lover: {
    ...baseUI.selectOne,
    items: ["Not at all", "A bit", "Sure", "Love them!"],
    store: "lover"
  },
  location: {
    ...baseUI.selectOne,
    items: ["At home", "In a theater", "No difference"],
    store: "location",
  },
  locationWhy: {
    ...baseUI.longtext,
    store: "locationWhy"
  },
  actor: {
    ...baseUI.text,
    store: "actor",
  },
  favorite: {
    ...baseUI.text,
    store: "favorite",
  },

  theater: {
    ...baseUI.selectOne,
    items: [
      "Never",
      "Once per week",
      "Once every two weeks",
      "Once every month",
      "Once every couple of months",
      "Once a year",
      "Never",
      "I'm not sure",
    ],
    store: "theater",
  },
  factor: {
    ...baseUI.selectOne,
    items: ["Genre", "Director", "Reviews", "Other"],
    store: "factor",
  },

  fanCrush: {
    ...baseUI.selectOne,
    items: ["Not at all", "A bit", "Sure", "Fan crush!"],
  },

  crucialFactor: {
    ...baseUI.longtext,
    store: "crucial",
  },
  social: {
    ...baseUI.selectOne,
    items: ["Alone", "With my partner", "In a group"],
    store: "social",
  },
  importance: {
    ...baseUI.selectOne,
    items: ["Not important at all", "Somewhat important", "Very important"],
    store: "importance",
  },
  news: {
    ...baseUI.selectOne,
    items: ["Trailers", "Reviews", "Social Media", "Friends", "Other"],
    store: "news",
  },
  streaming: {
    ...baseUI.selectMany,
    items: ["Netflix", "Hulu", "Amazon Prime", "HBO Max", "Disney+", "Other"],
    store: "streaming",
  },
  genres: {
    ...baseUI.selectMany,
    items: [
      "Action",
      "Comedy",
      "Drama",
      "Fantasy",
      "Filmhouse",
      "Horror",
      "Romance",
      "Sci-Fi",
      "Thriller",
    ],
    store: "genres",
  },
  results: {
    wait: 6000,
    show: (step) => {
      const items = Object.entries(step.topic);
      const renderValue = (value) => {
        if (Array.isArray(value)) return value.join(", ");

        return value;
      };
      return html`
        <section>
          <dl class="key-value">
            ${repeat(items, ([key, value]) => {
              return html`<dt>${key}</dt>
                <dd>${renderValue(value)}</dd>`;
            })}
          </dl>
        </section>
      `;
    },
  },
};

customElements.define(
  "my-app",
  class MyApp extends LitElement {
    constructor() {
      super();

      const movie = {
        lover: "Love them!",
        location: "In a theater",
        actor: "Jodie Foster",
        favorite: "One Flew Over the Cuckoo's Nest",
        genres: ["Filmhouse", "Drama"],
        theater: "Once every couple of months",
        streaming: ["Amazon Prime", "Netflix", "HBO Max"],
        locationWhy: "Test",
      };

      // simulate storage via broker
      Broker.instance
        .subscribe(`flow-step-load`, async (data) => {
          data.value = movie[data.key];
        })
        .subscribe(`flow-step-save`, (data) => {
          console.log(`${data.key}: ${data.value}`);

          if (data.isModified) {
            movie[data.key] = data.value;
          } else console.log(`No changes in ${data.key}`);
        });

      setTimeout(() => {
        this.start();
      }, 1);
    }

    createRenderRoot() {
      return this;
    }

    static properties = {
      load: { type: Object },
    };

    render() {
      if (!this.load) {
        return html` <h1>Movie survey</h1>
          <p>
            An example of running a workflow with the
            <a
              target="_blank"
              href="https://www.npmjs.com/package/@pwf/pure-work"
              >pure-work/flow</a
            >
            flow runner.
          </p>
          <button @click=${this.start}>Start survey</button>`;
      }

      if (this.load)
        return html`
          <flow-ui type="full-page" .options=${this.load}></flow-ui>
        `;
    }

    // starts the workflow
    start() {
      this.load = this.movieSurveyFlow;
    }

    // returns options for a workflow
    get movieSurveyFlow() {
      const options = new FlowOptions(
        "movieSurvey",
        this.movieSurvey.bind(this),
        (flow) => {
          this.flow = flow;

          // custom action
          this.flow.install("text", this.text.bind(this));

          flow.on("flow-ended", (e) => {
            this.load = null;
          });

          flow.on("step-ui-rendered", (e) => {
            // work with rendered ui
          });
        }
      );

      options.useBroker = true; // use Broker (pub-sub singleton message bus)

      return options;
    }

    // custom action
    text(step) {
      step.render = () => html`${step.topic}`;

      step.on("continue-request", (e) => {
        e.continue();
      });

      setTimeout(() => {
        step.resolve();
      }, step.options.timeout ?? 2000);
    }

    // entrypoint (first step) of the workflow
    async movieSurvey(wf) {
      await wf.text("Welcome to the movie survey!", {
        backTarget: false,
      });
      const results = {};

      (results.movieLover = await wf.ask("Are you a movie lover?", UI.lover)),
        (results.best = await wf.ask(
          "What is your favorite movie of all time?",
          UI.favorite
        ));

      results.genres = await wf.ask(
        "What are your favorite movie genres?",
        UI.genres
      );

      results.theater = await wf.ask(
        "How often do you watch movies in a theater?",
        UI.theater
      );

      results.location = await wf.ask(
        "Do you prefer watching movies at home or in a theater?",
        UI.location
      );

      results.why = await wf.ask("Why?", UI.locationWhy);

      results.factor = await wf.ask(
        "What is the most important factor when choosing a movie to watch?",
        UI.factor
      );

      if (results.factor === "Other")
        results.factor = await wf.ask(
          "What is the crucial factor in choosing a movie?",
          UI.crucialFactor
        );

      results.actor = await wf.ask(
        "Who is your favorite actor or actress?",
        UI.actor
      );

      results.fanCrush = await wf.ask("Do you have a fan crush?", UI.fanCrush);

      results.discover = await wf.ask(
        "How do you usually find out about new movies?",
        UI.news
      );

      results.news = await wf.ask(
        "Do you prefer watching movies alone or with others?",
        UI.social
      );

      results.streaming = await wf.ask(
        "Which streaming services to you prefer for movies?",
        UI.streaming
      );

      results.reviewImportance = await wf.ask(
        "How important are movie reviews to you when deciding what to watch?",
        UI.importance
      );

      await wf.text("Results coming up....");

      await wf.show(results, UI.results);
    }
  }
);
