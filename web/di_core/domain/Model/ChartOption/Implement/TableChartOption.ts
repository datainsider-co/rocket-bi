/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:42 PM
 */

import { ChartFamilyType, ChartOptionData, FieldFormatting, GridSetting, TableColumn, TooltipSetting, VisualHeader, VizSettingType } from '@core/domain/Model';
import { Scrollable } from '@core/domain/Model/Query/Features/Scrollable';
import { ChartOption } from '@core/domain/Model/ChartOption/ChartOption';
import { get } from 'lodash';
import { TablePanelUtils } from '@/utils/TablePanelUtils';
import { ColorConfig } from '@core/domain/Model/ChartOption/ExtraSetting/ColorConfig';
import { HeaderStyleSetting } from '@core/domain/Model/ChartOption/ExtraSetting/TableStyle/HeaderStyleSetting';
import { ValueStyleSetting } from '@core/domain/Model/ChartOption/ExtraSetting/TableStyle/ValueStyleSetting';
import { ToggleIconSetting } from '@core/domain/Model/ChartOption/ExtraSetting/TableStyle/ToggleIconSetting';
import { ConditionalFormatting } from '@core/domain/Model/ChartOption/ExtraSetting/ConditionFormatting/ConditionalFormatting';
import { FormatterSetting } from './FormatterSetting';
import { ConditionalFormattingUtils } from '@core/utils/ConditionalFormattingUtils';
import { _ThemeStore } from '@/store/modules/ThemeStore';

export enum DisplayTableType {
  Collapse = 'collapse',
  Normal = 'Normal'
}

export interface TableOptionData extends ChartOptionData {
  displayType?: DisplayTableType;
  enableScrollBar?: boolean;
  header?: HeaderStyleSetting;
  value?: ValueStyleSetting;
  grid?: GridSetting;
  fieldFormatting?: FieldFormatting;
  conditionalFormatting?: ConditionalFormatting;
  tooltip?: TooltipSetting;
  visualHeader?: VisualHeader;
  toggleIcon?: ToggleIconSetting;
  theme?: string;
}

export class TableChartOption extends ChartOption<TableOptionData> implements Scrollable, FormatterSetting {
  chartFamilyType = ChartFamilyType.Table;
  className = VizSettingType.TableSetting;

  constructor(options: TableOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): TableChartOption {
    return new TableChartOption(obj.options);
  }

  static isTableSetting(setting: any): setting is TableChartOption {
    return setting.className === VizSettingType.TableSetting;
  }

  static getDefaultChartOption(): TableChartOption {
    const textColor = this.getThemeTextColor();
    const gridColor = this.getTableGridLineColor();
    const options: TableOptionData = {
      title: {
        align: 'center',
        enabled: true,
        text: 'Untitled chart',
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
    return new TableChartOption(options);
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
