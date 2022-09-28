/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { AbstractTableQuerySetting, AbstractTableResponse, FieldFormatter, TableChartOption } from '@core/domain';
import { CustomStyleData } from '@chart/CustomTable/TableData';
import { ObjectUtils } from '@core/utils';
import { TableFieldFormatterUtils } from '@chart/Table/DefaultTable/Style/TableFieldFormatterUtils';
import { FooterStyleFormatter } from '@chart/Table/DefaultTable/Style/Footer/FooterStyleFormatter';
import { FooterData } from '@chart/Table/DefaultTable/Style/Footer/FooterData';

export class TableFieldStyleFormatter implements FooterStyleFormatter<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption> {
  createStyle(bodyData: FooterData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>): CustomStyleData {
    const { querySetting, data, vizSetting } = bodyData;
    const fieldFormatter: FieldFormatter | undefined = TableFieldFormatterUtils.getFieldFormatter(data.header, querySetting, vizSetting);
    if (fieldFormatter && fieldFormatter.applyTotals) {
      const style = {
        color: fieldFormatter.style?.color,
        'text-align': fieldFormatter.align,
        'background-color': fieldFormatter.backgroundColor
      };
      return { css: ObjectUtils.removeKeyIfValueNotExist(style) };
    } else {
      return { css: {} } as any;
    }
  }
}
