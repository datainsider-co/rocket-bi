import { Widget } from '../Widget';
import { ChartInfo, WidgetCommonData, Widgets } from '@core/common/domain';
import { isString } from 'lodash';
import { ChartType } from '@/shared';
import { Log, ObjectUtils } from '@core/utils';

export class DynamicConditionWidget extends Widget {
  className = Widgets.DynamicConditionWidget;
  values: string[];
  options: Record<string, any>;

  constructor(commonSetting: WidgetCommonData, values: string[], options: Record<string, any>) {
    super(commonSetting);
    this.values = values;
    this.options = options;
  }

  static fromObject(obj: DynamicConditionWidget): DynamicConditionWidget {
    const commonSetting: WidgetCommonData = {
      id: obj.id,
      name: obj.name,
      description: obj.description,
      extraData: obj.extraData,
      backgroundColor: obj.backgroundColor,
      textColor: obj.textColor
    };
    return new DynamicConditionWidget(commonSetting, obj.values, obj.options);
  }

  static fromChart(chart: ChartInfo): DynamicConditionWidget {
    Log.debug('isDynamicConditionChart::chart', chart);
    const common: WidgetCommonData = {
      id: chart.id,
      name: chart.name,
      description: chart.description,
      extraData: chart.extraData,
      backgroundColor: chart.backgroundColor,
      textColor: chart.textColor
    };
    const options = chart.setting.options.options;
    const values = chart.setting.options?.default?.values ?? [''];
    return new DynamicConditionWidget(common, values, options);
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

  static isDynamicConditionWidget(widget: any): widget is DynamicConditionWidget {
    return widget?.className === Widgets.DynamicConditionWidget;
  }

  static isDynamicConditionChart(widget: ChartInfo): boolean {
    Log.debug('isDynamicConditionChart::', widget.setting.options);
    const chartType = widget.setting.options.options['chartType'] ?? '';
    switch (chartType) {
      case ChartType.InputControl:
        return true;
      default:
        return false;
    }
  }

  get chartType(): ChartType {
    return this.options['extraData']?.currentChartType ?? this.options['chartType'] ?? '';
  }

  setValues(values: string[]): DynamicConditionWidget {
    ObjectUtils.set(this.options, 'options.default.values', values);
    this.values = values;
    return this;
  }
}
