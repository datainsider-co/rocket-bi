import { Config, EtlConfigs } from '@core/data-cook';

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
