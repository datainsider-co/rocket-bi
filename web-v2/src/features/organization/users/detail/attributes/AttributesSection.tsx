import { Button, Empty, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { toAttributeRows, type AttributeRow } from './attributes.utils';

interface AttributesSectionProps {
  properties: Readonly<Record<string, string>>;
  canEdit: boolean;
  onAdd: () => void;
  onEdit: (row: AttributeRow) => void;
  onDelete: (row: AttributeRow) => void;
}

/** v1's ATTRIBUTES: the user's own fields, which row level security reads. */
export function AttributesSection({ properties, canEdit, onAdd, onEdit, onDelete }: AttributesSectionProps) {
  const rows = toAttributeRows(properties);

  return (
    <section aria-label="Attributes">
      <div className="mb-2 flex items-center justify-between">
        <Typography.Text strong>Attributes</Typography.Text>
        {canEdit && (
          <Button size="small" icon={<PlusOutlined />} onClick={onAdd}>
            Add Attribute
          </Button>
        )}
      </div>
      {rows.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No attributes" />}
      <ul className="m-0 list-none p-0">
        {rows.map(row => (
          <li key={row.key} className="flex items-center gap-2 border-b border-gray-100 py-1.5 last:border-b-0">
            <span className="w-2/5 truncate text-gray-500" title={row.key}>
              {row.key}
            </span>
            <span className="min-w-0 flex-1 truncate" title={row.value}>
              {row.value}
            </span>
            {canEdit && (
              <>
                <Button type="text" size="small" aria-label={`Edit ${row.key}`} icon={<EditOutlined />} onClick={() => onEdit(row)} />
                <Button
                  type="text"
                  size="small"
                  danger
                  aria-label={`Delete ${row.key}`}
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(row)}
                />
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
