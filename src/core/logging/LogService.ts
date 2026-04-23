/**
 * LogService for structured error logging.
 * 
 * Currently logs to console. 
 * Can be extended to integrate with Sentry, LogRocket, etc.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
};

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class LogService {
  private minLevel: LogLevel = 'info';

  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const error = entry.error ? ` ${entry.error.message}` : '';
    return `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${context}${error}`;
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatEntry({ level: 'debug', message, timestamp: new Date(), context }));
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog('info')) {
      console.info(this.formatEntry({ level: 'info', message, timestamp: new Date(), context }));
    }
  }

  warn(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatEntry({ level: 'warn', message, timestamp: new Date(), context }));
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    if (this.shouldLog('error')) {
      console.error(this.formatEntry({ level: 'error', message, timestamp: new Date(), context, error }));
    }
  }

  logError(error: Error, context?: Record<string, unknown>) {
    this.error(error.message, error, context);
  }
}

export const logService = new LogService();