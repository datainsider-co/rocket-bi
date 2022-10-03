/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 12/10/20, 10:25 AM
 */

import {
  Condition,
  Function,
  getFiltersAndSorts,
  OrderBy,
  QuerySettingType,
  TableColumn,
  TableChartOption,
  InlineSqlView,
  WidgetId
} from '@core/common/domain/model';
import { AbstractTableQuerySetting } from './AbstractTableQuerySetting';
import { Log } from '@core/utils';
import { ListUtils } from '@/utils';
import { clone } from 'lodash';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class TableQueryChartSetting extends AbstractTableQuerySetting<TableChartOption> {
  readonly className = QuerySettingType.Table;

  constructor(
    columns: TableColumn[],
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    readonly formatters: TableColumn[] = [],

    sqlViews: InlineSqlView[] = []
  ) {
    super(columns, filters, sorts, options, formatters, sqlViews);
  }

  static fromObject(obj: any): TableQueryChartSetting {
    const columns = obj.columns?.map((col: any) => TableColumn.fromObject(col)) ?? [];
    const formatters = obj.formatters?.map((col: any) => TableColumn.fromObject(col)) ?? [];
    const [filters, sorts] = getFiltersAndSorts(obj);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new TableQueryChartSetting(columns, filters, sorts, obj.options, formatters, sqlViews);
  }

  getAllFunction(): Function[] {
    return this.columns.map(col => col.function);
  }

  getAllTableColumn(): TableColumn[] {
    return this.columns;
  }
  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.columns = ConfigDataUtils.replaceDynamicFunctions(this.columns, functions);
    Log.debug('TableQueryChartSetting::setDynamicFunctions::', this.columns);
  }
}
