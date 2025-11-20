/**
 * Log levels for the MCP server
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

/**
 * Check if debug logging is enabled via environment variable
 */
function isDebugEnabled(): boolean {
  return process.env.DEBUG === "true" || process.env.DEBUG === "1";
}

/**
 * Get the minimum log level from environment variable
 * Defaults to INFO if DEBUG is not enabled, or DEBUG if enabled
 */
function getMinLogLevel(): LogLevel {
  if (isDebugEnabled()) {
    return LogLevel.DEBUG;
  }
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  if (envLevel && envLevel in LogLevel) {
    return LogLevel[envLevel as keyof typeof LogLevel];
  }
  return LogLevel.INFO;
}

/**
 * Check if a log level should be logged based on the minimum log level
 */
function shouldLog(level: LogLevel): boolean {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const minLevel = getMinLogLevel();
  const currentLevelIndex = levels.indexOf(level);
  const minLevelIndex = levels.indexOf(minLevel);
  return currentLevelIndex >= minLevelIndex;
}

/**
 * Format a log message with level prefix and timestamp
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  ...rest: unknown[]
): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;

  // Remove emoji and color codes if NO_COLOR is set
  if (process.env.NO_COLOR) {
    message = message
      .replace(/✅/g, "SUCCESS:")
      .replace(/❌/g, "ERROR:")
      .replace(/ℹ️/g, "INFO:")
      .replace(/\u2139\ufe0f/g, "INFO:");
  }

  // Format additional arguments
  const formattedRest = rest
    .map((arg) => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      }
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");

  return formattedRest
    ? `${prefix} ${message} ${formattedRest}`
    : `${prefix} ${message}`;
}

/**
 * Log a debug message (only when DEBUG=true or LOG_LEVEL=DEBUG)
 */
export function debug(message: string, ...rest: unknown[]): void {
  if (shouldLog(LogLevel.DEBUG)) {
    console.error(formatLogMessage(LogLevel.DEBUG, message, ...rest));
  }
}

/**
 * Log an info message
 */
export function info(message: string, ...rest: unknown[]): void {
  if (shouldLog(LogLevel.INFO)) {
    console.error(formatLogMessage(LogLevel.INFO, message, ...rest));
  }
}

/**
 * Log a warning message
 */
export function warn(message: string, ...rest: unknown[]): void {
  if (shouldLog(LogLevel.WARN)) {
    console.error(formatLogMessage(LogLevel.WARN, message, ...rest));
  }
}

/**
 * Log an error message
 */
export function error(message: string, ...rest: unknown[]): void {
  if (shouldLog(LogLevel.ERROR)) {
    console.error(formatLogMessage(LogLevel.ERROR, message, ...rest));
  }
}

/**
 * Legacy log function for backward compatibility
 * Routes to info level
 */
export function log(message: string, ...rest: unknown[]): void {
  info(message, ...rest);
}
