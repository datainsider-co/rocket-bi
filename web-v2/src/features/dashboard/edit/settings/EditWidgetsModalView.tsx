import type { JsonObject } from '@/core/json/json';
import { SettingsDialogView, type SettingsTab } from './SettingsDialogView';
import { PaddingAndBorderTab } from './tabs/PaddingAndBorderTab';
import { WidgetColorTab } from './tabs/WidgetColorTab';
import { WidgetTextTab } from './tabs/WidgetTextTab';

/** v1 `WidgetSettingModal` tabs; the text defaults are `TextStyleSetting.primaryDefault()` and `secondaryDefault()`. */
const TABS: readonly SettingsTab[] = [
  {
    key: 'primary_text',
    label: 'Primary Text',
    icon: 'di-icon-minimize-text',
    render: section => (
      <WidgetTextTab
        {...section}
        textKey="primary_text"
        description="Primary Text is used for chart title..."
        defaults={{ fontSize: '20px', fontWeight: '500', color: '#4f4f4f' }}
      />
    )
  },
  {
    key: 'secondary_text',
    label: 'Secondary Text',
    icon: 'di-icon-minimize-text',
    render: section => (
      <WidgetTextTab
        {...section}
        textKey="secondary_text"
        description="Secondary Text is used for descriptions, tooltips..."
        defaults={{ fontSize: '14px', fontWeight: 'normal', color: '#5f6368' }}
      />
    )
  },
  { key: 'padding_and_border', label: 'Padding and Border', icon: 'di-icon-border-all', render: section => <PaddingAndBorderTab {...section} /> },
  { key: 'background_color', label: 'Background color', icon: 'di-icon-color', render: section => <WidgetColorTab {...section} /> }
];

interface EditWidgetsModalViewProps {
  initial: JsonObject;
  onSubmit: (setting: JsonObject) => Promise<void>;
  onCancel: () => void;
}

/** v1 `WidgetSettingModal` "Widgets Settings", from the gear's Edit Widgets: what every widget looks like by default. */
export function EditWidgetsModalView(props: EditWidgetsModalViewProps) {
  return <SettingsDialogView id="widget-setting-modal" title="Widgets Settings" icon="di-icon-edit-dashboard" tabs={TABS} {...props} />;
}
