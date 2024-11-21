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
  PivotTableQuerySetting
} from '@core/common/domain';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { ListUtils } from '@/utils';
import { ConditionalFormattingUtils, FormatHeaderType } from '@core/utils/ConditionalFormattingUtils';
import { Log } from '@core/utils';
import { TableFieldFormatterUtils } from '@chart/table/default-table/style/TableFieldFormatterUtils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { PivotFieldFormatterUtils } from '@chart/table/pivot-table/style/PivotFieldFormatterUtils';
import { PivotFormatAs } from '@chart/table/pivot-table/style/PivotFormatAs';
import { FooterStyleFormatter } from '@chart/table/default-table/style/footer/FooterStyleFormatter';
import { FooterData } from '@chart/table/default-table/style/footer/FooterData';
import { HeaderData } from '@/shared/models';

export class IconFieldValueFormatter implements FooterStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
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
    return isNotFirstColumn && isFormatterExisted && canApplyBody && iconFormatting && iconFormatting.formatType === ConditionalFormattingType.FieldValue;
  }

  private createPivotIconStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { data, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, data.header)!;
    const headerFormatting = ConditionalFormattingUtils.findPivotHeaderFormatter(formattingData, data.header, FormatHeaderType.Icon);

    return this.buildIconStyle(formattingData, headerFormatting);
  }

  private buildIconStyle(formattingData: ConditionalFormattingData, headerFormatting: HeaderData | undefined) {
    if (headerFormatting) {
      const imgSrc = headerFormatting.total as any;
      const img = HtmlElementRenderUtils.renderImgAsString(imgSrc);
      return {
        css: {} as any,
        icon: {
          iconHTML: HtmlElementRenderUtils.renderDivAsString(img, 'icon'),
          align: formattingData.icon?.align ?? 'top',
          layout: formattingData.icon?.layout ?? 'left'
        }
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
    return this.buildIconStyle(formattingData, headerFormatting);
  }
}
