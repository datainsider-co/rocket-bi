import { EtlConfigs, IncrementalConfig } from '@core/data-cook';

export abstract class Config {
  abstract className: EtlConfigs;

  static fromObject(obj: Config) {
    switch (obj.className) {
      default:
        return IncrementalConfig.fromObject(obj as IncrementalConfig);
    }
  }

  abstract isValid: boolean;

  static isIncrementalConfig(config: Config) {
    return config.className === EtlConfigs.Incremental;
  }

  static isFullModeConfig(config: Config) {
    return config.className === EtlConfigs.Full;
  }
}
