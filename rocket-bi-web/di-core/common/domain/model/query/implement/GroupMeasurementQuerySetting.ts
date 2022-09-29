/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { QuerySetting } from '../QuerySetting';
import {
  Condition,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  TabFilterOption,
  TableColumn,
  WidgetId
} from '@core/common/domain/model';
import { ListUtils } from '@/utils';
import { clone } from 'lodash';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class GroupMeasurementQuerySetting extends QuerySetting<TabFilterOption> {
  readonly className = QuerySettingType.GroupMeasurement;

  constructor(
    public values: TableColumn[],
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = []
  ) {
    super(filters, sorts, options, sqlViews);
  }

  static fromObject(obj: GroupMeasurementQuerySetting): GroupMeasurementQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const values = obj.values ? obj.values.map(value => TableColumn.fromObject(value)) : [];
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));
    return new GroupMeasurementQuerySetting(values, filters, sorts, obj.options, sqlViews);
  }

  getAllFunction(): Function[] {
    return this.values.map(value => value.function);
  }

  getAllTableColumn(): TableColumn[] {
    return this.values;
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.values = ConfigDataUtils.replaceDynamicFunctions(this.values, functions);
  }
  // setDefaultValue(values: string[]) {
  //   if (values.length > 0) {
  //     const id = -1;
  //     const filterRequest = FilterRequest.fromValues(id, this, values);
  //     this.filterRequest = filterRequest;
  //   } else {
  //     this.filterRequest = void 0;
  //   }
  //   Log.debug('setDefaultValue', this.filterRequest);
  // }
  //
  // getDefaultValue(): string[] {
  //   switch (this.filterRequest?.condition?.className) {
  //     case ConditionType.IsIn:
  //       return (this.filterRequest?.condition as In).possibleValues;
  //     default:
  //       return [];
  //   }
  // }
  //
  // setValueBySetting(setting: ChartOption) {
  //   const isTabFilterSetting = setting.className == VizSettingType.TabFilterSetting;
  //   if (isTabFilterSetting) {
  //     const defaultValues = (setting as TabFilterOption)?.options?.default?.setting?.value ?? [];
  //     this.setDefaultValue(defaultValues);
  //   }
  // }
}
