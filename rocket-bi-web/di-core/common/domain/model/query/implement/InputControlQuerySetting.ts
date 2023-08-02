/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { ChartOption, DynamicValues, Filterable, FilterRequest, InputFilterOption, MainDateMode, VizSettingType, WidgetId } from '@core/common/domain';
import { Log } from '@core/utils';
import { QuerySetting } from '../QuerySetting';
import { Condition, Function, getFiltersAndSorts, InlineSqlView, OrderBy, QuerySettingType, TabFilterOption, TableColumn } from '@core/common/domain/model';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';
import { StringUtils } from '@/utils/StringUtils';
import { DateTimeFormatter, DateUtils, ListUtils } from '@/utils';
import { get, isArray, isString } from 'lodash';
import { DateRange } from '@/shared';
import moment from 'moment';

export class InputControlQuerySetting extends QuerySetting<InputFilterOption> implements DynamicValues, Filterable {
  readonly className = QuerySettingType.InputControl;
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
    if (this.isDateFilterData(defaultValues)) {
      Log.debug('getDefaultValues::isDateFilterData', defaultValues);
      const mode: MainDateMode = get(defaultValues, 'mode', MainDateMode.custom);
      const customDates: string[] = get(defaultValues, 'dates', []);
      return InputControlQuerySetting.getDates(customDates, mode);
    }
    return [];
  }

  getDefaultSize(): [number, number] {
    const vizSettingType = this.getChartOption()?.className;
    if (vizSettingType === VizSettingType.SlicerFilterSetting) {
      return [12, 4];
    }
    if (vizSettingType === VizSettingType.DateSelectFilterSetting) {
      return [12, 3];
    }
    return [12, 2];
  }

  private isDateFilterData(obj: any) {
    return !!obj?.dates && !!obj?.mode;
  }

  static getDates(dates: string[], mode: MainDateMode): string[] {
    return InputControlQuerySetting.formatDate(InputControlQuerySetting.getDateTimeWithMode(mode, dates));
  }

  private static formatDate(date: (string | Date)[]) {
    if (date.length < 2) {
      return [];
    } else {
      const startDate = DateTimeFormatter.formatDate(date[0]);
      const endDate = DateTimeFormatter.formatDateWithTime(date[1], '23:59:59');
      return [startDate, endDate];
    }
  }

  private static getDateTimeWithMode(mode: MainDateMode, customDates: string[]): (string | Date)[] {
    switch (mode) {
      case MainDateMode.allTime:
        return [];
      case MainDateMode.custom:
        return customDates;
      default: {
        const dateRange: DateRange | null = DateUtils.getDateRange(mode);
        return dateRange ? [dateRange.start, dateRange.end] : [];
      }
    }
  }

  isEnableFilter(): boolean {
    return !this.enableDynamicValues();
  }
  hasDefaultValue(): boolean {
    return this.getChartOption()?.options?.default?.setting?.conditions != undefined;
  }

  getDefaultCondition(): Condition | undefined {
    const condition = this.getChartOption()?.options?.default?.setting?.conditions;
    return Condition.fromObject(condition);
  }
}
