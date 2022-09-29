/*
 * @author: tvc12 - Thien Vi
 * @created: 5/26/21, 4:21 PM
 */

import { ChartFamilyType, FormatterSetting, PivotTableOptionData, TableColumn, VizSettingType } from '@core/common/domain/model';
import { Scrollable } from '@core/common/domain/model/query/features/Scrollable';
import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { get } from 'lodash';
import { TablePanelUtils } from '@/utils/TablePanelUtils';
import { ColorConfig } from '@core/common/domain/model/chart-option/extra-setting/ColorConfig';
import { ConditionalFormattingUtils } from '@core/utils/ConditionalFormattingUtils';

export class FlattenPivotTableChartOption extends ChartOption<PivotTableOptionData> implements Scrollable, FormatterSetting {
  readonly chartFamilyType = ChartFamilyType.FlattenPivot;
  readonly className = VizSettingType.FlattenPivotTableSetting;

  constructor(options: PivotTableOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): FlattenPivotTableChartOption {
    return new FlattenPivotTableChartOption(obj.options);
  }

  static isPivotTableSetting(obj: any): obj is FlattenPivotTableChartOption {
    return obj.className === VizSettingType.FlattenPivotTableSetting;
  }

  static getDefaultChartOption(): FlattenPivotTableChartOption {
    const textColor = this.getThemeTextColor();
    const gridColor = this.getTableGridLineColor();
    const options: PivotTableOptionData = {
      title: {
        align: 'center',
        enabled: true,
        text: 'Pivot Table',
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
      total: {
        enabled: true,
        backgroundColor: this.getTableTotalColor(),
        label: {
          text: 'Total',
          enabled: true,
          align: 'left',
          isWordWrap: false,
          backgroundColor: this.getTableTotalColor(),
          style: {
            fontFamily: 'Roboto',
            fontSize: '12px',
            color: textColor,
            isWordWrap: false
          }
        }
      },
      toggleIcon: {
        color: textColor,
        backgroundColor: this.getTableToggleColor()
      },
      background: this.getThemeBackgroundColor()
    };
    return new FlattenPivotTableChartOption(options);
  }

  enableScrollBar(): boolean {
    return this.options.enableScrollBar ?? false;
  }

  getColorConfig(valueIndex: number): ColorConfig | undefined {
    const key: string = TablePanelUtils.getGroupKey(valueIndex);
    return get(this.options, key);
  }

  enableFooter(): boolean {
    return this.options.total?.enabled ?? true;
  }

  getFormatters(): TableColumn[] {
    return this.options.conditionalFormatting ? ConditionalFormattingUtils.buildTableColumns(this.options.conditionalFormatting) : [];
  }
}
