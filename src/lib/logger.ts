type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  component?: string;
  durationMs?: number;
  error?: unknown;
  metadata?: Record<string, unknown>;
}

const isBrowser = typeof window !== 'undefined';

function getTimestamp(): string {
  return new Date().toISOString();
}

function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  const extra: string[] = [];
  if (entry.requestId) extra.push(`reqId=${entry.requestId}`);
  if (entry.userId) extra.push(`userId=${entry.userId}`);
  if (entry.component) extra.push(`component=${entry.component}`);
  if (entry.durationMs !== undefined) extra.push(`duration=${entry.durationMs}ms`);
  return extra.length > 0 ? `${base} ${extra.join(' ')}` : base;
}

export const logger = {
  info(message: string, meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>) {
    const entry: LogEntry = { level: 'info', message, timestamp: getTimestamp(), ...meta };
    if (isBrowser && process.env.NODE_ENV !== 'production') {
      console.info(formatLog(entry));
    } else if (!isBrowser) {
      console.log(JSON.stringify(entry));
    }
  },

  warn(message: string, meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>) {
    const entry: LogEntry = { level: 'warn', message, timestamp: getTimestamp(), ...meta };
    if (isBrowser) {
      console.warn(formatLog(entry));
    } else {
      console.warn(JSON.stringify(entry));
    }
  },

  error(message: string, meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>) {
    const entry: LogEntry = { level: 'error', message, timestamp: getTimestamp(), ...meta };
    if (isBrowser) {
      console.error(formatLog(entry), meta?.error ?? '');
    } else {
      console.error(JSON.stringify(entry));
    }
  },

  debug(message: string, meta?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>) {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = { level: 'debug', message, timestamp: getTimestamp(), ...meta };
      if (isBrowser) {
        console.debug(formatLog(entry));
      } else {
        console.debug(JSON.stringify(entry));
      }
    }
  },
};
