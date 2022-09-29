/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { BodyStyleFormatter } from '@chart/table/pivot-table/style/body/BodyStyleFormatter';
import {
  AbstractTableQuerySetting,
  AbstractTableResponse,
  ApplyToType,
  ConditionalFormattingType,
  PivotTableQuerySetting,
  PivotTableChartOption,
  TableChartOption
} from '@core/common/domain';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { BodyData } from '@chart/table/pivot-table/style/body/BodyData';
import { ListUtils } from '@/utils';
import { ConditionalFormattingUtils, FormatHeaderType } from '@core/utils/ConditionalFormattingUtils';
import { Log } from '@core/utils';
import { ColorScaleUtils } from '@chart/table/default-table/style/body/ColorScaleUtils';
import { TableFieldFormatterUtils } from '@chart/table/default-table/style/TableFieldFormatterUtils';

export class BackgroundColorScaleFormatter implements BodyStyleFormatter<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption> {
  createStyle(bodyData: BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>): CustomStyleData {
    try {
      if (this.canUseBackgroundColorScale(bodyData)) {
        return BackgroundColorScaleFormatter.createBackgroundColorStyle(bodyData);
      } else {
        return TableFieldFormatterUtils.getDefaultStyle();
      }
    } catch (ex) {
      Log.error('TableBackgroundColorScaleFormatter::error', ex);
      return TableFieldFormatterUtils.getDefaultStyle();
    }
  }

  static createBackgroundColorStyle(
    bodyData:
      | BodyData<AbstractTableQuerySetting<TableChartOption>, AbstractTableResponse, TableChartOption>
      | BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>
  ): CustomStyleData {
    const { bodyCellData, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, bodyCellData.header)!;
    const headerFormatting = ConditionalFormattingUtils.findTableHeaderForFormatting(formattingData, tableResponse, FormatHeaderType.BackgroundColor);
    if (headerFormatting) {
      const minMaxData = ConditionalFormattingUtils.findMinMaxData(tableResponse, headerFormatting);
      return {
        css: {
          'background-color': ColorScaleUtils.getColor(headerFormatting, formattingData.backgroundColor!, minMaxData, bodyCellData.rowData)
        } as any
      };
    } else {
      return TableFieldFormatterUtils.getDefaultStyle();
    }
  }

  private canUseBackgroundColorScale(bodyData: BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>) {
    const { querySetting, bodyCellData, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const isFormatterExisted = ListUtils.isNotEmpty(querySetting.formatters);
    const backgroundColor = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, bodyCellData.header)?.backgroundColor;
    const canApplyBody = backgroundColor?.applyTo === ApplyToType.ValuesOnly || backgroundColor?.applyTo === ApplyToType.ValueAndTotals;
    return isFormatterExisted && canApplyBody && backgroundColor && backgroundColor.formatType === ConditionalFormattingType.ColorScale;
  }
}
