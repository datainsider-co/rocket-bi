import { useState } from 'react';
import { DatePicker, Input, Select } from 'antd';
import dayjs from 'dayjs';
import { ParamValueType, type QueryParameter } from '@/core/query/queryParameters';
import { PARAMETER_DATE_FORMAT } from './parameters.utils';

interface ParameterValueInputProps {
  /** With its current value. */
  parameter: QueryParameter;
  onChange: (value: string) => void;
}

const CLASS = 'w-36';

/**
 * A parameter's current value on the bar (v1 `ParamItem`): typed text or number, kept when the input is left or Enter
 * is pressed; a date or a list value as soon as it is picked. Mount it per value, so it shows a value set elsewhere.
 */
export function ParameterValueInput({ parameter, onChange }: ParameterValueInputProps) {
  const [draft, setDraft] = useState(parameter.value);
  const label = `Value of ${parameter.displayName}`;

  if (parameter.valueType === ParamValueType.Date) {
    const date = dayjs(parameter.value);
    return (
      <DatePicker
        size="small"
        className={CLASS}
        aria-label={label}
        allowClear={false}
        value={date.isValid() ? date : null}
        onChange={value => value && onChange(value.format(PARAMETER_DATE_FORMAT))}
      />
    );
  }
  if (parameter.valueType === ParamValueType.List) {
    return (
      <Select
        size="small"
        className={CLASS}
        aria-label={label}
        value={parameter.value || undefined}
        placeholder="Select value"
        options={(parameter.list ?? []).map(item => ({ value: item, label: item }))}
        onChange={onChange}
        popupMatchSelectWidth={false}
      />
    );
  }
  const commit = () => draft !== parameter.value && onChange(draft);
  return (
    <Input
      size="small"
      className={CLASS}
      aria-label={label}
      inputMode={parameter.valueType === ParamValueType.Number ? 'decimal' : undefined}
      placeholder="default value"
      value={draft}
      onChange={event => setDraft(event.target.value)}
      onBlur={commit}
      onPressEnter={commit}
    />
  );
}
