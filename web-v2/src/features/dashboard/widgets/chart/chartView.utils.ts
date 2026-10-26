import { snakeCase } from 'lodash-es';
import { asString, getPath, type JsonObject } from '@/core/json/json';
import { drilldownSetting, isDrilledField, type DrilldownStep } from '@/core/query/drilldown';
import type { TableSort } from '@/core/query/tableSort';
import { applyTableSort } from '@/core/query/tableSort';
import { applyZoom, ZOOM_LEVELS } from '@/core/query/zoom';
import { isDateType, isTextType } from '@/core/schema/fieldTypes';
import { tableField, type DatabaseSchema } from '@/core/schema/SchemaService';

/**
 * How the viewer changed one chart without saving it (v1 `DrilldownDataStore`, `ZoomStore`, the table's sort, the
 * filter icon's toggle): the drill down steps with the setting each one produced, the date function picked, the
 * column sorted on, whether the header's filters apply.
 */
export interface ChartView {
  drills: readonly { step: DrilldownStep; setting: JsonObject }[];
  zoom?: string;
  sort?: TableSort;
  /** Set once the viewer toggled the header's filters for this chart; until then the chart's setting decides. */
  filtersOn?: boolean;
}

export const INITIAL_VIEW: ChartView = { drills: [] };

/** The setting before sorting: the last drill step's, with the picked date function. */
function unsortedSetting(stored: JsonObject, view: ChartView): JsonObject {
  const drilled = view.drills.at(-1)?.setting ?? stored;
  return view.zoom ? applyZoom(drilled, view.zoom) : drilled;
}

/** What the chart queries with. */
export function viewedSetting(stored: JsonObject, view: ChartView): JsonObject {
  return applyTableSort(unsortedSetting(stored, view), view.sort);
}

export type ChartViewAction =
  | { type: 'drill'; stored: JsonObject; step: DrilldownStep }
  | { type: 'back'; index: number }
  | { type: 'zoom'; level: string }
  | { type: 'sort'; sort?: TableSort }
  | { type: 'filters'; on: boolean }
  | { type: 'reset' };

export function chartViewReducer(view: ChartView, action: ChartViewAction): ChartView {
  switch (action.type) {
    case 'drill': {
      // Drilling starts from what is on screen, date function included; the new dimension has its own (v1).
      const setting = drilldownSetting(unsortedSetting(action.stored, view), action.step);
      return setting ? { ...view, drills: [...view.drills, { step: action.step, setting }], zoom: undefined } : view;
    }
    case 'back':
      return { ...view, drills: view.drills.slice(0, action.index), zoom: undefined };
    case 'zoom':
      return { ...view, zoom: action.level };
    case 'sort':
      return { ...view, sort: action.sort };
    case 'filters':
      return { ...view, filtersOn: action.on };
    case 'reset':
      return { ...view, drills: [], zoom: undefined };
  }
}

export interface DrillField {
  label: string;
  field: JsonObject;
  /** Date fields drill by a date function, picked in a submenu. */
  isDate: boolean;
}

/**
 * The fields a chart can drill into (v1 `loadGroupedFieldsWillDrilldown`): the text and date columns of its
 * dimension's table, without those already drilled through.
 */
export function drillFields(schema: DatabaseSchema | undefined, setting: JsonObject, column: JsonObject | undefined): DrillField[] {
  const tblName = asString(getPath(column, ['function', 'field', 'tbl_name']));
  const table = schema?.tables.find(item => item.name === tblName);
  if (!table) return [];
  return table.columns.flatMap(item => {
    const isDate = isDateType(item.type);
    const field = tableField(table, item);
    if ((!isTextType(item.type) && !isDate) || isDrilledField(setting, field)) return [];
    return [{ label: item.displayName, field, isDate }];
  });
}

/** Date functions to drill a date field by (v1 `DrilldownSetting.functionsSupported`): the levels short of epochs. */
export const DRILL_DATE_LEVELS = ZOOM_LEVELS.filter(item => !item.level.startsWith('datetime_to_'));

/** v1 `getFileNameByWidgetId`: the widget name without accents, snake_case; `untitled` without one. */
export function exportFileName(name: string): string {
  const plain = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
  return snakeCase(plain) || 'untitled';
}
