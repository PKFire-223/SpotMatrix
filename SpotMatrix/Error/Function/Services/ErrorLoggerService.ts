export interface ErrorLogEntry {
  logId: string;
  timestampIso: string;
  errorCode: string;
  errorMessage: string;
  requestPath: string;
}

const recentErrorLogs: ErrorLogEntry[] = [];

export function recordSystemError(
  errorCode: string,
  errorMessage: string,
  requestPath: string
): ErrorLogEntry {
  const newEntry: ErrorLogEntry = {
    logId: `ERR-${Date.now()}`,
    timestampIso: new Date().toISOString(),
    errorCode,
    errorMessage,
    requestPath,
  };
  recentErrorLogs.unshift(newEntry);
  if (recentErrorLogs.length > 50) {
    recentErrorLogs.pop();
  }
  return newEntry;
}

export function getRecentErrorLogs(): ErrorLogEntry[] {
  return recentErrorLogs;
}
