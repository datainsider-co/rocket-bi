/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:48 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionData, DefaultSettings, ChartOptionClassName, ValueControlType, ValueControlInfo } from '@core/common/domain/model';
import { StringUtils } from '@/utils';
import { isString } from 'lodash';

export interface InputOptionData extends ChartOptionData {
  default?: DefaultSettings;
  placeHolder?: string;

  isNumber?: boolean;
}

export class InputFilterOption extends ChartOption<InputOptionData> {
  className = ChartOptionClassName.InputFilterSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): InputFilterOption {
    return new InputFilterOption(obj.options);
  }

  static getDefaultChartOption(): InputFilterOption {
    const textColor = this.getPrimaryTextColor();
    const options: ChartOptionData = {
      title: ChartOption.getDefaultTitle({ fontSize: '14px', align: 'left' }),
      subtitle: ChartOption.getDefaultSubtitle({ align: 'left' }),
      placeHolder: 'Typing...',
      affectedByFilter: true,
      textColor: textColor,
      background: this.getThemeBackgroundColor()
    };
    return new InputFilterOption(options);
  }

  isEnableControl(): boolean {
    return true;
  }

  public getSupportedControls(): ValueControlInfo[] {
    return [new ValueControlInfo(ValueControlType.SelectedValue, 'Selected value')];
  }

  public getDefaultValueAsMap(): Map<ValueControlType, string[]> {
    const defaultValue = this.options.default?.setting?.value;
    if (isString(defaultValue) && StringUtils.isNotEmpty(defaultValue)) {
      return new Map([[ValueControlType.SelectedValue, [defaultValue]]]);
    } else {
      return new Map<ValueControlType, string[]>();
    }
  }

  getOverridePadding(): string | undefined {
    return '6px';
  }
}
