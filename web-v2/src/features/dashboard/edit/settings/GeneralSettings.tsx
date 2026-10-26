import { Form, Select, Switch } from 'antd';
import { DATE_MODE_OPTIONS } from '@/core/query/dateRanges';
import type { DashboardThemeType } from '../../theme/dashboardThemes';
import {
  AUTO_REFRESH_OPTIONS,
  autoRefreshOf,
  mainDateModeOf,
  stringAt,
  THEME_OPTIONS,
  withAutoRefresh,
  withMainDate,
  withPath,
  withTheme
} from './dashboardSettings.utils';
import type { SettingsSectionProps } from './settingsSection';

/** v1 `DashboardSettingModal` (theme, overlap), Auto Refresh Data and `SetupMainDateFilter`. */
export function GeneralSettings({ draft, onChange }: SettingsSectionProps) {
  const mainDate = mainDateModeOf(draft);
  return (
    <>
      <Form.Item label="Theme" htmlFor="setting-theme">
        <Select<string>
          id="setting-theme"
          value={stringAt(draft, ['theme_name'], 'light_default')}
          onChange={theme => onChange(withTheme(draft, theme as DashboardThemeType))}
          options={[...THEME_OPTIONS]}
        />
      </Form.Item>
      <Form.Item label="Overlap widgets" extra="Widgets can sit on top of each other; pressing one brings it to front.">
        <Switch aria-label="Overlap widgets" checked={draft['enable_overlap'] === true} onChange={on => onChange(withPath(draft, ['enable_overlap'], on))} />
      </Form.Item>
      <Form.Item label="Auto refresh data" htmlFor="setting-refresh">
        <Select id="setting-refresh" value={autoRefreshOf(draft)} onChange={(ms: number) => onChange(withAutoRefresh(draft, ms))} options={[...AUTO_REFRESH_OPTIONS]} />
      </Form.Item>
      <Form.Item label="Date filter" extra="A date range in the header, for the charts set up to follow it.">
        <div className="flex items-center gap-2">
          <Switch aria-label="Date filter" checked={mainDate !== undefined} onChange={on => onChange(withMainDate(draft, on ? 'all_time' : undefined))} />
          {mainDate !== undefined && (
            <Select
              aria-label="Default range"
              className="min-w-40"
              value={mainDate}
              onChange={(mode: string) => onChange(withMainDate(draft, mode))}
              options={DATE_MODE_OPTIONS.filter(option => option.value !== 'custom').map(option => ({ value: option.value, label: option.label }))}
            />
          )}
        </div>
      </Form.Item>
    </>
  );
}
