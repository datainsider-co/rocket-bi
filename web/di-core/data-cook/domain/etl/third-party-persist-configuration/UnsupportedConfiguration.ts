import { ThirdPartyPersistConfiguration } from './ThirdPartyPersistConfiguration';
import { ThirdPartyPersistConfigurations } from '@core/data-cook/domain/etl';

export class UnsupportedConfiguration extends ThirdPartyPersistConfiguration {
  className = ThirdPartyPersistConfigurations.Other;

  displayName: string;
  databaseName: string;
  tableName: string;
  constructor(displayName: string, databaseName: string, tableName: string) {
    super();
    this.displayName = displayName;
    this.databaseName = databaseName;
    this.tableName = tableName;
  }

  static fromObject(obj: any): UnsupportedConfiguration {
    return new UnsupportedConfiguration(obj.displayName, obj.databaseName, obj.tableName);
  }

  static default(): UnsupportedConfiguration {
    return new UnsupportedConfiguration('', '', '');
  }

  getId(): string {
    return [this.className, this.databaseName, this.tableName].join('_');
  }
}
