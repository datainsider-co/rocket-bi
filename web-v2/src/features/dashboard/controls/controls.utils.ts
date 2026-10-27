import { isEqual } from 'lodash-es';
import { MainDateFilterSetting } from '@/core/dashboard/DashboardSetting';
import type { ChartWidget, Widget } from '@/core/dashboard/Widget';
import { asArray, getPath, isRecord, type JsonObject } from '@/core/json/json';
import { ValueControlType, type ControlValues } from '@/core/query/controlValues';
import { DateMode, formatDateTime, isDateMode, rangeValues } from '@/core/query/dateRanges';
import { functionColumns, functionKey, isFunctionControl } from '@/core/query/dynamicFunctions';
import type { InternalFilter } from '@/core/query/internalFilter';
import { treeRootKey, treeSelectedValues } from '../charts/filter/treeFilter.utils';
import { ChartVizClass } from '../charts/vizClass';

/** The main date filter is a control like the others, with a fixed id (v1 `MainDateFilter2.MAIN_DATE_ID`). */
export const MAIN_DATE_ID = MainDateFilterSetting.ID;

/**
 * A control's values, plus what its filter shows when the values don't say it: the checked keys of a tree filter
 * (its values are flattened from them), the mode of a date select (Last 7 Days, ...).
 */
export type ControlEntry = ControlValues & { readonly keys?: readonly string[]; readonly mode?: DateMode };

/** Control id → its entry. A control without one was never set; its conditions stay as stored. */
export type ControlEntryMap = Readonly<Record<number, ControlEntry>>;

function vizClassOf(setting: JsonObject): unknown {
  return getPath(setting, ['options', 'class_name']);
}

function defaultValueOf(setting: JsonObject): unknown {
  return getPath(setting, ['options', 'options', 'default', 'setting', 'value']);
}

const minMax = (values: readonly string[]): ControlEntry | undefined =>
  values.length === 2 ? { [ValueControlType.MinValue]: [values[0]!], [ValueControlType.MaxValue]: [values[1]!] } : undefined;

/** A date select's default: v1 `DateFilterData` (`{ mode, dates }`), or two custom dates. */
function dateDefault(value: unknown, now: Date): ControlEntry | undefined {
  if (Array.isArray(value)) {
    const range = minMax(value.map(String));
    return range && { mode: DateMode.Custom, ...range };
  }
  if (!isRecord(value) || !isDateMode(value['mode'])) return undefined;
  const range = minMax(rangeValues(value['mode'], asArray(value['dates']).map(String), now));
  return range && { mode: value['mode'], ...range };
}

function treeDefault(setting: JsonObject, value: unknown): ControlEntry | undefined {
  const keys = asArray(getPath(value, ['selected_keys'])).filter((key): key is string => typeof key === 'string');
  if (keys.length === 0) return undefined;
  const values = treeSelectedValues(keys, treeRootKey(setting));
  return values.length > 0 ? { keys, [ValueControlType.SelectedValue]: values } : { keys };
}

function functionDefault(setting: JsonObject, value: unknown): ControlEntry {
  const keys = (Array.isArray(value) ? value : [value]).filter((key): key is string => typeof key === 'string');
  const first = functionColumns(setting)[0];
  return { [ValueControlType.SelectedValue]: keys.length > 0 ? keys : first ? [functionKey(first, 0)] : [] };
}

/**
 * The starting values of a chart used as a control (v1 `ValueController.getDefaultValueAsMap`), from
 * `options.default.setting.value`, whose shape depends on the filter. A tab control without default picks its first
 * column, as v1 did when it loaded the dashboard.
 */
