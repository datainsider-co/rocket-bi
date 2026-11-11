import { ActionMenuView } from '@/shared/menu/ActionMenuView';
import type { TableNode, TreeActions } from './fieldTree.utils';

interface TableHeaderViewProps {
  node: TableNode;
  open: boolean;
  onToggle: (key: string) => void;
  actions?: TreeActions;
}

/** A table's row: it opens and closes the table, and has the table's menu, always in sight as in v1, when there are actions. */
export function TableHeaderView({ node, open, onToggle, actions }: TableHeaderViewProps) {
  const toggle = (
    <button type="button" className="field-tree__table" aria-expanded={open} title={node.title} onClick={() => onToggle(node.key)}>
      <i className={`field-tree__caret fa ${open ? 'fa-caret-down' : 'fa-caret-right'}`} aria-hidden />
      <i className="di-icon-table" aria-hidden />
      <span className="field-tree__name">{node.title}</span>
    </button>
  );
  if (!actions) return toggle;
  return (
    <ActionMenuView pinned items={actions.tableActionsOf(node.key)} target={node.title} onAction={action => actions.onTableAction(node.key, action)}>
      {toggle}
    </ActionMenuView>
  );
}
