import { PermissionTokenResponse, ResourceInfo, SharedUserInfo, UserProfile } from '@core/domain';
import { ActionType, ResourceType } from '@/utils/permission_utils';

export abstract class ShareHandler {
  abstract get sharedUserInfos(): SharedUserInfo[];
  abstract get resourceInfo(): ResourceInfo | null;
  abstract loadResourceInfo(resourceType: ResourceType, resourceId: string): Promise<void>;
  abstract getShareAnyone(resourceType: ResourceType, resourceId: string): Promise<PermissionTokenResponse | null>;
  abstract createShareAnyone(resourceType: ResourceType, resourceId: string, actionTypes: ActionType[]): Promise<PermissionTokenResponse>;

  abstract addShareUser(organizationId: string, resourceType: ResourceType, resourceId: string, userProfile: UserProfile): void;
  abstract updateSharePermission(userData: SharedUserInfo, editedValue: string): void;
  abstract saveAll(resourceId: string, resourceType: ResourceType, shareAnyonePermissionType: ActionType, isChangeShareAnyone: boolean): Promise<void>;
}
