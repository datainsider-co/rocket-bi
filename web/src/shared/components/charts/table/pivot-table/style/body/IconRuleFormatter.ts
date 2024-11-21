/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { BodyStyleFormatter } from '@chart/table/pivot-table/style/body/BodyStyleFormatter';
import { AbstractTableResponse, ApplyToType, ConditionalFormattingType, PivotTableChartOption, PivotTableQuerySetting } from '@core/common/domain';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { BodyData } from '@chart/table/pivot-table/style/body/BodyData';
import { ListUtils } from '@/utils';
import { ConditionalFormattingUtils, FormatHeaderType } from '@core/utils/ConditionalFormattingUtils';
import { Log } from '@core/utils';
import { RuleFormatterUtils } from '@chart/table/default-table/style/body/rule-handler/RuleFormatterUtils';
import { TableFieldFormatterUtils } from '@chart/table/default-table/style/TableFieldFormatterUtils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { PivotFieldFormatterUtils } from '@chart/table/pivot-table/style/PivotFieldFormatterUtils';
import { PivotFormatAs } from '@chart/table/pivot-table/style/PivotFormatAs';
import { IconRuleFormatter as TableIconRuleFormatter } from '@chart/table/default-table/style/body/IconRuleFormatter';

export class IconRuleFormatter implements BodyStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
  createStyle(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    try {
      if (this.canUseIconRule(bodyData)) {
        const formatType = PivotFieldFormatterUtils.getFormatType(bodyData.querySetting);
        switch (formatType) {
          case PivotFormatAs.Table:
            return TableIconRuleFormatter.createIconStyle(bodyData);
          case PivotFormatAs.OneRow:
            return this.createNormalIcon(bodyData);
          default:
            return this.createDefaultIcon(bodyData);
        }
      } else {
        return TableFieldFormatterUtils.getDefaultStyle();
      }
    } catch (ex) {
      Log.error('IconRuleFormatter::error', ex);
      return TableFieldFormatterUtils.getDefaultStyle();
    }
  }

  private canUseIconRule(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { querySetting, bodyCellData, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const isFormatterExisted = ListUtils.isNotEmpty(querySetting.formatters);
    const iconFormatting = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, bodyCellData.header)?.icon;
    const canApplyBody = iconFormatting?.applyTo === ApplyToType.ValuesOnly || iconFormatting?.applyTo === ApplyToType.ValueAndTotals;
    return isFormatterExisted && canApplyBody && iconFormatting && iconFormatting.formatType === ConditionalFormattingType.Rules;
  }

  private createNormalIcon(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { bodyCellData, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, bodyCellData.header)!;
    const headerFormatting = ConditionalFormattingUtils.findPivotHeaderFormatter(formattingData, bodyCellData.header, FormatHeaderType.Icon);

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
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  private createDefaultIcon(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const isFirstColumn = bodyData.bodyCellData.columnIndex == 0;
    if (isFirstColumn) {
      return PivotFieldFormatterUtils.getDefaultStyle();
    } else {
      return this.createNormalIcon(bodyData);
    }
  }
}
