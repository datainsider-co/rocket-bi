import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Typography } from 'antd';
import { useFieldArray } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import type { WithProperties } from './properties.utils';

/**
 * Extra JDBC properties of a form's `properties` array, sent as a map. Keys are kept as typed (only trimmed). Used by
 * the ClickHouse connector and the ingestion sources (v1 `ManagePropertyModal`).
 */
export function PropertiesFields<T extends WithProperties>({ control }: { control: Control<T> }) {
  // Any form with a `properties` array; react-hook-form can't see that through the generic.
  const rowsControl = control as unknown as Control<WithProperties>;
  const { fields, append, remove } = useFieldArray({ control: rowsControl, name: 'properties' });

  return (
    <section aria-label="Properties">
      <div className="mb-2 flex items-center justify-between">
        <Typography.Text strong>Properties</Typography.Text>
        <Button size="small" icon={<PlusOutlined />} onClick={() => append({ key: '', value: '' })}>
          Add property
        </Button>
      </div>
      {fields.map((row, index) => (
        <div key={row.id} className="flex items-start gap-2">
          <div className="flex-1">
            <FormField
              control={rowsControl}
              name={`properties.${index}.key`}
              render={field => <Input {...field} aria-label={`Property ${index + 1} key`} placeholder="Key" />}
            />
          </div>
          <div className="flex-1">
            <FormField
              control={rowsControl}
              name={`properties.${index}.value`}
              render={field => <Input {...field} aria-label={`Property ${index + 1} value`} placeholder="Value" />}
            />
          </div>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            aria-label={`Remove property ${index + 1}`}
            onClick={() => remove(index)}
          />
        </div>
      ))}
    </section>
  );
}