export function defaultControlValues(widget: ChartWidget, now: Date): ControlEntry | undefined {
  const { setting } = widget;
  const value = defaultValueOf(setting);
  if (isFunctionControl(setting)) return functionDefault(setting, value);
  if (value === null || value === undefined || value === '') return undefined;
  switch (vizClassOf(setting)) {
    case ChartVizClass.Slicer:
      return Array.isArray(value) ? minMax(value.map(String)) : undefined;
    case ChartVizClass.DateSelect:
      return dateDefault(value, now);
    case ChartVizClass.Tree:
      return treeDefault(setting, value);
    case ChartVizClass.Input:
      return isRecord(value) || Array.isArray(value) ? undefined : { [ValueControlType.SelectedValue]: [String(value)] };
    default:
      return { [ValueControlType.SelectedValue]: (Array.isArray(value) ? value : [value]).map(String) };
  }
}

/** What the main date picker shows: a mode, and the two dates of a custom range. */
export interface MainDateState {
  mode: DateMode;
  dates: readonly string[];
}

/** The picker as v1 saved it in local storage (`main_filter_mode_<dashboard id>`): `{ mode, chosenDateRange }`. */
export interface StoredMainDate {
  mode: string;
  chosenDateRange?: { start: string; end: string };
}

function storedDates(stored: unknown): string[] {
  const range = isRecord(stored) ? stored['chosenDateRange'] : undefined;
  if (!isRecord(range) || typeof range['start'] !== 'string' || typeof range['end'] !== 'string') return [];
  // v1 saved ISO strings, v2 saves the formatted dates; both parse once the space is a `T`.
  const start = new Date(range['start'].replace(' ', 'T'));
  const end = new Date(range['end'].replace(' ', 'T'));
  return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ? [] : [formatDateTime(start), formatDateTime(end, true)];
}

/** The picker on load: the viewer's last choice, else the dashboard's mode (v1 `DashboardStore.loadMainDateFilter`). */
export function initialMainDate(setting: MainDateFilterSetting | undefined, stored: unknown): MainDateState | undefined {
  if (!setting) return undefined;
  const storedMode = isRecord(stored) ? stored['mode'] : undefined;
  const mode = isDateMode(storedMode) ? storedMode : isDateMode(setting.mode) ? setting.mode : DateMode.AllTime;
  return { mode, dates: mode === DateMode.Custom ? storedDates(stored) : [] };
}

export function toStoredMainDate({ mode, dates }: MainDateState): StoredMainDate {
  return dates.length === 2 ? { mode, chosenDateRange: { start: dates[0]!, end: dates[1]! } } : { mode };
}

/** The main date as a control: start and end, or cleared for all time. */
export function mainDateValues(state: MainDateState, now: Date): ControlEntry {
  return minMax(rangeValues(state.mode, state.dates, now)) ?? {};
}

/** Starting values of every control on the dashboard (v1 `QuerySettingStore.init`), inner filters included. */
export function initialControls(widgets: readonly Widget[], mainDate: MainDateState | undefined, now: Date): ControlEntryMap {
  const controls: Record<number, ControlEntry> = {};
  for (const widget of widgets) {
    if (widget.kind !== 'chart') continue;
    for (const chart of widget.chartFilter ? [widget, widget.chartFilter] : [widget]) {
      const values = defaultControlValues(chart, now);
      if (values) controls[chart.id] = values;
    }
  }
  if (mainDate) {
    const values = mainDateValues(mainDate, now);
    if (Object.keys(values).length > 0) controls[MAIN_DATE_ID] = values;
  }
  return controls;
}

/** Widget id → the filter panel holding it. Their changes wait for the panel's Apply. */
export function panelOfWidgets(widgets: readonly Widget[]): ReadonlyMap<number, number> {
  const panels = new Map<number, number>();
  for (const widget of widgets) {
    if (widget.kind !== 'filter_panel') continue;
    for (const tab of widget.tabItems) tab.widgetIds.forEach(id => panels.set(id, widget.id));
  }
  return panels;
}

export interface ControlsState {
  /** Values the charts query with. */
  controls: ControlEntryMap;
  /** Changes made in a filter panel and not applied yet, per panel id. */
  pending: Readonly<Record<number, ControlEntryMap>>;
  mainDate?: MainDateState;
  /** Dashboard-wide filters (v1 `InternalFilter`), from `?filters=`; the header's filter bar edits them. */
  headerFilters: readonly InternalFilter[];
}

