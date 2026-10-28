import { Spin } from 'antd';
import type { TreeTables } from './fieldTree.utils';
import { FieldRowView } from './FieldRowView';
import { NestedFieldsView } from './NestedFieldsView';
import { TableHeaderView } from './TableHeaderView';

/** The tables of the picked database, each opening on its columns (v1 `SlVueTree` in `DatabaseListing`). */
export function TableTreeView({ tables }: { tables: TreeTables }) {
  const { nodes, expanded, onToggle, status, error, actions } = tables;
  if (status === 'loading') return <Spin className="mt-6 block" />;
  if (status === 'error') return <p className="m-2 text-[var(--ant-color-error,#ff4d4f)]">{error}</p>;
  if (nodes.length === 0) return <p className="m-2 text-black/45">No fields available</p>;
  return (
    <ul className="m-0 list-none p-0" aria-label="Tables">
      {nodes.map(node => {
        const open = expanded.has(node.key);
        return (
          <li key={node.key}>
            <TableHeaderView node={node} open={open} onToggle={onToggle} actions={actions} />
            {open && (
              <div className="pl-4">
                {node.items.map(item => (item.kind === 'field' ? <FieldRowView key={item.key} node={item} actions={actions} /> : <NestedFieldsView key={item.key} node={item} />))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
