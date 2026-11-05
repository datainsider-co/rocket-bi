import { useState } from 'react';
import { Button, Input, Tag } from 'antd';
import { domainError, normalizeDomain } from './loginMethod.utils';

interface DomainWhitelistFieldProps {
  value: readonly string[];
  onChange: (domains: string[]) => void;
  disabled?: boolean;
}

/** v1 `GoogleSettingItem` whitelist: type a domain, Add or Enter, remove with the tag's ×. */
export function DomainWhitelistField({ value, onChange, disabled }: DomainWhitelistFieldProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();

  const add = () => {
    const domain = normalizeDomain(text);
    const message = domainError(domain, value);
    setError(message);
    if (message) return;
    onChange([...value, domain]);
    setText('');
  };

  return (
    <div>
      <div className="flex gap-2">
        <Input
          aria-label="Domain"
          placeholder="example.com"
          value={text}
          disabled={disabled}
          status={error ? 'error' : undefined}
          onChange={event => setText(event.target.value)}
          onPressEnter={event => {
            event.preventDefault();
            add();
          }}
        />
        <Button onClick={add} disabled={disabled}>
          Add
        </Button>
      </div>
      {error && <div className="mt-1 text-sm text-red-500">{error}</div>}
      <div className="mt-2 flex flex-wrap gap-y-2">
        {value.map(domain => (
          <Tag key={domain} closable={!disabled} onClose={() => onChange(value.filter(item => item !== domain))}>
            {domain}
          </Tag>
        ))}
      </div>
    </div>
  );
}
