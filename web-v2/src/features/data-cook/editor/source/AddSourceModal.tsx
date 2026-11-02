import { Modal, Spin } from 'antd';
import { DatabaseTree } from '@/shared/database-tree/DatabaseTree';
import type { TreeHandlers } from '@/shared/database-tree/databaseTree.utils';
import type { AddSourceDialog } from './useAddSource';

/**
 * Add Source (v1 `SelectSourcePopover`): the database tree; a click on a table adds it. The tree's search finds
 * databases and tables, like v1's "Search databases & tables...".
 */
export function AddSourceModal({ source }: { source: AddSourceDialog }) {
  const handlers: TreeHandlers = { onSelectTable: source.pick };
  return (
    <Modal open centered title="Add Source" footer={null} width={480} onCancel={source.close} destroyOnHidden>
      <Spin spinning={source.isAdding}>
        <div className="flex h-[60vh] min-h-0 flex-col">
          <DatabaseTree handlers={handlers} />
        </div>
      </Spin>
    </Modal>
  );
}
