import { asRecord, type JsonObject } from '@/core/json/json';
import { builderDataFromJson, builderDataToJson, type BuilderData } from '@/core/chart-builder/BuilderData';
import { chartTypeInfoOf, newFunctionData, SORTING_ZONE, type ZoneConfig } from '@/core/chart-builder/chartCatalogue';
import { newConditionData, type ConditionData } from '@/core/chart-builder/ConditionData';
import { suggestConfigs } from '@/core/chart-builder/configSuggestion';
import { defaultVizOptions, vizOptionsForType } from '@/core/chart-builder/defaultVizOptions';
import { convertRowMode } from '@/core/chart-builder/functionConvertor';
import { SortType, type FunctionData } from '@/core/chart-builder/FunctionData';
import { isSameFieldKind } from '@/core/chart-builder/functions';
import { buildSetting } from '@/core/chart-builder/querySetting';
import { applyDrop, type DropAction } from '@/shared/field-dnd/fieldDnd.utils';

type Configs = Readonly<Record<string, readonly FunctionData[]>>;

/** The zones' items and the viz options as they were after the last zone edit (v1 `ConfigBuilderStore.latestState`). */
interface LatestEdit {
  readonly chartType: string;
  readonly configs: Configs;
  readonly options: JsonObject;
}

export interface BuilderState {
  readonly data: BuilderData;
  /** The chart's viz options, stored shape (`setting.options`). */
  readonly options: JsonObject;
  /**
   * The edited chart's setting as stored. It stays the chart's setting until the user changes a zone, a filter or the
   * chart type, so a chart without builder data (made by hand or by an old version) opens and saves unchanged.
   */
  readonly storedSetting?: JsonObject;
  readonly touched: boolean;
  /** Switching back to this chart type gives these zones back as they were. */
  readonly latest?: LatestEdit;
}

/** A column dropped from the field tree, or a chart control dropped as a field (with its `dynamicFunction`). */
export interface DroppedField {
  readonly field: JsonObject;
  readonly columnName: string;
  readonly tableName: string;
  readonly isNested?: boolean;
  readonly dynamicFunction?: JsonObject;
}

/** Where a condition sits: its group and its index there. */
export interface ConditionAt {
  readonly groupId: number;
  readonly index: number;
}

export type BuilderAction =
  | { type: 'chartType'; chartType: string }
  /** A drop resolved by `shared/field-dnd`; `field` is the column for drops from the field tree. */
  | { type: 'drop'; drop: DropAction; field?: DroppedField }
  /** An item changed from its menu (function, sorting, name, top N); matched by id. */
  | { type: 'updateItem'; zone: string; item: FunctionData }
  | { type: 'removeItem'; zone: string; id: number }
  /** A field dropped into the Filter zone: into the and-group `groupId` at `index` (default last), or a new or-group. */
  | { type: 'addCondition'; field: DroppedField; groupId?: number; index?: number }
  /** A condition dragged to `index` of the and-group `groupId`, or into a new or-group. */
  | { type: 'moveCondition'; from: ConditionAt; to: { groupId?: number; index: number } }
  | { type: 'updateCondition'; condition: ConditionData }
  | { type: 'removeCondition'; groupId: number; id: number }
  | { type: 'options'; options: JsonObject };

/** A builder for a new chart of `chartType` (v1 `ConfigBuilderStore.initDefaultState` + `setItemSelected`). */
export function newBuilderState(chartType: string): BuilderState {
  return { data: { chartType, configs: {}, filters: {} }, options: defaultVizOptions(chartType) ?? {}, touched: true };
}

/** A builder for a stored chart widget (v1 `ConfigBuilderStore.init`). */
export function builderStateOf(widget: JsonObject): BuilderState {
  const data = builderDataFromJson(widget['extra_data']);
  const setting = asRecord(widget['setting']);
  const options = asRecord(setting['options']);
  return { data, options, storedSetting: setting, touched: false, latest: { chartType: data.chartType, configs: data.configs, options } };
}

function zonesOf(chartType: string): ZoneConfig[] {
  return [...(chartTypeInfoOf(chartType)?.zones ?? []), SORTING_ZONE];
}

const idsOf = (items: readonly { id: number }[]) => items.map(item => item.id);

