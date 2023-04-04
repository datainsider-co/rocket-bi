import { Widget } from '../Widget';
import { ChartInfo, GroupMeasurementOption, GroupMeasurementQuerySetting, QuerySetting, TableColumn, WidgetCommonData, Widgets } from '@core/common/domain';
import { get, isString, toNumber } from 'lodash';
import { ChartType } from '@/shared';
import { ListUtils } from '@/utils';

export class DynamicFunctionWidget extends Widget {
  className = Widgets.DynamicFunctionWidget;
  values: TableColumn[];
  options: Record<string, any>;
  selectedIndex: number;

  constructor(commonSetting: WidgetCommonData, values: TableColumn[], options: Record<string, any>, selectedIndex: number) {
    super(commonSetting);
    this.values = values;
    this.options = options;
    this.selectedIndex = selectedIndex;
  }

  static fromObject(obj: DynamicFunctionWidget): DynamicFunctionWidget {
    const commonSetting: WidgetCommonData = {
      id: obj.id,
      name: obj.name,
      description: obj.description,
      extraData: obj.extraData,
      backgroundColor: obj.backgroundColor,
      textColor: obj.textColor
    };
    const values: TableColumn[] = obj.values ? obj.values.map(value => TableColumn.fromObject(value)) : [];
    return new DynamicFunctionWidget(commonSetting, values, obj.options, obj.selectedIndex);
  }

  static fromChart(chart: ChartInfo): DynamicFunctionWidget {
    const common: WidgetCommonData = {
      id: chart.id,
      name: chart.name,
      description: chart.description,
      extraData: chart.extraData,
      backgroundColor: chart.backgroundColor,
      textColor: chart.textColor
    };
    const values: TableColumn[] = chart.setting.getAllTableColumn();
    const options = chart.setting.options.options;
    options['extraData'] = chart.extraData;
    const index = toNumber(get(options, 'default.values[0]', '0'));
    return new DynamicFunctionWidget(common, values, options, index);
  }

  toChart(): ChartInfo {
    const common: WidgetCommonData = {
      id: this.id,
      name: this.name,
      description: this.description,
      extraData: this.options['extraData'],
      backgroundColor: this.backgroundColor,
      textColor: this.textColor
    };
    return new ChartInfo(common, this.querySetting);
  }

  get querySetting(): QuerySetting {
    const options = new GroupMeasurementOption(this.options);
    return new GroupMeasurementQuerySetting(this.values, [], [], options);
  }

  getTitleColor() {
    const defaultColor = '#fff';
    if (isString(this.options?.title)) {
      return this.options?.textColor || defaultColor;
    }
    return this.options?.title?.style?.color ?? defaultColor;
  }

  getTitle() {
    return this.name || this.options?.title?.text || '';
  }

  getSubtitle() {
    return this.options?.subtitle?.text ?? '';
  }

  static isDynamicFunctionWidget(widget: any): widget is DynamicFunctionWidget {
    return widget?.className === Widgets.DynamicFunctionWidget;
  }

  getDefaultTableColumns(): TableColumn[] {
    if (ListUtils.isEmpty(this.values)) {
      return [];
    } else {
      return ((this.options?.default?.dynamicFunction?.columns ?? [this.values[0]]) as any[]).map(column => {
        return TableColumn.fromObject(column).copyWith({
          dynamicFunctionId: this.id
        });
      });
    }
  }

  isUseChartBuilderToEdit(): boolean {
    switch (this.chartType) {
      case ChartType.InputControl:
        return false;
      default:
        return true;
    }
  }

  get chartType(): ChartType {
    return this.options['extraData']?.currentChartType ?? this.options['chartType'] ?? '';
  }
}
