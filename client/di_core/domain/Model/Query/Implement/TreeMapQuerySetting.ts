/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import {
  Condition,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  TableColumn,
  TreeMapChartOption,
  WidgetId
} from '@core/domain/Model';
import { QuerySetting } from '../QuerySetting';
import { ListUtils } from '@/utils';
import { clone } from 'lodash';
import { ConfigDataUtils } from '@/screens/ChartBuilder/ConfigBuilder/ConfigPanel/ConfigDataUtils';

export class TreeMapQuerySetting extends QuerySetting<TreeMapChartOption> {
  readonly className = QuerySettingType.TreeMap;

  constructor(
    public legends: TableColumn[],
    public value: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},

    sqlViews: InlineSqlView[] = []
  ) {
    super(filters, sorts, options, sqlViews);
  }

  static fromObject(obj: TreeMapQuerySetting): TreeMapQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const legends = obj.legends?.map(legend => TableColumn.fromObject(legend)) ?? [];
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new TreeMapQuerySetting(legends, value, filters, sorts, obj.options, sqlViews);
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
