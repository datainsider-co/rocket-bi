/*
 * @author: tvc12 - Thien Vi
 * @created: 7/14/21, 3:36 PM
 */

import { BodyStyleFormatter } from '@chart/table/pivot-table/style/body/BodyStyleFormatter';
import { AbstractTableResponse, ApplyToType, PivotTableQuerySetting, PivotTableChartOption, ConditionalFormattingType } from '@core/common/domain';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { BodyData } from '@chart/table/pivot-table/style/body/BodyData';
import { ListUtils } from '@/utils';
import { ConditionalFormattingUtils, FormatHeaderType } from '@core/utils/ConditionalFormattingUtils';
import { Log } from '@core/utils';
import { PivotFieldFormatterUtils } from '@chart/table/pivot-table/style/PivotFieldFormatterUtils';
import { PivotFormatAs } from '@chart/table/pivot-table/style/PivotFormatAs';
import { ColorFieldValueFormatter as TableColorFieldValueFormatter } from '@chart/table/default-table/style/body/ColorFieldValueFormatter';

export class ColorFieldValueFormatter implements BodyStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
  createStyle(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    try {
      if (this.canUseColorFieldValue(bodyData)) {
        const formatType = PivotFieldFormatterUtils.getFormatType(bodyData.querySetting);
        switch (formatType) {
          case PivotFormatAs.Table:
            return TableColorFieldValueFormatter.createColorStyle(bodyData);
          case PivotFormatAs.OneRow:
            return this.createNormalColorStyle(bodyData);
          default:
            return this.createDefaultBackground(bodyData);
        }
      } else {
        return PivotFieldFormatterUtils.getDefaultStyle();
      }
    } catch (ex) {
      Log.error('ColorFieldValueFormatter::error', ex);
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  private createDefaultBackground(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const isFirstColumn = bodyData.bodyCellData.columnIndex == 0;
    if (isFirstColumn) {
      return PivotFieldFormatterUtils.getDefaultStyle();
    } else {
      return this.createNormalColorStyle(bodyData);
    }
  }

  createNormalColorStyle(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    const { bodyCellData, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, bodyCellData.header)!;
    const headerFormatting = ConditionalFormattingUtils.findPivotHeaderFormatter(formattingData, bodyCellData.header, FormatHeaderType.Color);

    if (headerFormatting) {
      const color = bodyCellData.rowData[headerFormatting.key];
      return {
        css: {
          color: color
        } as any
      };
    } else {
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  private canUseColorFieldValue(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { querySetting, bodyCellData, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const isFormatterExisted = ListUtils.isNotEmpty(querySetting.formatters);
    const color = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, bodyCellData.header)?.color;
    const canApplyBody = color?.applyTo === ApplyToType.ValuesOnly || color?.applyTo === ApplyToType.ValueAndTotals;
    return isFormatterExisted && canApplyBody && color && color.formatType === ConditionalFormattingType.FieldValue;
  }
}
