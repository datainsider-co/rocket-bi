/*
 * @author: tvc12 - Thien Vi
 * @created: 7/5/21, 11:46 AM
 */

import { CustomFooterCellData } from '@chart/custom-table/TableData';

export interface FooterData<Query, Response, Setting> {
  tableResponse: Response;
  querySetting: Query;
  vizSetting: Setting;
  baseThemeColor: string;
  data: CustomFooterCellData;
}