function withoutKey<T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([current]) => current !== key));
}

/** One more than the largest id in use, so ids never clash (v1 picked random ones). */
function nextId(ids: readonly number[]): number {
  return Math.max(0, ...ids) + 1;
}

function withConfigs(state: BuilderState, configs: Configs): BuilderState {
  const data = { ...state.data, configs };
  return { ...state, data, touched: true, latest: { chartType: data.chartType, configs, options: state.options } };
}

/** v1 `ConfigBuilderStore.changeConfig`: back to the latest edit of that type, otherwise the zones moved across. */
function changeChartType(state: BuilderState, chartType: string): BuilderState {
  const { latest } = state;
  const info = chartTypeInfoOf(chartType);
  if (!info || chartType === state.data.chartType) return state;
  if (latest?.chartType === chartType) {
    return { ...state, data: { ...state.data, chartType, configs: latest.configs }, options: latest.options, touched: true };
  }
  const configs = latest ? suggestConfigs(info, latest.configs) : {};
  const options = vizOptionsForType(chartType, state.options) ?? state.options;
  return { ...state, data: { ...state.data, chartType, configs }, options, touched: true };
}

/**
 * A field dropped onto an item, in its place (v1 `ConfigDraggable.handleReplaceFunction`): it keeps the item's id, and its
 * function while the field is the same kind of column.
 */
function replacingItem(created: FunctionData, replaced: FunctionData): FunctionData {
  if (!isSameFieldKind(replaced.field, created.field)) return { ...created, id: replaced.id };
  return { ...created, id: replaced.id, functionFamily: replaced.functionFamily, functionType: replaced.functionType, displayAsColumn: replaced.displayAsColumn };
}

/** Where an item lands in another zone (v1 `FunctionNodeBuilder` without a new family): a new id, the zone's sorting. */
function movedItem(item: FunctionData, zoneId: string, id: number): FunctionData {
  return { ...item, id, displayAsColumn: false, sorting: zoneId === SORTING_ZONE.key ? SortType.Ascending : SortType.Unsorted };
}

const NO_FIELD: DroppedField = { field: {}, columnName: '', tableName: '' };

/** The zone a drop puts an item into. */
function targetZoneOf(action: DropAction): string {
  return action.type === 'transfer' ? action.to.zoneId : action.zoneId;
}

function drop(state: BuilderState, action: DropAction, field: DroppedField | undefined): BuilderState {
  const { configs, chartType } = state.data;
  const zones = zonesOf(chartType);
  const zone = zones.find(item => item.key === targetZoneOf(action));
  const fromTree = action.type === 'insert' || action.type === 'replace';
  if (!zone || (fromTree && !field)) return state;
  const lists = Object.fromEntries(zones.map(item => [item.key, configs[item.key] ?? []]));
  const id = nextId(idsOf(Object.values(configs).flat()));
  // Only drops from the tree create an item, and those have their field (checked above).
  const created = newFunctionData({ ...(field ?? NO_FIELD), id, zone });
  const dropped = applyDrop<FunctionData>(lists, action, {
    fromExternal: (_zoneId, replaced) => (replaced ? replacingItem(created, replaced) : created),
    fromZone: (item, zoneId) => movedItem(item, zoneId, id)
  });
  if (dropped === lists) return state;
  const changed = Object.fromEntries(Object.entries(dropped).filter(([key, items]) => items !== lists[key]));
  return withConfigs(state, { ...configs, ...changed });
}

function updateItem(state: BuilderState, zone: string, item: FunctionData): BuilderState {
  const { configs, chartType } = state.data;
  const items = configs[zone] ?? [];
  const previous = items.find(current => current.id === item.id);
  if (!previous) return state;
  const updated = { ...configs, [zone]: items.map(current => (current.id === item.id ? item : current)) };
  return withConfigs(state, convertRowMode(chartType, zone, updated, item, previous));
}

function removeItem(state: BuilderState, zone: string, id: number): BuilderState {
  const items = state.data.configs[zone];
  if (!items?.some(item => item.id === id)) return state;
  return withConfigs(state, { ...state.data.configs, [zone]: items.filter(item => item.id !== id) });
}

function withFilters(state: BuilderState, filters: BuilderData['filters']): BuilderState {
  return { ...state, data: { ...state.data, filters }, touched: true };
}

