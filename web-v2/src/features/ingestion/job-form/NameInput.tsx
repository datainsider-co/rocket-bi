import { AutoComplete, Spin } from 'antd';
import type { Suggestions } from './useJobFormOptions';

interface NameInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  suggestions: Suggestions;
  placeholder: string;
  disabled?: boolean | undefined;
}

function matches(input: string, option: { value?: unknown } | undefined): boolean {
  return String(option?.value ?? '').toLowerCase().includes(input.trim().toLowerCase());
}

/** A name picked from what the server listed, or typed (v1 `DropdownInput` "Or type your … name"). */
export function NameInput({ id, value, onChange, onBlur, suggestions, placeholder, disabled }: NameInputProps) {
  const options = suggestions.names.map(name => ({ value: name, label: name }));
  const notFound = suggestions.isLoading ? <Spin size="small" /> : (suggestions.error ?? null);

  return (
    <AutoComplete
      id={id}
      className="w-full"
      value={value}
      options={options}
      filterOption={matches}
      notFoundContent={notFound}
      placeholder={placeholder}
      disabled={disabled}
      allowClear
      onChange={next => onChange(next ?? '')}
      onBlur={onBlur}
    />
  );
}
