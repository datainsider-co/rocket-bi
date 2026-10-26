import { useState } from 'react';
import { Input, Modal, Typography } from 'antd';

const INPUT_ID = 'dashboard-password';

interface PasswordGateViewProps {
  /** Returns why the password is wrong, or nothing once it opens the dashboard. */
  onUnlock: (password: string) => string | undefined;
  onCancel: () => void;
}

/** v1 `PasswordModal`: asks for the dashboard's password before showing it; Cancel leaves the page. */
export function PasswordGateView({ onUnlock, onCancel }: PasswordGateViewProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const submit = () => setError(onUnlock(password));
  return (
    <Modal open centered title="Password Validation" okText="Access" onOk={submit} onCancel={onCancel} maskClosable={false} keyboard={false} closable={false}>
      <label htmlFor={INPUT_ID} className="mb-1 block">
        Password
      </label>
      <Input.Password
        id={INPUT_ID}
        autoComplete="new-password"
        placeholder="Enter password"
        value={password}
        onChange={event => setPassword(event.target.value)}
        onPressEnter={submit}
        status={error ? 'error' : undefined}
      />
      {error && <Typography.Text type="danger">{error}</Typography.Text>}
    </Modal>
  );
}
