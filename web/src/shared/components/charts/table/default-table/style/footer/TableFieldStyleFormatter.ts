/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { AbstractTableQuerySetting, AbstractTableResponse, FieldFormatter, TableChartOption } from '@core/common/domain';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { ObjectUtils } from '@core/utils';
import { TableFieldFormatterUtils } from '@chart/table/default-table/style/TableFieldFormatterUtils';
import { FooterStyleFormatter } from '@chart/table/default-table/style/footer/FooterStyleFormatter';
import { FooterData } from '@chart/table/default-table/style/footer/FooterData';

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
