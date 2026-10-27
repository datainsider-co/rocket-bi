import { CloseOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Button, Input, Switch } from 'antd';
import type { PasswordDraft } from './sharePassword.utils';
import { OptionRow } from './OptionRow';

export interface PasswordState {
  draft: PasswordDraft;
  isReady: boolean;
  onToggle: (on: boolean) => void;
  onType: (value: string) => void;
  onReset: () => void;
}

/** v1's Password protection: a switch, then the password; a stored one shows as `********` until reset with ×. */
export function PasswordProtectionView({ draft, isReady, onToggle, onType, onReset }: PasswordState) {
  return (
    <div className="flex flex-col gap-3">
      <OptionRow
        icon={<SafetyCertificateOutlined />}
        title="Password protection"
        description="Set a password to secure your data"
        control={<Switch aria-label="Password protection" checked={draft.enabled} disabled={!isReady} onChange={onToggle} />}
      />
      {draft.enabled && (
        <div className="pl-9">
          {draft.keepStored ? (
            <Input
              readOnly
              variant="filled"
              size="large"
              aria-label="Your password"
              value="********"
              suffix={<Button type="text" size="small" aria-label="Reset password" icon={<CloseOutlined />} onClick={onReset} />}
            />
          ) : (
            <Input.Password
              variant="filled"
              size="large"
              autoComplete="new-password"
              aria-label="Your password"
              placeholder="Your password"
              value={draft.value}
              onChange={event => onType(event.target.value)}
            />
          )}
        </div>
      )}
    </div>
  );
}
