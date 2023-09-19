/*
 * @author: tvc12 - Thien Vi
 * @created: 12/10/20, 10:25 AM
 */

import {
  Condition,
  CrossFilterable,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingClassName,
  TableColumn,
  WidgetId
} from '@core/common/domain/model';
import { AbstractTableQuerySetting } from './AbstractTableQuerySetting';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class GroupedTableQuerySetting extends AbstractTableQuerySetting implements CrossFilterable {
  readonly className = QuerySettingClassName.GroupedTable;

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

  static fromObject(obj: any): GroupedTableQuerySetting {
    const columns = obj.columns?.map((col: any) => TableColumn.fromObject(col)) ?? [];
    const formatters = obj.formatters?.map((col: any) => TableColumn.fromObject(col)) ?? [];
    const [filters, sorts] = getFiltersAndSorts(obj);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new GroupedTableQuerySetting(columns, filters, sorts, obj.options, formatters, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    return this.columns.map(col => col.function);
  }

  getAllTableColumns(): TableColumn[] {
    return this.columns;
  }

  applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.columns = ConfigDataUtils.replaceDynamicFunctions(this.columns, functions);
  }

  getFilterColumn(): TableColumn {
    return this.columns[0];
  }

  isEnableCrossFilter(): boolean {
    return true;
  }
}
