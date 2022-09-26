/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:26 PM
 */

import { LakeHouseResponse } from '../LakeHouseResponse';

export class SparkQueryResponse extends LakeHouseResponse {
  constructor(code = 0, msg?: string | null) {
    super(code, msg);
  }
}
