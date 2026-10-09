type Level = 'debug' | 'info' | 'warn' | 'error';

function log(level: Level, message: string, context?: Record<string, unknown>): void {
  if (__DEV__) {
    const prefix = `[ResilienceSOS][${level.toUpperCase()}]`;
    if (context) {
      console[level === 'debug' ? 'log' : level](`${prefix} ${message}`, context);
    } else {
      console[level === 'debug' ? 'log' : level](`${prefix} ${message}`);
    }
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => log('info',  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => log('warn',  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
};
