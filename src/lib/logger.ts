type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  action?: string;
}

class Logger {
  private log(level: LogLevel, message: string, data?: any, userId?: string, action?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userId,
      action
    };

    // In development, log to console
    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify(entry, null, 2));
      return;
    }

    // In production, you would send to your logging service
    // Example with Vercel's built-in logging:
    console.log(JSON.stringify(entry));
    
    // If using a service like Sentry:
    // Sentry.captureMessage(message, {
    //   level,
    //   extra: { ...entry }
    // });
  }

  info(message: string, data?: any, userId?: string, action?: string) {
    this.log('info', message, data, userId, action);
  }

  warn(message: string, data?: any, userId?: string, action?: string) {
    this.log('warn', message, data, userId, action);
  }

  error(message: string, data?: any, userId?: string, action?: string) {
    this.log('error', message, data, userId, action);
  }

  debug(message: string, data?: any, userId?: string, action?: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, data, userId, action);
    }
  }
}

export const logger = new Logger(); 