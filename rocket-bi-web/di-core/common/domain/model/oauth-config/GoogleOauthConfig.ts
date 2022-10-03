import { OauthType } from '@/shared';
import { OauthConfig } from '@core/common/domain/model/oauth-config/OauthConfig';

export class GoogleOauthConfig implements OauthConfig {
  constructor(
    public name: string,
    public oauthType: OauthType,
    public clientIds: string[],
    public whitelistEmail: string[],
    public isActive: boolean,
    public organizationId: number
  ) {}

  static fromObject(obj: any): GoogleOauthConfig {
    return new GoogleOauthConfig(obj.name, obj.oauthType, obj.clientIds, obj.whitelistEmail, obj.isActive, obj.organizationId);
  }
}

export interface OauthConfigResponse {
  [key: string]: OauthConfig;
}
