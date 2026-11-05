import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Select, Table, type TableColumnsType } from 'antd';
import { AS_TYPES, sampleValues, type FieldRow } from '../manageFields.utils';
import type { FieldsSample } from './useFieldsSample';

interface FieldsTableViewProps {
  rows: readonly FieldRow[];
  sample: FieldsSample;
  onAsType: (row: FieldRow, asType: string | undefined) => void;
  onEdit: (row: FieldRow) => void;
  onToggle: (row: FieldRow) => void;
  onRemove: (index: number) => void;
}

/** An expression's type may stay Auto: the server keeps what the expression gives. */
const AUTO = '__auto';
const EXPRESSION_TYPES = [{ value: AUTO, label: 'Auto' }, ...AS_TYPES];

function rowKey(row: FieldRow): string {
  return `${row.kind}:${row.index}`;
}

/** v1's table of fields: a row each, its name, its type, a few of its values and what can be done with it. */
export function FieldsTableView({ rows, sample, onAsType, onEdit, onToggle, onRemove }: FieldsTableViewProps) {
  const samples = sample.response?.records.length ?? 0;
  const columns: TableColumnsType<FieldRow> = [
    {
      key: 'field',
      title: 'Field',
      fixed: 'left',
      width: 180,
      render: (_, row) => <strong className={row.field.isHidden ? 'opacity-50' : undefined}>{row.field.displayName}</strong>
    },
    {
      key: 'type',
      title: 'Type',
      width: 150,
      render: (_, row) => (
        <Select
          className="w-full"
          size="small"
          aria-label={`Type of ${row.field.displayName}`}
          disabled={row.field.isHidden}
          value={row.field.asType ?? (row.kind === 'expression' ? AUTO : undefined)}
          options={row.kind === 'expression' ? EXPRESSION_TYPES : [...AS_TYPES]}
          onChange={(value: string) => onAsType(row, value === AUTO ? undefined : value)}
        />
      )
    },
    ...Array.from({ length: samples }, (_item, index) => ({
      key: `sample-${index}`,
      title: '',
      width: 140,
      ellipsis: true,
      render: (_value: unknown, row: FieldRow) => (
        <span className={row.field.isHidden ? 'opacity-50' : undefined}>{sample.response ? (sampleValues(sample.response.headers, sample.response.records, row.field.displayName)[index] ?? '--') : '--'}</span>
      )
    })),
    {
      key: 'actions',
      title: 'Action',
      fixed: 'right',
      width: 120,
      render: (_, row) => (
        <span className="flex gap-1">
          <Button type="text" size="small" icon={<EditOutlined />} disabled={row.field.isHidden} aria-label={`Edit ${row.field.displayName}`} onClick={() => onEdit(row)} />
          <Button
            type="text"
            size="small"
            icon={row.field.isHidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            aria-label={`${row.field.isHidden ? 'Show' : 'Hide'} ${row.field.displayName}`}
            onClick={() => onToggle(row)}
          />
          {row.kind === 'expression' && (
            <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label={`Delete ${row.field.displayName}`} onClick={() => onRemove(row.index)} />
          )}
        </span>
      )
    }
  ];

  return (
    <Table<FieldRow>
      rowKey={rowKey}
      size="small"
      dataSource={[...rows]}
      columns={columns}
      pagination={false}
      loading={sample.isFetching}
      scroll={{ x: 'max-content', y: '45vh' }}
      locale={{ emptyText: 'No fields found' }}
    />
  );
}
