import { Alert, Form, Input, Modal } from 'antd';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import { attributeNameError, attributeSchema, type AttributeForm, type AttributeRow } from './attributes.utils';

const FORM_ID = 'user-attribute-form';

interface AttributeModalProps {
  /** `null` to add one. */
  row: AttributeRow | null;
  properties: Readonly<Record<string, string>>;
  save: { run: (values: AttributeForm) => void; isPending: boolean; errorMessage?: string | undefined };
  onCancel: () => void;
}

/** v1 `AddNewFieldModal`, also used to edit one. The name is kept exactly as typed (v1 turned it into snake_case). */
export function AttributeModal({ row, properties, save, onCancel }: AttributeModalProps) {
  const { control, handleSubmit, setError, setFocus } = useForm<AttributeForm>({
    resolver: zodResolver(attributeSchema),
    defaultValues: { name: row?.key ?? '', value: row?.value ?? '' }
  });
  const submit = handleSubmit(values => {
    const nameError = attributeNameError(values.name, properties, row?.key);
    if (nameError) setError('name', { message: nameError });
    else save.run(values);
  });

  return (
    <Modal
      open
      centered
      title={row ? 'Edit Attribute' : 'Add Attribute'}
      okText={row ? 'Save' : 'Add'}
      okButtonProps={{ htmlType: 'submit', form: FORM_ID, loading: save.isPending }}
      cancelButtonProps={{ disabled: save.isPending }}
      onCancel={onCancel}
      destroyOnHidden
      afterOpenChange={visible => visible && setFocus(row ? 'value' : 'name')}
    >
      <form id={FORM_ID} noValidate onSubmit={event => void submit(event)}>
        <Form layout="vertical" component={false} disabled={save.isPending}>
          <FormField control={control} name="name" label="Name" required render={field => <Input {...field} />} />
          <FormField control={control} name="value" label="Value" required render={field => <Input {...field} />} />
        </Form>
      </form>
      {save.errorMessage && <Alert type="error" showIcon title={save.errorMessage} />}
    </Modal>
  );
}
