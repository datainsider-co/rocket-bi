import type { MouseEvent } from 'react';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Table, Tooltip } from 'antd';
import type { SchemaColumn } from '@/core/schema/SchemaService';
import { columnTypeLabel } from '../schema.utils';

interface FormulaColumnsViewProps {
  /** After the search. */
  columns: readonly SchemaColumn[];
  /** Before the search, for the header and the empty text. */
  total: number;
  emptyText: string;
  onEdit: (column: SchemaColumn) => void;
  onDelete: (column: SchemaColumn) => void;
}

const DASH = '--';

/** The row edits on click; its buttons must not reach it. */
function run(event: MouseEvent, action: () => void) {
  event.stopPropagation();
  action();
}

/**
 * The Measure Schema or Calculated Field tab (v1 `MeasureFieldManagement`, `CalculatedFieldManagement`): one row per
 * formula, a click edits it. v2 shows the formula; v1's Nullable, Default Value and Encryption are the same for all.
 */
export function FormulaColumnsView({ columns, total, emptyText, onEdit, onDelete }: FormulaColumnsViewProps) {
  return (
    <Table<SchemaColumn>
      rowKey="name"
      dataSource={[...columns]}
      pagination={false}
      size="middle"
      locale={{ emptyText: total === 0 ? emptyText : 'No columns found' }}
      onRow={column => ({ onClick: () => onEdit(column), className: 'cursor-pointer' })}
      columns={[
        { key: 'name', title: `Column (${total})`, dataIndex: 'name', ellipsis: true },
        { key: 'displayName', title: 'Display Name', dataIndex: 'displayName', ellipsis: true },
        { key: 'type', title: 'Type', width: 120, render: (_, column) => columnTypeLabel(column.type) },
        { key: 'expression', title: 'Expression', ellipsis: true, render: (_, column) => <code className="text-xs">{column.expression ?? DASH}</code> },
        { key: 'description', title: 'Description', ellipsis: true, responsive: ['lg'], render: (_, column) => column.description || DASH },
        {
          key: 'action',
          title: 'Action',
          width: 96,
          render: (_, column) => (
            <span className="flex gap-1">
              <Tooltip title="Edit">
                <Button type="text" size="small" icon={<EditOutlined />} aria-label={`Edit ${column.displayName}`} onClick={event => run(event, () => onEdit(column))} />
              </Tooltip>
              <Tooltip title="Delete">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label={`Delete ${column.displayName}`} onClick={event => run(event, () => onDelete(column))} />
              </Tooltip>
            </span>
          )
        }
      ]}
    />
  );
}
