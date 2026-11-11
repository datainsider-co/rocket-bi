import { useState } from 'react';
import type { TabWidget } from '@/core/dashboard/Widget';
import { AlignSetting } from '@/shared/settings/fields/AlignSetting';
import { ColorSetting } from '@/shared/settings/fields/ColorSetting';
import { RevertButton } from '@/shared/settings/fields/RevertButton';
import { SelectSetting } from '@/shared/settings/fields/SelectSetting';
import { TextSetting } from '@/shared/settings/fields/TextSetting';
import { SettingsCollapse } from '@/shared/settings/SettingsCollapse';
import { HeaderDialog } from '../dialogs/HeaderDialog';
import { getDashboardTheme } from '../theme/dashboardThemes';
import { DEFAULT_PANEL_HEADER, DEFAULT_TAB_HEADER, tabHeaderStyleOf, type TabHeaderStyle } from '../widgets/tab/tabWidget.utils';
import { FONT_FAMILIES, FONT_SIZES } from './settings/settingOptions';
import { applyButtonStyleOf, DEFAULT_APPLY_BUTTON, type ApplyButtonStyle } from './tabEdit.utils';
import { TabStylePreview } from './TabStylePreview';
import './editDialogs.css';

const POSITIONS = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' }
] as const;

interface TabStyleModalViewProps {
  widget: TabWidget;
  /** `setting.theme_name`: the preview shows the widget on the dashboard's theme. */
  themeName: string;
  onSubmit: (header: TabHeaderStyle, apply?: ApplyButtonStyle) => Promise<void>;
  onCancel: () => void;
}

type SetHeader = <K extends keyof TabHeaderStyle>(key: K) => (value: TabHeaderStyle[K]) => void;

/** The header's font: its family, then its color and size on a row (v1 `TabWidgetSetting`, `FilterPanelHeaderTab`). */
function HeaderFontFields({ header, set }: { header: TabHeaderStyle; set: SetHeader }) {
  return (
    <>
      <SelectSetting label="Font family" options={FONT_FAMILIES} value={header.fontFamily} onChange={set('fontFamily')} />
      <div className="settings-row settings-row--end">
        <ColorSetting label="Font color" value={header.color} onChange={set('color')} />
        <SelectSetting className="settings-size" label="Text size" options={FONT_SIZES} value={header.fontSize} onChange={set('fontSize')} />
      </div>
    </>
  );
}

/**
 * v1 `TabSettingModal`: the widget as it will look on the left, its settings on the right (`TabWidgetSetting` for a tab
 * widget, `FilterPanelSetting`'s Header, Apply and Background panels for a filter panel), Cancel and Save in the header.
 */
export function TabStyleModalView({ widget, themeName, onSubmit, onCancel }: TabStyleModalViewProps) {
  const isPanel = widget.kind === 'filter_panel';
  const [header, setHeader] = useState(() => tabHeaderStyleOf(widget));
  const [apply, setApply] = useState(() => (isPanel ? applyButtonStyleOf(widget) : undefined));
  const [saving, setSaving] = useState(false);
  const set: SetHeader = key => value => setHeader(current => ({ ...current, [key]: value }));
  const setApplyKey =
    <K extends keyof ApplyButtonStyle>(key: K) =>
    (value: ApplyButtonStyle[K]) =>
      setApply(current => current && { ...current, [key]: value });

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(header, apply);
    } finally {
      setSaving(false);
    }
  };

  const tabSettings = (
    <div className="settings-stack">
      <SelectSetting label="Position" options={POSITIONS} value={header.position} onChange={set('position')} />
      <HeaderFontFields header={header} set={set} />
      <div className="settings-row tab-style__halves">
        <ColorSetting label="Background active" className="tab-style__half" value={header.activeBackground} onChange={set('activeBackground')} />
        <ColorSetting label="Background inactive" className="tab-style__half" value={header.inactiveBackground} onChange={set('inactiveBackground')} />
      </div>
      <RevertButton onRevert={() => setHeader(DEFAULT_TAB_HEADER)} />
    </div>
  );

  const panelSettings = apply && (
    <SettingsCollapse
      defaultOpen={['header', 'apply', 'background']}
      items={[
        {
          key: 'header',
          label: 'Header',
          children: (
            <div className="settings-stack">
              <HeaderFontFields header={header} set={set} />
              <RevertButton onRevert={() => setHeader(current => ({ ...DEFAULT_PANEL_HEADER, activeBackground: current.activeBackground }))} />
            </div>
          )
        },
        {
          key: 'apply',
          label: 'Apply',
          children: (
            <div className="settings-stack">
              <TextSetting label="Footer title" placeholder="Input footer title..." value={apply.title} onChange={setApplyKey('title')} />
              <SelectSetting label="Font family" options={FONT_FAMILIES} value={apply.fontFamily} onChange={setApplyKey('fontFamily')} />
              <div className="settings-row settings-row--end">
                <ColorSetting label="Font color" value={apply.color} onChange={setApplyKey('color')} />
                <SelectSetting className="settings-size" label="Text size" options={FONT_SIZES} value={apply.fontSize} onChange={setApplyKey('fontSize')} />
                <AlignSetting label="Alignment" value={apply.align} onChange={setApplyKey('align')} />
              </div>
              <ColorSetting label="Apply Background" className="tab-style__half" value={apply.background} onChange={setApplyKey('background')} />
              <RevertButton onRevert={() => setApply(DEFAULT_APPLY_BUTTON)} />
            </div>
          )
        },
        {
          key: 'background',
          label: 'Background',
          children: (
            <div className="settings-stack">
              <ColorSetting label="Background" className="tab-style__half" value={header.activeBackground} onChange={set('activeBackground')} />
              <RevertButton onRevert={() => set('activeBackground')(DEFAULT_PANEL_HEADER.activeBackground)} />
            </div>
          )
        }
      ]}
    />
  );

  return (
    <HeaderDialog title={isPanel ? 'Config' : 'Config Tab'} actionName="Save" width={1200} grey className="tab-style-dialog" saving={saving} onSubmit={() => void submit()} onCancel={onCancel}>
      <div className="tab-style">
        <div className="tab-style__preview dashboard-theme" data-dashboard-theme={getDashboardTheme(themeName).cssName}>
          <TabStylePreview widget={widget} header={header} apply={apply} />
        </div>
        <div className="tab-style__settings chart-settings">{isPanel ? panelSettings : tabSettings}</div>
      </div>
    </HeaderDialog>
  );
}
