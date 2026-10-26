import { ArrowLeftOutlined } from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Flex, Form, Input, Typography } from 'antd';
import { useForm } from 'react-hook-form';
import { emailSchema } from '../auth.utils';
import type { EmailValues } from '../auth.utils';
import { FormField } from '@/shared/form/FormField';

interface EmailStepProps {
  initialEmail: string;
  isPending: boolean;
  errorMessage?: string | undefined;
  onSubmit: (email: string) => void;
  onBack: () => void;
}

export function EmailStep({ initialEmail, isPending, errorMessage, onSubmit, onBack }: EmailStepProps) {
  const { control, handleSubmit } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: initialEmail }
  });

  return (
    <Flex vertical gap="middle">
      <div>
        <Typography.Title level={3}>Forgot password</Typography.Title>
        <Typography.Text type="secondary">
          No worries, please type an email you used to login. We will send a verify code for you to reset your password.
        </Typography.Text>
      </div>
      {errorMessage && <Alert type="error" showIcon title={errorMessage} />}
      <form noValidate onSubmit={handleSubmit(({ email }) => onSubmit(email))}>
        <Form layout="vertical" component={false} disabled={isPending}>
          <FormField
            control={control}
            name="email"
            label="Email"
            render={field => <Input {...field} type="email" placeholder="demo@datainsider.co" autoComplete="username" />}
          />
          <Flex vertical gap="small">
            <Button type="primary" htmlType="submit" block loading={isPending}>
              Send Code
            </Button>
            <Button block icon={<ArrowLeftOutlined />} onClick={onBack}>
              Back to Login
            </Button>
          </Flex>
        </Form>
      </form>
    </Flex>
  );
}
