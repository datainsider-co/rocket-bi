/*
 * @author: tvc12 - Thien Vi
 * @created: 5/26/21, 4:21 PM
 */

import {
  ChartOptionClassName,
  ChartOptionData,
  FieldFormatting,
  FormatterSetting,
  GridSetting,
  StyleSetting,
  TableColumn,
  TooltipSetting,
  TotalSetting,
  VisualHeader
} from '@core/common/domain/model';
import { Scrollable } from '@core/common/domain/model/query/features/Scrollable';
import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { get } from 'lodash';
import { TablePanelUtils } from '@/utils/TablePanelUtils';
import { ColorConfig } from '@core/common/domain/model/chart-option/extra-setting/ColorConfig';
import { HeaderStyleSetting } from '@core/common/domain/model/chart-option/extra-setting/table-style/HeaderStyleSetting';
import { ValueStyleSetting } from '@core/common/domain/model/chart-option/extra-setting/table-style/ValueStyleSetting';
import { ToggleIconSetting } from '@core/common/domain/model/chart-option/extra-setting/table-style/ToggleIconSetting';
import { ConditionalFormatting } from '@core/common/domain/model/chart-option/extra-setting/condition-formatting/ConditionalFormatting';
import { ConditionalFormattingUtils } from '@core/utils/ConditionalFormattingUtils';

export type Disabled = false | null | undefined;

export interface PivotTableOptionData extends ChartOptionData {
  enableScrollBar?: boolean;
  valueColors?: ColorConfig[] | Disabled;
  grid?: GridSetting;
  total?: TotalSetting;
  header?: HeaderStyleSetting;
  value?: ValueStyleSetting;
  fieldFormatting?: FieldFormatting;
  conditionalFormatting?: ConditionalFormatting;
  tooltip?: TooltipSetting;
  visualHeader?: VisualHeader;
  style?: StyleSetting;
  toggleIcon?: ToggleIconSetting;
  theme?: string;
}

export class PivotTableChartOption extends ChartOption<PivotTableOptionData> implements Scrollable, FormatterSetting {
  readonly className = ChartOptionClassName.PivotTableSetting;

  constructor(options: PivotTableOptionData = {}) {
    super(options);
  }

  static fromObject(obj: any): PivotTableChartOption {
    return new PivotTableChartOption(obj.options);
  }

  static isPivotTableSetting(obj: any): obj is PivotTableChartOption {
    return obj.className === ChartOptionClassName.PivotTableSetting;
  }

  static getDefaultChartOption(): PivotTableChartOption {
    const textColor = this.getPrimaryTextColor();
    const gridColor = this.getTableGridLineColor();
    const options: PivotTableOptionData = {
      title: ChartOption.getDefaultTitle(),
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
          ...ChartOption.getSecondaryStyle(),
          color: textColor,
          isWordWrap: false,
          fontSize: '12px'
        }
      },
      total: {
        enabled: true,
        backgroundColor: this.getTableTotalColor(),
        label: {
          text: 'Total',
          enabled: true,
          align: 'right',
          isWordWrap: false,
          backgroundColor: this.getTableTotalColor(),
          style: {
            ...ChartOption.getSecondaryStyle(),
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
    return new PivotTableChartOption(options);
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

  isEnableControl(): boolean {
    return false;
  }
}
