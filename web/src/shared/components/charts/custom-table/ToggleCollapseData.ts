/*
 * @author: tvc12 - Thien Vi
 * @created: 6/18/21, 4:36 PM
 */

import { HeaderData, RowData } from '@/shared/models';

export interface ToggleCollapseData {
  rowData: RowData;
  rowIndex: number;
  header: HeaderData;
  columnIndex: number;
  reRender: () => void;
  updateRows: (rows: RowData[]) => void;
  rows: RowData[];
}
