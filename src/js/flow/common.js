export const FlowStepState = Object.freeze({
  Unknown: "unknown",
  Initialized: "initialized",
  Started: "started",
  Running: "running",
  Completing: "completing",
  Completed: "completed",
  Replayed: "replayed",
});

/**
 * Animates an element into view async and returns when the enimation has completed
 * @param {HTMLElement} element
 */
export async function scrollIntoView(element) {
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
      this.dispatchEvent(
        new CustomEvent(eventName, {
          detail: detail || {},
        })
      );
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

/**
 * Gets an object with padded string parts for a date.
 * @param {Date} date
 * @returns { Object } {year: yyyy, month: mm, day: dd}
 */
export function getDateStringParts(date) {
  if (!(date instanceof Date)) date = new Date(Date.parse(date));

  if (isNaN(date)) throw new TypeError("Invalid date");

  return {
    year: date.getFullYear(),
    month: padNumber(date.getMonth() + 1, 2),
    day: padNumber(date.getDate(), 2),
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

export function padNumber(num, length) {
  let numStr = num.toString();
  numStr = numStr.replace(".", "");
  let diff = length - numStr.length;
  if (diff > 0) return "0".repeat(diff) + numStr;

  return numStr;
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

export class TimeoutError extends Error {}
