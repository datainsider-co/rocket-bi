import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Alert, Form, Input, Modal, Radio, Select, Typography } from 'antd';
import { useForm, useWatch } from 'react-hook-form';
import { useDi } from '@/app/di/DiContext';
import { TableKind } from '@/core/schema/TableDefinition';
import { SchemaService } from '@/core/schema/SchemaService';
import { FormField } from '@/shared/form/FormField';
import { databaseQueryOptions, databasesQueryOptions } from '@/shared/schema/schemaQueries';
import { toTableName } from '../../schema/schema-edit/schemaEdit.utils';
import { TABLE_FROM_QUERY_TYPES, tableFromQuerySchema, type TableFromQueryForm } from './tableFromQuery.utils';

interface CreateTableFromQueryModalProps {
  /** The database to start on: the one the editor opened with. */
  dbName: string | undefined;
  creating: boolean;
  error: string | undefined;
  onSubmit: (form: TableFromQueryForm) => void;
  onCancel: () => void;
}

/** Create Table From Query (v1 `TableCreationFromQueryModal`): the database, the table's name and its type. */
export function CreateTableFromQueryModal({ dbName, creating, error, onSubmit, onCancel }: CreateTableFromQueryModalProps) {
  const service = useDi(SchemaService);
  const databases = useQuery(databasesQueryOptions(service));
  const { control, handleSubmit, setError, setFocus } = useForm<TableFromQueryForm>({
    resolver: zodResolver(tableFromQuerySchema(() => [])),
    defaultValues: { dbName: dbName ?? '', name: '', tableType: TableKind.View }
  });
  const picked = useWatch({ control, name: 'dbName' });
  const typed = useWatch({ control, name: 'name' });
  const schema = useQuery({ ...databaseQueryOptions(service, picked), enabled: picked !== '' });
  const name = toTableName(typed);
  // The tables of the database picked, once loaded: a name they have is refused before asking the server.
  const submit = handleSubmit(form => {
    const taken = tableFromQuerySchema(db => (db === schema.data?.name ? schema.data.tables.map(table => table.name) : [])).safeParse(form);
    const issue = taken.success ? undefined : taken.error.issues[0];
    if (issue) setError('name', { message: issue.message });
    else onSubmit(form);
  });

  return (
    <Modal open title="Create Table From Query" okText="Create" confirmLoading={creating} onOk={() => void submit()} onCancel={onCancel} destroyOnHidden afterOpenChange={visible => visible && setFocus('name')}>
      <Form layout="vertical" component={false}>
        <FormField
          control={control}
          name="dbName"
          label="To Database"
          render={field => <Select {...field} showSearch placeholder="Select database" loading={databases.isPending} options={(databases.data ?? []).map(item => ({ value: item.name, label: item.displayName || item.name }))} />}
        />
        <FormField control={control} name="name" label="Table Name" render={field => <Input {...field} placeholder="table name" onPressEnter={() => void submit()} />} />
        {name && name !== typed.trim() && (
          <Typography.Paragraph type="secondary" className="-mt-4">
            Will be created as <Typography.Text code>{name}</Typography.Text>
          </Typography.Paragraph>
        )}
        <FormField control={control} name="tableType" label="Table Type" render={field => <Radio.Group {...field} optionType="button" options={[...TABLE_FROM_QUERY_TYPES]} />} />
      </Form>
      {error && <Alert type="error" showIcon title={error} />}
    </Modal>
  );
}
