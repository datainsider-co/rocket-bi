import { Config, EtlConfigs } from '@core/DataCook';

export class FullModeConfig implements Config {
  className = EtlConfigs.Full;

  static fromObject(obj: FullModeConfig) {
    return new FullModeConfig();
  }

  static default() {
    return new FullModeConfig();
  }

  get isValid() {
    return true;
  }
}
