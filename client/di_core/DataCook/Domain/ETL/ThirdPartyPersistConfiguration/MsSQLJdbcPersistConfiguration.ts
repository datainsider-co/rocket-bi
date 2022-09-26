import { PERSISTENT_TYPE } from '@core/DataCook/Domain';
import { JdbcPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/JdbcPersistConfiguration';
import { ThirdPartyPersistConfigurations } from '@core/DataCook/Domain/ETL';

export class MsSQLJdbcPersistConfiguration extends JdbcPersistConfiguration {
  className = ThirdPartyPersistConfigurations.MsSQLPersistConfiguration;
  host: string;
  port: string;
  catalogName: string;

  constructor(
    displayName: string,
    username: string,
    password: string,
    databaseName: string,
    tableName: string,
    persistType: PERSISTENT_TYPE,
    host: string,
    port: string,
    catalogName: string
  ) {
    super(displayName, username, password, databaseName, tableName, persistType);
    this.host = host;
    this.port = port;
    this.catalogName = catalogName;
  }

  static fromObject(obj: any): MsSQLJdbcPersistConfiguration {
    return new MsSQLJdbcPersistConfiguration(
      obj.displayName,
      obj.username,
      obj.password,
      obj.databaseName,
      obj.tableName,
      obj.persistType,
      obj.host,
      obj.port,
      obj.catalogName
    );
  }

  static default(): MsSQLJdbcPersistConfiguration {
    return new MsSQLJdbcPersistConfiguration('', '', '', '', '', PERSISTENT_TYPE.Update, '', '1433', '');
  }
}
