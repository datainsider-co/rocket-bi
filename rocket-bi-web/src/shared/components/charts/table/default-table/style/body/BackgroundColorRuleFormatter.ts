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
import { RuleFormatterUtils } from '@chart/table/default-table/style/body/rule-handler/RuleFormatterUtils';
import { TableFieldFormatterUtils } from '@chart/table/default-table/style/TableFieldFormatterUtils';

export class BackgroundColorRuleFormatter implements BodyStyleFormatter<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption> {
  static createBackgroundColorStyle(
    bodyData:
      | BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>
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
          'background-color': RuleFormatterUtils.getColor(formattingData.backgroundColor!, headerFormatting, minMaxData, bodyCellData.rowData)
        } as any
      };
    } else {
      return TableFieldFormatterUtils.getDefaultStyle();
    }
  }

  createStyle(bodyData: BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>): CustomStyleData {
    try {
      if (this.canUseBackgroundColorRule(bodyData)) {
        return BackgroundColorRuleFormatter.createBackgroundColorStyle(bodyData);
      } else {
        return TableFieldFormatterUtils.getDefaultStyle();
      }
    } catch (ex) {
      Log.error('TableBackgroundColorScaleFormatter::error', ex);
      return TableFieldFormatterUtils.getDefaultStyle();
    }
  }

  private canUseBackgroundColorRule(bodyData: BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>) {
    const { querySetting, bodyCellData, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const isFormatterExisted = ListUtils.isNotEmpty(querySetting.formatters);
    const backgroundColor = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, bodyCellData.header)?.backgroundColor;
    const canApplyBody = backgroundColor?.applyTo === ApplyToType.ValuesOnly || backgroundColor?.applyTo === ApplyToType.ValueAndTotals;
    return isFormatterExisted && canApplyBody && backgroundColor && backgroundColor.formatType === ConditionalFormattingType.Rules;
  }
}
