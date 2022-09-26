/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:42 PM
 */

import { ChartFamilyType, DisplayTableType, TableColumn, TableOptionData, VizSettingType } from '@core/domain/Model';
import { Scrollable } from '@core/domain/Model/Query/Features/Scrollable';
import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { get } from 'lodash';
import { TablePanelUtils } from '@/utils/TablePanelUtils';
import { ColorConfig } from '@core/domain/Model/ChartOption/ExtraSetting/ColorConfig';
import { FormatterSetting } from './FormatterSetting';
import { ConditionalFormattingUtils } from '@core/utils/ConditionalFormattingUtils';

export class FlattenTableChartOption extends ChartOption<TableOptionData> implements Scrollable, FormatterSetting {
  chartFamilyType = ChartFamilyType.FlattenTable;
  className = VizSettingType.FlattenTableSetting;

  constructor(options: TableOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): FlattenTableChartOption {
    return new FlattenTableChartOption(obj.options);
  }

  static isTableSetting(setting: any): setting is FlattenTableChartOption {
    return setting.className === VizSettingType.FlattenTableSetting;
  }

  static getDefaultChartOption(): FlattenTableChartOption {
    const textColor = this.getThemeTextColor();
    const gridColor = this.getTableGridLineColor();
    const options: TableOptionData = {
      title: {
        align: 'center',
        enabled: true,
        text: 'Transform Table',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '20px'
        }
      },
      subtitle: {
        align: 'center',
        enabled: true,
        text: '',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '11px'
        }
      },
      grid: {
        horizontal: {
          color: gridColor,
          thickness: '1px',
          rowPadding: '0px',
          applyBody: false,
          applyHeader: true,
          applyTotal: true
        },
        vertical: {
          color: gridColor,
          thickness: '1px',
          applyBody: true,
          applyHeader: true,
          applyTotal: true
        }
      },
      affectedByFilter: true,
      tooltip: {
        fontFamily: 'Roboto',
        backgroundColor: 'var(--tooltip-background-color)',
        valueColor: textColor
      },
      value: {
        color: textColor,
        backgroundColor: 'var(--row-even-background-color)',
        align: 'left',
        alternateBackgroundColor: 'var(--row-odd-background-color)',
        alternateColor: textColor,
        enableUrlIcon: false,
        style: {
          color: textColor,
          fontFamily: 'Roboto',
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
          fontFamily: 'Roboto',
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
}
