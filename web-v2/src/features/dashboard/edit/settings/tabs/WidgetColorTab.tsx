import type { SettingsSectionProps } from '../settingsSection';
import { ColorOpacityFields } from './ColorOpacityFields';

/** v1 `WidgetColorSetting`: every widget's background, unless the widget sets its own. */
export function WidgetColorTab({ draft, onChange }: SettingsSectionProps) {
  return (
    <div className="setting-tab">
      <p className="setting-tab__subtitle">Please choose a single color or a gradient.</p>
      <ColorOpacityFields draft={draft} path={['widget_setting', 'background']} name="Widget background" fallbackColor="#FFFFFF" onChange={onChange} />
    </div>
  );
}
