/*
 * @author: tvc12 - Thien Vi
 * @created: 5/27/21, 1:56 PM
 */

import { CustomBodyCellData, CustomStyleData } from '@chart/custom-table/TableData';

export abstract class TableBodyStyleRender {
  abstract createStyle(bodyCellData: CustomBodyCellData): CustomStyleData;
}
