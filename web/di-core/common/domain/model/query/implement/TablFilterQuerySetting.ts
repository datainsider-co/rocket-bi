/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { ChartOption, ConditionType, FilterRequest, FunctionController, In, ChartOptionClassName, WidgetId } from '@core/common/domain';
import { Log } from '@core/utils';
import { QuerySetting } from '../QuerySetting';
import {
  Condition,
  FilterableSetting,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingClassName,
  TabFilterOption,
  TableColumn
} from '@core/common/domain/model';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';
import { toNumber } from 'lodash';
import { ListUtils } from '@/utils';
import { Direction, TabFilterDisplay } from '@/shared';

export class TabFilterQuerySetting extends QuerySetting implements FilterableSetting, FunctionController {
  readonly className = QuerySettingClassName.TabFilterQuerySetting;
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

  static fromObject(obj: TabFilterQuerySetting): TabFilterQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const values = obj.values ? obj.values.map(value => TableColumn.fromObject(value)) : [];
    ///Old widget
    const singleValue = (obj as any).value ? TableColumn.fromObject((obj as any).value) : void 0;
    if (singleValue) {
      values.push(singleValue);
    }
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));
    const filterRequest: FilterRequest | undefined = obj.filterRequest ? FilterRequest.fromObject(obj.filterRequest) : void 0;
    return new TabFilterQuerySetting(values, filters, sorts, obj.options, filterRequest, sqlViews, obj.parameters);
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
    if (ListUtils.isNotEmpty(values)) {
      const id = -1; //Temp id
      const filterRequest = FilterRequest.fromValues(id, this, values);
      this.filterRequest = filterRequest;
    } else {
      this.filterRequest = void 0;
    }
    Log.debug('setDefaultValue', this.filterRequest);
  }

  getDefaultValue(): string[] {
    switch (this.filterRequest?.condition?.className) {
      case ConditionType.IsIn:
        return (this.filterRequest?.condition as In).possibleValues;
      default:
        return [];
    }
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
    return this.values.length === 1;
  }

  isEnableFunctionControl(): boolean {
    return this.values.length > 1;
  }

  getDefaultTableColumns(): TableColumn[] {
    const defaultValues = this.getChartOption()?.options.default?.setting?.value as Array<string>;
    if (ListUtils.isNotEmpty(defaultValues)) {
      return defaultValues.map(value => {
        const index = TabFilterQuerySetting.getIndex(value);
        return this.values[index];
      });
    } else {
      return [this.values[0]];
    }
  }

  static getIndex(key: string): number {
    return toNumber(ListUtils.getLast(key.split('_')));
  }

  getDefaultSize(): [number, number] {
    const displayAs: TabFilterDisplay | undefined = this.getChartOption()?.options.displayAs;
    switch (displayAs) {
      case TabFilterDisplay.Normal:
      case TabFilterDisplay.SingleChoice:
      case TabFilterDisplay.MultiChoice:
        return this.getDefaultSizeTabWidget();
      case TabFilterDisplay.DropDown:
      case TabFilterDisplay.Flat:
        return [12, 2];
      default:
        return super.getDefaultSize();
    }
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

  getDefaultSizeTabWidget(): [number, number] {
    const direction: Direction = this.getChartOption()?.options.direction ?? Direction.row;
    const enableSearch = this.getChartOption()?.options.search?.enabled ?? true;
    switch (direction) {
      case Direction.row: {
        return enableSearch ? [12, 4] : [12, 2];
      }
      case Direction.column:
        return [12, 8];
    }
  }
}
