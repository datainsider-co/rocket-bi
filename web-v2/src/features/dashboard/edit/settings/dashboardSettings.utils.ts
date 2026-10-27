import type { Dashboard } from '@/core/dashboard/Dashboard';
import { MainDateFilterSetting } from '@/core/dashboard/DashboardSetting';
import { asRecord, getPath, isRecord, type JsonObject } from '@/core/json/json';
import { DashboardThemeType } from '../../theme/dashboardThemes';

/**
 * The dashboard's setting as the settings dialogs edit it (v1 `DashboardSettingModal`, `EditDashboardModal`,
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

export function booleanAt(json: JsonObject, path: readonly string[]): boolean {
  return getPath(json, path) === true;
}

export interface ThemeOption {
  value: DashboardThemeType;
  label: string;
}

/** v1 `DashboardSettingModal.LightThemes`, the first row of the Themes dialog. */
export const LIGHT_THEMES: readonly ThemeOption[] = [
  { value: DashboardThemeType.LightDefault, label: 'Dodger Blue' },
  { value: DashboardThemeType.LightTheme1, label: 'Anzac' },
  { value: DashboardThemeType.LightTheme2, label: 'Electric Violet' },
  { value: DashboardThemeType.LightTheme3, label: 'Curious Blue' },
  { value: DashboardThemeType.LightTheme4, label: 'Ebony Clay' }
];

/** v1 `DashboardSettingModal.DarkThemes`, the second row. */
export const DARK_THEMES: readonly ThemeOption[] = [
  { value: DashboardThemeType.Default, label: 'Dark Default' },
  { value: DashboardThemeType.Theme1, label: 'Clear Sky' },
  { value: DashboardThemeType.Theme2, label: 'Deep Sea Space' },
  { value: DashboardThemeType.Theme3, label: 'Lawrencium' },
  { value: DashboardThemeType.Theme4, label: 'Dark' }
];

export const CORNERS = ['top_left', 'top_right', 'bottom_right', 'bottom_left'] as const;
export type Corner = (typeof CORNERS)[number];

/**
 * v1 `DashboardTheme.json` `defaultSettings`, the same for every light theme and every dark one. Its `enableOverlap`
 * is left out: v1's dialog saved its own Overlap mode toggle over it.
 */
function themeDefaults(dark: boolean): [string[], unknown][] {
  const color = dark ? '#000' : '#f2f2f7';
  return [
    [['border', 'width'], 1],
    [['border', 'color'], color],
    [['border', 'color_opacity'], dark ? 10 : 100],
    ...CORNERS.map((corner): [string[], unknown] => [['border', 'radius', corner], 20]),
    [['border', 'position'], 'inside'],
    [['background', 'color'], dark ? '#000' : '#fafafb'],
    [['background', 'opacity'], dark ? 10 : 100]
  ];
}

/** Picking a theme also resets the dashboard's border and background to the theme's (v1 `selectTheme`). */
export function withTheme(draft: JsonObject, themeName: DashboardThemeType): JsonObject {
  return themeDefaults(themeName.startsWith('dark')).reduce((json, [path, value]) => withPath(json, path, value), withPath(draft, ['theme_name'], themeName));
}

/** The same radius on every corner (v1 `RadiusInfo.setAllRadius`). */
export function withRadius(draft: JsonObject, path: readonly string[], radius: number): JsonObject {
  return CORNERS.reduce((json, corner) => withPath(json, [...path, corner], radius), draft);
}

/** The radius shared by the four corners, or undefined when they differ (v1 shows "Mixed"). */
export function sharedRadius(draft: JsonObject, path: readonly string[], fallback: number): number | undefined {
  const [first, ...rest] = CORNERS.map(corner => numberAt(draft, [...path, corner], fallback));
  return rest.every(radius => radius === first) ? first : undefined;
}

/** A typed pixel size: v1 `DiRadiusInput` turned anything but a number of zero or more into 0. */
export function toPixels(text: string): number {
  const value = Number(text.trim());
  return text.trim() !== '' && Number.isFinite(value) && value >= 0 ? value : 0;
}

/** v1 `DashboardDetail.onClickDashboardSetting` "Auto Refresh Data", in its order; 0 is Off. */
export const AUTO_REFRESH_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 15_000, label: '15 Seconds' },
  { value: 30_000, label: '30 Seconds' },
  { value: 60_000, label: '60 Seconds' },
  { value: 180_000, label: '3 Minutes' },
  { value: 300_000, label: '5 Minutes' },
  { value: 0, label: 'Off' }
];

export function autoRefreshOf(draft: JsonObject): number {
  return getPath(draft, ['auto_refresh_setting', 'is_auto_refresh']) === true ? numberAt(draft, ['auto_refresh_setting', 'refresh_interval_ms'], 0) : 0;
}

/** v1 `AutoRefreshSetting.setRefreshIntervalMs`: 0 turns it off and keeps the last interval. */
export function withAutoRefresh(draft: JsonObject, intervalMs: number): JsonObject {
  const turnedOn = withPath(draft, ['auto_refresh_setting', 'is_auto_refresh'], intervalMs > 0);
  return intervalMs > 0 ? withPath(turnedOn, ['auto_refresh_setting', 'refresh_interval_ms'], intervalMs) : turnedOn;
}

/**
 * Sets up the date filter in the header with a default mode, or removes it (v1 `SetupMainDateFilter`,
 * `DashboardStore.updateMainDateFilter`). Charts follow it where ChartBuilder gave them a condition on it.
 */
export function withMainDate(draft: JsonObject, mode: string | undefined): JsonObject {
  const { main_date_filter: _removed, ...rest } = draft;
  return mode === undefined ? rest : { ...rest, main_date_filter: { id: MainDateFilterSetting.ID, mode } };
}

/** What a settings dialog shows when saving fails: the server's message, if any (v1 `DIException.getPrettyMessage`). */
export function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Cannot save the setting, please try again.';
}
