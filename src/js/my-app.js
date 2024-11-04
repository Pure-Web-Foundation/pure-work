import { html, LitElement } from "lit";
import { FlowOptions } from "./flow/index";
import { UI as baseUI } from "./flow/ui";
import { repeat } from "lit/directives/repeat.js";

const UI = {
  ...baseUI,
  lover: {
    ...baseUI.selectOne,
    items: ["Not at all", "A bit", "Sure", "Love them!"],
  },
  location: {
    ...baseUI.selectOne,
    items: ["At home", "In a theater", "No difference"],
  },
  theaterFrequency: {
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
  streamingServices: {
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
};

customElements.define(
  "my-app",
  class MyApp extends LitElement {
    static get properties() {
      return {
        load: { type: Object },
        flowType: { type: String },
      };
    }

    createRenderRoot() {
      return this;
    }

    render() {
      return html`
        <flow-ui type="full-page" .options=${this.movieSurveyFlow}></flow-ui>
      `;
    }

    get movieSurveyFlow() {
      return new FlowOptions(
        "movieSurvey",
        this.movieSurvey.bind(this),
        (flow) => {
          this.flowType = "full-page";
          this.flow = flow;

          flow.on("flow-ended", (e) => {
            this.load = null;
          });
        }
      );
    }

    async movieSurvey(wf) {
      const results = {};

      results.movieLover = await wf.ask("Are you a movie lover?", UI.lover);

      results.genres = await wf.ask(
        "What is your favorite movie genre?",
        UI.genres
      );

      results.theater = await wf.ask(
        "How often do you watch movies in a theater?",
        UI.theaterFrequency
      );

      results.location = await wf.ask(
        "Do you prefer watching movies at home or in a theater?",
        UI.location
      );

      results.locationWhy = await wf.ask("Why?", UI.longtext);

      results.factor = await wf.ask(
        "What is the most important factor when choosing a movie to watch?",
        UI.factor
      );

      results.actor = await wf.ask(
        "Who is your favorite actor or actress?",
        UI.text
      );

      results.top1 = await wf.ask(
        "What is your favorite movie of all time?",
        UI.text
      );

      results.news = await wf.ask(
        "How do you usually find out about new movies?",
        UI.news
      );

      results.news = await wf.ask(
        "Do you prefer watching movies alone or with others?",
        UI.social
      );

      results.news = await wf.ask(
        "Which streaming services to you prefer for movies?",
        UI.streamingServices
      );

      results.news = await wf.ask(
        "How important are movie reviews to you when deciding what to watch?",
        UI.importance
      );

      await wf.show(`Results`, {
        wait: 3000,
        show: (step) => {
          const items = Object.entries(results);

          return html`<dl>
            ${repeat(items, ([key, value]) => {
              return html`<dt>${key}</dt>
                <dd>${value}</dd>`;
            })}
          </dl>`;
        },
      });

      await wf.end();
    }
  }
);
