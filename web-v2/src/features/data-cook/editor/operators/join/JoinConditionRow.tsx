import { DeleteOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';
import type { TableSchema } from '@/core/schema/SchemaService';
import { conditionSign, type ConditionForm } from '../join.utils';

function columnOptions(table: TableSchema | undefined) {
  return (table?.columns ?? []).map(column => ({ value: column.name, label: column.displayName || column.name }));
}

interface JoinConditionRowProps {
  index: number;
  condition: ConditionForm;
  left: TableSchema;
  right: TableSchema | undefined;
  onRemove: (index: number) => void;
  onChange: (index: number, change: Partial<ConditionForm>) => void;
}

/** One condition: the column of each table, its sign between, and Remove. Cells of the grid of `JoinConditionsView`. */
export function JoinConditionRow({ index, condition, left, right, onRemove, onChange }: JoinConditionRowProps) {
  return (
    <>
      <Select
        aria-label={`Left field ${index + 1}`}
        placeholder="Select field"
        showSearch={{ optionFilterProp: 'label' }}
        value={condition.left}
        options={columnOptions(left)}
        onChange={value => onChange(index, { left: value })}
      />
      <span className="text-center text-base text-black/45">{conditionSign(condition.type)}</span>
      <Select
        aria-label={`Right field ${index + 1}`}
        placeholder="Select field"
        showSearch={{ optionFilterProp: 'label' }}
        value={condition.right}
        disabled={!right}
        options={columnOptions(right)}
        onChange={value => onChange(index, { right: value })}
      />
      <Button type="text" icon={<DeleteOutlined />} aria-label={`Remove join clause ${index + 1}`} onClick={() => onRemove(index)} />
    </>
  );
}
