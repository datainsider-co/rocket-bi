import { isRouteErrorResponse } from 'react-router';

export type ErrorPageStatus = '403' | '404' | '500';

export interface ErrorPageContent {
  status: ErrorPageStatus;
  title: string;
  description: string;
  /** Technical detail for developers; shown only in dev builds. */
  detail?: string | undefined;
}

export const NOT_FOUND: ErrorPageContent = {
  status: '404',
  title: 'Page not found',
  description: 'The page you are looking for does not exist or was moved.'
};

const FORBIDDEN: ErrorPageContent = {
  status: '403',
  title: 'Access denied',
  description: 'You do not have permission to view this page.'
};

const UNEXPECTED: ErrorPageContent = {
  status: '500',
  title: 'Something went wrong',
  description: 'An unexpected error happened. Try again, or contact us if it keeps happening.'
};

function detailOf(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack ?? `${error.name}: ${error.message}`;
  if (typeof error === 'string') return error;
  return undefined;
}

/** Maps whatever a route threw (a `Response` from a loader, or a render error) to what the error page shows. */
export function toErrorPageContent(error: unknown): ErrorPageContent {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return NOT_FOUND;
    if (error.status === 403 || error.status === 401) return FORBIDDEN;
    return { ...UNEXPECTED, detail: `${error.status} ${error.statusText}`.trim() };
  }
  return { ...UNEXPECTED, detail: detailOf(error) };
}
