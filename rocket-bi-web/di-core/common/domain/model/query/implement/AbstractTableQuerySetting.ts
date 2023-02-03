/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { Condition, FormatterSetting, OrderBy, QuerySettingType, TableColumn, TableChartOption, ChartOption, InlineSqlView } from '@core/common/domain/model';
import { SortDirection } from '@core/common/domain/request';
import { Log } from '@core/utils';
import { Sortable } from '@core/common/domain/model/query/features/Sortable';
import { Paginatable } from '@core/common/domain/model/query/features/Paginatable';
import { DisplayTableType } from '@core/common/domain/model/chart-option/implement/TableChartOption';

export abstract class AbstractTableQuerySetting<T extends TableChartOption = TableChartOption> extends QuerySetting<T> implements Sortable, Paginatable {
  formatters: TableColumn[];

  protected constructor(
    public columns: TableColumn[],
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    formatters: TableColumn[] = [],

    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
    this.formatters = formatters;
  }

  static isTableChartSetting(querySetting: any): querySetting is AbstractTableQuerySetting<any> {
    return (
      (querySetting.className == QuerySettingType.Table ||
        querySetting.className == QuerySettingType.GroupedTable ||
        querySetting.className == QuerySettingType.RawQuery) &&
      !!querySetting.changeDisplayType
    );
  }

  changeDisplayType(displayType: DisplayTableType): AbstractTableQuerySetting<T> {
    switch (displayType) {
      case DisplayTableType.Collapse:
        this.className = QuerySettingType.GroupedTable;
        break;
      case DisplayTableType.Normal:
        this.className = QuerySettingType.Table;
        break;
    }
    return this;
  }

  applySort(sortAsMap: Map<string, SortDirection>) {
    const newSorts: OrderBy[] = this.columns
      .filter(column => sortAsMap.has(column.name))
      .map(sortColumn => {
        const sortDirection = sortAsMap.get(sortColumn.name) ?? SortDirection.Asc;
        return new OrderBy(sortColumn.function, sortDirection);
      });
    Log.debug('newSort::', newSorts);
    this.sorts = newSorts;
  }

  getFrom(): number {
    return 0;
  }

  getSize(): number {
    return 20;
  }

  protected setValueBySetting(setting: ChartOption) {
    if (FormatterSetting.isFormatterSetting(setting)) {
      this.formatters = setting.getFormatters();
    }
  }
}
