/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:00 PM
 */

import { OauthConfig } from '@core/common/domain/model/oauth-config/OauthConfig';
import { OauthType } from '@/shared';

export class FacebookOauthConfig implements OauthConfig {
  constructor(
    public name: string,
    public oauthType: OauthType,
    public appSecret: string,
    public whitelistEmail: string[],
    public isActive: boolean,
    public organizationId: number
  ) {}

  static fromObject(obj: any): FacebookOauthConfig {
    return new FacebookOauthConfig(obj.name, obj.oauthType, obj.appSecret, obj.whitelistEmail, obj.isActive, obj.organizationId);
  }

  getIcon(): string {
    return 'assets/icon/facebook.svg';
  }

  getPrettyType(): string {
    return 'Facebook';
  }
}
