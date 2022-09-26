/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import {
  AbstractTableResponse,
  ApplyToType,
  ConditionalFormattingData,
  ConditionalFormattingType,
  PivotTableChartOption,
  PivotTableQuerySetting,
  TableResponse
} from '@core/domain';
import { CustomStyleData } from '@chart/CustomTable/TableData';
import { ListUtils } from '@/utils';
import { ConditionalFormattingUtils, FormatHeaderType } from '@core/utils/ConditionalFormattingUtils';
import { Log } from '@core/utils';
import { RuleFormatterUtils } from '@chart/Table/DefaultTable/Style/Body/RuleHandler/RuleFormatterUtils';
import { TableFieldFormatterUtils } from '@chart/Table/DefaultTable/Style/TableFieldFormatterUtils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { PivotFieldFormatterUtils } from '@chart/Table/PivotTable/Style/PivotFieldFormatterUtils';
import { PivotFormatAs } from '@chart/Table/PivotTable/Style/PivotFormatAs';
import { FooterStyleFormatter } from '@chart/Table/DefaultTable/Style/Footer/FooterStyleFormatter';
import { FooterData } from '@chart/Table/DefaultTable/Style/Footer/FooterData';
import { HeaderData } from '@/shared/models';

export class IconRuleFormatter implements FooterStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
  createStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    try {
      if (this.canUseIconRule(bodyData)) {
        const formatType = PivotFieldFormatterUtils.getFormatType(bodyData.querySetting);
        switch (formatType) {
          case PivotFormatAs.Table:
            return this.createTableIconStyle(bodyData);
          default:
            return this.createPivotIconStyle(bodyData);
        }
      } else {
        return TableFieldFormatterUtils.getDefaultStyle();
      }
    } catch (ex) {
      Log.error('IconRuleFormatter::error', ex);
      return TableFieldFormatterUtils.getDefaultStyle();
    }
  }

  private canUseIconRule(footerData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { querySetting, data, vizSetting } = footerData;
    const { conditionalFormatting } = vizSetting.options;
    // ignore formatting first column
    const isNotFirstColumn = data.header.columnIndex > 0;
    const isFormatterExisted = ListUtils.isNotEmpty(querySetting.formatters);
    const iconFormatting = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, data.header)?.icon;
    const canApplyBody = iconFormatting?.applyTo === ApplyToType.TotalsOnly || iconFormatting?.applyTo === ApplyToType.ValueAndTotals;
    return isNotFirstColumn && isFormatterExisted && canApplyBody && iconFormatting && iconFormatting.formatType === ConditionalFormattingType.Rules;
  }

  private createPivotIconStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { data, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, data.header)!;
    const headerFormatting = ConditionalFormattingUtils.findPivotHeaderFormatter(formattingData, data.header, FormatHeaderType.Icon);

    return this.buildIconStyle(formattingData, headerFormatting, tableResponse);
  }

  private buildIconStyle(formattingData: ConditionalFormattingData, headerFormatting: HeaderData | undefined, tableResponse: TableResponse) {
    if (headerFormatting) {
      const minMaxData = ConditionalFormattingUtils.findMinMaxData(tableResponse, headerFormatting);
      const icon: string | undefined = RuleFormatterUtils.getFooterIcon(formattingData.icon!, headerFormatting, minMaxData);

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

  private createTableIconStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { data, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, data.header)!;
    const headerFormatting = ConditionalFormattingUtils.findTableHeaderForFormatting(formattingData, tableResponse, FormatHeaderType.Icon);
    return this.buildIconStyle(formattingData, headerFormatting, tableResponse);
  }
}
