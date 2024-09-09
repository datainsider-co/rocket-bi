import { OauthConfigResponse } from '@core/common/domain';
import { AuthenticationService } from '@core/common/services';
import { DIKeys } from '@core/common/modules';
import { InjectValue } from 'typescript-ioc';

export class SSOConfigLoader {
  @InjectValue(DIKeys.AuthService)
  private authenticationService!: AuthenticationService;

  async get(): Promise<OauthConfigResponse> {
    return this.authenticationService.getLoginMethods();
  }
}
