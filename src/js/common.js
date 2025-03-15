/**
 * Animates an element into view async and returns when the enimation has completed
 * @param {HTMLElement} element
 * @param {Object} options use passive: true to prevent actual scrolling but still wait for element to be in view
 */
export async function scrollIntoView(element, options = {}) {
  return new Promise((resolve) => {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            resolve();
          }, 500);
          observer.disconnect();
        }
      });
    });
    observer.observe(element);
    if(!options?.passive)
      element.scrollIntoView({ behavior: "smooth" });
  });
}

/**
 * Mixin for event shortcuts on(), off(), fire()
 * @template T
 * @param {T} superclass
 * @returns {T}
 */
export function EventTargetMixin(superclass) {
  return class extends superclass {
    /**
     * Dispatch app-level event
     * @param {String} eventName
     * @param {Object} detail Optional details to pass along with event
     */
    fire(eventName, detail = {}) {
      const ev = new CustomEvent(eventName, {
        detail: detail || {},
        cancelable: true
      });
      this.dispatchEvent(ev);
      return ev;
    }

    /**
     * Listen for app-level event
     * @param {String} eventName
     * @param {Function} func
     */
    on(eventName, func) {
      this.addEventListener(eventName, func);
      return this;
    }

    /**
     * Stop listening to app-level event
     * @param {String} eventName
     * @param {Function} func
     */
    off(eventName, func) {
      this.removeEventListener(eventName, func);
      return this;
    }
  };
}

// clones an object and takes only 'simple' properties.
export function takeSimpleProperties(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(takeSimpleProperties);
  }

  const clonedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (
        typeof value === "number" ||
        typeof value === "string" ||
        typeof value === "boolean"
      ) {
        clonedObj[key] = value;
      } else if (typeof value === "object" && value !== null) {
        clonedObj[key] = takeSimpleProperties(value);
      }
    }
  }
  return clonedObj;
}

/**
 * Wraps a promise in a new promise that adds a timeout to the promise execution.
 * @param {Promise} promise
 * @param {Number} timeout
 * @returns { Promise }
 */
export function withTimeout(promise, timeout) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => {
        reject(new TimeoutError("Timeout"));
      }, timeout)
    ),
  ]);
}


export function parseBoolean(value) {
  switch (typeof value) {
    case "boolean":
      return value;
    case "string":
      return ["true", "false"].includes(value.toLowerCase());
    case "number":
      return value !== 0;
    default:
      return false;
  }
}

export class TimeoutError extends Error {}

/**
 * Generates a hash that uniquely identifies a string
 * @param {String} str
 * @param {Number} seed
 * @returns {String }
 */
export function generateHash(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hashNr = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  const radix = 16;
  return `h${hashNr.toString(radix)}`;
}
