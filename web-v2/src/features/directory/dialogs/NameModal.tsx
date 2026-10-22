import { useEffect } from 'react';
import { Alert, Form, Input, Modal } from 'antd';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/shared/form/FormField';
import { nameSchema } from '../directory.utils';
import type { NameForm } from '../directory.utils';

export interface NameModalCopy {
  title: string;
  label: string;
  placeholder: string;
  okText: string;
}

interface NameModalProps {
  open: boolean;
  copy: NameModalCopy;
  initialName?: string;
  isSubmitting: boolean;
  /** Server error of the last submit. */
  error?: string | undefined;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/** Asks for a folder or dashboard name: create folder, create dashboard and rename (v1 `DiRenameModal`). */
export function NameModal({ open, copy, initialName = '', isSubmitting, error, onSubmit, onCancel }: NameModalProps) {
  const { control, handleSubmit, reset, setFocus } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: initialName }
  });

  useEffect(() => {
    if (open) reset({ name: initialName });
  }, [open, initialName, reset]);

  const submit = handleSubmit(values => onSubmit(values.name));

  return (
    <Modal
      open={open}
      title={copy.title}
      okText={copy.okText}
      confirmLoading={isSubmitting}
      onOk={() => void submit()}
      onCancel={onCancel}
      destroyOnHidden
      afterOpenChange={visible => visible && setFocus('name')}
    >
      <Form layout="vertical" component={false}>
        <FormField
          control={control}
          name="name"
          label={copy.label}
          render={field => (
            <Input {...field} placeholder={copy.placeholder} onPressEnter={() => void submit()} />
          )}
        />
      </Form>
      {error && <Alert type="error" title={error} showIcon />}
    </Modal>
  );
}
