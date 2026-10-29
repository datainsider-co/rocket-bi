import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import { ActionMenuView } from '@/shared/menu/ActionMenuView';
import type { TableNode, TreeActions } from './fieldTree.utils';

interface TableHeaderViewProps {
  node: TableNode;
  open: boolean;
  onToggle: (key: string) => void;
  actions?: TreeActions;
}

/** A table's row: it opens and closes the table, and has the table's menu when there are actions. */
export function TableHeaderView({ node, open, onToggle, actions }: TableHeaderViewProps) {
  const toggle = (
    <button type="button" className="flex w-full cursor-pointer items-center gap-2 rounded border-0 bg-transparent px-2 py-1.5 text-left font-medium text-inherit hover:bg-black/5" aria-expanded={open} onClick={() => onToggle(node.key)}>
      {open ? <CaretDownOutlined aria-hidden /> : <CaretRightOutlined aria-hidden />}
      <i className="di-icon-table" aria-hidden />
      <span className="truncate">{node.title}</span>
    </button>
  );
  if (!actions) return toggle;
  return (
    <ActionMenuView items={actions.tableActionsOf(node.key)} target={node.title} onAction={action => actions.onTableAction(node.key, action)}>
      {toggle}
    </ActionMenuView>
  );
}
