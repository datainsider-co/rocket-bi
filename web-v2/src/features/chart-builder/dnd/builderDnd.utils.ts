import { isRecord } from '@/core/json/json';
import type { BuilderData } from '@/core/chart-builder/BuilderData';
import { chartTypeInfoOf, SORTING_ZONE, type ZoneConfig } from '@/core/chart-builder/chartCatalogue';
import { ChartInfoType, type ChartControl } from '@/core/chart-builder/chartControls';
import type { ConditionData } from '@/core/chart-builder/ConditionData';
import type { FunctionData } from '@/core/chart-builder/FunctionData';
import { FieldKind, fieldKindOf } from '@/core/chart-builder/functions';
import type { DragSource, DropAction, TransferModeOf, ZoneId, ZoneRules } from '@/shared/field-dnd/fieldDnd.utils';
import { controlLookOf, fieldLookOf, type FieldLook, type FieldTreePayload } from '../field-tree/fieldTree.utils';
import type { BuilderAction, DroppedField } from '../state/builderState.utils';

/**
 * Drag and drop between the field tree and the builder's zones. Config zones use their stored key as zone id. The
 * Filters zone is `FILTER_ZONE` (a drop there starts a new or-group) holding one zone per and-group.
 */
export const FILTER_ZONE = 'filters';

const GROUP_PREFIX = `${FILTER_ZONE}:`;

export const groupZoneId = (groupId: number | string): ZoneId => `${GROUP_PREFIX}${groupId}`;

/** The and-group a zone id names; none for the Filters zone itself and the config zones. */
export function groupIdOf(zoneId: ZoneId): number | undefined {
  if (!zoneId.startsWith(GROUP_PREFIX)) return undefined;
  const id = Number(zoneId.slice(GROUP_PREFIX.length));
  return Number.isInteger(id) ? id : undefined;
}

const isFilterZone = (zoneId: ZoneId) => zoneId === FILTER_ZONE || zoneId.startsWith(GROUP_PREFIX);

/** The chart type's zones, then Sorting for types that have it (v1 `ConfigBuilder`). */
export function configZonesOf(chartType: string): readonly ZoneConfig[] {
  const info = chartTypeInfoOf(chartType);
  if (!info) return [];
  return info.extraZones ? [...info.zones, SORTING_ZONE] : info.zones;
}

export function hasFilterZone(chartType: string): boolean {
  return chartTypeInfoOf(chartType)?.extraZones ?? false;
}

/** The filter groups in order, with their id. */
export function filterGroupsOf(data: BuilderData): [groupId: number, conditions: readonly ConditionData[]][] {
  return Object.entries(data.filters).map(([key, conditions]) => [Number(key), conditions]);
}

/** A chart control dropped as a field (v1 `ChartControlField`): the control's data is the item's dynamic function. */
export function droppedControl(control: ChartControl): DroppedField {
  return {
    field: { class_name: 'chart_control_field', db_name: '', tbl_name: '', field_name: '', field_type: '', control_data: control.data },
    columnName: control.title,
    tableName: '',
    dynamicFunction: control.data
  };
}

function droppedItem(item: FunctionData): DroppedField {
  return {
    field: item.field,
    columnName: item.columnName ?? item.name,
    tableName: item.tableName ?? '',
    isNested: item.isNested,
    ...(item.dynamicFunction && { dynamicFunction: item.dynamicFunction })
  };
}

function droppedCondition(condition: ConditionData): DroppedField {
  return { field: condition.field, columnName: condition.columnName ?? '', tableName: condition.tableName ?? '', isNested: condition.isNested };
}

function treePayloadOf(source: DragSource): FieldTreePayload | undefined {
  if (source.kind !== 'external' || !isRecord(source.payload)) return undefined;
  const { kind } = source.payload;
  return kind === 'column' || kind === 'control' ? (source.payload as FieldTreePayload) : undefined;
}

function droppedOf(source: DragSource): DroppedField | undefined {
  const payload = treePayloadOf(source);
  if (!payload) return undefined;
  return payload.kind === 'column' ? payload.field : droppedControl(payload.control);
}

function itemAt(data: BuilderData, zoneId: ZoneId, index: number): FunctionData | undefined {
  return data.configs[zoneId]?.[index];
}

function conditionAt(data: BuilderData, zoneId: ZoneId, index: number): ConditionData | undefined {
  const groupId = groupIdOf(zoneId);
  return groupId === undefined ? undefined : data.filters[groupId]?.[index];
}

/**
 * What a config zone takes (v1 `ConfigBuilder.disabledDropConfig`): columns, function controllers among the chart
 * controls (they pick the columns), items of other zones and conditions.
 */
