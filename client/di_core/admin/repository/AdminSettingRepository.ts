import { OauthConfigResponse } from '@core/domain/Model/OauthConfig/GoogleOauthConfig';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';

export abstract class AdminSettingRepository {
  abstract updateLoginMethods(request: OauthConfigResponse): Promise<OauthConfigResponse>;
}

export class AdminSettingRepositoryIml extends AdminSettingRepository {
  apiPath = 'admin/setting';
  @InjectValue(DIKeys.authClient)
  private httpClient!: BaseClient;

  updateLoginMethods(request: OauthConfigResponse): Promise<OauthConfigResponse> {
    return this.httpClient.put(`${this.apiPath}/login_methods`, request);
  }
}
