import { PERSISTENT_TYPE } from '@core/DataCook/Domain';
import { JdbcPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/JdbcPersistConfiguration';
import { ThirdPartyPersistConfigurations } from '@core/DataCook/Domain/ETL';

export class VerticaPersistConfiguration extends JdbcPersistConfiguration {
  className = ThirdPartyPersistConfigurations.VerticaPersistConfiguration;
  host: string;
  port: string;
  catalog: string;
  isLoadBalance: boolean;
  timeoutMs: number;

  constructor(
    displayName: string,
    username: string,
    password: string,
    databaseName: string,
    tableName: string,
    persistType: PERSISTENT_TYPE,
    host: string,
    port: string,
    catalog: string,
    isLoadBalance: boolean,
    timeoutMs: number
  ) {
    super(displayName, username, password, databaseName, tableName, persistType);
    this.host = host;
    this.port = port;
    this.catalog = catalog;
    this.isLoadBalance = isLoadBalance;
    this.timeoutMs = timeoutMs;
  }

  static fromObject(obj: any): VerticaPersistConfiguration {
    return new VerticaPersistConfiguration(
      obj.displayName,
      obj.username,
      obj.password,
      obj.databaseName,
      obj.tableName,
      obj.persistType,
      obj.host,
      obj.port,
      obj.catalog,
      obj.isLoadBalance,
      obj.timeoutMs
    );
  }

  static default(): VerticaPersistConfiguration {
    return new VerticaPersistConfiguration('', '', '', '', '', PERSISTENT_TYPE.Update, '', '5433', '', false, 0);
  }
}
