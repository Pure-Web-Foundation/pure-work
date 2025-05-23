import { html, LitElement } from "lit";
import { FlowOptions } from "./flow/options";
import { repeat } from "lit/directives/repeat.js";
import { UI as baseUI } from "./flow/ui";
import { Broker } from "./broker/index";
import { ApiRequest } from "./api/index";

const UI = {
  ...baseUI,
  lover: {
    ...baseUI.selectOne,
    id: "movieLover",
    items: ["Not at all", "A bit", "Sure", "Love them!"],
    store: "lover",
    activate: async (step, element) => {},
  },
  location: {
    ...baseUI.selectOne,
    items: ["At home", "In a theater", "No difference"],
    store: "location",
  },
  locationWhy: {
    ...baseUI.longtext,
    class: "c-why",
    store: "locationWhy",
  },
  movieDetail: {
    ...baseUI.longtext,
    class: "c-m-details",
    store: "movieDetails",
    label: "",

    renderInput: (step) => {
      const movie = step.topic;
      return html` <div>
        <p>
          ${movie.director.name}'s <b>${movie.title}</b> (${movie.year}), with
          ${movie.starring.join(", ")}, has a score of
          <em>${movie.vote_average}</em>!
        </p>
      </div>`;
    },
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
  chatBox: {
    ...baseUI.longtext,
    class: "chat-box",
    stepClass: "actor-user",
  },
};

customElements.define(
  "movies-flow",
  class MoviesFlow extends LitElement {
    constructor() {
      super();
      const me = this;

      const movie = {
        lover: "Love them!",
        location: "In a theater",
        actor: "Jodie Foster",
        favorite: "One Flew",
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
          if (data.isModified) {
            movie[data.key] = data.value;
          }
        });
    }

    // returns options for a workflow
    get options() {
      const options = new FlowOptions(
        "movieSurvey",
        this.movieSurvey.bind(this),
        (flow) => {
          this.flow = flow;

          flow.install("lookup", this.lookupAction.bind(this), {
            backTarget: false, // skip this step when going back.
          });

          // custom action
          this.flow.install("text", this.text.bind(this));

          flow
            .on("flow-ended", (e) => {
              //this.load = null;
              location.href = `/`;
            })
            .on("step-ui-rendered", (e) => {
              // work with rendered ui
            })
            .on("before-back", async (e) => {
              const result = e.detail.step.id !== "movieLover";
              e.waitFor(result);
            });
        }
      );

      options.useNavigation = true;
      options.useBroker = true; // use Broker (pub-sub singleton message bus)
      options.strings.continue = "Next";
      return options;
    }

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
      const results = {};

      await wf.text("Welcome to the movie survey!", {
        backTarget: false,
      });

      results.movieLover = await wf.ask("Are you a movie lover?", UI.lover);

      results.best = await wf.ask(
        "What is your favorite movie of all time?",
        UI.favorite
      );

      results.movieDetails = await wf.lookup(results.best);

      if (results.movieDetails)
        await wf.ui(results.movieDetails, UI.movieDetail);
      else await wf.ui("No movies found", { type: "hidden" });

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
        {
          ...UI.importance,
          strings: {
            continue: "Finish!",
          },
        }
      );

      await wf.text("Results coming up....");

      await wf.show(results, UI.results);
    }

    async lookupAction(step) {
      const request = {
        headers: {
          accept: "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMDY5Zjc5MjZmZDI0Y2NkNmI0YmVhODJjMjRhOTE3YSIsInN1YiI6IjY1YTEwNGE0ZjA0ZDAxMDEyMjc5MTI0MiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.YeIAk8TWtLgEVUcl24e_FZ4owWJqiFzzZlwi5KAhkxM",
        },
      };
      const api = ApiRequest.factory({
        baseUrl: "https://api.themoviedb.org/3/",
      });

      const params = new URLSearchParams();
      params.append("query", step.topic);

      const result = await api.getData(`search/movie?${params.toString()}`, {
        ...request,
      });

      const id = result.results[0]?.id;

      if (!id) {
        step.resolve(null);
      } else {
        const movie = await api.getData(
          `movie/${id}?append_to_response=credits`,
          {
            ...request,
          }
        );

        movie.year = new Date(movie.release_date).getFullYear();

        movie.director =
          movie.credits.crew.find(
            (x) => x.known_for_department === "Directing"
          ) ?? "Unknown director";
        movie.starring = movie.credits.cast
          .filter((x) => x.known_for_department === "Acting")
          .slice(0, 3)
          .map((x) => x.name);

        movie.toString = function () {
          return `${this.title} (${this.director.name}, ${
            movie.year
          } - with ${this.starring.join(", ")})`;
        };

        step.resolve(movie);
      }
    }
  }
);
