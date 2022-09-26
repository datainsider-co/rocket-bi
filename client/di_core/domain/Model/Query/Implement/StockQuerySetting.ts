/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:39 AM
 */

import {
  Condition,
  Equal,
  Filterable,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  LineStockChartOption,
  OrderBy,
  QuerySettingType,
  SeriesChartOption,
  TableColumn,
  WidgetId,
  Zoomable
} from '@core/domain/Model';
import { QuerySetting } from '../QuerySetting';
import { ZoomData } from '@/shared';
import { Drilldownable, DrilldownData } from '@core/domain/Model/Query/Features/Drilldownable';
import { ConditionUtils } from '@core/utils';
import { clone } from 'lodash';
import { ConfigDataUtils } from '@/screens/ChartBuilder/ConfigBuilder/ConfigPanel/ConfigDataUtils';

export class StockQuerySetting extends QuerySetting<LineStockChartOption> {
  readonly className = QuerySettingType.Stocks;

  constructor(
    public values: TableColumn[],
    public legend?: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = []
  ) {
    super(filters, sorts, options, sqlViews);
  }

  static fromObject(obj: StockQuerySetting): StockQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const values = obj.values?.map(value => TableColumn.fromObject(value)) ?? [];
    const legend = obj.legend ? TableColumn.fromObject(obj.legend) : void 0;
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new StockQuerySetting(values, legend, filters, sorts, obj.options, sqlViews);
  }

  getAllFunction(): Function[] {
    if (this.legend) {
      return [...this.values.map(value => value.function), this.legend.function];
    } else {
      return [...this.values.map(value => value.function)];
    }
  }

  getAllTableColumn(): TableColumn[] {
    if (this.legend) {
      return [...this.values, this.legend];
    } else {
      return [...this.values];
    }
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.values = ConfigDataUtils.replaceDynamicFunctions(this.values, functions);
    if (this.legend) {
      this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    }
  }
}
