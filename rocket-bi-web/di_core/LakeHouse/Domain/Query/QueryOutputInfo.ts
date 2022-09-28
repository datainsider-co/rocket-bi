/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:39 PM
 */
import { TextOutputInfo } from './TextOutputInfo';
import { ESOutputInfo } from './ESOutputInfo';
import { MySQLOutputInfo } from './MySQLOutputInfo';
import { DataInsiderOutputInfo } from '@core/LakeHouse/Domain/Query/DataInsiderOutputInfo';

export enum QueryOutputType {
  TextFile = 0,
  DefaultES = 1,
  CustomES = 2,
  DefaultMySQL = 3,
  CustomMySQL = 4
}

export class QueryOutputInfo {
  constructor(
    public type: QueryOutputType,
    public textOutputInfo?: TextOutputInfo,
    public esOutputInfo?: ESOutputInfo,
    public mySqlOutputInfo?: MySQLOutputInfo,
    public dataInsiderOutputInfo?: DataInsiderOutputInfo
  ) {}

  static fromObject(obj: any): QueryOutputInfo {
    return new QueryOutputInfo(
      obj.type,
      obj.textOutputInfo ? TextOutputInfo.fromObject(obj.textOutputInfo) : void 0,
      obj.esOutputInfo ? ESOutputInfo.fromObject(obj.esOutputInfo) : void 0,
      obj.mySqlOutputInfo ? MySQLOutputInfo.fromObject(obj.mySqlOutputInfo) : void 0,
      obj.dataInsiderOutputInfo ? DataInsiderOutputInfo.fromObject(obj.dataInsiderOutputInfo) : void 0
    );
  }
}
