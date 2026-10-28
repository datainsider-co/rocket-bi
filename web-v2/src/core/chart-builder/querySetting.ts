import { asRecord, asString, withoutUndefined, type JsonObject } from '@/core/json/json';
import { SqlView } from '@/core/relationship/QueryView';
import { isDateType, isNumberType } from '@/core/schema/fieldTypes';
import type { BuilderData } from './BuilderData';
import { ChartType } from './chartType';
import { filtersOf } from './conditions';
import type { FunctionData } from './FunctionData';
import { sortsOf, tableColumnsOf } from './functions';

type Configs = Readonly<Record<string, readonly FunctionData[]>>;

/** One chart type's part of the setting (v1 `QuerySettingHandler`): its own keys, and whether its zones are filled. */
interface SettingBuilder {
  readonly className: string;
  canBuild(configs: Configs): boolean;
  build(configs: Configs): JsonObject;
}

const filled = (configs: Configs, key: string) => (configs[key]?.length ?? 0) > 0;
const columns = (configs: Configs, key: string) => tableColumnsOf(configs[key] ?? []);
const firstColumn = (configs: Configs, key: string): JsonObject | undefined => columns(configs, key)[0];

const series: SettingBuilder = {
  className: 'series_chart_setting',
  canBuild: configs => filled(configs, 'x_axis') && filled(configs, 'y_axis'),
  build: configs => ({ x_axis: firstColumn(configs, 'x_axis'), y_axis: columns(configs, 'y_axis'), legend: firstColumn(configs, 'legend_optional') })
};

const pie: SettingBuilder = {
  className: 'pie_chart_setting',
  canBuild: configs => filled(configs, 'legend') && filled(configs, 'value'),
  build: configs => ({ legend: firstColumn(configs, 'legend'), value: firstColumn(configs, 'value') })
};

const number: SettingBuilder = {
  className: 'number_chart_setting',
  canBuild: configs => filled(configs, 'value'),
  build: configs => ({ value: firstColumn(configs, 'value'), compare_request: null })
};

const AGGREGATE_FUNCTIONS = new Set(['avg', 'sum', 'max', 'min', 'count', 'count_distinct', 'select_expression']);

/** Number and aggregated columns get their min and max (v1 `forceTurnOnCalcMinMax` of both table handlers). */
function withMinMax(column: JsonObject): JsonObject {
  const func = asRecord(column['function']);
  const isNumber = isNumberType(asString(asRecord(func['field'])['field_type']));
  return AGGREGATE_FUNCTIONS.has(asString(func['class_name'])) || isNumber ? { ...column, is_calc_min_max: true } : column;
}

/** Tables list their columns, number and aggregated ones with min / max (v1 `FlattenTableQuerySettingHandler`, `TableQuerySettingHandler`). */
const tableOf = (className: string): SettingBuilder => ({
  className,
  canBuild: configs => filled(configs, 'columns'),
  build: configs => ({ columns: columns(configs, 'columns').map(withMinMax), formatters: [] })
});

const table = tableOf('table_chart_setting');

/** The collapse table: the same columns; the server nests the rows by its group by columns. */
const groupTable = tableOf('group_table_chart_setting');

/**
 * The pivot table (v1 `PivotQuerySettingHandler`): any zone filled is enough. Rows go without their group totals, values
 * with their min and max, whatever their type.
 */
const pivot: SettingBuilder = {
  className: 'pivot_table_chart_setting',
  canBuild: configs => ['columns', 'rows', 'values'].some(key => filled(configs, key)),
  build: configs => ({
    columns: columns(configs, 'columns'),
    rows: columns(configs, 'rows').map(column => ({ ...column, is_calc_group_total: false })),
    values: columns(configs, 'values').map(column => ({ ...column, is_calc_min_max: true })),
    formatters: []
  })
};

/** Tab, choice, dropdown and tree filters, and inner filters (v1 `TabFilterQuerySettingHandler`, `TreeFilterQuerySettingHandler`). */
const tabControl: SettingBuilder = {
  className: 'tab_control_chart_setting',
  canBuild: configs => filled(configs, 'values'),
  build: configs => ({ values: columns(configs, 'values') })
};

/** The column's min and max, through `scalarOf` (v1 `SlicerFilterQuerySettingHandler`, `DateSelectFilterQuerySettingHandler`). */
function minMaxColumns(column: JsonObject | undefined, scalarOf: (column: JsonObject, isDate: boolean) => JsonObject | undefined): JsonObject[] {
  if (!column) return [];
  const func = asRecord(column['function']);
  const field = func['field'];
  const scalarFunction = scalarOf(func, isDateType(asString(asRecord(field)['field_type'])));
  const withAggregate = (className: string) => ({ ...column, function: { class_name: className, field, ...(scalarFunction && { scalar_function: scalarFunction }) } });
  return [withAggregate('min'), withAggregate('max')];
}

