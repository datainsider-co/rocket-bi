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
  PivotTableChartOption,
  PivotTableQuerySetting,
  TableChartOption
} from '@core/common/domain';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { BodyData } from '@chart/table/pivot-table/style/body/BodyData';
import { ListUtils } from '@/utils';
import { ConditionalFormattingUtils, FormatHeaderType } from '@core/utils/ConditionalFormattingUtils';
import { Log } from '@core/utils';
import { RuleFormatterUtils } from '@chart/table/default-table/style/body/rule-handler/RuleFormatterUtils';
import { TableFieldFormatterUtils } from '@chart/table/default-table/style/TableFieldFormatterUtils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';

export class IconRuleFormatter implements BodyStyleFormatter<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption> {
  static createIconStyle(
    bodyData:
      | BodyData<AbstractTableQuerySetting<TableChartOption>, AbstractTableResponse, TableChartOption>
      | BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>
  ): CustomStyleData {
    const { bodyCellData, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, bodyCellData.header)!;
    const headerFormatting = ConditionalFormattingUtils.findTableHeaderForFormatting(formattingData, tableResponse, FormatHeaderType.Icon);
    if (headerFormatting) {
      const minMaxData = ConditionalFormattingUtils.findMinMaxData(tableResponse, headerFormatting);
      const icon: string | undefined = RuleFormatterUtils.getIcon(formattingData.icon!, headerFormatting, minMaxData, bodyCellData.rowData);
      return {
        css: {} as any,
        icon: icon
          ? {
              iconHTML: HtmlElementRenderUtils.renderDivAsString(icon, 'icon'),
              align: formattingData.icon?.align ?? 'top',
              layout: formattingData.icon?.layout ?? 'left'
            }
          : void 0
      };
    } else {
      return TableFieldFormatterUtils.getDefaultStyle();
    }
  }

  createStyle(bodyData: BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>): CustomStyleData {
    try {
      if (this.canUseIconRule(bodyData)) {
        return IconRuleFormatter.createIconStyle(bodyData);
      } else {
        return TableFieldFormatterUtils.getDefaultStyle();
      }
    } catch (ex) {
      Log.error('IconRuleFormatter::error', ex);
      return TableFieldFormatterUtils.getDefaultStyle();
    }
  }

  private canUseIconRule(bodyData: BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>) {
    const { querySetting, bodyCellData, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const isFormatterExisted = ListUtils.isNotEmpty(querySetting.formatters);
    const iconFormatting = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, bodyCellData.header)?.icon;
    const canApplyBody = iconFormatting?.applyTo === ApplyToType.ValuesOnly || iconFormatting?.applyTo === ApplyToType.ValueAndTotals;
    return isFormatterExisted && canApplyBody && iconFormatting && iconFormatting.formatType === ConditionalFormattingType.Rules;
  }
}
