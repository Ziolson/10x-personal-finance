/**
 * Simple logger utility to replace direct console calls.
 * This allows for better control over logging in different environments
 * and helps avoid linter errors.
 */
const logger = {
  info: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.log(...args);
  },
  warn: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(...args);
  },
  debug: (...args: unknown[]) => {
    // Check if we are in a dev environment safely (handling both Vite and potentially Node if needed)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isDev = typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.DEV;

    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  },
};

export default logger;
