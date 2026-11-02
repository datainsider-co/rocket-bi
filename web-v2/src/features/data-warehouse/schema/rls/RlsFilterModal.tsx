import type { JsonObject } from '@/core/json/json';
import type { TableSchema } from '@/core/schema/SchemaService';
import { RlsFilterModalView } from './RlsFilterModalView';
import { useRlsFilter } from './useRlsFilter';

interface RlsFilterModalProps {
  table: TableSchema;
  /** The policy's conditions when the editor opened. */
  conditions: readonly JsonObject[];
  onApply: (conditions: readonly JsonObject[]) => void;
  onCancel: () => void;
}

/** Edits a policy's Custom filter; mount it per opening so it starts from the policy. */
export function RlsFilterModal({ table, conditions, onApply, onCancel }: RlsFilterModalProps) {
  const filter = useRlsFilter(conditions, table);
  return <RlsFilterModalView title={`Custom filter on ${table.displayName || table.name}`} filter={filter} onApply={() => onApply(filter.conditions)} onCancel={onCancel} />;
}
