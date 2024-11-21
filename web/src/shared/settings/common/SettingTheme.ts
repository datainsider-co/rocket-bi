import { SettingKey } from '@core/common/domain';

export interface SettingTheme {
  readonly name: string;
  readonly key: string;
  readonly settings: Record<SettingKey, any>;
}
