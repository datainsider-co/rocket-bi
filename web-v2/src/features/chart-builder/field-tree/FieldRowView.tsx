import { FieldDraggable } from '@/shared/field-dnd/FieldDraggable';
import { columnActionsOf } from '../field-actions/fieldActions.utils';
import { ActionMenuView } from '@/shared/menu/ActionMenuView';
import { FieldLabelView } from './FieldLabelView';
import { expressionKindOf, fieldLookOf, type FieldNode, type FieldTreePayload, type TreeActions } from './fieldTree.utils';

/**
 * A column of the tree, dragged into the zones. Measures show a function icon (v1 `FunctionIcon`); measures and
 * calculated columns have a menu to edit or delete them.
 */
export function FieldRowView({ node, actions }: { node: FieldNode; actions?: TreeActions }) {
  const payload: FieldTreePayload = { kind: 'column', field: node.dropped };
  const kind = expressionKindOf(node);
  const row = (
    <FieldDraggable id={`field:${node.key}`} payload={payload}>
      <FieldLabelView look={fieldLookOf(node.dropped.field, node.title)} />
    </FieldDraggable>
  );
  if (!actions || !kind) return row;
  return (
    <ActionMenuView items={columnActionsOf(kind)} target={node.title} onAction={action => actions.onColumnAction(node, action)}>
      {row}
    </ActionMenuView>
  );
}
