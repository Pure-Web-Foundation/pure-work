import { html, LitElement } from "lit";
import { FlowOptions } from "./flow/index";
import { UI as baseUI } from "./flow/ui";
import { repeat } from "lit/directives/repeat.js";

const UI = {
  ...baseUI,
  lover: {
    ...baseUI.selectOne,
    items: ["Not at all", "A bit", "Sure", "Love them!"],
    id: "movie-lover",
  },
  location: {
    ...baseUI.selectOne,
    items: ["At home", "In a theater", "No difference"],
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
  },
  factor: {
    ...baseUI.selectOne,
    items: ["Genre", "Director", "Reviews", "Other"],
  },
  social: {
    ...baseUI.selectOne,
    items: ["Alone", "With my partner", "In a group"],
  },
  importance: {
    ...baseUI.selectOne,
    items: ["Not important at all", "Somewhat important", "Very important"],
  },
  news: {
    ...baseUI.selectOne,
    items: ["Trailers", "Reviews", "Social Media", "Friends", "Other"],
  },
  streaming: {
    ...baseUI.selectMany,
    items: ["Netflix", "Hulu", "Amazon Prime", "HBO Max", "Disney+", "Other"],
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
  },
  results: {
    wait: 6000,
    show: (step) => {
      const items = Object.entries(results);

      return html`
        <section>
          <dl class="key-value">
            ${repeat(items, ([key, value]) => {
              return html`<dt>${key}</dt>
                <dd>${value}</dd>`;
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
    createRenderRoot() {
      return this;
    }

    static properties = {
      load: { type: Object },
    };

    render() {
      if (!this.load)
        return html`<button @click=${this.start}>Start survey</button>`;

      if (this.load)
        return html`
          <flow-ui type="full-page" .options=${this.load}></flow-ui>
        `;
    }

    start() {
      this.load = this.movieSurveyFlow;
    }

    get movieSurveyFlow() {
      return new FlowOptions(
        "movieSurvey",
        this.movieSurvey.bind(this),
        (flow) => {
          this.flow = flow;

          // custom action
          this.flow.install("text", this.text.bind(this));

          flow.on("flow-ended", (e) => {
            this.load = null;
          });
        }
      );
    }

    text(step) {
      step.render = () => html`${step.topic}`;

      step.on("continue-request", (e) => {
        e.continue();
      });

      setTimeout(() => {
        step.resolve();
      }, step.options.timeout ?? 3000);
    }

    async movieSurvey(wf) {
      const results = {};

      await wf.text("Welcome to this survey!");

      results.movieLover = await wf.ask("Are you a movie lover?", UI.lover);

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

      results.why = await wf.ask("Why?", UI.longtext);

      results.factor = await wf.ask(
        "What is the most important factor when choosing a movie to watch?",
        UI.factor
      );

      results.actor = await wf.ask(
        "Who is your favorite actor or actress?",
        UI.text
      );

      results.best = await wf.ask(
        "What is your favorite movie of all time?",
        UI.text
      );

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

      await wf.show(`Results`, UI.results);

      await wf.end();
    }
  }
);
