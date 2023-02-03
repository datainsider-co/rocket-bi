/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { QuerySetting } from '../QuerySetting';
import {
  Condition,
  DrilldownPieChartOption,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  TableColumn,
  WidgetId
} from '@core/common/domain/model';
import { ListUtils } from '@/utils';
import { clone } from 'lodash';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

/**
 * @deprecated unused from v1.0.0
 */
export class DrilldownPieQueryChartSetting extends QuerySetting<DrilldownPieChartOption> {
  readonly className = QuerySettingType.Drilldown;

  constructor(
    public legends: TableColumn[],
    public value: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},

    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  static fromObject(obj: DrilldownPieQueryChartSetting): DrilldownPieQueryChartSetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const legends = obj.legends?.map(legend => TableColumn.fromObject(legend)) ?? [];
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map(view => InlineSqlView.fromObject(view));

    return new DrilldownPieQueryChartSetting(legends, value, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    return [...this.legends.map(legend => legend.function), this.value.function];
  }

  getAllTableColumn(): TableColumn[] {
    return [...this.legends, this.value];
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.legends = ConfigDataUtils.replaceDynamicFunctions(this.legends, functions);
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }
}
