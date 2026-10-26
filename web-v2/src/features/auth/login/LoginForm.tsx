import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Form, Input } from 'antd';
import { useForm } from 'react-hook-form';
import { loginSchema } from '../auth.utils';
import type { LoginValues } from '../auth.utils';
import { FormField } from '@/shared/form/FormField';

interface LoginFormProps {
  isPending: boolean;
  errorMessage?: string | undefined;
  /** v1 `REGISTER_URL`; the link is hidden when empty. */
  registerUrl?: string | undefined;
  onLogin: (values: LoginValues) => void;
  onForgotPassword: () => void;
}

export function LoginForm({ isPending, errorMessage, registerUrl, onLogin, onForgotPassword }: LoginFormProps) {
  const { control, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  return (
    <div className="flex flex-col">
      <h2 className="m-0 mb-1.5 text-[36px] leading-[1.32] font-medium text-brand">Welcome to RocketBI</h2>
      <h4 className="m-0 text-[22px] leading-normal font-medium">Login</h4>
      {errorMessage && <Alert className="mt-4" type="error" showIcon title={errorMessage} />}
      <form noValidate onSubmit={handleSubmit(onLogin)} className="mt-6">
        <Form layout="vertical" component={false} disabled={isPending}>
          <FormField
            control={control}
            name="email"
            label="Email"
            render={field => (
              <Input {...field} size="large" type="email" placeholder="email@datainsider.co" autoComplete="username" />
            )}
          />
          <FormField
            control={control}
            name="password"
            label="Password"
            render={field => (
              <Input.Password {...field} size="large" placeholder="Your password" autoComplete="current-password" />
            )}
          />
          <div className="-mt-4 mb-6 flex justify-end">
            <Button type="link" size="small" className="px-0" onClick={onForgotPassword}>
              Forgot password
            </Button>
          </div>
          <Button type="primary" htmlType="submit" block loading={isPending} className="h-[46px]">
            Login
          </Button>
        </Form>
      </form>
      {registerUrl && (
        <p className="mt-6 mb-0 text-center">
          Don&apos;t have an account yet? <a href={registerUrl}>Register</a>
        </p>
      )}
    </div>
  );
}
