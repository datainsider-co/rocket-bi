/*
 * @author: tvc12 - Thien Vi
 * @created: 7/14/21, 5:45 PM
 */

import { BodyStyleFormatter } from '@chart/table/pivot-table/style/body/BodyStyleFormatter';
import { AbstractTableResponse, ApplyToType, PivotTableQuerySetting, PivotTableChartOption, ConditionalFormattingType } from '@core/common/domain';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { BodyData } from '@chart/table/pivot-table/style/body/BodyData';
import { ListUtils } from '@/utils';
import { ConditionalFormattingUtils, FormatHeaderType } from '@core/utils/ConditionalFormattingUtils';
import { Log } from '@core/utils';
import { RuleFormatterUtils } from '@chart/table/default-table/style/body/rule-handler/RuleFormatterUtils';
import { PivotFieldFormatterUtils } from '@chart/table/pivot-table/style/PivotFieldFormatterUtils';
import { PivotFormatAs } from '@chart/table/pivot-table/style/PivotFormatAs';
import { BackgroundColorRuleFormatter as TableBackgroundColorRuleFormatter } from '@chart/table/default-table/style/body/BackgroundColorRuleFormatter';

export class BackgroundRuleFormatter implements BodyStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
  createStyle(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    try {
      if (this.canUseBackgroundColorRule(bodyData)) {
        const formatType = PivotFieldFormatterUtils.getFormatType(bodyData.querySetting);
        switch (formatType) {
          case PivotFormatAs.Table:
            return TableBackgroundColorRuleFormatter.createBackgroundColorStyle(bodyData);
          case PivotFormatAs.OneRow:
            return this.createNormalBackground(bodyData);
          default:
            return this.createDefaultBackground(bodyData);
        }
      } else {
        return PivotFieldFormatterUtils.getDefaultStyle();
      }
    } catch (ex) {
      Log.error('BackgroundColorRuleFormatter::error', ex);
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  private createDefaultBackground(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const isFirstColumn = bodyData.bodyCellData.columnIndex == 0;
    if (isFirstColumn) {
      return PivotFieldFormatterUtils.getDefaultStyle();
    } else {
      return this.createNormalBackground(bodyData);
    }
  }

  createNormalBackground(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    const { bodyCellData, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, bodyCellData.header)!;
    const headerFormatting = ConditionalFormattingUtils.findPivotHeaderFormatter(formattingData, bodyCellData.header, FormatHeaderType.BackgroundColor);

    if (headerFormatting) {
      const minMaxData = ConditionalFormattingUtils.findMinMaxData(tableResponse, headerFormatting);
      return {
        css: {
          'background-color': RuleFormatterUtils.getColor(formattingData.backgroundColor!, headerFormatting, minMaxData, bodyCellData.rowData)
        } as any
      };
    } else {
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  private canUseBackgroundColorRule(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { querySetting, bodyCellData, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const isFormatterExisted = ListUtils.isNotEmpty(querySetting.formatters);
    const backgroundColor = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, bodyCellData.header)?.backgroundColor;
    const canApplyBody = backgroundColor?.applyTo === ApplyToType.ValuesOnly || backgroundColor?.applyTo === ApplyToType.ValueAndTotals;
    return isFormatterExisted && canApplyBody && backgroundColor && backgroundColor.formatType === ConditionalFormattingType.Rules;
  }
}
