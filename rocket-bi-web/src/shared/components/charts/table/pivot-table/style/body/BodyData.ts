/*
 * @author: tvc12 - Thien Vi
 * @created: 7/5/21, 11:46 AM
 */

import { CustomBodyCellData } from '@chart/custom-table/TableData';

export interface BodyData<Query, Response, Setting> {
  tableResponse: Response;
  querySetting: Query;
  vizSetting: Setting;
  baseThemeColor: string;
  bodyCellData: CustomBodyCellData;
}
