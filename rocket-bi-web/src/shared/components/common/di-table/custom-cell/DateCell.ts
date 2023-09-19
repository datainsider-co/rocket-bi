/*
 * @author: tvc12 - Thien Vi
 * @created: 8/25/21, 11:40 AM
 */

import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { DateTimeUtils } from '@/utils';

export class DateCell implements CustomCell {
  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const date = rowData[header.key];
    if (date) {
      return DateTimeUtils.formatASMMMDDYYYY(date);
    } else {
      return '--';
    }
  }
}

export class DateTimeCell implements CustomCell {
  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const date = rowData[header.key];
    if (date) {
      return DateTimeUtils.formatAsMMMDDYYYHHmmss(date);
    } else {
      return '--';
    }
  }
}
