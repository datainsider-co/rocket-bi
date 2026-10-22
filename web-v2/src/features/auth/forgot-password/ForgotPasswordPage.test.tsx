import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthenticationService } from '@/core/auth/AuthenticationService';
import { ApiError } from '@/shared/http/ApiError';
import { fakeAuthenticationService as fakeService, renderAppAt } from '../testing';

function renderPage(service: AuthenticationService) {
  return renderAppAt('/forgot-password', service);
}

async function sendCode(user: ReturnType<typeof userEvent.setup>, email: string) {
  await user.type(await screen.findByLabelText('Email'), email);
  await user.click(screen.getByRole('button', { name: 'Send Code' }));
}

async function typeCode(user: ReturnType<typeof userEvent.setup>, code: string) {
  const [first] = await screen.findAllByRole('textbox');
  if (!first) throw new Error('no OTP input');
  await user.click(first);
  await user.keyboard(code);
}

describe('forgot password page', () => {
  it('sends a code, checks it, sets a new password and returns to login', async () => {
    const user = userEvent.setup();
    const service = fakeService();
    const router = renderPage(service);

    await sendCode(user, 'hello@gmail.com');
    expect(await screen.findByText('Code sent to email: hello@gmail.com')).toBeInTheDocument();
    expect(service.forgotPassword).toHaveBeenCalledWith('hello@gmail.com');
    expect(screen.getByText(/Resend code after \d+ seconds/)).toBeInTheDocument();

    await typeCode(user, '123456');
    expect(await screen.findByRole('heading', { name: 'Create a new password' })).toBeInTheDocument();
    expect(service.verifyCode).toHaveBeenCalledWith('hello@gmail.com', '123456');

    await user.type(screen.getByLabelText('New Password'), 'newpass');
    await user.type(screen.getByLabelText('Confirm Password'), 'newpass');
    await user.click(screen.getByRole('button', { name: 'Completed' }));

    expect(await screen.findByRole('heading', { name: 'Welcome to RocketBI' })).toBeInTheDocument();
    expect(service.resetPassword).toHaveBeenCalledWith({
      email: 'hello@gmail.com',
      newPassword: 'newpass',
      verifyCode: '123456'
    });
    expect(router.state.location.pathname).toBe('/login');
  });

  it('shows why an unknown email was rejected', async () => {
    const user = userEvent.setup();
    renderPage(
      fakeService({
        forgotPassword: vi.fn<AuthenticationService['forgotPassword']>(async () => Promise.reject(new ApiError('Email Not Exists', 400, 'email_not_existed')))
      })
    );

    await sendCode(user, 'nobody@x.com');

    expect(await screen.findByText('This email not existed. Please try again.')).toBeInTheDocument();
  });

  it('stays on the code step for a wrong code', async () => {
    const user = userEvent.setup();
    renderPage(
      fakeService({
        verifyCode: vi.fn<AuthenticationService['verifyCode']>(async () =>
          Promise.reject(new ApiError('No code was found.', 400, 'verification_code_invalid'))
        )
      })
    );

    await sendCode(user, 'hello@gmail.com');
    await typeCode(user, '000000');

    expect(await screen.findByText('The code is invalid. Please check it again.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Create a new password' })).not.toBeInTheDocument();
  });

  it('rejects a confirmation that does not match', async () => {
    const user = userEvent.setup();
    const service = fakeService();
    renderPage(service);

    await sendCode(user, 'hello@gmail.com');
    await typeCode(user, '123456');
    await user.type(await screen.findByLabelText('New Password'), 'newpass');
    await user.type(screen.getByLabelText('Confirm Password'), 'other');
    await user.click(screen.getByRole('button', { name: 'Completed' }));

    expect(await screen.findByText('Confirm Password not correct!')).toBeInTheDocument();
    expect(service.resetPassword).not.toHaveBeenCalled();
  });
});
