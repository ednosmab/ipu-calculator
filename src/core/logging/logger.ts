const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

// Always log in browser for debugging
const shouldLog = isDev || (typeof window !== 'undefined' && !window.location.hostname.includes('vercel'));

export const logger = {
  info(message: string, ...args: unknown[]): void {
    if (shouldLog) console.log(message, ...args);
  },

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog) console.warn(message, ...args);
  },

  error(message: string, ...args: unknown[]): void {
    if (shouldLog) console.error(message, ...args);
  },
};