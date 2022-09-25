import {
  MsSQLJdbcPersistConfiguration,
  MySQLJdbcPersistConfiguration,
  OracleJdbcPersistConfiguration,
  PostgresJdbcPersistConfiguration,
  ThirdPartyPersistConfigurations,
  UnsupportedConfiguration,
  VerticaPersistConfiguration
} from '@core/DataCook/Domain/ETL';

export abstract class ThirdPartyPersistConfiguration {
  abstract className: ThirdPartyPersistConfigurations;
  abstract displayName: string;
  abstract databaseName: string;
  abstract tableName: string;

  static fromObject(obj: any): ThirdPartyPersistConfiguration {
    switch (obj.className as ThirdPartyPersistConfigurations) {
      case ThirdPartyPersistConfigurations.OraclePersistConfiguration:
        return OracleJdbcPersistConfiguration.fromObject(obj);
      case ThirdPartyPersistConfigurations.MySQLPersistConfiguration:
        return MySQLJdbcPersistConfiguration.fromObject(obj);
      case ThirdPartyPersistConfigurations.MsSQLPersistConfiguration:
        return MsSQLJdbcPersistConfiguration.fromObject(obj);
      case ThirdPartyPersistConfigurations.PostgresSQLPersistConfiguration:
        return PostgresJdbcPersistConfiguration.fromObject(obj);
      case ThirdPartyPersistConfigurations.VerticaPersistConfiguration:
        return VerticaPersistConfiguration.fromObject(obj);

      default:
        return UnsupportedConfiguration.fromObject(obj);
    }
  }

  static default(className: ThirdPartyPersistConfigurations): ThirdPartyPersistConfiguration {
    switch (className) {
      case ThirdPartyPersistConfigurations.OraclePersistConfiguration:
        return OracleJdbcPersistConfiguration.default();
      case ThirdPartyPersistConfigurations.MySQLPersistConfiguration:
        return MySQLJdbcPersistConfiguration.default();
      case ThirdPartyPersistConfigurations.MsSQLPersistConfiguration:
        return MsSQLJdbcPersistConfiguration.default();
      case ThirdPartyPersistConfigurations.PostgresSQLPersistConfiguration:
        return PostgresJdbcPersistConfiguration.default();
      case ThirdPartyPersistConfigurations.VerticaPersistConfiguration:
        return VerticaPersistConfiguration.default();
      default:
        return UnsupportedConfiguration.default();
    }
  }

  getImgSource() {
    switch (this.className) {
      case ThirdPartyPersistConfigurations.OraclePersistConfiguration:
        return require('@/assets/icon/data_ingestion/datasource/ic_oracle_small.png');
      case ThirdPartyPersistConfigurations.MySQLPersistConfiguration:
        return require('@/assets/icon/data_ingestion/datasource/ic_my_sql_small.png');
      case ThirdPartyPersistConfigurations.MsSQLPersistConfiguration:
        return require('@/assets/icon/data_ingestion/datasource/ic_sql_server_small.png');
      case ThirdPartyPersistConfigurations.PostgresSQLPersistConfiguration:
        return require('@/assets/icon/data_ingestion/datasource/ic_postgre_sql_small.png');
      case ThirdPartyPersistConfigurations.VerticaPersistConfiguration:
        return require('@/assets/icon/data_ingestion/datasource/ic_vertica_small.png');
      default:
        return require('@/assets/icon/data_ingestion/datasource/ic_database.svg');
    }
  }

  abstract getId(): string;
}
