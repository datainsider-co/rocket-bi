import { DatePicker, Input, InputNumber, Select } from 'antd';
import dayjs from 'dayjs';
import type { DefaultValue } from '@/core/schema/TableDefinition';
import { defaultValueFor, defaultValueKindOf, hasTime, TEXT_MAX_LENGTH } from './schemaEdit.utils';

interface DefaultValueInputProps {
  /** The column's type, which picks the input. */
  type: string;
  value: DefaultValue | undefined;
  onChange: (value: DefaultValue | undefined) => void;
  ariaLabel: string;
}

const BOOL_OPTIONS = [
  { value: 'true', label: 'True' },
  { value: 'false', label: 'False' }
];

/** A column's default value, input by its type (v1 `FieldManagement` default value cell). Cleared means none. */
export function DefaultValueInput({ type, value, onChange, ariaLabel }: DefaultValueInputProps) {
  const kind = defaultValueKindOf(type);
  const current = defaultValueFor(kind, value);
  switch (kind) {
    case 'bool':
      return (
        <Select
          allowClear
          className="w-full"
          aria-label={ariaLabel}
          placeholder="None"
          options={BOOL_OPTIONS}
          value={current === undefined ? undefined : String(current)}
          onChange={(picked?: string) => onChange(picked === undefined ? undefined : picked === 'true')}
        />
      );
    case 'number':
      return (
        <InputNumber
          className="w-full"
          aria-label={ariaLabel}
          placeholder="None"
          value={typeof current === 'number' ? current : null}
          onChange={number => onChange(typeof number === 'number' ? number : undefined)}
        />
      );
    case 'text':
      return <Input aria-label={ariaLabel} placeholder="None" maxLength={TEXT_MAX_LENGTH} value={String(current ?? '')} onChange={event => onChange(event.target.value)} />;
    case 'date':
      return (
        <DatePicker
          className="w-full"
          aria-label={ariaLabel}
          placeholder="None"
          showTime={hasTime(type)}
          value={typeof current === 'number' ? dayjs(current) : null}
          onChange={date => onChange(date ? date.valueOf() : undefined)}
        />
      );
    case 'none':
      return <span className="text-black/45">--</span>;
  }
}
