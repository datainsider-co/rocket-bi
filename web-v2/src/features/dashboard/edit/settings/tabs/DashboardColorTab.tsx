import type { SettingsSectionProps } from '../settingsSection';
import { ColorOpacityFields } from './ColorOpacityFields';

/** v1 `DashboardColorSetting`: the dashboard's background color. */
export function DashboardColorTab({ draft, onChange }: SettingsSectionProps) {
  return (
    <div className="setting-tab">
      <h6 className="setting-tab__title">Dashboard Color</h6>
      <p className="setting-tab__subtitle">Please choose a single color or a gradient.</p>
      <ColorOpacityFields draft={draft} path={['background']} name="Dashboard" fallbackColor="#FAFAFB" onChange={onChange} />
    </div>
  );
}
