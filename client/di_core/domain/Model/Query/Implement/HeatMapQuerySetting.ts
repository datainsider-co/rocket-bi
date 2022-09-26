/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:37 AM
 */

import {
  Condition,
  Function,
  getFiltersAndSorts,
  HeatMapChartOption,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  TableColumn,
  WidgetId
} from '@core/domain/Model';
import { QuerySetting } from '../QuerySetting';
import { ConfigDataUtils } from '@/screens/ChartBuilder/ConfigBuilder/ConfigPanel/ConfigDataUtils';

export class HeatMapQuerySetting extends QuerySetting<HeatMapChartOption> {
  readonly className = QuerySettingType.HeatMap;

  constructor(
    public xAxis: TableColumn,
    public yAxis: TableColumn,
    public value: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = []
  ) {
    super(filters, sorts, options, sqlViews);
  }

  static fromObject(obj: HeatMapQuerySetting): HeatMapQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const xAxis = TableColumn.fromObject(obj.xAxis);
    const yAxis = TableColumn.fromObject(obj.yAxis);
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new HeatMapQuerySetting(xAxis, yAxis, value, filters, sorts, obj.options, sqlViews);
  }

  getAllFunction(): Function[] {
    return [this.xAxis.function, this.yAxis.function, this.value.function];
  }

  getAllTableColumn(): TableColumn[] {
    return [this.xAxis, this.yAxis, this.value];
  }

  static isHeatMapQuerySetting(obj: any): obj is HeatMapQuerySetting {
    return obj?.className === QuerySettingType.HeatMap;
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.xAxis = ConfigDataUtils.replaceDynamicFunction(this.xAxis, functions);
    this.yAxis = ConfigDataUtils.replaceDynamicFunction(this.yAxis, functions);
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }
}
