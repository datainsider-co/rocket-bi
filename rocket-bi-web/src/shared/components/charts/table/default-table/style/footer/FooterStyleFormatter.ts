/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { CustomStyleData } from '@chart/custom-table/TableData';
import { FooterData } from '@chart/table/default-table/style/footer/FooterData';

export abstract class FooterStyleFormatter<Query, Response, Setting> {
  abstract createStyle(data: FooterData<Query, Response, Setting>): CustomStyleData;
}
