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
  ParetoQuerySetting,
  ParliamentQuerySetting,
  PieQuerySetting,
  PivotTableQuerySetting,
  PyramidQuerySetting,
  Queryable,
  QuerySettingType,
  RawQuerySetting,
  SankeyQuerySetting,
  ScatterQuerySetting,
  SeriesQuerySetting,
  SpiderWebQuerySetting,
  StackedQuerySetting,
  TabFilterQuerySetting,
  TableColumn,
  TableQueryChartSetting,
  TreeMapQuerySetting,
  ValueCondition,
  VizSettingType,
  WidgetId,
  WordCloudQuerySetting
} from '@core/common/domain/model';
import { Log } from '@core/utils';
import { InlineSqlView } from '@core/common/domain/model/query/InlineSqlView';
import { FilterUtils, ListUtils } from '@/utils';

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

  protected constructor(filters: Condition[], sorts: OrderBy[], options: Record<string, any>, sqlViews: InlineSqlView[]) {
    this.filters = filters;
    this.sorts = sorts;
    this.options = options;
    this.sqlViews = sqlViews;
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
        return TabFilterQuerySetting.fromObject(obj as TabFilterQuerySetting);
      case QuerySettingType.InputControl:
        return InputControlQuerySetting.fromObject(obj as InputControlQuerySetting);
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
      }
    }
    return void 0;
  }

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
}
