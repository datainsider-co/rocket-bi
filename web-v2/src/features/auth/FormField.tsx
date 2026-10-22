import type { ReactElement } from 'react';
import { Form } from 'antd';
import { Controller } from 'react-hook-form';
import type { Control, ControllerRenderProps, FieldPath, FieldValues } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues, N extends FieldPath<T>> {
  control: Control<T>;
  name: N;
  label: string;
  /** Renders the input. Spread `field` onto it; `id` ties it to the label. */
  render: (field: ControllerRenderProps<T, N> & { id: string }) => ReactElement;
}

/** A react-hook-form field laid out by antd: label above, zod error message below. */
export function FormField<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  label,
  render
}: FormFieldProps<T, N>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Form.Item
          label={label}
          htmlFor={name}
          validateStatus={fieldState.error ? 'error' : undefined}
          help={fieldState.error?.message}
        >
          {render({ ...field, id: name })}
        </Form.Item>
      )}
    />
  );
}
