import { OauthType } from '@/shared';
import { DIException } from '@core/domain/Exception';
import { GoogleOauthConfig } from '@core/domain/Model/OauthConfig/GoogleOauthConfig';
import { FacebookOauthConfig } from '@core/domain/Model/OauthConfig/FacebookOauthConfig';

export abstract class OauthConfig {
  protected constructor(
    public name: string,
    public oauthType: OauthType,
    public whitelistEmail: string[],
    public isActive: boolean,
    public organizationId: number
  ) {}

  static fromObject(obj: any): OauthConfig {
    switch (obj.oauthType) {
      case OauthType.GOOGLE:
        return GoogleOauthConfig.fromObject(obj);
      case OauthType.FACEBOOK:
        return FacebookOauthConfig.fromObject(obj);
      default:
        throw new DIException(`${obj.oauthType} is not unsupported.`);
    }
  }
}
