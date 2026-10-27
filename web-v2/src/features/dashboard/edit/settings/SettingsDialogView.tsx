import { useState, type ReactNode } from 'react';
import { Button, Modal, Tabs } from 'antd';
import type { JsonObject } from '@/core/json/json';
import { dashboardPageContainer } from '../../theme/popupContainer';
import { useSettingSubmit } from './useSettingSubmit';
import type { SettingsSectionProps } from './settingsSection';
import './settings.css';

export interface SettingsTab {
  key: string;
  label: string;
  /** A v1 icon font class. */
  icon: string;
  render: (section: SettingsSectionProps) => ReactNode;
}

interface SettingsDialogViewProps {
  /** Lets tests and styles tell the dialogs apart (v1 `#edit-dashboard-setting`, `#widget-setting-modal`). */
  id: string;
  title: string;
  /** A v1 icon font class, before the title. */
  icon: string;
  tabs: readonly SettingsTab[];
  /** `settingDraft` of the dashboard. */
  initial: JsonObject;
  onSubmit: (setting: JsonObject) => Promise<void>;
  onCancel: () => void;
}

/**
 * v1 `DiCustomModal` with a `DiTab`, as Edit Dashboard and Edit Widgets use it: an icon and a title, tabs of the same
 * draft, Cancel and Save. Every tab edits one copy of the setting, saved whole.
 */
export function SettingsDialogView({ id, title, icon, tabs, initial, onSubmit, onCancel }: SettingsDialogViewProps) {
  const [draft, setDraft] = useState(initial);
  const { saving, error, submit } = useSettingSubmit(onSubmit);
  return (
    <Modal
      open
      centered
      width={800}
      closable={false}
      maskClosable={!saving}
      keyboard={!saving}
      onCancel={onCancel}
      getContainer={dashboardPageContainer}
      classNames={{ root: `setting-dialog setting-dialog--${id}` }}
      title={
        <span id={id} className="setting-dialog__title">
          <i className={icon} aria-hidden />
          {title}
        </span>
      }
      footer={
        <div className="setting-dialog__footer">
          {error && <span className="setting-dialog__error">{error}</span>}
          <Button className="setting-dialog__cancel" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" className="setting-dialog__ok" loading={saving} onClick={() => void submit(draft)}>
            Save
          </Button>
        </div>
      }
    >
      <Tabs
        className="setting-dialog__tabs"
        items={tabs.map(({ key, label, icon: tabIcon, render }) => ({
          key,
          label,
          icon: <i className={tabIcon} aria-hidden />,
          children: render({ draft, onChange: setDraft })
        }))}
      />
    </Modal>
  );
}
