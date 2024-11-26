class Cache {
  #cache;

  constructor() {
    this.#cache = new Map();
  }

  // Method to get data from cache or fetch if not available or expired
  async get(path, fetchFunction, duration) {
    const now = Date.now();
    const cached = this.#cache.get(path);

    if (cached && now - cached.timestamp < duration) {
      console.log("Took cache for fetch", path);
      return cached.data;
    }

    const data = await fetchFunction();
    this.#cache.set(path, { data, timestamp: now });
    return data;
  }

  // Method to clear the cache
  clear() {
    this.#cache.clear();
  }
}

/**
 * Encapsulates fetch() functionality
 * @event beforeRequest dispatched before fetching
 * @event afterResponse dispatched when response is fetched, but before returning the results.
 */
export class ApiRequest extends EventTarget {
  #controller;
  #cache = new Cache();
  static jwt = null;

  constructor(baseUrl, defaultHeaders = {}) {
    super();
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  static factory(
    config = {
      baseUrl: null,
    }
  ) {
    return new this(config.baseUrl);
  }

  async #execute(localUrl, options = {}) {
    if (
      this.#controller &&
      options?.abortPrevious &&
      !this.#controller?.signal.aborted
    ) {
      this.#controller.abort("New incoming request");
    }

    if (options.signal && !options.signal.aborted) {
      console.log("Signal abort");
      options.signal.abort("Abort existing");
    }

    this.#controller = new AbortController();

    if (ApiRequest.jwt) {
      if (!options.headers) {
        options.headers = {};
      }
      options.headers["Authorization"] = `Bearer ${ApiRequest.jwt}`;
    }

    const signal = this.#controller.signal;

    const mergedOptions = {
      method: "GET",
      signal: signal,
      ...options,
      headers: { ...this.defaultHeaders, ...options.headers },
    };

    const url = `${this.baseUrl}${localUrl}`;

    this.#dispatch("beforeRequest", {
      request: {
        url: url,
        options: mergedOptions,
      },
    });

    const response = await fetch(url, mergedOptions);

    this.#dispatch("afterResponse", {
      request: {
        url: url,
        options: mergedOptions,
      },
      response: response,
    });

    if (!response.ok) {
      const error = new Error(`HTTP error! Status: ${response.status}`);
      error.response = response;
      try {
        error.errorData = await response.json();
      } catch {
        // ignore
      }
      // noinspection ExceptionCaughtLocallyJS
      throw error;
    }
    return await response.json();
  }

  #dispatch(eventName, data) {
    return this.dispatchEvent(
      new CustomEvent(eventName, {
        detail: data,
      })
    );
  }

  on(eventName, func) {
    this.addEventListener(eventName, func);
    return this;
  }

  /**
   * GET data resource.
   * @param {string} url Path
   * @param {any} options Any options given to the request method
   * @returns any
   */
  async getData(url, options = {}) {
    if (options?.cache?.duration) {
      const duration = options?.cache?.duration;
      delete options.cache;
      return this.#cache.get(
        url,
        () =>
          this.#execute(url, {
            ...options,
            method: "GET",
          }),
        duration
      );
    }

    return await this.#execute(url, {
      ...options,
      method: "GET",
    });
  }

  async postData(url, data = {}, options = {}) {
    return this.#execute(url, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async putData(url, data, options = {}) {
    return this.#execute(url, {
      ...options,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  /**
   *
   * @param {string} method
   * @param {string} url
   * @param {FormData} data
   * @param options
   * @returns {Promise<any|undefined>}
   */
  async uploadFile(method, url, data, options = {}) {
    return this.#execute(url, {
      ...options,
      method,
      headers: { Accept: "application/json" },
      body: data,
    });
  }

  async patchData(url, data, options = {}) {
    return this.#execute(url, {
      ...options,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async deleteData(url, data = {}, options = {}) {
    return this.#execute(url, {
      ...options,
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
}
