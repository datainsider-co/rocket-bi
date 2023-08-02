/*
 * @author: tvc12 - Thien Vi
 * @created: 11/26/20, 6:47 PM
 */

import {
  BellCurve2QuerySetting,
  BellCurveQuerySetting,
  BubbleQuerySetting,
  ChartOption,
  Condition,
  DrilldownQueryChartSetting,
  DropdownQuerySetting,
  DynamicFunction,
  FlattenPivotTableQuerySetting,
  Function,
  FunnelQuerySetting,
  GaugeQuerySetting,
  GroupedTableQuerySetting,
  GroupMeasurementQuerySetting,
  HeatMapQuerySetting,
  HistogramQuerySetting,
  InputControlQuerySetting,
  MapQuerySetting,
  NumberQuerySetting,
  OrderBy,
  ParamValueType,
  ParetoQuerySetting,
  ParliamentQuerySetting,
  PieQuerySetting,
  PivotTableQuerySetting,
  PyramidQuerySetting,
  Queryable,
  QueryParameter,
  QuerySettingType,
  RawQuerySetting,
  SankeyQuerySetting,
  ScatterQuerySetting,
  SeriesQuerySetting,
  SpiderWebQuerySetting,
  SqlQuery,
  StackedQuerySetting,
  TableColumn,
  TableQueryChartSetting,
  TreeMapQuerySetting,
  ValueCondition,
  VizSettingType,
  WidgetId,
  WordCloudQuerySetting,
  TreeFilterQuerySetting,
  TabFilterQuerySetting, GenericChartQuerySetting, VariablepieQuerySetting
} from '@core/common/domain/model';
import { Log, NumberUtils } from '@core/utils';
import { InlineSqlView } from '@core/common/domain/model/query/InlineSqlView';
import { FilterUtils, ListUtils } from '@/utils';
import { DefaultSize } from '@/shared';

export const getFiltersAndSorts: (obj: QuerySetting) => [Condition[], OrderBy[]] = (obj: QuerySetting): [Condition[], OrderBy[]] => {
  const filters: Condition[] = obj.filters?.map(filter => Condition.fromObject(filter)) ?? [];
  const sorts = obj.sorts?.map(sort => OrderBy.fromObject(sort)) ?? [];
  return [filters, sorts];
};

export abstract class QuerySetting<T extends ChartOption = ChartOption> implements Queryable {
  abstract className: QuerySettingType;
  public filters: Condition[];
  public sorts: OrderBy[];
  public options: Record<string, any>;
  sqlViews: InlineSqlView[];
  public parameters: Record<string, string>;

  protected constructor(filters: Condition[], sorts: OrderBy[], options: Record<string, any>, sqlViews: InlineSqlView[], parameters: Record<string, string>) {
    this.filters = filters;
    this.sorts = sorts;
    this.options = options;
    this.sqlViews = sqlViews;
    this.parameters = parameters;
  }

