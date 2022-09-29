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

export class ColorRuleFormatter implements FooterStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
  createStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    try {
      if (this.canUseColorRule(bodyData)) {
        const formatType = PivotFieldFormatterUtils.getFormatType(bodyData.querySetting);
        switch (formatType) {
          case PivotFormatAs.Table:
            return this.createTableColorStyle(bodyData);
          default: {
            return this.createColorStyle(bodyData);
          }
        }
      } else {
        return PivotFieldFormatterUtils.getDefaultStyle();
      }
    } catch (ex) {
      Log.error('ColorRuleFormatter::error', ex);
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  createColorStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    const { data, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, data.header)!;
    const headerFormatting = ConditionalFormattingUtils.findPivotHeaderFormatter(formattingData, data.header, FormatHeaderType.Color);
    return this.buildStyle(formattingData, headerFormatting, tableResponse);
  }

  private buildStyle(formattingData: ConditionalFormattingData, headerFormatting: HeaderData | undefined, tableResponse: TableResponse) {
    if (headerFormatting) {
      const minMaxData = ConditionalFormattingUtils.findMinMaxData(tableResponse, headerFormatting);
      return {
        css: {
          color: RuleFormatterUtils.getFooterColor(formattingData.color!, headerFormatting, minMaxData)
        } as any
      };
    } else {
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  private canUseColorRule(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { querySetting, data, vizSetting } = bodyData;
    // ignore formatting first column
    const isNotFirstColumn = data.header.columnIndex > 0;
    const { conditionalFormatting } = vizSetting.options;
    const isFormatterExisted = ListUtils.isNotEmpty(querySetting.formatters);
    const color = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, data.header)?.color;
    const canApplyBody = color?.applyTo === ApplyToType.TotalsOnly || color?.applyTo === ApplyToType.ValueAndTotals;
    return isNotFirstColumn && isFormatterExisted && canApplyBody && color && color.formatType === ConditionalFormattingType.Rules;
  }

  private createTableColorStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { data, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, data.header)!;
    const headerFormatting = ConditionalFormattingUtils.findTableHeaderForFormatting(formattingData, tableResponse, FormatHeaderType.Color);
    return this.buildStyle(formattingData, headerFormatting, tableResponse);
  }
}
