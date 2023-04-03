import { DirectoryMetadata } from '@core/common/domain/model/directory/directory-metadata/DirectoryMetadata';
import { Directory, PasswordConfig } from '@core/common/domain';
import { Passwordable } from '@core/common/domain/model/directory/directory-metadata/setting/Passwordable';
import { SecurityUtils } from '@/utils';

export class DashboardMetaData implements DirectoryMetadata, Passwordable {
  config?: PasswordConfig;

  constructor(password?: PasswordConfig) {
    this.config = password;
  }

  static fromObject(obj: Directory) {
    const data = obj.data as DashboardMetaData;
    return new DashboardMetaData(data.config);
  }

  static default() {
    return new DashboardMetaData(void 0);
  }

  setPassword(rawPassword: string): Passwordable {
    if (!this.config) {
      this.config = { enabled: true, hashedPassword: '' };
    }
    this.config.hashedPassword = SecurityUtils.hash(rawPassword);
    return this;
  }

  setEnable(enable: boolean): Passwordable {
    if (this.config) {
      this.config.enabled = enable;
    } else if (enable) {
      this.config = { enabled: enable, hashedPassword: '' };
    }
    return this;
  }

  removePassword(): Passwordable {
    this.config = void 0;
    return this;
  }

  validate(rawPassword: string): boolean {
    const enablePassword = this.config?.enabled ?? false;
    if (enablePassword) {
      const hashPassword = SecurityUtils.hash(rawPassword);
      return hashPassword === this.config?.hashedPassword;
    }
    return true;
  }
}
