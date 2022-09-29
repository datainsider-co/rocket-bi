/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartFamilyType, ChartOptionData, DefaultSettings, VizSettingType } from '@core/common/domain/model';
import { DateHistogramConditionTypes } from '@/shared';

export interface DateFilterOptionData extends ChartOptionData {
  default?: DefaultSettings;
}

export class DateSelectFilterOption extends ChartOption<DateFilterOptionData> {
  chartFamilyType = ChartFamilyType.TabFilter;
  className = VizSettingType.DateSelectFilterSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): DateSelectFilterOption {
    return new DateSelectFilterOption(obj.options);
  }

  static getDefaultChartOption(): DateSelectFilterOption {
    const textColor = this.getThemeTextColor();
    const options: ChartOptionData = {
      title: {
        align: 'left',
        enabled: true,
        text: 'Date',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '14px'
        }
      },
      subtitle: {
        align: 'left',
        enabled: true,
        text: '',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '11px'
        }
      },
      affectedByFilter: true,
      textColor: textColor,
      activeColor: 'var(--tab-filter-background-active)',
      deActiveColor: 'var(--tab-filter-background-de-active)',
      background: this.getThemeBackgroundColor(),
      condition: DateHistogramConditionTypes.allTime
    };
    return new DateSelectFilterOption(options);
  }
}
