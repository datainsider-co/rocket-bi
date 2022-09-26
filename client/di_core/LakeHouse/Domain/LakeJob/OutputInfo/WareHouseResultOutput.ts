import { WriteMode } from '@core/LakeHouse';
import { ResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutput';
import { ResultOutputs } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutputs';

export class WareHouseResultOutput implements ResultOutput {
  className = ResultOutputs.WareHouse;
  databaseName?: string;
  tableName?: string;
  writeMode?: WriteMode;

  constructor(database?: string, table?: string, writeMode?: WriteMode) {
    this.databaseName = database;
    this.tableName = table;
    this.writeMode = writeMode;
  }

  static fromObject(obj: any): WareHouseResultOutput {
    return new WareHouseResultOutput(obj.databaseName, obj.tableName, obj.writeMode);
  }
}
