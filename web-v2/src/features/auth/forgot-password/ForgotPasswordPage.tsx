import { CodeStep } from './CodeStep';
import { EmailStep } from './EmailStep';
import { ResetPasswordStep } from './ResetPasswordStep';
import { useForgotPassword } from './useForgotPassword';

export function ForgotPasswordPage() {
  const flow = useForgotPassword();
  const { state } = flow;

  switch (state.step) {
    case 'email':
      return (
        <EmailStep
          initialEmail={state.email}
          isPending={flow.sendCode.isPending}
          errorMessage={flow.sendCode.errorMessage}
          onSubmit={flow.sendCode.run}
          onBack={flow.backToLogin}
        />
      );
    case 'code':
      return (
        <CodeStep
          email={state.email}
          isPending={flow.verifyCode.isPending}
          errorMessage={flow.verifyCode.errorMessage ?? flow.sendCode.errorMessage}
          resendSecondsLeft={flow.resendSecondsLeft}
          onSubmit={flow.verifyCode.run}
          onResend={flow.resendCode}
          onEditEmail={flow.editEmail}
        />
      );
    case 'reset':
      return (
        <ResetPasswordStep
          email={state.email}
          isPending={flow.resetPassword.isPending}
          errorMessage={flow.resetPassword.errorMessage}
          onSubmit={flow.resetPassword.run}
        />
      );
  }
}
