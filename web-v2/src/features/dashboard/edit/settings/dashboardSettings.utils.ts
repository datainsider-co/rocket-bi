import type { Dashboard } from '@/core/dashboard/Dashboard';
import { MainDateFilterSetting } from '@/core/dashboard/DashboardSetting';
import { asRecord, getPath, isRecord, type JsonObject } from '@/core/json/json';
import { DashboardThemeType } from '../../theme/dashboardThemes';

/**
 * The dashboard's setting as the settings dialog edits it (v1 `DashboardSettingModal`, `EditDashboardModal`,
 * `WidgetSettingModal`): the stored JSON with every modelled field filled with its default, edited by path and saved
 * whole, so keys v2 doesn't model stay.
 */
export function settingDraft(dashboard: Dashboard): JsonObject {
  const { main_date_filter: mainDate, ...modelled } = dashboard.setting.toJson();
  return { ...dashboard.settingJson, ...modelled, ...(isRecord(mainDate) && { main_date_filter: mainDate }) };
}

/** `json` with `value` at `path`, every object on the way copied. */
export function withPath(json: JsonObject, path: readonly string[], value: unknown): JsonObject {
  const [key, ...rest] = path;
  if (key === undefined) return json;
  return { ...json, [key]: rest.length === 0 ? value : withPath(asRecord(json[key]), rest, value) };
}

export function numberAt(json: JsonObject, path: readonly string[], fallback: number): number {
  const value = getPath(json, path);
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function stringAt(json: JsonObject, path: readonly string[], fallback: string): string {
  const value = getPath(json, path);
  return typeof value === 'string' ? value : fallback;
}

/** v1 `DashboardSettingModal` theme names, light ones first. */
export const THEME_OPTIONS: readonly { value: DashboardThemeType; label: string }[] = [
  { value: DashboardThemeType.LightDefault, label: 'Dodger Blue' },
  { value: DashboardThemeType.LightTheme1, label: 'Anzac' },
  { value: DashboardThemeType.LightTheme2, label: 'Electric Violet' },
  { value: DashboardThemeType.LightTheme3, label: 'Curious Blue' },
  { value: DashboardThemeType.LightTheme4, label: 'Ebony Clay' },
  { value: DashboardThemeType.Default, label: 'Dark Default' },
  { value: DashboardThemeType.Theme1, label: 'Clear Sky' },
  { value: DashboardThemeType.Theme2, label: 'Deep Sea Space' },
  { value: DashboardThemeType.Theme3, label: 'Lawrencium' },
  { value: DashboardThemeType.Theme4, label: 'Dark' }
];

const RADIUS = ['top_left', 'top_right', 'bottom_left', 'bottom_right'];

/** v1 `DashboardTheme.json` `defaultSettings`, the same for every light theme and every dark one. */
function themeDefaults(dark: boolean): [string[], unknown][] {
  const color = dark ? '#000' : '#f2f2f7';
  return [
    [['enable_overlap'], true],
    [['border', 'width'], 1],
    [['border', 'color'], color],
    [['border', 'color_opacity'], dark ? 10 : 100],
    ...RADIUS.map((corner): [string[], unknown] => [['border', 'radius', corner], 20]),
    [['border', 'position'], 'inside'],
    [['background', 'color'], dark ? '#000' : '#fafafb'],
    [['background', 'opacity'], dark ? 10 : 100]
  ];
}

/** Picking a theme also resets the dashboard's border and background to the theme's (v1 `selectTheme`). */
export function withTheme(draft: JsonObject, themeName: DashboardThemeType): JsonObject {
  return themeDefaults(themeName.startsWith('dark')).reduce((json, [path, value]) => withPath(json, path, value), withPath(draft, ['theme_name'], themeName));
}

/** The same radius on every corner; the dialog edits them together (v1 also offered them one by one). */
export function withRadius(draft: JsonObject, path: readonly string[], radius: number): JsonObject {
  return RADIUS.reduce((json, corner) => withPath(json, [...path, corner], radius), draft);
}

/** v1 `DashboardDetail.onClickDashboardSetting` "Auto Refresh Data"; 0 is Off. */
export const AUTO_REFRESH_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 15_000, label: '15 Seconds' },
  { value: 30_000, label: '30 Seconds' },
  { value: 60_000, label: '60 Seconds' },
  { value: 180_000, label: '3 Minutes' },
  { value: 300_000, label: '5 Minutes' }
];

export function autoRefreshOf(draft: JsonObject): number {
  return getPath(draft, ['auto_refresh_setting', 'is_auto_refresh']) === true ? numberAt(draft, ['auto_refresh_setting', 'refresh_interval_ms'], 0) : 0;
}

/** v1 `AutoRefreshSetting.setRefreshIntervalMs`: 0 turns it off and keeps the last interval. */
export function withAutoRefresh(draft: JsonObject, intervalMs: number): JsonObject {
  const turnedOn = withPath(draft, ['auto_refresh_setting', 'is_auto_refresh'], intervalMs > 0);
  return intervalMs > 0 ? withPath(turnedOn, ['auto_refresh_setting', 'refresh_interval_ms'], intervalMs) : turnedOn;
}

/** The main date filter's default mode, or `undefined` without one. */
export function mainDateModeOf(draft: JsonObject): string | undefined {
  const mode = getPath(draft, ['main_date_filter', 'mode']);
  return typeof mode === 'string' ? mode : undefined;
}

/**
 * Sets up the date filter in the header with a default mode, or removes it (v1 `SetupMainDateFilter`,
 * `DashboardStore.updateMainDateFilter`). Charts follow it where ChartBuilder gave them a condition on it.
 */
export function withMainDate(draft: JsonObject, mode: string | undefined): JsonObject {
  const { main_date_filter: _removed, ...rest } = draft;
  return mode === undefined ? rest : { ...rest, main_date_filter: { id: MainDateFilterSetting.ID, mode } };
}
