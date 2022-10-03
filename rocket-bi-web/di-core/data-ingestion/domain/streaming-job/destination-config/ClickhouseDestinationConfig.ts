import { DestinationConfig, DestinationConfigs } from '@core/data-ingestion';

export class ClickhouseDestinationConfig implements DestinationConfig {
  className: DestinationConfigs = DestinationConfigs.Clickhouse;
  constructor(public dbName: string, public tblName: string) {}

  static fromObject(obj: ClickhouseDestinationConfig) {
    return new ClickhouseDestinationConfig(obj.dbName, obj.tblName);
  }

  static default() {
    return new ClickhouseDestinationConfig('', '');
  }
}
