/*
 * @author: tvc12 - Thien Vi
 * @created: 11/11/21, 9:44 AM
 */

import { LakeHouseRequest } from '../LakeHouseRequest';

export abstract class MultiFileRequest extends LakeHouseRequest {
  protected constructor(public paths: string[]) {
    super();
  }
}
