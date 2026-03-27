import { MOCK_MODE } from '../constants';

// ============================================================
// LOGGER UTILITY
// In production, this would integrate with a crash reporting
// service like Sentry or Firebase Crashlytics
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

const isDev = __DEV__ || MOCK_MODE;

class AppLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;

  debug(message: string, data?: unknown): void {
    if (!isDev) return;
    this.log('debug', message, data);
    console.debug(`[DEBUG] ${message}`, data ?? '');
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
    if (isDev) console.info(`[INFO] ${message}`, data ?? '');
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
    console.warn(`[WARN] ${message}`, data ?? '');
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
    console.error(`[ERROR] ${message}`, data ?? '');
    // In production: Sentry.captureException(data)
  }

  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(entry);

    // Keep log buffer from growing indefinitely
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
}

export const Logger = new AppLogger();
