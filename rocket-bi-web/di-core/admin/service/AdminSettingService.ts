import { OauthConfigResponse } from '@core/common/domain/model/oauth-config/GoogleOauthConfig';
import { Inject } from 'typescript-ioc';
import { AdminSettingRepository } from '@core/admin/repository/AdminSettingRepository';

export abstract class AdminSettingService {
  abstract updateLoginMethods(request: OauthConfigResponse): Promise<OauthConfigResponse>;
}

export class AdminSettingServiceIml extends AdminSettingService {
  @Inject
  adminSettingRepository!: AdminSettingRepository;

  updateLoginMethods(request: OauthConfigResponse): Promise<OauthConfigResponse> {
    return this.adminSettingRepository.updateLoginMethods(request);
  }
}
