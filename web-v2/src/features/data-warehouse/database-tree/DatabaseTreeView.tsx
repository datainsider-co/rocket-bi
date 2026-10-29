import type { TreeHandlers, TreeSelection } from './databaseTree.utils';
import { CreateDatabaseModal } from './CreateDatabaseModal';
import { TreeBodyView } from './TreeBodyView';
import { TreeHeaderView } from './TreeHeaderView';
import type { DatabaseTreeModel } from './useDatabaseTree';

interface DatabaseTreeViewProps {
  model: DatabaseTreeModel;
  selection: TreeSelection;
  handlers: TreeHandlers;
}

/** The database panel of the Data Warehouse pages (v1 `DatabaseTreeView`). */
export function DatabaseTreeView({ model, selection, handlers }: DatabaseTreeViewProps) {
  const { data, expansion, search, create, onDatabaseClick } = model;
  return (
    <section aria-label="Database tree" className="flex h-full min-h-0 flex-col rounded-lg bg-white">
      <TreeHeaderView total={data.all.length} isRefreshing={data.isRefreshing} onRefresh={data.refresh} onCreate={create.open} search={search} />
      <div className="min-h-0 flex-1 overflow-auto">
        <TreeBodyView
          data={data}
          expansion={expansion}
          selection={selection}
          handlers={handlers}
          onDatabaseClick={onDatabaseClick}
          searching={search.isOpen && search.text.trim() !== ''}
        />
      </div>
      {create.isOpen && (
        <CreateDatabaseModal existing={data.all} isSubmitting={create.isSubmitting} error={create.error} onSubmit={create.submit} onCancel={create.close} />
      )}
    </section>
  );
}
