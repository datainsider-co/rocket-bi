import { Form } from 'antd';
import { useController, useWatch } from 'react-hook-form';
import type { TableSchema } from '@/core/schema/SchemaService';
import type { PolicyCellProps } from './PolicyConditionCell';
import { PolicyFilterButton } from './PolicyFilterButton';
import { conditionsOfKind, filterKindOf } from './rls.utils';
import { describeFilter } from './rlsFilter.utils';

interface FilterCellProps extends PolicyCellProps {
  table: TableSchema;
  /** Custom... was picked: the filter editor opens on this row. */
  onCustom: (index: number) => void;
}

/** What the users of row `index` see: View All and View Nothing are set here, Custom opens the filter editor. */
export function PolicyFilterCell({ control, index, table, onCustom }: FilterCellProps) {
  const { field, fieldState } = useController({ control, name: `policies.${index}.conditions` });
  const conditions = useWatch({ control, name: `policies.${index}.conditions` });
  const error = fieldState.error?.message;
  return (
    <Form.Item className="mb-0" validateStatus={error ? 'error' : undefined} help={error}>
      <PolicyFilterButton
        kind={filterKindOf(conditions)}
        summary={describeFilter(conditions, table)}
        ariaLabel={`Rows seen by policy ${index + 1}`}
        onPick={choice => (choice === 'custom' ? onCustom(index) : field.onChange(conditionsOfKind(choice)))}
      />
    </Form.Item>
  );
}
