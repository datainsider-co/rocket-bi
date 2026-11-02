import { Form, Input, Modal } from 'antd';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/shared/form/FormField';
import { etlNameSchema, type EtlNameForm } from './draft/etlDraft.utils';

interface EtlNameModalProps {
  /** "Rename ETL" or "Edit Display Name". */
  title: string;
  initialName: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/** v1 `DiRenameModal` of the editor: the ETL's name or a table's display name, kept in the draft until Save. */
export function EtlNameModal({ title, initialName, onSubmit, onCancel }: EtlNameModalProps) {
  const { control, handleSubmit, setFocus } = useForm<EtlNameForm>({
    resolver: zodResolver(etlNameSchema),
    defaultValues: { name: initialName }
  });
  const submit = handleSubmit(values => onSubmit(values.name));

  return (
    <Modal
      open
      centered
      title={title}
      okText="Rename"
      onOk={() => void submit()}
      onCancel={onCancel}
      destroyOnHidden
      afterOpenChange={visible => visible && setFocus('name')}
    >
      <Form layout="vertical" component={false}>
        <FormField
          control={control}
          name="name"
          label="Name"
          render={field => <Input {...field} placeholder="Input your title" onPressEnter={() => void submit()} />}
        />
      </Form>
    </Modal>
  );
}
