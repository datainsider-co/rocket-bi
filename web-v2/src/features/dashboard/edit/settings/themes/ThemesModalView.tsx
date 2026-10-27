import { useState } from 'react';
import { Button, Modal, Switch } from 'antd';
import type { JsonObject } from '@/core/json/json';
import { dashboardPageContainer } from '../../../theme/popupContainer';
import { DashboardThemeType } from '../../../theme/dashboardThemes';
import { booleanAt, DARK_THEMES, LIGHT_THEMES, stringAt, withPath, withTheme, type ThemeOption } from '../dashboardSettings.utils';
import { useSettingSubmit } from '../useSettingSubmit';
import { THEME_THUMBNAILS } from './themeThumbnails';
import '../settings.css';

interface ThemesModalViewProps {
  /** `settingDraft` of the dashboard. */
  initial: JsonObject;
  onSubmit: (setting: JsonObject) => Promise<void>;
  onCancel: () => void;
}

/**
 * v1 `DashboardSettingModal` "Dashboard Setting", from Options → Settings and the gear's Themes: the theme, picked from
 * pictures (it brings its border and background), and Overlap mode.
 */
export function ThemesModalView({ initial, onSubmit, onCancel }: ThemesModalViewProps) {
  const [draft, setDraft] = useState(initial);
  const { saving, error, submit } = useSettingSubmit(onSubmit);
  const current = stringAt(draft, ['theme_name'], DashboardThemeType.LightDefault);
  const pick = (theme: DashboardThemeType) => setDraft(withTheme(draft, theme));
  const row = (themes: readonly ThemeOption[], label: string) => (
    <fieldset className="theme-picker__row" aria-label={label}>
      {themes.map(theme => (
        <button key={theme.value} type="button" className="theme-picker__item" title={theme.label} aria-pressed={theme.value === current} onClick={() => pick(theme.value)}>
          <img src={THEME_THUMBNAILS[theme.value]} alt="" />
          <span>{theme.label}</span>
        </button>
      ))}
    </fieldset>
  );
  return (
    <Modal
      open
      centered
      width={500}
      closable={false}
      maskClosable={!saving}
      keyboard={!saving}
      onCancel={onCancel}
      getContainer={dashboardPageContainer}
      classNames={{ root: 'theme-dialog' }}
      title="Dashboard Setting"
      footer={
        <>
          {error && <div className="setting-dialog__error mb-2 text-left">{error}</div>}
          <div className="theme-dialog__footer">
            <Button disabled={saving} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" loading={saving} onClick={() => void submit(draft)}>
              Apply
            </Button>
          </div>
        </>
      }
    >
      <div className="theme-picker">
        <div className="theme-picker__header">
          <h5>Select Theme</h5>
          <button type="button" className="theme-picker__reset" onClick={() => pick(DashboardThemeType.LightDefault)}>
            Reset to default
          </button>
        </div>
        {row(LIGHT_THEMES, 'Light themes')}
        {row(DARK_THEMES, 'Dark themes')}
      </div>
      <div className="theme-picker__overlap">
        <label htmlFor="theme-overlap">Overlap mode</label>
        <Switch id="theme-overlap" size="small" checked={booleanAt(draft, ['enable_overlap'])} onChange={on => setDraft(withPath(draft, ['enable_overlap'], on))} />
      </div>
    </Modal>
  );
}
