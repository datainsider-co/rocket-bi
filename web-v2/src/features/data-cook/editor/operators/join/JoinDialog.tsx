import type { JoinOperator } from '@/core/data-cook/EtlOperator';
import { dialogTexts, knownTable, type OperatorDialog } from '../operators.utils';
import { JoinFormDialog } from './JoinFormDialog';
import type { JoinDialogContext, JoinSides } from './useJoinDialog';

interface JoinDialogProps {
  dialog: OperatorDialog;
  context: JoinDialogContext;
  onCancel: () => void;
}

/** The tables a join reads: after a table, the table and one to pick; when edited, the two it reads (v1). */
function sidesOf(dialog: OperatorDialog, { graph, previews, dbName }: JoinDialogContext): JoinSides | undefined {
  if (dialog.mode === 'add') {
    const left = graph.operators.get(dialog.parent);
    return left && { left, leftTable: knownTable(previews, left, dbName), right: undefined, editing: undefined };
  }
  const editing = graph.operators.get(dialog.tblName);
  const [leftName = '', rightName = ''] = graph.parentNames.get(dialog.tblName) ?? [];
  const left = graph.operators.get(leftName);
  const right = graph.operators.get(rightName);
  if (editing?.kind !== 'join' || !left || !right) return undefined;
  return {
    left,
    leftTable: knownTable(previews, left, dbName),
    right: { operator: right, table: knownTable(previews, right, dbName), source: undefined },
    editing: editing satisfies JoinOperator
  };
}

/** Join Table after a table, or a join edited. */
export function JoinDialog({ dialog, context, onCancel }: JoinDialogProps) {
  const sides = sidesOf(dialog, context);
  if (!sides) return null;
  return <JoinFormDialog texts={dialogTexts(dialog)} sides={sides} context={context} onCancel={onCancel} />;
}
