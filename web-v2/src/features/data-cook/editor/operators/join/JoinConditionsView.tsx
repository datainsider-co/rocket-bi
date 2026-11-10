import { PlusOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import type { TableSchema } from '@/core/schema/SchemaService';
import type { ConditionForm } from '../join.utils';
import { tableTitle } from '../operators.utils';
import { JoinConditionRow } from './JoinConditionRow';

interface JoinConditionsViewProps {
  left: TableSchema;
  right: TableSchema | undefined;
  conditions: readonly ConditionForm[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, change: Partial<ConditionForm>) => void;
}

/** v1 "Applied Join Clauses": a column of each table per row, with its sign between. */
export function JoinConditionsView({ left, right, conditions, onAdd, onRemove, onChange }: JoinConditionsViewProps) {
  return (
    <section aria-label="Applied Join Clauses">
      <div className="mb-2 flex items-center">
        <Typography.Text strong>Applied Join Clauses</Typography.Text>
        <Button className="ml-auto" size="small" icon={<PlusOutlined />} aria-label="Add a join clause" onClick={onAdd} />
      </div>
      {conditions.length === 0 ? (
        <div className="py-3 text-center">
          <Button onClick={onAdd}>Add a Join clause to create a Join</Button>
        </div>
      ) : (
        <div className="grid max-h-[300px] grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px] items-center gap-2 overflow-auto">
          <Typography.Text type="secondary" ellipsis>
            <i className="di-icon-table mr-1" />
            {tableTitle(left)}
          </Typography.Text>
          <span />
          <Typography.Text type="secondary" ellipsis>
            <i className="di-icon-table mr-1" />
            {right ? tableTitle(right) : '--'}
          </Typography.Text>
          <span />
          {conditions.map((condition, index) => (
            // Conditions have no id; a row is its place.
            <JoinConditionRow key={index} index={index} condition={condition} left={left} right={right} onRemove={onRemove} onChange={onChange} />
          ))}
        </div>
      )}
    </section>
  );
}
