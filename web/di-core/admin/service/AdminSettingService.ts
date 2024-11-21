import { OauthConfigResponse } from '@core/common/domain/model/oauth-config/GoogleOauthConfig';
import { Inject } from 'typescript-ioc';
import { AdminSettingRepository } from '@core/admin/repository/AdminSettingRepository';
import { OauthType } from '@/shared';

export abstract class AdminSettingService {
  abstract updateLoginMethods(request: OauthConfigResponse): Promise<OauthConfigResponse>;

  abstract deleteLoginMethods(type: OauthType): Promise<boolean>;
}

export class AdminSettingServiceIml extends AdminSettingService {
  @Inject
  adminSettingRepository!: AdminSettingRepository;

  updateLoginMethods(request: OauthConfigResponse): Promise<OauthConfigResponse> {
    return this.adminSettingRepository.updateLoginMethods(request);
  }

  deleteLoginMethods(type: OauthType): Promise<boolean> {
    return this.adminSettingRepository.deleteLoginMethods(type);
  }
}
