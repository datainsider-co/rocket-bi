import { useState } from 'react';
import { Button, Input, Modal } from 'antd';
import './PasswordGate.css';

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
    <Modal
      open
      centered
      className="password-gate"
      width={500}
      title="Password Validation"
      maskClosable={false}
      keyboard={false}
      closable={false}
      onCancel={onCancel}
      footer={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={submit}>
            Access
          </Button>
        </>
      }
    >
      <label htmlFor={INPUT_ID} className="password-gate__label">
        Password
      </label>
      <Input.Password
        id={INPUT_ID}
        variant="filled"
        autoComplete="new-password"
        placeholder="Enter password"
        value={password}
        onChange={event => setPassword(event.target.value)}
        onPressEnter={submit}
        status={error ? 'error' : undefined}
      />
      <div className="password-gate__error" role="alert">
        {error}
      </div>
    </Modal>
  );
}
