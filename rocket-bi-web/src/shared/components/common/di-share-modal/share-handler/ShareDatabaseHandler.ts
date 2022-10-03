import { ActionType, ResourceType } from '@/utils/PermissionUtils';
import { DIException, GetUserSharingInfoRequest, PermissionTokenResponse, ResourceInfo, SharedUserInfo, UserProfile } from '@core/common/domain';
import { ShareModule } from '@/store/modules/ShareStore';
import { Log } from '@core/utils';
import { ShareHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareHandler';
import { ShareDatabaseModule } from '@/screens/data-management/store/ShareDatabaseStore';

export class ShareDatabaseHandler implements ShareHandler {
  addShareUser(organizationId: string, resourceType: ResourceType, resourceId: string, userProfile: UserProfile): void {
    ShareDatabaseModule.addNewShareUser({ userProfile: userProfile, organizationId: organizationId, resourceId: resourceId, resourceType: resourceType });
  }
  getShareAnyone(resourceType: ResourceType, resourceId: string): Promise<PermissionTokenResponse | null> {
    throw new DIException('Invalid in Share Database Handler');
  }

  loadResourceInfo(resourceType: ResourceType, resourceId: string): Promise<void> {
    const request: GetUserSharingInfoRequest = new GetUserSharingInfoRequest(resourceType, resourceId, 0, 100);
    return ShareDatabaseModule.loadResourceInfo(request);
    Log.debug('request::', request.resourceId, resourceId);
  }

  get resourceInfo(): ResourceInfo | null {
    return ShareDatabaseModule.resourceInfo;
  }

  get sharedUserInfos(): SharedUserInfo[] {
    return ShareDatabaseModule.sharedUserInfos ?? [];
  }

  createShareAnyone(resourceType: ResourceType, resourceId: string, actionTypes: ActionType[]): Promise<PermissionTokenResponse> {
    return Promise.reject('create share anyone fail with database');
  }

  updateSharePermission(userData: SharedUserInfo, editedValue: string): void {
    ShareDatabaseModule.updateSharePermission({ userData: userData, editedValue: editedValue });
  }

  async saveAll(resourceId: string, resourceType: ResourceType, shareAnyonePermissionType: ActionType, isChangeShareAnyone: boolean): Promise<void> {
    await ShareDatabaseModule.saveAll({
      resourceId: resourceId,
      resourceType: resourceType,
      shareAnyonePermissionType: shareAnyonePermissionType,
      isChangeShareAnyone: isChangeShareAnyone
    });
  }
}
