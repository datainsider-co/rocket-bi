import { ClickhouseDestinationConfig, DestinationConfigs } from '@core/data-ingestion';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';

export abstract class DestinationConfig {
  abstract className: DestinationConfigs;

  static fromObject(obj: DestinationConfig) {
    switch (obj.className) {
      case DestinationConfigs.Clickhouse:
        return ClickhouseDestinationConfig.fromObject(obj as ClickhouseDestinationConfig);
      default:
        throw new UnsupportedException(`Unsupported destination format${obj.className}`);
    }
  }

  static isClickhouseConfig(config: DestinationConfig) {
    return config.className === DestinationConfigs.Clickhouse;
  }

  static default() {
    return new ClickhouseDestinationConfig('', '');
  }
}
