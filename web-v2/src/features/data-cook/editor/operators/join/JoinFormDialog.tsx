import { JoinDialogView } from './JoinDialogView';
import { useJoinDialog, type JoinDialogContext, type JoinSides } from './useJoinDialog';

interface JoinFormDialogProps {
  texts: { title: string; okText: string };
  sides: JoinSides;
  context: JoinDialogContext;
  onCancel: () => void;
}

/** The dialog on its form; mounted once per dialog, so the form starts from the join edited. */
export function JoinFormDialog({ texts, sides, context, onCancel }: JoinFormDialogProps) {
  const join = useJoinDialog(sides, context);
  return <JoinDialogView texts={texts} leftTable={sides.leftTable} canPickRight={!sides.editing} join={join} onCancel={onCancel} />;
}
