const isDev = (typeof __DEV__ !== 'undefined' && __DEV__) || (typeof window !== 'undefined');

export const logger = {
  info(message: string, ...args: unknown[]): void {
    if (isDev) console.log(message, ...args);
  },

  warn(message: string, ...args: unknown[]): void {
    if (isDev) console.warn(message, ...args);
  },

  error(message: string, ...args: unknown[]): void {
    if (isDev) console.error(message, ...args);
  },
};