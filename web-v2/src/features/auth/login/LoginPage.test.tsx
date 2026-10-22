import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthenticationService } from '@/core/auth/AuthenticationService';
import { LoginResponse } from '@/core/auth/LoginResponse';
import { clearSession, getSession } from '@/core/session/session';
import { ApiError } from '@/shared/http/ApiError';
import { fakeAuthenticationService, renderAppAt } from '../testing';

const LOGGED_IN = new LoginResponse({
  session: { value: 'session-1', max_age: 60 },
  user_profile: { username: 'root', full_name: 'Root User' }
});

function fakeService(overrides: Partial<AuthenticationService> = {}) {
  return fakeAuthenticationService(overrides, LOGGED_IN);
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Login' }));
}

describe('login page', () => {
  afterEach(() => clearSession());

  it('shows login when opening a protected page without a session', async () => {
    const router = renderAppAt('/', fakeService());

    expect(await screen.findByRole('heading', { name: 'Welcome to RocketBI' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('logs in, saves the session and goes to the redirect target', async () => {
    const service = fakeService();
    const router = renderAppAt('/login?redirect=%2Fmydata%3Ftab%3Da', service);

    await fillAndSubmit('hello@gmail.com', '123456');

    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    expect(await screen.findByText('Root User')).toBeInTheDocument();
    expect(service.login).toHaveBeenCalledWith('hello@gmail.com', '123456');
    expect(getSession()).toBe('session-1');
    expect(router.state.location.pathname).toBe('/mydata');
    expect(router.state.location.search).toBe('?tab=a');
    // The login response seeds the current user, so the app shell needs no check_session call.
    expect(service.checkSession).not.toHaveBeenCalled();
  });

  it('shows wrong credentials for the 500 the server sends on a bad password', async () => {
    const login = vi.fn<AuthenticationService['login']>(async () =>
      Promise.reject(new ApiError('did not match', 500, 'internal_error'))
    );
    renderAppAt('/login', fakeService({ login }));

    await fillAndSubmit('hello@gmail.com', 'wrong');

    expect(await screen.findByText('Incorrect email or password')).toBeInTheDocument();
    expect(getSession()).toBeUndefined();
  });

  it('validates the form before calling the server', async () => {
    const service = fakeService();
    renderAppAt('/login', service);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Email is required!')).toBeInTheDocument();
    expect(screen.getByText('Password is required!')).toBeInTheDocument();
    expect(service.login).not.toHaveBeenCalled();
  });
});
