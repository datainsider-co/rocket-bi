import { ActionType, ResourceType } from '@/utils/permission_utils';
import { DIException, GetUserSharingInfoRequest, PermissionTokenResponse, ResourceInfo, SharedUserInfo, UserProfile } from '@core/domain';
import { ShareModule } from '@/store/modules/share.store';
import { Log } from '@core/utils';
import { ShareHandler } from '@/shared/components/Common/DiShareModal/ShareHandler/ShareHandler';
import { ShareDatabaseModule, ShareDatabaseStore } from '@/screens/DataManagement/store/ShareDatabaseStore';

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