const innerScalar = (func: JsonObject): JsonObject | undefined => (func['scalar_function'] ? asRecord(func['scalar_function']) : undefined);

const inputControl = (values: (configs: Configs) => JsonObject[]): SettingBuilder => ({
  className: 'input_control_chart_setting',
  canBuild: () => true,
  build: configs => ({ values: values(configs) })
});

/** A date column is read as epoch millis for the slider; v1 dropped the column's own scalar function there. */
const slicer = inputControl(configs =>
  minMaxColumns(firstColumn(configs, 'value'), (func, isDate) => (isDate ? { class_name: 'datetime_to_millis' } : innerScalar(func)))
);

const dateSelect = inputControl(configs =>
  minMaxColumns(firstColumn(configs, 'value'), (func, isDate) => {
    const inner = innerScalar(func);
    return isDate ? { class_name: 'datetime_to_millis', ...(inner && { inner_fn: inner }) } : inner;
  })
);

const input = inputControl(configs => columns(configs, 'value').slice(0, 1));

const T = ChartType;

/** The setting builder per chart type (v1 `ChartBuilderModule.bindQueryBuilder`), for the types v2 builds. */
const BUILDERS: Readonly<Record<ChartType, SettingBuilder>> = {
  [T.Line]: series,
  [T.Spline]: series,
  [T.LineInverted]: series,
  [T.Area]: series,
  [T.AreaInverted]: series,
  [T.Column]: series,
  [T.Bar]: series,
  [T.Pie]: pie,
  [T.SemiPie]: pie,
  [T.Donut]: pie,
  [T.Number]: number,
  [T.Table]: table,
  [T.CollapseTable]: groupTable,
  [T.PivotTable]: pivot,
  [T.TabFilter]: tabControl,
  [T.SingleChoice]: tabControl,
  [T.MultiChoice]: tabControl,
  [T.DropDown]: tabControl,
  [T.SingleTreeFilter]: tabControl,
  [T.MultiTreeFilter]: tabControl,
  [T.DropDownInnerFilter]: tabControl,
  [T.TabInnerFilter]: tabControl,
  [T.SlicerFilter]: slicer,
  [T.DateSelectFilter]: dateSelect,
  [T.InputFilter]: input
};

function builderOf(chartType: string): SettingBuilder | undefined {
  return Object.hasOwn(BUILDERS, chartType) ? BUILDERS[chartType as ChartType] : undefined;
}

/** Whether the zones the chart type needs are filled (v1 `QuerySettingResolver.canBuildQuerySetting`). */
export function canBuildSetting(data: BuilderData): boolean {
  return builderOf(data.chartType)?.canBuild(data.configs) ?? false;
}

/** The view fields' views, each once, in the order the items use them. */
function viewNamesOf(data: BuilderData): string[] {
  const fields = [...Object.values(data.configs).flat(), ...Object.values(data.filters).flat()].map(item => item.field);
  const names = fields.filter(field => field['class_name'] === 'view_field').map(field => asString(field['view_name']));
  return [...new Set(names)];
}

export interface SettingInput {
  /** The chart's viz options (`setting.options`), kept as they are. */
  readonly options: JsonObject;
  /** The SQL of an ad hoc view by its alias; views it doesn't know are left out (v1 `ConfigBuilderStore.getSqlViews`). */
  readonly sqlQueryOf?: (viewName: string) => string | undefined;
}

/**
 * The chart's query setting, as v1's builder sent it (v1 `ConfigBuilderStore.getQuerySetting`), or `undefined` for a
 * type v2 can't build or zones still missing a field. Keys v1 left out stay out; the server fills `dynamic_function_ids`,
 * `drill_through_fields` and the functions' flags itself.
 */
export function buildSetting(data: BuilderData, { options, sqlQueryOf }: SettingInput): JsonObject | undefined {
  const builder = builderOf(data.chartType);
  if (!builder?.canBuild(data.configs)) return undefined;
  const own = withoutUndefined(builder.build(data.configs));
  const sqlViews = viewNamesOf(data).flatMap(name => {
    const query = sqlQueryOf?.(name);
    return query === undefined ? [] : [new SqlView({ alias_name: name, query: { query } }).toJson()];
  });
  return {
    class_name: builder.className,
    ...own,
    filters: filtersOf(data.filters),
    sorts: sortsOf(data.configs),
    options,
    sql_views: sqlViews,
    parameters: {}
  };
}
