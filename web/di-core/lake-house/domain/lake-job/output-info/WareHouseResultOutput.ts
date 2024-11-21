import { WriteMode } from '@core/lake-house';
import { ResultOutput } from '@core/lake-house/domain/lake-job/output-info/ResultOutput';
import { ResultOutputs } from '@core/lake-house/domain/lake-job/output-info/ResultOutputs';

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
