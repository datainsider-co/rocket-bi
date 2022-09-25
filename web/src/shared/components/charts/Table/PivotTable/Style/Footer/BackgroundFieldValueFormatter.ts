/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { AbstractTableResponse, ApplyToType, PivotTableQuerySetting, PivotTableChartOption, ConditionalFormattingType } from '@core/domain';
import { CustomStyleData } from '@chart/CustomTable/TableData';
import { ListUtils } from '@/utils';
import { ConditionalFormattingUtils, FormatHeaderType } from '@core/utils/ConditionalFormattingUtils';
import { Log } from '@core/utils';
import { FooterStyleFormatter } from '@chart/Table/DefaultTable/Style/Footer/FooterStyleFormatter';
import { FooterData } from '@chart/Table/DefaultTable/Style/Footer/FooterData';
import { HeaderData } from '@/shared/models';
import { PivotFieldFormatterUtils } from '@chart/Table/PivotTable/Style/PivotFieldFormatterUtils';
import { PivotFormatAs } from '@chart/Table/PivotTable/Style/PivotFormatAs';

export class BackgroundFieldValueFormatter implements FooterStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
  createStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    try {
      if (this.canUseBackgroundFieldValue(bodyData)) {
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
      Log.error('BackgroundFieldValueFormatter::error', ex);
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  createBackgroundColorStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    const { data, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, data.header)!;
    const headerFormatting = ConditionalFormattingUtils.findPivotHeaderFormatter(formattingData, data.header, FormatHeaderType.BackgroundColor);
    return this.buildStyle(headerFormatting);
  }

  private canUseBackgroundFieldValue(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { querySetting, data, vizSetting } = bodyData;
    // ignore formatting first column
    const isNotFirstColumn = data.header.columnIndex > 0;
    const { conditionalFormatting } = vizSetting.options;
    const isFormatterExisted = ListUtils.isNotEmpty(querySetting.formatters);
    const backgroundColor = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, data.header)?.backgroundColor;
    const canApplyBody = backgroundColor?.applyTo === ApplyToType.TotalsOnly || backgroundColor?.applyTo === ApplyToType.ValueAndTotals;
    return isNotFirstColumn && isFormatterExisted && canApplyBody && backgroundColor && backgroundColor.formatType === ConditionalFormattingType.FieldValue;
  }

  private buildStyle(headerFormatting: HeaderData | undefined) {
    if (headerFormatting) {
      return {
        css: {
          'background-color': headerFormatting.total
        } as any
      };
    } else {
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  private createTableBackgroundColorStyle(bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { data, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, data.header)!;
    const headerFormatting = ConditionalFormattingUtils.findTableHeaderForFormatting(formattingData, tableResponse, FormatHeaderType.BackgroundColor);
    return this.buildStyle(headerFormatting);
  }
}
