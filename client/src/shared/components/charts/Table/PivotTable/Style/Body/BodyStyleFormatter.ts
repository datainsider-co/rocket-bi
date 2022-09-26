/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { CustomStyleData } from '@chart/CustomTable/TableData';
import { BodyData } from '@chart/Table/PivotTable/Style/Body/BodyData';

export abstract class BodyStyleFormatter<Query, Response, Setting> {
  abstract createStyle(bodyData: BodyData<Query, Response, Setting>): CustomStyleData;
}