  static fromObject(obj: QuerySetting): QuerySetting | undefined {
    // return new PreviewChartRequest(filters, sorts);
    switch (obj.className) {
      case QuerySettingType.GroupedTable:
        return GroupedTableQuerySetting.fromObject(obj);
      case QuerySettingType.Table:
        return TableQueryChartSetting.fromObject(obj);
      case QuerySettingType.Pie:
        return PieQuerySetting.fromObject(obj as PieQuerySetting);
      case QuerySettingType.Funnel:
        return FunnelQuerySetting.fromObject(obj as FunnelQuerySetting);
      case QuerySettingType.Pyramid:
        return PyramidQuerySetting.fromObject(obj as PyramidQuerySetting);
      case QuerySettingType.Series:
        return QuerySetting.fromObjectWithSettingType(obj);
      // Scatter or bell is not different
      case QuerySettingType.Scatter:
        return QuerySetting.fromObjectWithSettingType(obj);
      case QuerySettingType.Bubble:
        return BubbleQuerySetting.fromObject(obj as BubbleQuerySetting);
      case QuerySettingType.HeatMap:
        return HeatMapQuerySetting.fromObject(obj as HeatMapQuerySetting);
      case QuerySettingType.Gauge:
        return QuerySetting.fromObjectWithSettingType(obj);
      case QuerySettingType.Number:
        return NumberQuerySetting.fromObject(obj as NumberQuerySetting);
      case QuerySettingType.Drilldown:
        return DrilldownQueryChartSetting.fromObject(obj as DrilldownQueryChartSetting);
      case QuerySettingType.WordCloud:
        return WordCloudQuerySetting.fromObject(obj as WordCloudQuerySetting);
      case QuerySettingType.TreeMap:
        return TreeMapQuerySetting.fromObject(obj as TreeMapQuerySetting);
      case QuerySettingType.Histogram:
        return HistogramQuerySetting.fromObject(obj as HistogramQuerySetting);
      case QuerySettingType.Dropdown:
        return DropdownQuerySetting.fromObject(obj as DropdownQuerySetting);
      case QuerySettingType.Map:
        return MapQuerySetting.fromObject(obj as MapQuerySetting);
      case QuerySettingType.TabFilter:
        return QuerySetting.fromObjectWithSettingType(obj);
      case QuerySettingType.PivotTable:
        return PivotTableQuerySetting.fromObject(obj);
      case QuerySettingType.Parliament:
        return ParliamentQuerySetting.fromObject(obj);
      case QuerySettingType.SpiderWeb:
        return SpiderWebQuerySetting.fromObject(obj as SpiderWebQuerySetting);
      case QuerySettingType.BellCurve:
        return BellCurve2QuerySetting.fromObject(obj as BellCurve2QuerySetting);
      case QuerySettingType.Sankey:
        return SankeyQuerySetting.fromObject(obj as SankeyQuerySetting);
      case QuerySettingType.FlattenPivot:
        return FlattenPivotTableQuerySetting.fromObject(obj as FlattenPivotTableQuerySetting);
      case QuerySettingType.RawQuery:
        return RawQuerySetting.fromObject(obj as RawQuerySetting);
      case QuerySettingType.Stocks:
        return QuerySetting.fromObjectWithSettingType(obj);
      case QuerySettingType.GroupMeasurement:
        return GroupMeasurementQuerySetting.fromObject(obj as GroupMeasurementQuerySetting);
      case QuerySettingType.TabControl:
        return QuerySetting.fromObjectWithSettingType(obj);
      case QuerySettingType.InputControl:
        return InputControlQuerySetting.fromObject(obj as InputControlQuerySetting);
      case QuerySettingType.TreeFilter:
        return TreeFilterQuerySetting.fromObject(obj as TreeFilterQuerySetting);
      case QuerySettingType.GenericChart:
        return this.fromObjectWithSettingType(obj);
      default:
        Log.info(`QuerySetting:: ${obj.className} unsupported`);
        return void 0;
    }
  }

  private static fromObjectWithSettingType(obj: any | QuerySetting): QuerySetting | undefined {
    if (obj.options) {
      switch (obj.options.className) {
        case VizSettingType.BellCurveSetting:
          return BellCurveQuerySetting.fromObject(obj);
        case VizSettingType.ScatterSetting:
          return ScatterQuerySetting.fromObject(obj);
        case VizSettingType.SeriesSetting:
          return SeriesQuerySetting.fromObject(obj);
        case VizSettingType.StackedSeriesSetting:
          return StackedQuerySetting.fromObject(obj);
        case VizSettingType.CircularBarSetting:
          return StackedQuerySetting.fromObject(obj);
        case VizSettingType.ParetoSetting:
          return ParetoQuerySetting.fromObject(obj);
        case VizSettingType.BulletSetting:
          return GaugeQuerySetting.fromObject(obj);
        case VizSettingType.GaugeSetting:
          return GaugeQuerySetting.fromObject(obj as GaugeQuerySetting);
        case VizSettingType.WindRoseSetting:
          return StackedQuerySetting.fromObject(obj);
        case VizSettingType.TabFilterSetting:
          return TabFilterQuerySetting.fromObject(obj as TabFilterQuerySetting);
        case VizSettingType.LineStockSetting:
          return SeriesQuerySetting.fromObject(obj);
        case VizSettingType.TabMeasurementSetting:
          return GroupMeasurementQuerySetting.fromObject(obj);
        case VizSettingType.TreeFilterSetting:
          return TreeFilterQuerySetting.fromObject(obj as TreeFilterQuerySetting);
        case VizSettingType.VariablepieSetting:
          return VariablepieQuerySetting.fromObject(obj as any);
      }
    }
    return void 0;
  }

  /**
   * Get all table column of this query, including all table column of sub query
   * Method support for suggest database and table
   */
  abstract getAllFunction(): Function[];

  abstract getAllTableColumn(): TableColumn[];

  getChartOption(): T | undefined {
    return this.options?.className ? (ChartOption.fromObject(this.options as any) as T) : void 0;
  }

  setChartOption(vizSetting: ChartOption): void {
    // function assign or merge is working
    const options: any = Object.assign({}, vizSetting);
    this.options = options;
    try {
      const finalVizSetting = ChartOption.fromObject(options);
      if (finalVizSetting) {
        this.setValueBySetting(finalVizSetting);
      }
    } catch (ex) {
      Log.error('setVisualizationSetting::ex', ex);
    }
  }

  protected setValueBySetting(setting: ChartOption) {
    //Nothing to do
  }

  get hasDynamicFunction(): boolean {
    return ListUtils.isNotEmpty(this.getAllTableColumn().map(column => column.dynamicFunctionId !== undefined));
  }

