/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 2:01 PM
 */

import { WriteMode } from '@core/LakeHouse';

export class DataInsiderOutputInfo {
  constructor(public database: string, public table: string, public timestamp: number, public timestampField: string, public writeMode: WriteMode) {}

  static fromObject(obj: any): DataInsiderOutputInfo {
    return new DataInsiderOutputInfo(obj.database, obj.table, obj.timestamp, obj.timestampField, obj.writeMode);
  }
}
