/*
 * @author: tvc12 - Thien Vi
 * @created: 7/14/21, 5:45 PM
 */

import {
  AbstractTableResponse,
  ApplyToType,
  ConditionalFormattingType,
  ConditionalFormattingData,
  PivotTableQuerySetting,
  PivotTableChartOption,
  TableResponse
} from '@core/common/domain';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { ListUtils } from '@/utils';
import { ConditionalFormattingUtils, FormatHeaderType } from '@core/utils/ConditionalFormattingUtils';
import { Log } from '@core/utils';
import { RuleFormatterUtils } from '@chart/table/default-table/style/body/rule-handler/RuleFormatterUtils';
import { FooterStyleFormatter } from '@chart/table/default-table/style/footer/FooterStyleFormatter';
import { FooterData } from '@chart/table/default-table/style/footer/FooterData';
import { PivotFieldFormatterUtils } from '@chart/table/pivot-table/style/PivotFieldFormatterUtils';
import { PivotFormatAs } from '@chart/table/pivot-table/style/PivotFormatAs';
import { HeaderData } from '@/shared/models';

export class BackgroundColorRuleFormatter implements FooterStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
  createStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    try {
      if (this.canUseBackgroundColorRule(bodyData)) {
        const formatType = PivotFieldFormatterUtils.getFormatType(bodyData.querySetting);
        switch (formatType) {
          case PivotFormatAs.Table:
            return this.createTableBackgroundColorStyle(bodyData);
          default: {
            return this.createBackgroundColorStyle(bodyData);
          }
        }
      } else {
        return PivotFieldFormatterUtils.getDefaultStyle();
      }
    } catch (ex) {
      Log.error('BackgroundColorRuleFormatter::error', ex);
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  createBackgroundColorStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    const { data, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, data.header)!;
    const headerFormatting = ConditionalFormattingUtils.findPivotHeaderFormatter(formattingData, data.header, FormatHeaderType.BackgroundColor);
    return this.buildStyle(formattingData, headerFormatting, tableResponse);
  }

  private canUseBackgroundColorRule(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { querySetting, data, vizSetting } = bodyData;
    // ignore formatting first column
    const isNotFirstColumn = data.header.columnIndex > 0;
    const { conditionalFormatting } = vizSetting.options;
    const isFormatterExisted = ListUtils.isNotEmpty(querySetting.formatters);
    const backgroundColor = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, data.header)?.backgroundColor;
    const canApplyBody = backgroundColor?.applyTo === ApplyToType.TotalsOnly || backgroundColor?.applyTo === ApplyToType.ValueAndTotals;
    return isNotFirstColumn && isFormatterExisted && canApplyBody && backgroundColor && backgroundColor.formatType === ConditionalFormattingType.Rules;
  }

  private createTableBackgroundColorStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { data, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, data.header)!;
    const headerFormatting = ConditionalFormattingUtils.findTableHeaderForFormatting(formattingData, tableResponse, FormatHeaderType.BackgroundColor);
    return this.buildStyle(formattingData, headerFormatting, tableResponse);
  }

  private buildStyle(formattingData: ConditionalFormattingData, headerFormatting: HeaderData | undefined, tableResponse: TableResponse) {
    if (headerFormatting) {
      const minMaxData = ConditionalFormattingUtils.findMinMaxData(tableResponse, headerFormatting);
      return {
        css: {
          'background-color': RuleFormatterUtils.getFooterColor(formattingData.backgroundColor!, headerFormatting, minMaxData)
        } as any
      };
    } else {
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }
}
