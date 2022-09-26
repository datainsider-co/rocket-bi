import { DataInsiderOutputInfo, QueryOutputTemplate, WriteMode } from '@core/LakeHouse';
import { StringUtils } from '@/utils/string.utils';
import { DIException } from '@core/domain';
import { WareHouseResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/WareHouseResultOutput';
import { ResultOutputs } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutputs';
import { ResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutput';

export class WareHouseUIConfig {
  enable: boolean;
  database?: string;
  table?: string;
  saveMode?: WriteMode;

  constructor(payload: { enable: boolean; database?: string; table?: string; saveMode: WriteMode }) {
    const { enable, database, table, saveMode } = payload;
    this.enable = enable;
    this.database = database;
    this.table = table;
    this.saveMode = saveMode;
  }

  updateFromOutputTemplate(output: DataInsiderOutputInfo) {
    this.enable = true;
    this.database = output.database;
    this.table = output.table;
    this.saveMode = output.writeMode ?? WriteMode.Append;
  }

  updateFromOutputInfo(config: ResultOutput) {
    this.enable = true;
    this.database = (config as WareHouseResultOutput).databaseName;
    this.table = (config as WareHouseResultOutput).tableName;
    this.saveMode = (config as WareHouseResultOutput).writeMode;
  }

  static default(): WareHouseUIConfig {
    return new WareHouseUIConfig({ enable: false, saveMode: WriteMode.Append });
  }

  static output() {
    return {
      id: '8p8xZnwMQ2GT0yrdda3ABw',
      ownerId: 'root',
      accessType: 1,
      outputName: 'Clickhouse',
      output: {
        type: 5,
        dataInsiderOutputInfo: {
          database: 'db',
          table: 'tbl',
          timestamp: 0,
          timestampField: null,
          writeMode: 'append'
        }
      }
    };
  }

  static defaultConfig() {
    return {
      className: ResultOutputs.WareHouse,
      databaseName: 'test_db',
      tableName: 'product',
      writeMode: 'append'
    };
  }

  //todo: unuse for now
  toQueryOutputTemplate(): QueryOutputTemplate | undefined {
    if (this.enable) {
      const isEmptyDatabase = StringUtils.isEmpty(this.database);
      const isEmptyTable = StringUtils.isEmpty(this.table);
      if (isEmptyDatabase) {
        throw new DIException('Database is not empty!');
      }
      if (isEmptyTable) {
        throw new DIException('Table is not empty!');
      }
      const output = WareHouseUIConfig.output();
      output.output.dataInsiderOutputInfo.database = this.database!;
      output.output.dataInsiderOutputInfo.table = this.table!;
      output.output.dataInsiderOutputInfo.writeMode = this.saveMode as WriteMode;
      return QueryOutputTemplate.fromObject(output);
    } else {
      return void 0;
    }
  }

  toOutputInfo(): ResultOutput | undefined {
    if (this.enable) {
      const isEmptyDatabase = StringUtils.isEmpty(this.database);
      const isEmptyTable = StringUtils.isEmpty(this.table);
      if (isEmptyDatabase) {
        throw new DIException('Database is not empty!');
      }
      if (isEmptyTable) {
        throw new DIException('Table is not empty!');
      }
      const config = WareHouseUIConfig.defaultConfig();
      config.databaseName = this.database!;
      config.tableName = this.table!;
      config.writeMode = this.saveMode as WriteMode;
      return ResultOutput.fromObject(config);
    }
  }

  isValid(): boolean {
    if (this.enable) {
      return StringUtils.isNotEmpty(this.database) && StringUtils.isNotEmpty(this.table);
    }
    return true;
  }
}
