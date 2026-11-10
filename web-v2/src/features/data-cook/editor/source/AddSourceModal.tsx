import type { AddSourceDialog } from './useAddSource';
import { WarehouseTablePicker } from './WarehouseTablePicker';

/** Add Source (v1 `SelectSourcePopover`): a click on a table of the tree adds it. */
export function AddSourceModal({ source }: { source: AddSourceDialog }) {
  return <WarehouseTablePicker title="Add Source" busy={source.isAdding} onPick={source.pick} onCancel={source.close} />;
}
