/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { ChartOption, FilterableSetting, FilterRequest, ChartOptionClassName, WidgetId } from '@core/common/domain';
import { Log } from '@core/utils';
import { QuerySetting } from '../QuerySetting';
import {
  Condition,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingClassName,
  TabFilterOption,
  TableColumn
} from '@core/common/domain/model';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class InputControlQuerySetting extends QuerySetting implements FilterableSetting {
  readonly className = QuerySettingClassName.InputQuerySetting;
  filterRequest?: FilterRequest;

  constructor(
    public values: TableColumn[],
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    filterRequest?: FilterRequest,
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
    this.filterRequest = filterRequest;
  }

  static fromObject(obj: InputControlQuerySetting): InputControlQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const values = obj.values ? obj.values.map(value => TableColumn.fromObject(value)) : [];
    ///Old widget
    const singleValue = (obj as any).value ? TableColumn.fromObject((obj as any).value) : void 0;
    if (singleValue) {
      values.push(singleValue);
    }
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));
    const filterRequest: FilterRequest | undefined = obj.filterRequest ? FilterRequest.fromObject(obj.filterRequest) : void 0;
    return new InputControlQuerySetting(values, filters, sorts, obj.options, filterRequest, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    return this.values.map(value => value.function);
  }

  getAllTableColumns(): TableColumn[] {
    return this.values;
  }

  getFilterColumn(): TableColumn {
    return this.values[0];
  }

  setDefaultValue(values: string[]) {
    if (values.length > 0) {
      const id = -1;
      const filterRequest = FilterRequest.fromValues(id, this, values);
      this.filterRequest = filterRequest;
    } else {
      this.filterRequest = void 0;
    }
    Log.debug('setDefaultValue', this.filterRequest);
  }

  assignChartOptionValue(setting: ChartOption) {
    const isTabFilterSetting = setting.className == ChartOptionClassName.TabFilterSetting;
    if (isTabFilterSetting) {
      const defaultValues = (setting as TabFilterOption)?.options?.default?.setting?.value ?? [];
      this.setDefaultValue(defaultValues);
    }
  }

  applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.values = ConfigDataUtils.replaceDynamicFunctions(this.values, functions);
  }

  canQuery(): boolean {
    return this.values.length === 2;
  }

  getDefaultSize(): [number, number] {
    const vizSettingType = this.getChartOption()?.className;
    if (vizSettingType === ChartOptionClassName.SlicerFilterSetting) {
      return [12, 4];
    }
    if (vizSettingType === ChartOptionClassName.DateSelectFilterSetting) {
      return [12, 3];
    }
    return [12, 2];
  }

  isEnableFilter(): boolean {
    return false;
  }

  hasDefaultCondition(): boolean {
    return this.getChartOption()?.options?.default?.setting?.conditions != undefined;
  }

  getDefaultCondition(): Condition | undefined {
    const condition = this.getChartOption()?.options?.default?.setting?.conditions;
    return Condition.fromObject(condition);
  }
}
