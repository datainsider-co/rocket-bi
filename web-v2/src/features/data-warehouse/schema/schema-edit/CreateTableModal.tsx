import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Input, Modal, Typography } from 'antd';
import { useForm, useWatch } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import { createTableSchema, toTableName, type CreateTableForm } from './schemaEdit.utils';

interface CreateTableModalProps {
  /** Names of the database's tables, which a new one can't take. */
  existing: readonly string[];
  /** The name was accepted: the table's columns come next. */
  onSubmit: (name: string, displayName: string) => void;
  onCancel: () => void;
}

/** Names a new table (v1 "New table" `DiRenameModal`), showing the name the server will get. Mounted while open. */
export function CreateTableModal({ existing, onSubmit, onCancel }: CreateTableModalProps) {
  const schema = useMemo(() => createTableSchema(existing), [existing]);
  const { control, handleSubmit, setFocus } = useForm<CreateTableForm>({ resolver: zodResolver(schema), defaultValues: { name: '' } });
  const typed = useWatch({ control, name: 'name' });
  const name = toTableName(typed);
  const submit = handleSubmit(values => onSubmit(toTableName(values.name), values.name.trim()));

  return (
    <Modal open title="Create Table" okText="Create" onOk={() => void submit()} onCancel={onCancel} destroyOnHidden afterOpenChange={visible => visible && setFocus('name')}>
      <Form layout="vertical" component={false}>
        <FormField control={control} name="name" label="Table name" render={field => <Input {...field} placeholder="Input table name" onPressEnter={() => void submit()} />} />
      </Form>
      {name && name !== typed.trim() && (
        <Typography.Text type="secondary">
          Will be created as <Typography.Text code>{name}</Typography.Text>
        </Typography.Text>
      )}
    </Modal>
  );
}
