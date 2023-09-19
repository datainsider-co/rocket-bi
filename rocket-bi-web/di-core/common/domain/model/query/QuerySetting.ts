/* eslint-disable no-fallthrough */
/*
 * @author: tvc12 - Thien Vi
 * @created: 11/26/20, 6:47 PM
 */

import {
  BellCurve2QuerySetting,
  BellCurveQuerySetting,
  BubbleQuerySetting,
  ChartOption,
  ChartOptionClassName,
  Condition,
  DrilldownQueryChartSetting,
  DropdownQuerySetting,
  DynamicFunction,
  DynamicValueCondition,
  FlattenPivotTableQuerySetting,
  Function,
  FunnelQuerySetting,
  GaugeQuerySetting,
  GroupedTableQuerySetting,
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
  QuerySettingClassName,
  RawQuerySetting,
  SankeyQuerySetting,
  ScatterQuerySetting,
  SeriesQuerySetting,
  SpiderWebQuerySetting,
  SqlQuery,
  StackedQuerySetting,
  TabFilterQuerySetting,
  TableColumn,
  TableQueryChartSetting,
  TreeFilterQuerySetting,
  TreeMapQuerySetting,
  ValueCondition,
  ValueControlType,
  VariablepieQuerySetting,
  WidgetId,
  WordCloudQuerySetting
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

export abstract class QuerySetting implements Queryable {
  abstract className: QuerySettingClassName;
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

  static fromObject(obj: any): QuerySetting | undefined {
    // return new PreviewChartRequest(filters, sorts);
    switch (obj?.className) {
      case QuerySettingClassName.GroupedTable:
        return GroupedTableQuerySetting.fromObject(obj);
      case QuerySettingClassName.Table:
        return TableQueryChartSetting.fromObject(obj);
      case QuerySettingClassName.Pie:
        return PieQuerySetting.fromObject(obj);
      case QuerySettingClassName.Funnel:
        return FunnelQuerySetting.fromObject(obj);
      case QuerySettingClassName.Pyramid:
        return PyramidQuerySetting.fromObject(obj);
      case QuerySettingClassName.Bubble:
        return BubbleQuerySetting.fromObject(obj);
      case QuerySettingClassName.HeatMap:
        return HeatMapQuerySetting.fromObject(obj);
      case QuerySettingClassName.Number:
        return NumberQuerySetting.fromObject(obj);
      case QuerySettingClassName.Drilldown:
        return DrilldownQueryChartSetting.fromObject(obj);
      case QuerySettingClassName.WordCloud:
        return WordCloudQuerySetting.fromObject(obj);
      case QuerySettingClassName.TreeMap:
        return TreeMapQuerySetting.fromObject(obj);
      case QuerySettingClassName.Histogram:
        return HistogramQuerySetting.fromObject(obj);
      case QuerySettingClassName.Dropdown:
        return DropdownQuerySetting.fromObject(obj);
      case QuerySettingClassName.Map:
        return MapQuerySetting.fromObject(obj);
      case QuerySettingClassName.PivotTable:
        return PivotTableQuerySetting.fromObject(obj);
      case QuerySettingClassName.Parliament:
        return ParliamentQuerySetting.fromObject(obj);
      case QuerySettingClassName.SpiderWeb:
        return SpiderWebQuerySetting.fromObject(obj);
      case QuerySettingClassName.BellCurve:
        return BellCurve2QuerySetting.fromObject(obj);
      case QuerySettingClassName.Sankey:
        return SankeyQuerySetting.fromObject(obj);
      case QuerySettingClassName.FlattenPivot:
        return FlattenPivotTableQuerySetting.fromObject(obj);
      case QuerySettingClassName.RawQuery:
        return RawQuerySetting.fromObject(obj);
      case QuerySettingClassName.InputQuerySetting:
        return InputControlQuerySetting.fromObject(obj);
      case QuerySettingClassName.TreeFilter:
        return TreeFilterQuerySetting.fromObject(obj);

      // Scatter or bell is not different
      case QuerySettingClassName.Scatter:
      case QuerySettingClassName.Series:
      case QuerySettingClassName.Stocks:
      case QuerySettingClassName.GenericChart:
      case QuerySettingClassName.TabFilterQuerySetting:
      case QuerySettingClassName.TabFilter:
      case QuerySettingClassName.Gauge:
        return QuerySetting.fromObjectWithSettingType(obj);
      default:
        Log.info(`QuerySetting:: ${obj.className} unsupported`);
        return void 0;
    }
  }

  private static fromObjectWithSettingType(obj: any | QuerySetting): QuerySetting | undefined {
    switch (obj?.options?.className) {
      case ChartOptionClassName.BellCurveSetting:
        return BellCurveQuerySetting.fromObject(obj);
      case ChartOptionClassName.ScatterSetting:
        return ScatterQuerySetting.fromObject(obj);
      case ChartOptionClassName.SeriesSetting:
        return SeriesQuerySetting.fromObject(obj);
      case ChartOptionClassName.StackedSeriesSetting:
        return StackedQuerySetting.fromObject(obj);
      case ChartOptionClassName.CircularBarSetting:
        return StackedQuerySetting.fromObject(obj);
      case ChartOptionClassName.ParetoSetting:
        return ParetoQuerySetting.fromObject(obj);
      case ChartOptionClassName.BulletSetting:
        return GaugeQuerySetting.fromObject(obj);
      case ChartOptionClassName.GaugeSetting:
        return GaugeQuerySetting.fromObject(obj);
      case ChartOptionClassName.WindRoseSetting:
        return StackedQuerySetting.fromObject(obj);
      case ChartOptionClassName.TabFilterSetting:
        return TabFilterQuerySetting.fromObject(obj);
      case ChartOptionClassName.LineStockSetting:
        return SeriesQuerySetting.fromObject(obj);
      case ChartOptionClassName.TreeFilterSetting:
        return TreeFilterQuerySetting.fromObject(obj);
      case ChartOptionClassName.VariablePieSetting:
        return VariablepieQuerySetting.fromObject(obj);
      default:
        return void 0;
    }
  }

  /**
   * Get all table column of this query, including all table column of sub query
   * Method support for suggest database and table
   */
  abstract getAllFunction(): Function[];

  abstract getAllTableColumns(): TableColumn[];

  getChartOption<T extends ChartOption = ChartOption<any>>(): T | undefined {
    return this.options?.className ? (ChartOption.fromObject(this.options as any) as T) : void 0;
  }

  setChartOption(newChartOption: ChartOption): void {
    // function assign or merge is working
    const options: any = Object.assign({}, newChartOption);
    this.options = options;
    try {
      const finalChartOption = ChartOption.fromObject(options);
      if (finalChartOption) {
        this.assignChartOptionValue(finalChartOption);
      }
    } catch (ex) {
      Log.error('QuerySetting::setChartOption::ex', ex);
    }
  }

  /**
   * method will assign all value to implement class.
   * Class override this method will assign current value to implement class
   * @param otherChartOption is a chart option will be assigned to implement class
   */
  protected assignChartOptionValue(otherChartOption: ChartOption): void {
    //Nothing to do
  }

  hasDynamicFunction(): boolean {
    return this.getAllTableColumns().some(column => column.dynamicFunctionId !== undefined);
  }

  hasDynamicValue(): boolean {
    return ListUtils.isNotEmpty(FilterUtils.getDynamicConditions(this.filters, []));
  }

  getControlledFunctions(): TableColumn[] {
    return this.getAllTableColumns().filter(column => column.dynamicFunctionId !== undefined);
  }

  /**
   * check setting is affect by dynamic control
   * @param controllerId related with widget, who control this query
   */
  canControlFunction(controllerId: WidgetId): boolean {
    return this.getAllTableColumns().some(column => column.dynamicFunctionId === controllerId);
  }

  canApplyValueControl(controllerId: WidgetId): boolean {
    const dynamicConditions = FilterUtils.getDynamicConditions(this.filters, []);
    // Log.debug('affectByDynamicControl::', dynamicConditions, this.filters);
    return dynamicConditions.some(condition => condition.dynamicWidgetId === controllerId);
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
  abstract applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void;

  /**
   * fixme: move setSortDynamicFunctions to applyDynamicFunctions method
   * @deprecated
   */
  applyDynamicSortFunction(functions: Map<WidgetId, TableColumn[]>): void {
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

  applyDynamicFilters(filterAsMap: Map<WidgetId, Map<ValueControlType, string[]>>): void {
    FilterUtils.getDynamicConditions(this.filters, []).forEach((filter: DynamicValueCondition) => {
      if (filterAsMap.has(filter.dynamicWidgetId)) {
        if (ValueCondition.isValueCondition(filter.baseCondition)) {
          ///Assign values to filter
          const valueMap: Map<ValueControlType, string[]> = filterAsMap.get(filter.dynamicWidgetId) ?? new Map();
          const controlTypes: ValueControlType[] = filter.extraData.controlTypes ?? [];
          const allValues: string[] = controlTypes.flatMap(controlType => {
            const values: string[] = valueMap.get(controlType) ?? [];
            return values;
          });
          filter.withValues(allValues);
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
