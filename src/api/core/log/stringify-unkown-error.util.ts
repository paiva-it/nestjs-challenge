export function stringifyUnknownError(error: unknown): string {
  if (!error) {
    return String(error);
  }
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}
