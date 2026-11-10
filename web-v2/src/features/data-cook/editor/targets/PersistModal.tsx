import type { PersistDialogModel } from './usePersistDialog';
import { PersistModalView } from './PersistModalView';
import { usePersistForm } from './usePersistForm';

/** Save To Data Warehouse of the table the dialog is open on; mounted per opening, so the form starts from it. */
export function PersistModal({ dialog }: { dialog: PersistDialogModel }) {
  const form = usePersistForm(dialog.persist, dialog.submit);
  return <PersistModalView okText={dialog.persist ? 'Update' : 'Add'} form={form} onCancel={dialog.close} />;
}
