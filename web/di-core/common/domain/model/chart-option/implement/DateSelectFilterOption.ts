/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionClassName, ChartOptionData, DefaultSettings, ValueControlInfo, ValueControlType } from '@core/common/domain/model';
import { DateFilterUtils } from '@/shared/components/charts/date-filter/DateFilterUtils';
import { DateHistogramConditionTypes } from '@/shared/enums/ChartType';

export interface DateFilterOptionData extends ChartOptionData {
  default?: DefaultSettings;
}

export class DateSelectFilterOption extends ChartOption<DateFilterOptionData> {
  className = ChartOptionClassName.DateSelectFilterSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): DateSelectFilterOption {
    return new DateSelectFilterOption(obj.options);
  }

  static getDefaultChartOption(): DateSelectFilterOption {
    const textColor = this.getPrimaryTextColor();
    const options: ChartOptionData = {
      title: ChartOption.getDefaultTitle({ align: 'left', title: 'Date', fontSize: '14px' }),
      subtitle: ChartOption.getDefaultSubtitle({ align: 'left', content: '', fontSize: '11px' }),
      affectedByFilter: true,
      textColor: textColor,
      activeColor: 'var(--tab-filter-background-active)',
      deActiveColor: 'var(--tab-filter-background-de-active)',
      background: this.getThemeBackgroundColor(),
      condition: DateHistogramConditionTypes.allTime
    };
    return new DateSelectFilterOption(options);
  }

  isEnableControl(): boolean {
    return true;
  }

  getSupportedControls(): ValueControlInfo[] {
    return [new ValueControlInfo(ValueControlType.MinValue, 'Start date'), new ValueControlInfo(ValueControlType.MaxValue, 'End date')];
  }

  getDefaultValueAsMap(): Map<ValueControlType, string[]> {
    const defaultDateFilterData = this.options.default?.setting?.value;

    if (DateFilterUtils.isDateFilterData(defaultDateFilterData)) {
      const range: string[] = DateFilterUtils.calculatedDates(defaultDateFilterData);
      if (range.length === 2) {
        return new Map<ValueControlType, string[]>([
          [ValueControlType.MinValue, [range[0]]],
          [ValueControlType.MaxValue, [range[1]]]
        ]);
      }
    }
    return new Map<ValueControlType, string[]>();
  }

  getOverridePadding(): string | undefined {
    return '6px';
  }
}
