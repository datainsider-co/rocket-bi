/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { CustomStyleData } from '@chart/CustomTable/TableData';
import { FooterData } from '@chart/Table/DefaultTable/Style/Footer/FooterData';

export abstract class FooterStyleFormatter<Query, Response, Setting> {
  abstract createStyle(data: FooterData<Query, Response, Setting>): CustomStyleData;
}
