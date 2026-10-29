const DEFAULT_ERROR = 'Oops internal error! Try to refresh page or feel free contact us if issue persists.';

/** Server errors carry a readable message (a driver's "unable to connect to data source: …"); show it as is. */
export function toErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : DEFAULT_ERROR;
}
