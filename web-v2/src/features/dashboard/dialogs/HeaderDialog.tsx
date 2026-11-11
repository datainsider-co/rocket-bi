import type { ReactNode } from 'react';
import { Button, Modal } from 'antd';
import './dialogs.css';

interface HeaderDialogProps {
  title: string;
  /** Under the title; the title is then larger (v1 `AddChartModal`, `SortModal`). */
  subtitle?: string;
  actionName: string;
  width: number;
  /** v1 `EtlModal` is grey around white panels unless `secondary-background-color`. */
  grey?: boolean;
  className?: string;
  disabled?: boolean;
  saving?: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  children: ReactNode;
}

/** v1 `EtlModal`: the title on the left of the header, Cancel and the action on its right, and no footer. */
export function HeaderDialog({ title, subtitle, actionName, width, grey = false, className = '', disabled = false, saving = false, onSubmit, onCancel, children }: HeaderDialogProps) {
  return (
    <Modal
      open
      centered
      width={width}
      className={`header-dialog ${grey ? 'header-dialog--grey' : ''} ${className}`}
      closable={false}
      footer={null}
      keyboard={!saving}
      mask={{ closable: !saving }}
      onCancel={onCancel}
      title={
        <div className="header-dialog__header">
          <div className="header-dialog__titles">
            <div className={subtitle ? 'header-dialog__title header-dialog__title--large' : 'header-dialog__title'}>{title}</div>
            {subtitle && <div className="header-dialog__subtitle">{subtitle}</div>}
          </div>
          <Button className="header-dialog__cancel" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" className="header-dialog__submit" disabled={disabled} loading={saving} onClick={onSubmit}>
            {actionName}
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  );
}