const groupIdsOf = (filters: BuilderData['filters']) => Object.values(filters).flat().map(condition => condition.groupId);

function addCondition(state: BuilderState, field: DroppedField, groupId: number | undefined, index: number | undefined): BuilderState {
  const { filters } = state.data;
  const group = groupId ?? nextId(groupIdsOf(filters));
  const condition = newConditionData({ ...field, id: nextId(idsOf(Object.values(filters).flat())), groupId: group });
  const conditions = filters[group] ?? [];
  return withFilters(state, { ...filters, [group]: conditions.toSpliced(index ?? conditions.length, 0, condition) });
}

/**
 * v1 `FilterDraggable` drags between groups: the condition leaves its group (an empty group goes) for another group or
 * a new one, keeping its id. In its own group, `to.index` is counted without it.
 */
function moveCondition(state: BuilderState, from: ConditionAt, to: { groupId?: number; index: number }): BuilderState {
  const { filters } = state.data;
  const source = filters[from.groupId];
  const condition = source?.[from.index];
  if (!source || !condition) return state;
  const groupId = to.groupId ?? nextId(groupIdsOf(filters));
  const rest = source.toSpliced(from.index, 1);
  const left = rest.length > 0 ? { ...filters, [from.groupId]: rest } : withoutKey(filters, String(from.groupId));
  const target = left[groupId] ?? [];
  return withFilters(state, { ...left, [groupId]: target.toSpliced(to.index, 0, { ...condition, groupId }) });
}

/** v1 `ConfigBuilderStore.updateFilter`: replaces the condition in its group, adds it when it isn't there. */
function updateCondition(state: BuilderState, condition: ConditionData): BuilderState {
  const { filters } = state.data;
  const group = filters[condition.groupId] ?? [];
  const exists = group.some(current => current.id === condition.id);
  const next = exists ? group.map(current => (current.id === condition.id ? condition : current)) : [...group, condition];
  return withFilters(state, { ...filters, [condition.groupId]: next });
}

/** v1 `ConfigBuilderStore.removeFilter`: an empty group goes too. */
function removeCondition(state: BuilderState, groupId: number, id: number): BuilderState {
  const { filters } = state.data;
  const group = filters[groupId];
  if (!group?.some(condition => condition.id === id)) return state;
  const rest = group.filter(condition => condition.id !== id);
  return withFilters(state, rest.length > 0 ? { ...filters, [groupId]: rest } : withoutKey(filters, String(groupId)));
}

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'chartType':
      return changeChartType(state, action.chartType);
    case 'drop':
      return drop(state, action.drop, action.field);
    case 'updateItem':
      return updateItem(state, action.zone, action.item);
    case 'removeItem':
      return removeItem(state, action.zone, action.id);
    case 'addCondition':
      return addCondition(state, action.field, action.groupId, action.index);
    case 'moveCondition':
      return moveCondition(state, action.from, action.to);
    case 'updateCondition':
      return updateCondition(state, action.condition);
    case 'removeCondition':
      return removeCondition(state, action.groupId, action.id);
    case 'options':
      return { ...state, options: action.options };
  }
}

/**
 * What the setting is built from. Slicer, date select and input filters have no Sorting or Filter zone: v1 still
 * applied the sorts and filters left from another chart type, which the user could neither see nor remove.
 */
function visibleData(data: BuilderData): BuilderData {
  if (chartTypeInfoOf(data.chartType)?.extraZones !== false) return data;
  return { ...data, configs: withoutKey(data.configs, SORTING_ZONE.key), filters: {} };
}

/**
 * The chart's setting: the stored one until the user changes the zones, the filters or the type, else the one the
 * zones build (`undefined` while they are not filled). The viz options are always the builder's.
 */
export function builderSettingOf(state: BuilderState, sqlQueryOf?: (viewName: string) => string | undefined): JsonObject | undefined {
  if (!state.touched && state.storedSetting) return { ...state.storedSetting, options: state.options };
  return buildSetting(visibleData(state.data), { options: state.options, sqlQueryOf });
}

/** The builder's keys of the chart's `extra_data`, to merge over the stored ones when saving. */
export function builderExtraDataOf(state: BuilderState): JsonObject {
  return builderDataToJson(state.data);
}
