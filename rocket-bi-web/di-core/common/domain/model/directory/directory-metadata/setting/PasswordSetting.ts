import { PasswordConfig } from '@core/common/domain';

export abstract class PasswordSetting {
  config?: PasswordConfig;

  abstract setPassword(rawPassword: string): PasswordSetting;

  abstract setEnable(enable: boolean): PasswordSetting;

  abstract removePassword(): PasswordSetting;

  abstract validate(rawPassword: string): boolean;

  static is(directoryMetaData: any): directoryMetaData is PasswordSetting {
    return !!directoryMetaData?.setPassword && !!directoryMetaData?.setEnable && !!directoryMetaData?.removePassword && !!directoryMetaData?.validate;
  }
}