export type ControlsAction =
  | { type: 'set'; id: number; values: ControlEntry; panelId?: number }
  | { type: 'apply'; panelId: number }
  | { type: 'mainDate'; mainDate: MainDateState; values: ControlEntry }
  /** The main date filter was removed: no picker, and charts no longer filter by it. */
  | { type: 'removeMainDate' }
  /** Replaces the header filter with the same id. */
  | { type: 'headerFilter'; filter: InternalFilter }
  | { type: 'removeHeaderFilter'; id: number }
  | { type: 'reset'; initial: ControlEntryMap; headerFilters: readonly InternalFilter[] };

function withoutKey<T>(record: Readonly<Record<number, T>>, key: number): Record<number, T> {
  const { [key]: _removed, ...rest } = record;
  return rest;
}

export function controlsReducer(state: ControlsState, action: ControlsAction): ControlsState {
  switch (action.type) {
    case 'set': {
      const { id, values, panelId } = action;
      if (panelId === undefined) return { ...state, controls: { ...state.controls, [id]: values } };
      return { ...state, pending: { ...state.pending, [panelId]: { ...state.pending[panelId], [id]: values } } };
    }
    case 'apply': {
      const changes = state.pending[action.panelId];
      if (!changes) return state;
      return { ...state, controls: { ...state.controls, ...changes }, pending: withoutKey(state.pending, action.panelId) };
    }
    case 'mainDate':
      return { ...state, mainDate: action.mainDate, controls: { ...state.controls, [MAIN_DATE_ID]: action.values } };
    case 'removeMainDate':
      return { ...state, mainDate: undefined, controls: withoutKey(state.controls, MAIN_DATE_ID) };
    case 'headerFilter': {
      const { filter } = action;
      return { ...state, headerFilters: state.headerFilters.map(item => (item.id === filter.id ? filter : item)) };
    }
    case 'removeHeaderFilter':
      return { ...state, headerFilters: state.headerFilters.filter(item => item.id !== action.id) };
    case 'reset': {
      // Reset Filters leaves the main date alone: it has its own picker, and v1 kept it too. Header filters go back to
      // those the URL opened with (v1's button never touched them).
      const mainDate = state.controls[MAIN_DATE_ID];
      const controls = mainDate ? { ...withoutKey(action.initial, MAIN_DATE_ID), [MAIN_DATE_ID]: mainDate } : withoutKey(action.initial, MAIN_DATE_ID);
      return { ...state, controls, pending: {}, headerFilters: action.headerFilters };
    }
  }
}

/** The values a control shows: its pending change in its panel, else its applied values. */
export function controlEntryOf(state: ControlsState, id: number, panelId: number | undefined): ControlEntry | undefined {
  return (panelId === undefined ? undefined : state.pending[panelId]?.[id]) ?? state.controls[id];
}

/** Equal entries; a missing list is the same as an empty one. */
function sameEntry(a: ControlEntry | undefined, b: ControlEntry | undefined): boolean {
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]) as Set<keyof ControlEntry>;
  const orEmpty = (value: unknown) => (Array.isArray(value) && value.length === 0 ? undefined : value);
  return [...keys].every(key => isEqual(orEmpty(a?.[key]), orEmpty(b?.[key])));
}

/**
 * Whether any control other than the main date left its default, a panel holds unapplied changes or the header
 * filters differ from those the dashboard opened with.
 */
export function hasChangedControls(state: ControlsState, initial: ControlEntryMap, initialHeaderFilters: readonly InternalFilter[] = []): boolean {
  if (Object.keys(state.pending).length > 0 || !isEqual(state.headerFilters, initialHeaderFilters)) return true;
  const ids = new Set([...Object.keys(state.controls), ...Object.keys(initial)].map(Number));
  ids.delete(MAIN_DATE_ID);
  return [...ids].some(id => !sameEntry(state.controls[id], initial[id]));
}
