import { DatePicker, Input, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Control } from 'react-hook-form';
import { ParamValueType } from '@/core/query/queryParameters';
import { FormField } from '@/shared/form/FormField';
import { listValuesOf, PARAMETER_DATE_FORMAT, type ParameterForm } from './parameters.utils';

interface ParameterDefaultFieldProps {
  control: Control<ParameterForm>;
  valueType: string;
  listText: string;
  onSubmit: () => void;
}

/** The default value of a parameter by its type (v1 `DynamicInputValue`); a list also takes its values, one per line. */
export function ParameterDefaultField({ control, valueType, listText, onSubmit }: ParameterDefaultFieldProps) {
  if (valueType === ParamValueType.Date) {
    return (
      <FormField
        control={control}
        name="value"
        label="Default Date"
        render={({ value, onChange, ...field }) => {
          const date = dayjs(value);
          return <DatePicker {...field} className="w-full" allowClear={false} value={date.isValid() ? date : null} onChange={next => next && onChange(next.format(PARAMETER_DATE_FORMAT))} />;
        }}
      />
    );
  }
  if (valueType === ParamValueType.List) {
    const options = listValuesOf(listText).map(item => ({ value: item, label: item }));
    return (
      <>
        <FormField
          control={control}
          name="value"
          label="Default select"
          render={({ value, onChange, ...field }) => (
            <Select {...field} value={value || undefined} onChange={(next?: string) => onChange(next ?? '')} allowClear placeholder="Select default value..." options={options} />
          )}
        />
        <FormField control={control} name="listText" label="List values" render={field => <Input.TextArea {...field} rows={4} placeholder="Input list values" />} />
        <Typography.Text type="secondary">Separate values with newlines.</Typography.Text>
      </>
    );
  }
  const isNumber = valueType === ParamValueType.Number;
  return (
    <FormField
      control={control}
      name="value"
      label={isNumber ? 'Default Number' : 'Default Text'}
      render={field => <Input {...field} inputMode={isNumber ? 'decimal' : undefined} placeholder={isNumber ? 'Input number value' : 'Input text value'} onPressEnter={onSubmit} />}
    />
  );
}
