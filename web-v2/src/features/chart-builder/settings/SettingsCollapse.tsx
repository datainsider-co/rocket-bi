import type { ReactNode } from 'react';
import { Collapse } from 'antd';
import './Settings.css';

interface SettingPanel {
  key: string;
  label: string;
  children: ReactNode;
}

interface SettingsCollapseProps {
  items: readonly SettingPanel[];
  /** The panels open at first. */
  defaultOpen: readonly string[];
}

/** v1's arrow before a panel's title: down while it is open. */
function renderArrow({ isActive }: { isActive?: boolean }) {
  return <img src={isActive ? '/icons/ic-16-arrow-down.svg' : '/icons/ic-16-arrow-up.svg'} alt="" width={16} height={16} />;
}

/** The settings' panels (v1 `PanelHeader` over a `b-collapse`): each opens on its title, an arrow before it (down while open, as in v1). */
export function SettingsCollapse({ items, defaultOpen }: SettingsCollapseProps) {
  return (
    <Collapse
      ghost
      defaultActiveKey={[...defaultOpen]}
      expandIcon={renderArrow}
      items={items.map(item => ({ ...item, label: <span className="chart-settings__panel-title">{item.label}</span> }))}
    />
  );
}
