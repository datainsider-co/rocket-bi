/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:38 AM
 */

import {
  Condition,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingClassName,
  TableColumn,
  ChartOptionClassName,
  WidgetId
} from '@core/common/domain/model';
import { QuerySetting } from '../QuerySetting';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class GaugeQuerySetting extends QuerySetting {
  readonly className = QuerySettingClassName.Gauge;

  constructor(
    public value: TableColumn,
    public legend?: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  static fromObject(obj: GaugeQuerySetting): GaugeQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const value = TableColumn.fromObject(obj.value);
    const legend = obj.legend ? TableColumn.fromObject(obj.legend) : void 0;
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new GaugeQuerySetting(value, legend, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    if (this.legend) {
      return [this.value.function, this.legend.function];
    }
    return [this.value.function];
  }

  getAllTableColumns(): TableColumn[] {
    if (this.legend) {
      return [this.value, this.legend];
    }
    return [this.value];
  }

  applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
    if (this.legend) {
      this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    }
  }

  getDefaultSize(): [number, number] {
    const vizSettingClassName = this.getChartOption()?.className;
    if (vizSettingClassName === ChartOptionClassName.BulletSetting) {
      return [16, 8];
    }
    return super.getDefaultSize();
  }
}
