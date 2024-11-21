/*
 * @author: tvc12 - Thien Vi
 * @created: 6/23/21, 5:22 PM
 */

import { CustomFooterCellData, CustomStyleData } from '@chart/custom-table/TableData';

export abstract class TableFooterStyleRender {
  abstract createStyle(cellData: CustomFooterCellData): CustomStyleData;
}