function acceptsInConfig(source: DragSource): boolean {
  const payload = treePayloadOf(source);
  if (payload?.kind === 'control') return payload.control.infoType === ChartInfoType.FunctionController;
  return source.kind === 'zone' || payload !== undefined;
}

/** A field can be filtered when it is a column; measures and chart controls can't (v1 `FilterDraggable`). */
const filterable = (field: DroppedField | FunctionData | undefined) => {
  const kind = field && fieldKindOf(field.field);
  return kind !== undefined && kind !== FieldKind.Expression && kind !== FieldKind.Control;
};

/**
 * What the Filters zone takes: columns, items of the config zones, other conditions. A chart control steers a
 * condition from its editor (Chart Control mode) rather than being dropped.
 */
function acceptsInFilter(source: DragSource, data: BuilderData): boolean {
  if (source.kind === 'external') return treePayloadOf(source)?.kind === 'column' && filterable(droppedOf(source));
  return isFilterZone(source.zoneId) || filterable(itemAt(data, source.zoneId, source.index));
}

/** The rules of every zone the chart type shows, for `FieldDndProvider`. */
export function builderZoneRules(data: BuilderData): ZoneRules {
  const config = configZonesOf(data.chartType).map(zone => [
    zone.key,
    { size: data.configs[zone.key]?.length ?? 0, maxItems: zone.maxItems, accepts: acceptsInConfig }
  ]);
  if (!hasFilterZone(data.chartType)) return Object.fromEntries(config);
  const accepts = (source: DragSource) => acceptsInFilter(source, data);
  const groups = filterGroupsOf(data).map(([groupId, conditions]) => [groupZoneId(groupId), { size: conditions.length, accepts }]);
  return Object.fromEntries([...config, [FILTER_ZONE, { size: 0, accepts }], ...groups]);
}

/**
 * v1 moves items between config zones and between filter groups, and copies them to or from Sorting and between the
 * config zones and the Filters zone.
 */
export const builderTransferMode: TransferModeOf = (from, to) => {
  if (isFilterZone(from) !== isFilterZone(to)) return 'copy';
  return from === SORTING_ZONE.key || to === SORTING_ZONE.key ? 'copy' : 'move';
};

function transferAction(action: Extract<DropAction, { type: 'transfer' }>, data: BuilderData): BuilderAction | undefined {
  const { from, to } = action;
  const toGroup = groupIdOf(to.zoneId);
  if (!isFilterZone(from.zoneId) && !isFilterZone(to.zoneId)) return { type: 'drop', drop: action };
  if (isFilterZone(from.zoneId) && isFilterZone(to.zoneId)) {
    const fromGroup = groupIdOf(from.zoneId);
    return fromGroup === undefined ? undefined : { type: 'moveCondition', from: { groupId: fromGroup, index: from.index }, to: { groupId: toGroup, index: to.index } };
  }
  if (isFilterZone(from.zoneId)) {
    const condition = conditionAt(data, from.zoneId, from.index);
    return condition && { type: 'drop', drop: { type: 'insert', zoneId: to.zoneId, index: to.index }, field: droppedCondition(condition) };
  }
  const item = itemAt(data, from.zoneId, from.index);
  return item && { type: 'addCondition', field: droppedItem(item), groupId: toGroup, index: to.index };
}

/** The reducer action for a drop `resolveDrop` allowed, or none when its source is gone. */
export function builderActionOf(action: DropAction, source: DragSource, data: BuilderData): BuilderAction | undefined {
  switch (action.type) {
    case 'insert':
    case 'replace': {
      const field = droppedOf(source);
      if (!field) return undefined;
      if (!isFilterZone(action.zoneId)) return { type: 'drop', drop: action, field };
      return { type: 'addCondition', field, groupId: groupIdOf(action.zoneId), index: action.index };
    }
    case 'reorder': {
      const groupId = groupIdOf(action.zoneId);
      if (groupId === undefined) return { type: 'drop', drop: action };
      return { type: 'moveCondition', from: { groupId, index: action.from }, to: { groupId, index: action.to } };
    }
    case 'transfer':
      return transferAction(action, data);
  }
}

/** What follows the pointer: the dragged column, control, item or condition, as the tree shows a field. */
export function dragLookOf(source: DragSource, data: BuilderData): FieldLook | undefined {
  const payload = treePayloadOf(source);
  if (payload) return payload.kind === 'control' ? controlLookOf(payload.control) : fieldLookOf(payload.field.field, payload.field.columnName);
  if (source.kind === 'external') return undefined;
  const item = itemAt(data, source.zoneId, source.index);
  if (item) return fieldLookOf(item.field, item.name);
  const condition = conditionAt(data, source.zoneId, source.index);
  return condition && fieldLookOf(condition.field, condition.columnName ?? '');
}
