import { StringUtils } from '@/utils/string.utils';
import { Config, EtlConfigs } from '@core/DataCook';

export class IncrementalConfig implements Config {
  className = EtlConfigs.Incremental;

  constructor(public columnName: string, public value: string) {}

  static fromObject(obj: IncrementalConfig) {
    return new IncrementalConfig(obj.columnName, obj.value);
  }

  static default() {
    return new IncrementalConfig('', '');
  }

  get isValid() {
    return StringUtils.isNotEmpty(this.columnName);
  }
}
