import { ErrorState } from '@/shared/status/ErrorState';
import { Loading } from '@/shared/status/Loading';
import { FieldTreeEmptyView } from './FieldTreeEmptyView';
import type { TreeTables } from './fieldTree.utils';
import { FieldRowView } from './FieldRowView';
import { NestedFieldsView } from './NestedFieldsView';
import { TableHeaderView } from './TableHeaderView';

/** The tables of the picked database, each opening on its columns (v1 `SlVueTree` in `DatabaseListing`). */
export function TableTreeView({ tables, searching = false }: { tables: TreeTables; searching?: boolean }) {
  const { nodes, expanded, onToggle, status, error, actions } = tables;
  if (status === 'loading') {
    return (
      <div className="field-tree__status">
        <Loading />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="field-tree__status">
        <ErrorState message={error} />
      </div>
    );
  }
  if (nodes.length === 0) return <FieldTreeEmptyView listing="database" searching={searching} />;
  return (
    <ul className="field-tree__list" aria-label="Tables">
      {nodes.map(node => {
        const open = expanded.has(node.key);
        return (
          <li key={node.key}>
            <TableHeaderView node={node} open={open} onToggle={onToggle} actions={actions} />
            {open && (
              <div className="field-tree__children">
                {node.items.map(item => (item.kind === 'field' ? <FieldRowView key={item.key} node={item} actions={actions} /> : <NestedFieldsView key={item.key} node={item} />))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
