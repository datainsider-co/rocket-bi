import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Flex, Form, Input, Typography } from 'antd';
import { useForm } from 'react-hook-form';
import { resetPasswordSchema } from '../auth.utils';
import type { ResetPasswordValues } from '../auth.utils';
import { FormField } from '../FormField';

interface ResetPasswordStepProps {
  email: string;
  isPending: boolean;
  errorMessage?: string | undefined;
  onSubmit: (newPassword: string) => void;
}

export function ResetPasswordStep({ email, isPending, errorMessage, onSubmit }: ResetPasswordStepProps) {
  const { control, handleSubmit } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  return (
    <Flex vertical gap="middle">
      <div>
        <Typography.Title level={3}>Create a new password</Typography.Title>
        <Typography.Text type="secondary">Enter and confirm your new password again.</Typography.Text>
      </div>
      {errorMessage && <Alert type="error" showIcon title={errorMessage} />}
      <form noValidate onSubmit={handleSubmit(({ password }) => onSubmit(password))}>
        <Form layout="vertical" component={false} disabled={isPending}>
          <Form.Item label="Email" htmlFor="reset-email">
            <Input id="reset-email" value={email} disabled autoComplete="username" />
          </Form.Item>
          <FormField
            control={control}
            name="password"
            label="New Password"
            render={field => (
              <Input.Password {...field} placeholder="Input new password..." autoComplete="new-password" />
            )}
          />
          <FormField
            control={control}
            name="confirmPassword"
            label="Confirm Password"
            render={field => (
              <Input.Password {...field} placeholder="Input confirm password..." autoComplete="new-password" />
            )}
          />
          <Button type="primary" htmlType="submit" block loading={isPending}>
            Completed
          </Button>
        </Form>
      </form>
    </Flex>
  );
}
