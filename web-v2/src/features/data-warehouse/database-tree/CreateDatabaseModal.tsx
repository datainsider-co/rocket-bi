import { useMemo } from 'react';
import { Alert, Form, Input, Modal, Typography } from 'antd';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { DatabaseInfo } from '@/core/schema/SchemaService';
import { FormField } from '@/shared/form/FormField';
import { createDatabaseSchema, toDatabaseName, type CreateDatabaseForm } from './databaseTree.utils';

interface CreateDatabaseModalProps {
  /** Databases already there, which a new one can't be named after. */
  existing: readonly DatabaseInfo[];
  isSubmitting: boolean;
  /** Server error of the last submit. */
  error: string | undefined;
  onSubmit: (typed: string) => void;
  onCancel: () => void;
}

/** Names a new database (v1 `DatabaseCreationModal`), showing the name the server will get. Mounted while open. */
export function CreateDatabaseModal({ existing, isSubmitting, error, onSubmit, onCancel }: CreateDatabaseModalProps) {
  const schema = useMemo(() => createDatabaseSchema(existing), [existing]);
  const { control, handleSubmit, setFocus } = useForm<CreateDatabaseForm>({ resolver: zodResolver(schema), defaultValues: { name: '' } });
  const typed = useWatch({ control, name: 'name' });
  const name = toDatabaseName(typed);
  const submit = handleSubmit(values => onSubmit(values.name));

  return (
    <Modal
      open
      title="Create Database"
      okText="Create"
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
          label="Database name"
          render={field => <Input {...field} placeholder="Type database name" onPressEnter={() => void submit()} />}
        />
      </Form>
      {name && name !== typed.trim() && (
        <Typography.Text type="secondary">
          Will be created as <Typography.Text code>{name}</Typography.Text>
        </Typography.Text>
      )}
      {error && <Alert className="mt-3" type="error" showIcon message={error} />}
    </Modal>
  );
}
