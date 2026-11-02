import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Input, Modal, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import { useForm, useWatch } from 'react-hook-form';
import type { QueryParameter } from '@/core/query/queryParameters';
import { FormField } from '@/shared/form/FormField';
import { defaultValueOf, fromParameterForm, PARAMETER_DATE_FORMAT, PARAMETER_TYPES, parameterFormSchema, toParameterForm, type ParameterForm } from './parameters.utils';
import { ParameterDefaultField } from './ParameterDefaultField';

interface ParameterModalProps {
  parameter: QueryParameter;
  /** The other parameters' names, which this one can't take. */
  takenNames: readonly string[];
  onSubmit: (parameter: QueryParameter) => void;
  onCancel: () => void;
}

/** Config Parameter (v1 `ParameterModal`): name, type and default value. Mounted while open. */
export function ParameterModal({ parameter, takenNames, onSubmit, onCancel }: ParameterModalProps) {
  const schema = useMemo(() => parameterFormSchema(takenNames), [takenNames]);
  const { control, handleSubmit, setValue, setFocus } = useForm<ParameterForm>({ resolver: zodResolver(schema), defaultValues: toParameterForm(parameter) });
  const valueType = useWatch({ control, name: 'valueType' });
  const listText = useWatch({ control, name: 'listText' });
  const submit = handleSubmit(form => onSubmit(fromParameterForm(form)));
  const onTypeChange = (type: string) => {
    setValue('valueType', type);
    setValue('value', defaultValueOf(type, dayjs().format(PARAMETER_DATE_FORMAT)));
  };

  return (
    <Modal open title="Config Parameter" okText="Apply" onOk={() => void submit()} onCancel={onCancel} destroyOnHidden afterOpenChange={visible => visible && setFocus('displayName')}>
      <Form layout="vertical" component={false}>
        <FormField control={control} name="displayName" label="Parameter" render={field => <Input {...field} placeholder="Input parameter name" onPressEnter={() => void submit()} />} />
        <Typography.Paragraph type="secondary">Wrap your parameter in single quotes to use as a value '{'{{Parameter}}'}' in SQL.</Typography.Paragraph>
        <FormField
          control={control}
          name="valueType"
          label="Parameter Type"
          render={({ onChange: _onChange, ...field }) => <Select {...field} options={[...PARAMETER_TYPES]} onChange={onTypeChange} />}
        />
        <ParameterDefaultField control={control} valueType={valueType} listText={listText} onSubmit={() => void submit()} />
      </Form>
    </Modal>
  );
}
