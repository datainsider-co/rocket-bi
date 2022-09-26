/*
 * @author: tvc12 - Thien Vi
 * @created: 8/20/21, 8:07 PM
 */

import { Inject } from 'typescript-ioc';
import { UserProfileRepository } from '@core/repositories';
import { UserProfile } from '@core/domain';
import { EditUserProfileRequest } from '@core/admin/domain/request/EditUserProfileRequest';

export abstract class UserProfileService {
  abstract updateTheme(themName: string): Promise<void>;
  abstract getMyProfile(): Promise<UserProfile>;
  abstract updateUserProfile(request: EditUserProfileRequest): Promise<UserProfile>;
}

export class UserProfileServiceImpl extends UserProfileService {
  @Inject
  private userProfileRepository!: UserProfileRepository;

  updateTheme(themName: string): Promise<void> {
    return this.userProfileRepository.updateTheme(themName);
  }

  getMyProfile(): Promise<UserProfile> {
    return this.userProfileRepository.getMyProfile();
  }

  updateUserProfile(request: EditUserProfileRequest): Promise<UserProfile> {
    return this.userProfileRepository.updateUserProfile(request);
  }
}
