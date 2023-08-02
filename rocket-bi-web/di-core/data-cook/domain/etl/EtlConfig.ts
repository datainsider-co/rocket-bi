import { Config } from '@core/data-cook';
import { StringUtils } from '@/utils/StringUtils';

export class EtlConfig {
  constructor(public mapIncrementalConfig: Map<string, Config>) {}

  static fromObject(obj: EtlConfig) {
    const result = new Map<string, Config>();
    Object.entries(obj.mapIncrementalConfig).forEach(([key, value]: any) => {
      result.set(StringUtils.toSnakeCase(key), Config.fromObject(value));
    });
    return new EtlConfig(result);
  }
}
