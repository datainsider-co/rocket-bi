import { useState } from 'react';
import { Alert, Button, Flex, Input, Typography } from 'antd';
import { CODE_LENGTH, isCompleteCode } from './forgotPassword.utils';

interface CodeStepProps {
  email: string;
  isPending: boolean;
  errorMessage?: string | undefined;
  resendSecondsLeft: number;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onEditEmail: () => void;
}

/** Submits as soon as every digit is filled in, like v1. */
export function CodeStep({
  email,
  isPending,
  errorMessage,
  resendSecondsLeft,
  onSubmit,
  onResend,
  onEditEmail
}: CodeStepProps) {
  const [code, setCode] = useState('');

  const handleChange = (value: string) => {
    setCode(value);
    if (isCompleteCode(value)) onSubmit(value);
  };

  return (
    <Flex vertical gap="middle">
      <div>
        <Typography.Title level={3}>Enter the verification code (OTP)</Typography.Title>
        <Typography.Text type="secondary">Code sent to email: {email}</Typography.Text>
      </div>
      {errorMessage && <Alert type="error" showIcon title={errorMessage} />}
      <Input.OTP length={CODE_LENGTH} value={code} onChange={handleChange} disabled={isPending} />
      <div>
        {resendSecondsLeft > 0 ? (
          <Typography.Text type="secondary">Resend code after {resendSecondsLeft} seconds</Typography.Text>
        ) : (
          <Button type="link" onClick={onResend} style={{ paddingInline: 0 }}>
            Resend code?
          </Button>
        )}
        <div>
          <Typography.Text type="secondary">Wrong email? </Typography.Text>
          <Button type="link" onClick={onEditEmail} style={{ paddingInline: 0 }}>
            Edit email
          </Button>
        </div>
      </div>
      <Button
        type="primary"
        block
        loading={isPending}
        disabled={!isCompleteCode(code)}
        onClick={() => onSubmit(code)}
      >
        Confirm
      </Button>
    </Flex>
  );
}
