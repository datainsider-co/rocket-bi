import { OauthConfigResponse } from '@core/common/domain/model/oauth-config/GoogleOauthConfig';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';

export abstract class AdminSettingRepository {
  abstract updateLoginMethods(request: OauthConfigResponse): Promise<OauthConfigResponse>;
}

export class AdminSettingRepositoryIml extends AdminSettingRepository {
  @InjectValue(DIKeys.CaasClient)
  private httpClient!: BaseClient;

  updateLoginMethods(request: OauthConfigResponse): Promise<OauthConfigResponse> {
    return this.httpClient.put(`admin/setting/login_methods`, request);
  }
}
