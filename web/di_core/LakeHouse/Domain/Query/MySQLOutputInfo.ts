/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:56 PM
 */

import { WriteMode } from './ESOutputInfo';

export class MySQLOutputInfo {
  constructor(
    public driver: string,
    public host: string,
    public port: number,
    public database: string,
    public table: string,
    public user: string,
    public password: string,
    public writeMode: WriteMode,
    public timestamp: number,
    public timestampField: string
  ) {}

  static fromObject(obj: any): MySQLOutputInfo {
    return new MySQLOutputInfo(
      obj.driver,
      obj.host,
      obj.port,
      obj.database,
      obj.table,
      obj.user,
      obj.password,
      obj.writeMode,
      obj.timestamp,
      obj.timestampField
    );
  }
}
