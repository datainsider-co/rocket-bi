/*
 * @author: tvc12 - Thien Vi
 * @created: 7/22/21, 2:06 PM
 */

import { BodyStyleFormatter } from '@chart/table/pivot-table/style/body/BodyStyleFormatter';
import { AbstractTableResponse, ConditionalFormattingData, PivotTableQuerySetting, PivotTableChartOption } from '@core/common/domain';
import { PivotFieldFormatterUtils } from '@chart/table/pivot-table/style/PivotFieldFormatterUtils';
import { Log, NumberUtils } from '@core/utils';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { BodyData } from '@chart/table/pivot-table/style/body/BodyData';
import { PivotFormatAs } from '@chart/table/pivot-table/style/PivotFormatAs';
import { DataBarFormatter as TableDataBarFormatter } from '@chart/table/default-table/style/body/DataBarFormatter';
import { isNumber } from 'lodash';
import { ConditionalFormattingUtils } from '@core/utils/ConditionalFormattingUtils';
import { ListUtils } from '@/utils';
import { DataBarUtils } from '@chart/table/default-table/style/body/DataBarUtils';

export class DataBarFormatter implements BodyStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
  private static findConditionalFormattingData(
    bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>
  ): ConditionalFormattingData | undefined {
    const { bodyCellData, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    if (ListUtils.hasOnlyOneItem(bodyData.querySetting.values)) {
      const settingName = ListUtils.getHead(bodyData.querySetting.values)!.name;
      return ConditionalFormattingUtils.findConditionFormattingDataByName(conditionalFormatting, settingName);
    } else {
      return ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, bodyCellData.header);
    }
  }

  createStyle(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    try {
      if (this.canUseDataBar(bodyData)) {
        const formatType = PivotFieldFormatterUtils.getFormatType(bodyData.querySetting);
        switch (formatType) {
          case PivotFormatAs.Table:
            return TableDataBarFormatter.createDataBarStyle(bodyData);
          case PivotFormatAs.OneRow:
            return this.createDataBarStyle(bodyData);
          default: {
            return this.createDefaultDataBarStyle(bodyData);
          }
        }
      } else {
        return PivotFieldFormatterUtils.getDefaultStyle();
      }
    } catch (ex) {
      Log.error('DataBarFormatter::error', ex);
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  private canUseDataBar(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { bodyCellData } = bodyData;
    const dataBar = DataBarFormatter.findConditionalFormattingData(bodyData)?.dataBar;
    const value = bodyCellData.rowData[bodyCellData.header.key];

    return dataBar && dataBar.enabled && isNumber(NumberUtils.toNumber(value));
  }

  private createDataBarStyle(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const { bodyCellData, tableResponse } = bodyData;
    const formattingData: ConditionalFormattingData = DataBarFormatter.findConditionalFormattingData(bodyData)!;
    const value = NumberUtils.toNumber(bodyCellData.rowData[bodyCellData.header.key]);

    return DataBarUtils.buildDataBarStyle(formattingData, tableResponse, value);
  }

  private createDefaultDataBarStyle(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>) {
    const isFirstRow = bodyData.bodyCellData.columnIndex === 0;
    if (isFirstRow) {
      return PivotFieldFormatterUtils.getDefaultStyle();
    } else {
      return this.createDataBarStyle(bodyData);
    }
  }
}
