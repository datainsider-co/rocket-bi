import { PERSISTENT_TYPE, SSLConfig } from '@core/data-cook/domain';
import { JdbcPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration/JdbcPersistConfiguration';
import { ThirdPartyPersistConfigurations } from '@core/data-cook/domain/etl';

export class OracleJdbcPersistConfiguration extends JdbcPersistConfiguration {
  className = ThirdPartyPersistConfigurations.OraclePersistConfiguration;
  host: string;
  port: string;
  serviceName: string;
  sslConfiguration: SSLConfig | null;
  sslServerCertDn: string;
  extraPropertiesAsJson: string;

  constructor(
    displayName: string,
    username: string,
    password: string,
    databaseName: string,
    tableName: string,
    persistType: PERSISTENT_TYPE,
    host: string,
    port: string,
    serviceName: string,
    sslConfiguration: SSLConfig | null,
    sslServerCertDn: string,
    extraPropertiesAsJson: string
  ) {
    super(displayName, username, password, databaseName, tableName, persistType);
    this.host = host;
    this.port = port;
    this.serviceName = serviceName;
    this.sslConfiguration = sslConfiguration;
    this.sslServerCertDn = sslServerCertDn;
    this.extraPropertiesAsJson = extraPropertiesAsJson;
  }

  static fromObject(obj: any): OracleJdbcPersistConfiguration {
    return new OracleJdbcPersistConfiguration(
      obj.displayName,
      obj.username,
      obj.password,
      obj.databaseName,
      obj.tableName,
      obj.persistType,
      obj.host,
      obj.port,
      obj.serviceName,
      obj.sslConfiguration ? SSLConfig.fromObject(obj.sslConfiguration) : null,
      obj.sslServerCertDn,
      obj.extraPropertiesAsJson
    );
  }

  static default(): OracleJdbcPersistConfiguration {
    return new OracleJdbcPersistConfiguration('', '', '', '', '', PERSISTENT_TYPE.Update, '', '1521', '', null, '', '{}');
  }
}
