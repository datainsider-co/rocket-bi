/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:38 AM
 */

import { Condition, Function, GaugeChartOption, getFiltersAndSorts, InlineSqlView, OrderBy, QuerySettingType, TableColumn, WidgetId } from '@core/domain/Model';
import { QuerySetting } from '../QuerySetting';
import { ConfigDataUtils } from '@/screens/ChartBuilder/ConfigBuilder/ConfigPanel/ConfigDataUtils';

export class GaugeQuerySetting extends QuerySetting<GaugeChartOption> {
  readonly className = QuerySettingType.Gauge;

  constructor(
    public value: TableColumn,
    public legend?: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = []
  ) {
    super(filters, sorts, options, sqlViews);
  }

  static fromObject(obj: GaugeQuerySetting): GaugeQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const value = TableColumn.fromObject(obj.value);
    const legend = obj.legend ? TableColumn.fromObject(obj.legend) : void 0;
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new GaugeQuerySetting(value, legend, filters, sorts, obj.options, sqlViews);
  }

  getAllFunction(): Function[] {
    if (this.legend) {
      return [this.value.function, this.legend.function];
    }
    return [this.value.function];
  }

  getAllTableColumn(): TableColumn[] {
    if (this.legend) {
      return [this.value, this.legend];
    }
    return [this.value];
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
    if (this.legend) {
      this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    }
  }
}
