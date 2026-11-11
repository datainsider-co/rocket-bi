import { Button, Modal } from 'antd';
import './dialogs.css';

/** v1's sweetalert backdrop, lighter than the modals'. */
const CONFIRM_STYLES = { mask: { background: 'rgba(0, 0, 0, 0.4)' } };

interface ConfirmDialogViewProps {
  title: string;
  message: string;
  okText?: string;
  cancelText?: string;
  /** OK is working. */
  busy?: boolean;
  onOk: () => void;
  onCancel: () => void;
}

/** v1's confirmation (`Modals.showConfirmationModal`): a warning sign, the question, and No and Yes sharing the width. */
export function ConfirmDialogView({ title, message, okText = 'Yes', cancelText = 'No', busy = false, onOk, onCancel }: ConfirmDialogViewProps) {
  return (
    <Modal open centered width={398} className="confirm-dialog" closable={false} footer={null} keyboard={!busy} mask={{ closable: false }} styles={CONFIRM_STYLES} onCancel={onCancel}>
      <div className="confirm-dialog__icon" aria-hidden>
        !
      </div>
      <h2 className="confirm-dialog__title">{title}</h2>
      <div className="confirm-dialog__message">{message}</div>
      <div className="confirm-dialog__actions">
        <Button disabled={busy} onClick={onCancel}>
          {cancelText}
        </Button>
        <Button type="primary" loading={busy} onClick={onOk}>
          {okText}
        </Button>
      </div>
    </Modal>
  );
}
