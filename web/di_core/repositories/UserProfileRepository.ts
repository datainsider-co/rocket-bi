/*
 * @author: tvc12 - Thien Vi
 * @created: 8/20/21, 8:07 PM
 */

import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';
import { ThemeUtils } from '@/utils/ThemeUtils';
import { UserProfile } from '@core/domain';
import { EditUserProfileRequest } from '@core/admin/domain/request/EditUserProfileRequest';

export abstract class UserProfileRepository {
  abstract updateTheme(themName: string): Promise<void>;

  abstract getMyProfile(): Promise<UserProfile>;

  abstract updateUserProfile(request: EditUserProfileRequest): Promise<UserProfile>;
}

export class UserProfileRepositoryImpl extends UserProfileRepository {
  @InjectValue(DIKeys.authClient)
  private httpClient!: BaseClient;
  private basePath = '/user/profile/me';

  updateTheme(themName: string): Promise<void> {
    return this.httpClient.put(this.basePath, {
      properties: {
        [ThemeUtils.THEME_KEY]: themName
      }
    });
  }

  getMyProfile() {
    return this.httpClient.get(this.basePath).then(response => UserProfile.fromObject(response));
  }

  updateUserProfile(request: EditUserProfileRequest) {
    return this.httpClient.put(this.basePath, request).then(response => UserProfile.fromObject(response));
  }
}
