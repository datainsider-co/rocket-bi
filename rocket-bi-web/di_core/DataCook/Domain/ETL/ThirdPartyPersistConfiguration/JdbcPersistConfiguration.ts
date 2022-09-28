import { PERSISTENT_TYPE } from '@core/DataCook/Domain';
import { ThirdPartyPersistConfiguration } from '@core/DataCook/Domain/ETL/ThirdPartyPersistConfiguration/ThirdPartyPersistConfiguration';
import { ThirdPartyPersistConfigurations } from '@core/DataCook/Domain/ETL';

export abstract class JdbcPersistConfiguration extends ThirdPartyPersistConfiguration {
  abstract className: ThirdPartyPersistConfigurations;
  displayName: string;
  username: string;
  password: string;
  tableName: string;
  databaseName: string;
  persistType: PERSISTENT_TYPE;

  protected constructor(displayName: string, username: string, password: string, databaseName: string, tableName: string, persistType: PERSISTENT_TYPE) {
    super();
    this.displayName = displayName;
    this.username = username;
    this.password = password;
    this.databaseName = databaseName;
    this.tableName = tableName;
    this.persistType = persistType;
  }

  getId(): string {
    return [this.className, this.databaseName, this.tableName].join('_');
  }
}
