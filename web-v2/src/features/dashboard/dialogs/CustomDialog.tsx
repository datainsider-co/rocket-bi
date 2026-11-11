import type { ReactNode } from 'react';
import { Modal } from 'antd';
import './dialogs.css';

interface CustomDialogProps {
  title: ReactNode;
  okText: string;
  cancelText?: string;
  width?: number;
  className?: string;
  okDisabled?: boolean;
  /** OK is working: it spins, and the dialog can't be dismissed. */
  saving?: boolean;
  onOk: () => void;
  onCancel: () => void;
  children: ReactNode;
}

/**
 * v1 `DiCustomModal` without its close button, as the small dialogs use it: a title, the fields, and Cancel and OK
 * sharing the footer. Fields inside take v1's grey input look (`custom-dialog__label` over an antd `Input`).
 */
export function CustomDialog({ title, okText, cancelText = 'Cancel', width = 500, className = '', okDisabled = false, saving = false, onOk, onCancel, children }: CustomDialogProps) {
  return (
    <Modal
      open
      centered
      width={width}
      className={`custom-dialog ${className}`}
      title={title}
      closable={false}
      keyboard={!saving}
      mask={{ closable: !saving }}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ disabled: okDisabled, loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onOk={onOk}
      onCancel={onCancel}
    >
      {children}
    </Modal>
  );
}
