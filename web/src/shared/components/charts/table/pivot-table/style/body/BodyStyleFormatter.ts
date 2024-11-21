/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { CustomStyleData } from '@chart/custom-table/TableData';
import { BodyData } from '@chart/table/pivot-table/style/body/BodyData';

export abstract class BodyStyleFormatter<Query, Response, Setting> {
  abstract createStyle(bodyData: BodyData<Query, Response, Setting>): CustomStyleData;
}
