/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:39 AM
 */

import { Condition, Function, getFiltersAndSorts, InlineSqlView, OrderBy, QuerySettingClassName, TableColumn, WidgetId } from '@core/common/domain/model';
import { QuerySetting } from '../QuerySetting';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class StockQuerySetting extends QuerySetting {
  readonly className = QuerySettingClassName.Stocks;

  constructor(
    public values: TableColumn[],
    public legend?: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  static fromObject(obj: StockQuerySetting): StockQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const values = obj.values?.map(value => TableColumn.fromObject(value)) ?? [];
    const legend = obj.legend ? TableColumn.fromObject(obj.legend) : void 0;
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new StockQuerySetting(values, legend, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    if (this.legend) {
      return [...this.values.map(value => value.function), this.legend.function];
    } else {
      return [...this.values.map(value => value.function)];
    }
  }

  getAllTableColumns(): TableColumn[] {
    if (this.legend) {
      return [...this.values, this.legend];
    } else {
      return [...this.values];
    }
  }

  applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.values = ConfigDataUtils.replaceDynamicFunctions(this.values, functions);
    if (this.legend) {
      this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    }
  }
}
