import { OauthConfigResponse } from '@core/common/domain/model/oauth-config/GoogleOauthConfig';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { OauthType } from '@/shared';

export abstract class AdminSettingRepository {
  abstract updateLoginMethods(request: OauthConfigResponse): Promise<OauthConfigResponse>;

  abstract deleteLoginMethods(type: OauthType): Promise<boolean>;
}

export class AdminSettingRepositoryIml extends AdminSettingRepository {
  @InjectValue(DIKeys.CaasClient)
  private httpClient!: BaseClient;

  updateLoginMethods(request: OauthConfigResponse): Promise<OauthConfigResponse> {
    return this.httpClient.put(`admin/setting/login_methods`, request);
  }

  deleteLoginMethods(type: OauthType): Promise<boolean> {
    return this.httpClient.delete(`admin/setting/login_methods/${type}`);
  }
}
