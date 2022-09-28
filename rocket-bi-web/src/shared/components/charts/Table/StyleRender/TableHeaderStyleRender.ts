/*
 * @author: tvc12 - Thien Vi
 * @created: 6/23/21, 5:22 PM
 */

import { CustomHeaderCellData, CustomStyleData } from '@chart/CustomTable/TableData';

export abstract class TableHeaderStyleRender {
  abstract createStyle(cellData: CustomHeaderCellData): CustomStyleData;
}
