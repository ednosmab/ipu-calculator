export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  error?: Error;
  timestamp: number;
  context?: Record<string, unknown>;
}

type LogHandler = (entry: LogEntry) => void;

class LogService {
  private handlers: LogHandler[] = [];

  addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  removeHandler(handler: LogHandler): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  private log(level: LogLevel, message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      error,
      timestamp: Date.now(),
      context,
    };

    this.handlers.forEach(handler => {
      try {
        handler(entry);
      } catch (err) {
        console.error('LogService handler error:', err);
      }
    });

    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    if (level === 'error') {
      console.error(`${prefix} [${level.toUpperCase()}] ${message}`, error, context);
    } else if (level === 'warn') {
      console.warn(`${prefix} [${level.toUpperCase()}] ${message}`, context);
    } else {
      console.log(`${prefix} [${level.toUpperCase()}] ${message}`, context);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, undefined, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, undefined, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, error, context);
  }
}

export const logService = new LogService();