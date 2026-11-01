import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Table, Tag, Tooltip } from 'antd';
import { useWatch } from 'react-hook-form';
import type { TableSchema } from '@/core/schema/SchemaService';
import { FormField } from '@/shared/form/FormField';
import { PolicyConditionCell } from './PolicyConditionCell';
import { PolicyFilterCell } from './PolicyFilterCell';
import { filterKindOf, toAttributeKey } from './rls.utils';
import { RlsFilterModal } from './RlsFilterModal';
import type { RlsEditor } from './useRlsEditor';

type Row = RlsEditor['rows'][number];

/** The RLS policies in edit mode (v1 `ManageRLSPolicy` with Add RLS, Cancel, Save). */
export function RlsEditorView({ editor, table }: { editor: RlsEditor; table: TableSchema }) {
  const { control, filterRow } = editor;
  const policies = useWatch({ control, name: 'policies' });
  const editing = filterRow === undefined ? undefined : policies[filterRow];
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button icon={<PlusOutlined />} onClick={editor.onAdd}>
          Add RLS
        </Button>
        <Button onClick={editor.onCancel}>Cancel</Button>
        <Button type="primary" icon={<SaveOutlined />} loading={editor.saving} onClick={editor.onSave}>
          Save
        </Button>
      </div>
      {editor.error && <Alert type="error" showIcon title="Save RLS Error" description={editor.error} />}
      <Form component={false}>
        <Table<Row>
          rowKey="id"
          dataSource={[...editor.rows]}
          pagination={false}
          size="middle"
          scroll={{ x: 760 }}
          locale={{ emptyText: 'No RLS created yet' }}
          columns={[
            {
              key: 'key',
              title: 'Attribute Name',
              width: 220,
              render: (_, row, index) => (
                <div className="flex flex-col gap-1">
                  <FormField
                    control={control}
                    name={`policies.${index}.key`}
                    className="mb-0"
                    render={field => (
                      <Input
                        {...field}
                        aria-label={`Attribute name of policy ${index + 1}`}
                        placeholder="Attribute name"
                        onBlur={() => {
                          field.onChange(toAttributeKey(field.value));
                          field.onBlur();
                        }}
                      />
                    )}
                  />
                  {row.userIds.length > 0 && <Tag className="self-start">{`${row.userIds.length} user${row.userIds.length === 1 ? '' : 's'}`}</Tag>}
                </div>
              )
            },
            { key: 'condition', title: 'Condition', render: (_, _row, index) => <PolicyConditionCell control={control} index={index} /> },
            {
              key: 'filter',
              title: 'Filters',
              width: 240,
              render: (_, _row, index) => <PolicyFilterCell control={control} index={index} table={table} onCustom={editor.onFilterRowChange} />
            },
            {
              key: 'action',
              title: 'Action',
              width: 72,
              render: (_, _row, index) => (
                <Tooltip title="Delete">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label={`Delete policy ${index + 1}`} onClick={() => editor.onRemove(index)} />
                </Tooltip>
              )
            }
          ]}
        />
      </Form>
      {filterRow !== undefined && editing && (
        <RlsFilterModal
          table={table}
          conditions={filterKindOf(editing.conditions) === 'custom' ? editing.conditions : []}
          onApply={conditions => {
            editor.onConditionsChange(filterRow, conditions);
            editor.onFilterRowChange(undefined);
          }}
          onCancel={() => editor.onFilterRowChange(undefined)}
        />
      )}
    </div>
  );
}
