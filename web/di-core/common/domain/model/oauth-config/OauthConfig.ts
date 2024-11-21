import { OauthType } from '@/shared';
import { DIException } from '@core/common/domain/exception';
import { GoogleOauthConfig } from '@core/common/domain/model/oauth-config/GoogleOauthConfig';
import { FacebookOauthConfig } from '@core/common/domain/model/oauth-config/FacebookOauthConfig';

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

  static default(type: OauthType): OauthConfig {
    switch (type) {
      case OauthType.GOOGLE:
        return GoogleOauthConfig.default();
      // case OauthType.FACEBOOK:
      //   return FacebookOauthConfig.fromObject(obj);
      default:
        throw new DIException(`${type} is not unsupported.`);
    }
  }

  abstract getIcon(): string;

  abstract getPrettyType(): string;
}
