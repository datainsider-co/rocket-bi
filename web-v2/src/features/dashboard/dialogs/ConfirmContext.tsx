import { createContext, use, useCallback, useState, type ReactNode } from 'react';
import { DialogScope } from '../theme/DialogScope';
import { ConfirmDialogView } from './ConfirmDialogView';

export interface ConfirmRequest {
  title: string;
  message: string;
  okText?: string;
  cancelText?: string;
  /** The dialog stays, busy, until this settles. */
  onOk: () => void | Promise<void>;
  onCancel?: () => void;
}

type Confirm = (request: ConfirmRequest) => void;

const ConfirmContext = createContext<Confirm | null>(null);

/** Asks the dashboard page's yes or no questions, one at a time, in the dialogs' look (`DialogScope`). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest>();
  const [busy, setBusy] = useState(false);
  const confirm = useCallback<Confirm>(next => setRequest(next), []);

  const accept = async () => {
    if (!request) return;
    setBusy(true);
    try {
      await request.onOk();
    } finally {
      setBusy(false);
      setRequest(undefined);
    }
  };
  const decline = () => {
    request?.onCancel?.();
    setRequest(undefined);
  };

  return (
    <ConfirmContext value={confirm}>
      {children}
      {request && (
        <DialogScope>
          <ConfirmDialogView title={request.title} message={request.message} okText={request.okText} cancelText={request.cancelText} busy={busy} onOk={() => void accept()} onCancel={decline} />
        </DialogScope>
      )}
    </ConfirmContext>
  );
}

export function useConfirm(): Confirm {
  const confirm = use(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider');
  return confirm;
}
