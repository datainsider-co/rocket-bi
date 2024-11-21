/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:42 PM
 */

import { DisplayTableType, TableColumn, TableOptionData, ChartOptionClassName } from '@core/common/domain/model';
import { Scrollable } from '@core/common/domain/model/query/features/Scrollable';
import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { get } from 'lodash';
import { TablePanelUtils } from '@/utils/TablePanelUtils';
import { ColorConfig } from '@core/common/domain/model/chart-option/extra-setting/ColorConfig';
import { FormatterSetting } from './FormatterSetting';
import { ConditionalFormattingUtils } from '@core/utils/ConditionalFormattingUtils';

export class FlattenTableChartOption extends ChartOption<TableOptionData> implements Scrollable, FormatterSetting {
  className = ChartOptionClassName.FlattenTableSetting;

  constructor(options: TableOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): FlattenTableChartOption {
    return new FlattenTableChartOption(obj.options);
  }

  static isTableSetting(setting: any): setting is FlattenTableChartOption {
    return setting.className === ChartOptionClassName.FlattenTableSetting;
  }

  static getDefaultChartOption(title = 'Untitled Chart'): FlattenTableChartOption {
    const textColor = this.getPrimaryTextColor();
    const gridColor = this.getTableGridLineColor();
    const options: TableOptionData = {
      title: ChartOption.getDefaultTitle({ title: title }),
      subtitle: ChartOption.getDefaultSubtitle(),
      grid: {
        horizontal: {
          color: gridColor,
          thickness: '1px',
          rowPadding: '0px',
          applyBody: true,
          applyHeader: true,
          applyTotal: true
        },
        vertical: {
          color: gridColor,
          thickness: '1px',
          applyBody: false,
          applyHeader: false,
          applyTotal: false
        }
      },
      affectedByFilter: true,
      tooltip: {
        fontFamily: ChartOption.getSecondaryFontFamily(),
        backgroundColor: 'var(--tooltip-background-color)',
        valueColor: ChartOption.getSecondaryTextColor()
      },
      value: {
        color: textColor,
        backgroundColor: 'var(--row-even-background-color)',
        align: 'left',
        alternateBackgroundColor: 'var(--row-odd-background-color)',
        alternateColor: textColor,
        enableUrlIcon: false,
        style: {
          ...ChartOption.getSecondaryStyle(),
          fontSize: '12px',
          isWordWrap: false
        }
      },
      header: {
        align: 'left',
        backgroundColor: this.getTableHeaderBackgroundColor(),
        color: textColor,
        isWordWrap: false,
        isAutoWidthSize: false,
        style: {
          color: textColor,
          isWordWrap: false,
          fontFamily: ChartOption.getPrimaryFontFamily(),
          fontWeight: ChartOption.getPrimaryFontWeight(),
          fontStyle: ChartOption.getPrimaryFontStyle(),
          fontSize: '12px'
        }
      },
      toggleIcon: {
        color: textColor,
        backgroundColor: this.getTableToggleColor()
      },
      background: this.getThemeBackgroundColor()
    };
    return new FlattenTableChartOption(options);
  }

  getDisplayTableType(): DisplayTableType {
    return this.options.displayType ?? DisplayTableType.Collapse;
  }

  enableScrollBar(): boolean {
    return this.options.enableScrollBar ?? false;
  }

  getColorData(valueIndex: number): ColorConfig | undefined {
    const key: string = TablePanelUtils.getGroupKey(valueIndex);
    return get(this.options, key);
  }

  getFormatters(): TableColumn[] {
    return this.options.conditionalFormatting ? ConditionalFormattingUtils.buildTableColumns(this.options.conditionalFormatting) : [];
  }

  isEnableControl(): boolean {
    return false;
  }
}
