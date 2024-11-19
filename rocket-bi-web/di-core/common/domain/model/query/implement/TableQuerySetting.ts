/*
 * @author: tvc12 - Thien Vi
 * @created: 12/10/20, 10:25 AM
 */

import {
  Condition,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingClassName,
  TableChartOption,
  TableColumn,
  WidgetId
} from '@core/common/domain/model';
import { AbstractTableQuerySetting } from './AbstractTableQuerySetting';
import { Log } from '@core/utils';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class TableQueryChartSetting extends AbstractTableQuerySetting {
  readonly className = QuerySettingClassName.Table;

  constructor(
    columns: TableColumn[],
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    readonly formatters: TableColumn[] = [],
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(columns, filters, sorts, options, formatters, sqlViews, parameters);
  }

  static fromObject(obj: any): TableQueryChartSetting {
    const columns = obj.columns?.map((col: any) => TableColumn.fromObject(col)) ?? [];
    const formatters = obj.formatters?.map((col: any) => TableColumn.fromObject(col)) ?? [];
    const [filters, sorts] = getFiltersAndSorts(obj);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new TableQueryChartSetting(columns, filters, sorts, obj.options, formatters, sqlViews, obj.parameters);
  }

  static default(): TableQueryChartSetting {
    return new TableQueryChartSetting([], [], [], TableChartOption.getDefaultChartOption(), [], [], {});
  }

  getAllFunction(): Function[] {
    return this.columns.map(col => col.function);
  }

  getAllTableColumns(): TableColumn[] {
    return this.columns;
  }

  applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.columns = ConfigDataUtils.replaceDynamicFunctions(this.columns, functions);
    Log.debug('TableQueryChartSetting::setDynamicFunctions::', this.columns);
  }

  forecastable(): boolean {
    return true;
  }
}
