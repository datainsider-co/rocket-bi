import { describe, expect, it } from 'vitest';
import type { LoaderFunctionArgs } from 'react-router';
import { redirectIfLoggedIn, requireSession } from './routeGuards';

function loaderArgs(url: string): LoaderFunctionArgs {
  return { request: new Request(url), params: {}, context: undefined } as unknown as LoaderFunctionArgs;
}

describe('requireSession', () => {
  it('lets the page load with a session', () => {
    expect(requireSession(loaderArgs('http://app.test/dashboard'), () => true)).toBeNull();
  });

  it('redirects to login with the current path', () => {
    const response = requireSession(loaderArgs('http://app.test/dashboard/1?tab=a'), () => false);

    expect(response?.status).toBe(302);
    expect(response?.headers.get('Location')).toBe('/login?redirect=%2Fdashboard%2F1%3Ftab%3Da');
  });

  it('redirects to plain /login from the home page', () => {
    expect(requireSession(loaderArgs('http://app.test/'), () => false)?.headers.get('Location')).toBe('/login');
  });
});

describe('redirectIfLoggedIn', () => {
  it('sends a logged-in user home', () => {
    expect(redirectIfLoggedIn(() => true)?.headers.get('Location')).toBe('/');
  });

  it('shows the page without a session', () => {
    expect(redirectIfLoggedIn(() => false)).toBeNull();
  });
});
