import { PasswordConfig, PermissionTokenResponse, ResourceInfo, SharedUserInfo, UserProfile } from '@core/common/domain';
import { ActionType, ResourceType } from '@/utils/PermissionUtils';

export abstract class ShareHandler {
  abstract get sharedUserInfos(): SharedUserInfo[];

  abstract get resourceInfo(): ResourceInfo | null;

  abstract loadResourceInfo(resourceType: ResourceType, resourceId: string): Promise<void>;

  abstract getShareAnyone(resourceType: ResourceType, resourceId: string): Promise<PermissionTokenResponse | null>;

  abstract createShareAnyone(resourceType: ResourceType, resourceId: string, actionTypes: ActionType[]): Promise<PermissionTokenResponse>;

  abstract addShareUser(organizationId: string, resourceType: ResourceType, resourceId: string, userProfile: UserProfile): void;

  abstract updateSharePermission(userData: SharedUserInfo, toActionType: ActionType): void;

  abstract saveAll(resourceId: string, resourceType: ResourceType, shareAnyonePermissionType: ActionType, isChangeShareAnyone: boolean): Promise<void>;

  abstract savePassword(resourceId: string, resourceType: ResourceType, password: PasswordConfig): Promise<void>;

  abstract removePassword(resourceId: string, resourceType: ResourceType): Promise<void>;
}
