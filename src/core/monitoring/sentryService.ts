// Sentry integration - TODO: Enable when DSN is configured
// import * as Sentry from 'sentry-expo';

// Sentry.init({
//   dsn: process.env.SENTRY_DSN || 'https://placeholder@placeholder.ingest.sentry.io/0',
//   enableInExpoDevelopment: true,
//   debug: process.env.NODE_ENV === 'development',
// });

// export const captureError = (error: Error, context?: Record<string, unknown>) => {
//   Sentry.captureException(error, {
//     extra: context,
//     tags: {
//       source: 'application',
//     },
//   });
// };

// export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
//   Sentry.captureMessage(message, level);
// };

// export const setUserContext = (userId: string, email?: string) => {
//   Sentry.setUser({
//     id: userId,
//     email,
//   });
// };

// export const clearUserContext = () => {
//   Sentry.setUser(null);
// };

// export const addBreadcrumb = (category: string, message: string, data?: Record<string, unknown>) => {
//   Sentry.addBreadcrumb({
//     category,
//     message,
//     data,
//     level: 'info',
//   });
// };

// export default Sentry;

export const captureError = (_error: Error, _context?: Record<string, unknown>) => {
  // TODO: Enable when Sentry DSN is configured
};

export const captureMessage = (_message: string, _level?: string) => {
  // TODO: Enable when Sentry DSN is configured
};

export const setUserContext = (_userId: string, _email?: string) => {
  // TODO: Enable when Sentry DSN is configured
};

export const clearUserContext = () => {
  // TODO: Enable when Sentry DSN is configured
};

export const addBreadcrumb = (_category: string, _message: string, _data?: Record<string, unknown>) => {
  // TODO: Enable when Sentry DSN is configured
};