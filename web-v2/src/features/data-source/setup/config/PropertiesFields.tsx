import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Typography } from 'antd';
import { useFieldArray } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import type { ConnectionFormValues } from './connectionForm.utils';

/** Extra JDBC properties, sent as a map. Keys are kept as typed (only trimmed). */
export function PropertiesFields({ control }: { control: Control<ConnectionFormValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'properties' });

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
              control={control}
              name={`properties.${index}.key`}
              render={field => <Input {...field} aria-label={`Property ${index + 1} key`} placeholder="Key" />}
            />
          </div>
          <div className="flex-1">
            <FormField
              control={control}
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
