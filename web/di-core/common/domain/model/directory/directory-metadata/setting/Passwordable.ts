import { PasswordConfig } from '@core/common/domain';

export abstract class Passwordable {
  config?: PasswordConfig;

  abstract setPassword(rawPassword: string): Passwordable;

  abstract setEnable(enable: boolean): Passwordable;

  abstract removePassword(): Passwordable;

  abstract validate(rawPassword: string): boolean;

  static is(directoryMetaData: any): directoryMetaData is Passwordable {
    return !!directoryMetaData?.setPassword && !!directoryMetaData?.setEnable && !!directoryMetaData?.removePassword && !!directoryMetaData?.validate;
  }
}
