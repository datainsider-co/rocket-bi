/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { ChartOption, ConditionType, DynamicValues, FilterRequest, In, InputFilterOption, VizSettingType, WidgetId } from '@core/common/domain';
import { Log } from '@core/utils';
import { QuerySetting } from '../QuerySetting';
import { Condition, Function, getFiltersAndSorts, InlineSqlView, OrderBy, QuerySettingType, TabFilterOption, TableColumn } from '@core/common/domain/model';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';
import { StringUtils } from '@/utils/StringUtils';
import { ListUtils } from '@/utils';
import { isArray, isString } from 'lodash';
import { SlicerRange } from '@/shared';

export class InputControlQuerySetting extends QuerySetting<InputFilterOption> implements DynamicValues {
  readonly className = QuerySettingType.InputControl;
  filterRequest?: FilterRequest;

  constructor(
    public values: TableColumn[],
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    filterRequest?: FilterRequest,
    sqlViews: InlineSqlView[] = []
  ) {
    super(filters, sorts, options, sqlViews);
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
    return new InputControlQuerySetting(values, filters, sorts, obj.options, filterRequest, sqlViews);
  }

  getAllFunction(): Function[] {
    return this.values.map(value => value.function);
  }

  getAllTableColumn(): TableColumn[] {
    return this.values;
  }

  getFilter(): TableColumn {
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

  setValueBySetting(setting: ChartOption) {
    const isTabFilterSetting = setting.className == VizSettingType.TabFilterSetting;
    if (isTabFilterSetting) {
      const defaultValues = (setting as TabFilterOption)?.options?.default?.setting?.value ?? [];
      this.setDefaultValue(defaultValues);
    }
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.values = ConfigDataUtils.replaceDynamicFunctions(this.values, functions);
  }

  canQuery(): boolean {
    return this.values.length === 2;
  }

  enableDynamicValues(): boolean {
    return ListUtils.isEmpty(this.values);
  }

  getDefaultValues(): string[] {
    const defaultValues = this.getChartOption()?.options.default?.setting?.value;
    ///is String
    if (isString(defaultValues)) {
      if (StringUtils.isEmpty(defaultValues)) {
        return [];
      } else {
        return [defaultValues];
      }
    }
    ///is Array
    if (isArray(defaultValues)) {
      return defaultValues;
    }
    return [];
  }
}
