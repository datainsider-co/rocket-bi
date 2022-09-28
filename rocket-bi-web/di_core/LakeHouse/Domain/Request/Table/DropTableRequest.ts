/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 5:10 PM
 */

import { TableManagerRequest } from './TableManagerRequest';

export class DropTableRequest extends TableManagerRequest {
  constructor(public tableId: string) {
    super();
  }
}
