/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { QuerySetting } from '../QuerySetting';
import {
  Condition,
  DropdownChartOption,
  Filterable,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  TableColumn,
  WidgetId
} from '@core/common/domain/model';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class DropdownQuerySetting extends QuerySetting<DropdownChartOption> implements Filterable {
  readonly className = QuerySettingType.Dropdown;

  constructor(
    public value: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  static fromObject(obj: DropdownQuerySetting): DropdownQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map(view => InlineSqlView.fromObject(view));

    return new DropdownQuerySetting(value, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    return [this.value.function];
  }

  getAllTableColumn(): TableColumn[] {
    return [this.value];
  }

  getFilter(): TableColumn {
    return this.value;
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }

  hasDefaultValue(): boolean {
    return this.getChartOption()?.options?.default?.setting?.conditions != undefined;
  }

  getDefaultCondition(): Condition | undefined {
    const condition = this.getChartOption()?.options?.default?.setting?.conditions;
    return Condition.fromObject(condition);
  }

  isEnableFilter(): boolean {
    return true;
  }
}
