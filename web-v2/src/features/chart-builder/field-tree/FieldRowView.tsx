import { FunctionOutlined } from '@ant-design/icons';
import { FieldDraggable } from '@/shared/field-dnd/FieldDraggable';
import { ColumnTypeIcon } from '@/shared/schema/ColumnTypeIcon';
import { columnActionsOf } from '../field-actions/fieldActions.utils';
import { ActionMenuView } from './ActionMenuView';
import { expressionKindOf, type FieldNode, type FieldTreePayload, type TreeActions } from './fieldTree.utils';

/**
 * A column of the tree, dragged into the zones. Measures show a function icon (v1 `FunctionIcon`); measures and
 * calculated columns have a menu to edit or delete them.
 */
export function FieldRowView({ node, actions }: { node: FieldNode; actions?: TreeActions }) {
  const payload: FieldTreePayload = { kind: 'column', field: node.dropped };
  const kind = expressionKindOf(node);
  const row = (
    <FieldDraggable id={`field:${node.key}`} payload={payload}>
      <div className="flex cursor-grab items-center gap-2 rounded px-2 py-1.5 hover:bg-black/5" title={node.title}>
        {node.role === 'measure' ? <FunctionOutlined className="shrink-0 text-[var(--color-brand)]" aria-hidden /> : <ColumnTypeIcon type={node.type} />}
        <span className={`truncate ${node.role === 'column' ? '' : 'italic'}`}>{node.title}</span>
      </div>
    </FieldDraggable>
  );
  if (!actions || !kind) return row;
  return (
    <ActionMenuView items={columnActionsOf(kind)} target={node.title} onAction={action => actions.onColumnAction(node, action)}>
      {row}
    </ActionMenuView>
  );
}
