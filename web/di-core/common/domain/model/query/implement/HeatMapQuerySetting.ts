/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:37 AM
 */

import { Condition, Function, getFiltersAndSorts, InlineSqlView, OrderBy, QuerySettingClassName, TableColumn, WidgetId } from '@core/common/domain/model';
import { QuerySetting } from '../QuerySetting';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class HeatMapQuerySetting extends QuerySetting {
  readonly className = QuerySettingClassName.HeatMap;

  constructor(
    public xAxis: TableColumn,
    public yAxis: TableColumn,
    public value: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  static fromObject(obj: HeatMapQuerySetting): HeatMapQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const xAxis = TableColumn.fromObject(obj.xAxis);
    const yAxis = TableColumn.fromObject(obj.yAxis);
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new HeatMapQuerySetting(xAxis, yAxis, value, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    return [this.xAxis.function, this.yAxis.function, this.value.function];
  }

  getAllTableColumns(): TableColumn[] {
    return [this.xAxis, this.yAxis, this.value];
  }

  static isHeatMapQuerySetting(obj: any): obj is HeatMapQuerySetting {
    return obj?.className === QuerySettingClassName.HeatMap;
  }

  applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.xAxis = ConfigDataUtils.replaceDynamicFunction(this.xAxis, functions);
    this.yAxis = ConfigDataUtils.replaceDynamicFunction(this.yAxis, functions);
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }
}
