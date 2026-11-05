import { Modal, Spin } from 'antd';
import { DatabaseTree } from '@/shared/database-tree/DatabaseTree';
import type { TreeHandlers, TreeTable } from '@/shared/database-tree/databaseTree.utils';

interface WarehouseTablePickerProps {
  title: string;
  busy: boolean;
  onPick: (table: TreeTable) => void;
  onCancel: () => void;
}

/**
 * The database tree in a dialog (v1 `SelectSourcePopover`, `SelectSource`); a click on a table picks it. The tree's
 * search finds databases and tables, like v1's "Search databases & tables...".
 */
export function WarehouseTablePicker({ title, busy, onPick, onCancel }: WarehouseTablePickerProps) {
  const handlers: TreeHandlers = { onSelectTable: onPick };
  return (
    <Modal open centered title={title} footer={null} width={480} onCancel={onCancel} destroyOnHidden>
      <Spin spinning={busy}>
        <div className="flex h-[60vh] min-h-0 flex-col">
          <DatabaseTree handlers={handlers} />
        </div>
      </Spin>
    </Modal>
  );
}
