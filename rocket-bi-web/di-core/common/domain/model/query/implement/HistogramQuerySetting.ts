/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:38 AM
 */

import {
  Condition,
  Function,
  getFiltersAndSorts,
  HistogramChartOption,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  TableColumn,
  VizSettingType,
  WidgetId
} from '@core/common/domain/model';
import { QuerySetting } from '../QuerySetting';
import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class HistogramQuerySetting extends QuerySetting<HistogramChartOption> {
  readonly className = QuerySettingType.Histogram;

  constructor(
    public value: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    public binsNumber?: number,
    options: Record<string, any> = {},

    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  static fromObject(obj: HistogramQuerySetting): HistogramQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new HistogramQuerySetting(value, filters, sorts, obj.binsNumber, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    return [this.value.function];
  }

  getAllTableColumn(): TableColumn[] {
    return [this.value];
  }

  changeBinsNumber(value: string | number | undefined) {
    if (value) {
      this.binsNumber = +value;
    }
  }

  setValueBySetting(setting: ChartOption) {
    const isHistogramSetting = setting.className == VizSettingType.HistogramSetting;
    if (isHistogramSetting) {
      const binsNumber = (setting as HistogramChartOption).options.binNumber;
      this.changeBinsNumber(binsNumber);
    }
  }

  static isHistogramQuerySetting(obj: any): obj is HistogramQuerySetting {
    return obj.className === QuerySettingType.Histogram;
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }
}
