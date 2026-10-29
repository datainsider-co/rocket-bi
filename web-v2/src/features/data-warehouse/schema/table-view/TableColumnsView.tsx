import { CheckOutlined } from '@ant-design/icons';
import { Table } from 'antd';
import type { ColumnDefinition } from '@/core/schema/TableDefinition';
import { columnTypeLabel } from '../schema.utils';

const DASH = '--';

/** The Table Schema tab (v1 `FieldManagement` in view mode): one row per column, in the table's order. */
export function TableColumnsView({ columns, total }: { columns: readonly ColumnDefinition[]; total: number }) {
  return (
    <Table<ColumnDefinition>
      rowKey="name"
      dataSource={[...columns]}
      pagination={false}
      size="middle"
      locale={{ emptyText: total === 0 ? 'This table has no columns' : 'No columns found' }}
      columns={[
        { key: 'name', title: `Column (${total})`, dataIndex: 'name', ellipsis: true },
        { key: 'displayName', title: 'Display Name', dataIndex: 'displayName', ellipsis: true },
        {
          key: 'nullable',
          title: 'Nullable',
          width: 90,
          align: 'center',
          render: (_, column) => (column.isNullable ? <CheckOutlined className="text-[var(--color-brand)]" aria-label="Nullable" /> : null)
        },
        { key: 'type', title: 'Type', width: 120, render: (_, column) => columnTypeLabel(column.type) },
        { key: 'description', title: 'Description', ellipsis: true, responsive: ['md'], render: (_, column) => column.description || DASH },
        {
          key: 'defaultValue',
          title: 'Default Value',
          width: 140,
          ellipsis: true,
          responsive: ['md'],
          render: (_, column) => (column.defaultValue === undefined ? DASH : String(column.defaultValue))
        }
      ]}
    />
  );
}
