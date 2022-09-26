import { ActionType, ResourceType } from '@/utils/permission_utils';
import { GetUserSharingInfoRequest, PermissionTokenResponse, ResourceInfo, SharedUserInfo, UserProfile } from '@core/domain';
import { ShareModule } from '@/store/modules/share.store';
import { Log } from '@core/utils';
import { ShareHandler } from '@/shared/components/Common/DiShareModal/ShareHandler/ShareHandler';

export class ShareDirectoryHandler implements ShareHandler {
  addShareUser(organizationId: string, resourceType: ResourceType, resourceId: string, userProfile: UserProfile): void {
    ShareModule.addNewShareUser({ userProfile: userProfile, organizationId: organizationId, resourceId: resourceId, resourceType: resourceType });
  }
  getShareAnyone(resourceType: ResourceType, resourceId: string): Promise<PermissionTokenResponse | null> {
    return ShareModule.getShareWithAnyone({
      resourceType: resourceType,
      resourceId: +resourceId
    });
  }

  loadResourceInfo(resourceType: ResourceType, resourceId: string): Promise<void> {
    const request: GetUserSharingInfoRequest = new GetUserSharingInfoRequest(resourceType, resourceId, 0, 100);
    return ShareModule.loadResourceInfo(request);
    Log.debug('request::', request.resourceId, resourceId);
  }

  get resourceInfo(): ResourceInfo | null {
    return ShareModule.resourceInfo;
  }

  get sharedUserInfos(): SharedUserInfo[] {
    return ShareModule.sharedUserInfos;
  }

  createShareAnyone(resourceType: ResourceType, resourceId: string, actionTypes: ActionType[]): Promise<PermissionTokenResponse> {
    return ShareModule.shareWithAnyone({ resourceType: resourceType, resourceId: resourceId, actions: actionTypes });
  }

  updateSharePermission(userData: SharedUserInfo, editedValue: string): void {
    ShareModule.updateSharePermission({ userData: userData, editedValue: editedValue });
  }

  async saveAll(resourceId: string, resourceType: ResourceType, shareAnyonePermissionType: ActionType, isChangeShareAnyone: boolean): Promise<void> {
    await ShareModule.saveAll({
      resourceId: resourceId,
      resourceType: resourceType,
      shareAnyonePermissionType: shareAnyonePermissionType,
      isChangeShareAnyone: isChangeShareAnyone
    });
  }
}
