import { useReducer } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { AuthenticationService } from '@/core/auth/AuthenticationService';
import { toAuthErrorMessage } from '../auth.utils';
import { forgotPasswordReducer, initialForgotPasswordState } from './forgotPassword.utils';
import { useResendCountdown } from './useResendCountdown';

function errorMessageOf(error: unknown): string | undefined {
  return error ? toAuthErrorMessage(error) : undefined;
}

/** v1's login-v2 flow: send a code to the email, check it, then set a new password and go back to login. */
export function useForgotPassword() {
  const service = useDi(AuthenticationService);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [state, dispatch] = useReducer(forgotPasswordReducer, undefined, () => initialForgotPasswordState());
  const countdown = useResendCountdown();

  const sendCode = useMutation({
    mutationFn: (email: string) => service.forgotPassword(email),
    onSuccess: (_, email) => {
      dispatch({ type: 'codeSent', email });
      countdown.restart();
    }
  });

  const verifyCode = useMutation({
    mutationFn: (code: string) => service.verifyCode(state.email, code),
    onSuccess: (_, code) => dispatch({ type: 'codeVerified', code })
  });

  const resetPassword = useMutation({
    mutationFn: (newPassword: string) =>
      service.resetPassword({ email: state.email, newPassword, verifyCode: state.step === 'reset' ? state.code : '' }),
    onSuccess: () => {
      void message.success('Your new password is updated.');
      void navigate('/login', { replace: true });
    }
  });

  return {
    state,
    resendSecondsLeft: countdown.secondsLeft,
    sendCode: {
      run: (email: string) => sendCode.mutate(email),
      isPending: sendCode.isPending,
      errorMessage: errorMessageOf(sendCode.error)
    },
    verifyCode: {
      run: (code: string) => verifyCode.mutate(code),
      isPending: verifyCode.isPending,
      errorMessage: errorMessageOf(verifyCode.error)
    },
    resetPassword: {
      run: (newPassword: string) => resetPassword.mutate(newPassword),
      isPending: resetPassword.isPending,
      errorMessage: errorMessageOf(resetPassword.error)
    },
    resendCode: () => sendCode.mutate(state.email),
    editEmail: () => {
      verifyCode.reset();
      dispatch({ type: 'editEmail' });
    },
    backToLogin: () => void navigate('/login')
  };
}
