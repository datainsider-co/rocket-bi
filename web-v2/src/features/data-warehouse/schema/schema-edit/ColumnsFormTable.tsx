import { DeleteOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Select, Table, Tooltip } from 'antd';
import { useWatch, type Control } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import { COLUMN_TYPES, columnTypeLabel } from '../schema.utils';
import { DefaultValueInput } from './DefaultValueInput';
import { TEXT_MAX_LENGTH, type SchemaFormValues } from './schemaEdit.utils';
import type { SchemaEditor } from './useSchemaEditor';

type Row = SchemaEditor['rows'][number];

interface ColumnsFormTableProps {
  control: Control<SchemaFormValues>;
  rows: SchemaEditor['rows'];
  onTypeChange: (index: number, type: string) => void;
  onRemoveColumn: (index: number) => void;
}

const CELL = 'mb-0';

/** The default value of row `index`, following the row's type as it changes. */
function DefaultValueCell({ control, index }: { control: Control<SchemaFormValues>; index: number }) {
  const type = useWatch({ control, name: `columns.${index}.type` });
  return (
    <FormField
      control={control}
      name={`columns.${index}.defaultValue`}
      className={CELL}
      render={field => <DefaultValueInput type={type} value={field.value} onChange={field.onChange} ariaLabel={`Default value of row ${index + 1}`} />}
    />
  );
}

/**
 * The columns in edit mode (v1 `FieldManagement` edit rows): an existing column keeps its name, a new one is named
 * here and can be taken out again before saving. A type v2 doesn't offer (arrays, nested) can't be changed.
 */
export function ColumnsFormTable({ control, rows, onTypeChange, onRemoveColumn }: ColumnsFormTableProps) {
  const label = (what: string, index: number) => `${what} of row ${index + 1}`;
  return (
    <Form component={false}>
      <Table<Row>
        rowKey="id"
        dataSource={[...rows]}
        pagination={false}
        size="middle"
        scroll={{ x: 960 }}
        columns={[
          {
            key: 'name',
            title: `Column (${rows.length})`,
            width: 180,
            render: (_, row, index) =>
              row.isNew ? (
                <FormField control={control} name={`columns.${index}.name`} className={CELL} render={field => <Input {...field} aria-label={label('Name', index)} placeholder="Column name" autoComplete="off" />} />
              ) : (
                <span className="break-all">{row.name}</span>
              )
          },
          {
            key: 'displayName',
            title: 'Display Name',
            width: 180,
            render: (_, _row, index) => (
              <FormField
                control={control}
                name={`columns.${index}.displayName`}
                className={CELL}
                render={field => <Input {...field} aria-label={label('Display name', index)} placeholder="Display name" maxLength={TEXT_MAX_LENGTH} />}
              />
            )
          },
          {
            key: 'nullable',
            title: 'Nullable',
            width: 90,
            align: 'center',
            render: (_, _row, index) => (
              <FormField
                control={control}
                name={`columns.${index}.isNullable`}
                className={CELL}
                render={({ value, onChange, ref }) => <Checkbox ref={ref} aria-label={label('Nullable', index)} checked={value} onChange={event => onChange(event.target.checked)} />}
              />
            )
          },
          {
            key: 'type',
            title: 'Type',
            width: 140,
            render: (_, row, index) => (
              <FormField
                control={control}
                name={`columns.${index}.type`}
                className={CELL}
                render={field => (
                  <Select
                    className="w-full"
                    showSearch={{ optionFilterProp: 'label' }}
                    aria-label={label('Type', index)}
                    options={[...COLUMN_TYPES]}
                    value={field.value}
                    labelRender={({ value }) => columnTypeLabel(String(value))}
                    disabled={!COLUMN_TYPES.some(option => option.value === row.type)}
                    onChange={(type: string) => onTypeChange(index, type)}
                  />
                )}
              />
            )
          },
          {
            key: 'description',
            title: 'Description',
            render: (_, _row, index) => (
              <FormField
                control={control}
                name={`columns.${index}.description`}
                className={CELL}
                render={field => <Input {...field} aria-label={label('Description', index)} placeholder="Description" maxLength={TEXT_MAX_LENGTH} />}
              />
            )
          },
          { key: 'defaultValue', title: 'Default Value', width: 200, render: (_, _row, index) => <DefaultValueCell control={control} index={index} /> },
          {
            key: 'action',
            width: 56,
            render: (_, row, index) =>
              row.isNew && (
                <Tooltip title="Remove">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label={label('Remove', index)} onClick={() => onRemoveColumn(index)} />
                </Tooltip>
              )
          }
        ]}
      />
    </Form>
  );
}
