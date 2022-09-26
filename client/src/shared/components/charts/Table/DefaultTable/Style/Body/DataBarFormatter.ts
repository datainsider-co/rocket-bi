/*
 * @author: tvc12 - Thien Vi
 * @created: 7/22/21, 2:06 PM
 */

import { BodyStyleFormatter } from '@chart/Table/PivotTable/Style/Body/BodyStyleFormatter';
import {
  AbstractTableQuerySetting,
  AbstractTableResponse,
  ConditionalFormattingData,
  PivotTableQuerySetting,
  PivotTableChartOption,
  TableChartOption
} from '@core/domain';
import { PivotFieldFormatterUtils } from '@chart/Table/PivotTable/Style/PivotFieldFormatterUtils';
import { Log, NumberUtils } from '@core/utils';
import { CustomStyleData } from '@chart/CustomTable/TableData';
import { BodyData } from '@chart/Table/PivotTable/Style/Body/BodyData';
import { ConditionalFormattingUtils } from '@core/utils/ConditionalFormattingUtils';
import { isNumber } from 'lodash';
import { DataBarUtils } from '@chart/Table/DefaultTable/Style/Body/DataBarUtils';

export class DataBarFormatter implements BodyStyleFormatter<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption> {
  static createDataBarStyle(
    bodyData:
      | BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>
      | BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>
  ): CustomStyleData {
    const { bodyCellData, vizSetting, tableResponse } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const formattingData: ConditionalFormattingData = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, bodyCellData.header)!;
    const value = NumberUtils.toNumber(bodyCellData.rowData[bodyCellData.header.key]);

    return DataBarUtils.buildDataBarStyle(formattingData, tableResponse, value);
  }

  createStyle(bodyData: BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>): CustomStyleData {
    try {
      if (this.canUseDataBar(bodyData)) {
        return DataBarFormatter.createDataBarStyle(bodyData);
      } else {
        return PivotFieldFormatterUtils.getDefaultStyle();
      }
    } catch (ex) {
      Log.error('DataBarFormatter::error', ex);
      return PivotFieldFormatterUtils.getDefaultStyle();
    }
  }

  private canUseDataBar(bodyData: BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>) {
    const { bodyCellData, vizSetting } = bodyData;
    const { conditionalFormatting } = vizSetting.options;
    const dataBar = ConditionalFormattingUtils.findConditionFormattingData(conditionalFormatting, bodyCellData.header)?.dataBar;
    const value = bodyCellData.rowData[bodyCellData.header.key];
    return dataBar && dataBar.enabled && isNumber(NumberUtils.toNumber(value));
  }
}
