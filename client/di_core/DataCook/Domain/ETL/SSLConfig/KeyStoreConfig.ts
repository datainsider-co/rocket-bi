import { OrgId } from '@core/domain';

export class KeyStoreConfig {
  organizationId: OrgId;
  data: string;
  type: string;
  password: string;
  fileName: string;

  constructor(orgId: OrgId, data: string, password: string, fileName: string, type = 'JKS') {
    this.organizationId = orgId;
    this.data = data;
    this.password = password;
    this.fileName = fileName;
    this.type = type;
  }

  static fromObject(obj: any) {
    return new KeyStoreConfig(obj.organizationId, obj.data, obj.password, obj.fileName);
  }

  static default(orgId: OrgId) {
    return new KeyStoreConfig(orgId, '', '', '');
  }
}
