/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { BodyStyleFormatter } from '@chart/Table/PivotTable/Style/Body/BodyStyleFormatter';
import { AbstractTableResponse, ApplyToType, ConditionalFormattingType, PivotTableChartOption, PivotTableQuerySetting } from '@core/domain';
import { CustomStyleData } from '@chart/CustomTable/TableData';
import { BodyData } from '@chart/Table/PivotTable/Style/Body/BodyData';
import { ListUtils } from '@/utils';
import { ConditionalFormattingUtils, FormatHeaderType } from '@core/utils/ConditionalFormattingUtils';
import { Log } from '@core/utils';
import { TableFieldFormatterUtils } from '@chart/Table/DefaultTable/Style/TableFieldFormatterUtils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { PivotFieldFormatterUtils } from '@chart/Table/PivotTable/Style/PivotFieldFormatterUtils';
import { PivotFormatAs } from '@chart/Table/PivotTable/Style/PivotFormatAs';
import { IconFieldValueFormatter as TableIconFieldValueFormatter } from '@chart/Table/DefaultTable/Style/Body/IconFieldValueFormatter';

export class IconFieldValueFormatter implements BodyStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
  createStyle(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    try {
      if (this.canUseIconRule(bodyData)) {
        const formatType = PivotFieldFormatterUtils.getFormatType(bodyData.querySetting);
        switch (formatType) {
          case PivotFormatAs.Table:
            return TableIconFieldValueFormatter.createIconStyle(bodyData);
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
    return isFormatterExisted && canApplyBody && iconFormatting && iconFormatting.formatType === ConditionalFormattingType.FieldValue;
  }

  private createNormalIcon(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { bodyCellData, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting!, bodyCellData.header)!;
    const headerFormatting = ConditionalFormattingUtils.findPivotHeaderFormatter(formattingData, bodyCellData.header, FormatHeaderType.Icon);

    if (headerFormatting) {
      const imgSrc = bodyCellData.rowData[headerFormatting.key];
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

  private createDefaultIcon(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const isFirstColumn = bodyData.bodyCellData.columnIndex == 0;
    if (isFirstColumn) {
      return PivotFieldFormatterUtils.getDefaultStyle();
    } else {
      return this.createNormalIcon(bodyData);
    }
  }
}