  get hasDynamicCondition(): boolean {
    return ListUtils.isNotEmpty(FilterUtils.getDynamicConditions(this.filters, []));
  }

  getAllDynamicFunction(): TableColumn[] {
    return this.getAllTableColumn().filter(column => column.dynamicFunctionId !== undefined);
  }

  affectByDynamicFunction(id: WidgetId): boolean {
    return this.getAllTableColumn().find(column => column.dynamicFunctionId === id) !== undefined;
  }

  affectByDynamicCondition(id: WidgetId): boolean {
    const dynamicConditions = FilterUtils.getDynamicConditions(this.filters, []);
    Log.debug('affectByDynamicControl::', dynamicConditions, this.filters);
    return ListUtils.isNotEmpty(dynamicConditions.filter(condition => condition.dynamicWidgetId === id));
  }

  isAffectByQueryParameter(id: WidgetId): boolean {
    const parameterWidgetIds: WidgetId[] = this.getChartOption()?.options?.parameterWidgetIds ?? [];
    return parameterWidgetIds.includes(id);
  }

  /*
   *Key: Dynamic Function Id cần replace
   *
   *Value: Replace Column
   *
   */
  abstract setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void;

  setSortDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    functions.forEach((tblColumns, dynamicWidgetId) => {
      const currentSort = this.sorts.find(sort => DynamicFunction.isDynamicFunction(sort.function) && sort.function.dynamicWidgetId === dynamicWidgetId);
      if (currentSort) {
        ///Build sort mới với dynamic function
        const newSorts: OrderBy[] = tblColumns.map(tblColumn => {
          const newFunction = DynamicFunction.fromObject(currentSort.function).withFinalFunction(tblColumn.function);
          return OrderBy.fromObject(currentSort).withFunction(newFunction);
        });
        ///Xoá sort hiện tại của dynamic function
        this.sorts = ListUtils.remove(
          this.sorts,
          sort => DynamicFunction.isDynamicFunction(sort.function) && sort.function.dynamicWidgetId === dynamicWidgetId
        );
        ///Add sort mới vào
        this.sorts.push(...newSorts);
      }
    });
  }

  /*
   *Key: Dynamic Filter Id cần replace
   *
   *Value: Replace Value
   *
   */
  setDynamicFilter(filterValueAsMap: Map<WidgetId, string[]>) {
    FilterUtils.getDynamicConditions(this.filters, []).forEach(filter => {
      if (filterValueAsMap.has(filter.dynamicWidgetId)) {
        if (ValueCondition.isValueCondition(filter.baseCondition)) {
          ///Assign values to filter
          const values = filterValueAsMap.get(filter.dynamicWidgetId)!;
          filter.withValues(values);
          return;
        }
      }
    });
  }

  canQuery(): boolean {
    return true;
  }

  ///Fist value is Width
  ///Second value is Height
  getDefaultSize(): [number, number] {
    return DefaultSize;
  }

  withQueryParameters(params: Record<string, string>): QuerySetting {
    this.parameters = params;
    return this;
  }

  getQueryParamInOptions(): Record<string, any> {
    const result: Record<string, any> = {};
    const queryParamInOptions: Record<string, QueryParameter> = this.getChartOption()?.options?.queryParameter ?? {};
    for (const key in queryParamInOptions) {
      const param = queryParamInOptions[key];
      result[param.displayName] = QuerySetting.formatParamValue(param.valueType, param.value);
    }
    return result;
  }

  isQueryParameter(): boolean {
    return !!this.getChartOption()?.options?.parameterConfig;
  }

  toQueryParameter(): QueryParameter {
    return this.getChartOption()?.options.parameterConfig!;
  }

  updateInlineView(aliasName: string, newQuery: string): void {
    Log.debug('updateInlineView::', aliasName, newQuery);
    const inlineView = this.getInlineView(aliasName);
    if (inlineView) {
      inlineView.query = new SqlQuery(newQuery);
    } else {
      Log.error('updateNewInlineView::InlineView not found');
    }
  }

  getInlineView(aliasName: string): InlineSqlView | undefined {
    return this.sqlViews.find(inlineView => inlineView.aliasName === aliasName);
  }

  static formatParamValue(type: ParamValueType, value: any): any {
    //Regex link: https://stackoverflow.com/questions/22626579/regex-match-a-string-enclosed-in-single-quotes-but-dont-match-those-inside-do
    switch (type) {
      case ParamValueType.text:
      case ParamValueType.date:
      case ParamValueType.list:
        return `'${value}'`;
      case ParamValueType.number:
        return `${NumberUtils.toNumber(value)}`;
    }
  }

  isAffectedByFilter(): boolean {
    return this.getChartOption()?.isAffectedByFilter() ?? true;
  }
}
