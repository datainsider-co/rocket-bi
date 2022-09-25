import { ActionType, ResourceType } from '@/utils/permission_utils';
import { DIException, GetUserSharingInfoRequest, PermissionTokenResponse, ResourceInfo, SharedUserInfo, UserProfile } from '@core/domain';
import { Log } from '@core/utils';
import { ShareHandler } from '@/shared/components/Common/DiShareModal/ShareHandler/ShareHandler';
import { _DataCookShareStore } from '@/screens/DataManagement/store/DataCookShareStore';

export class DataCookShareHandler implements ShareHandler {
  get resourceInfo(): ResourceInfo | null {
    return _DataCookShareStore.resourceInfo;
  }

  get sharedUserInfos(): SharedUserInfo[] {
    return _DataCookShareStore.sharedUserInfos ?? [];
  }

  addShareUser(organizationId: string, resourceType: ResourceType, resourceId: string, userProfile: UserProfile): void {
    _DataCookShareStore.addNewShareUser({
      userProfile: userProfile,
      organizationId: organizationId,
      resourceId: resourceId,
      resourceType: resourceType
    });
  }

  getShareAnyone(resourceType: ResourceType, resourceId: string): Promise<PermissionTokenResponse | null> {
    throw new DIException('Invalid in Share Database Handler');
  }

  loadResourceInfo(resourceType: ResourceType, resourceId: string): Promise<void> {
    const request: GetUserSharingInfoRequest = new GetUserSharingInfoRequest(resourceType, resourceId, 0, 100);
    return _DataCookShareStore.loadResourceInfo(request);
    Log.debug('request::', request.resourceId, resourceId);
  }

  createShareAnyone(resourceType: ResourceType, resourceId: string, actionTypes: ActionType[]): Promise<PermissionTokenResponse> {
    return Promise.reject('create share anyone fail with database');
  }

  updateSharePermission(userData: SharedUserInfo, editedValue: string): void {
    _DataCookShareStore.updateSharePermission({ userData: userData, editedValue: editedValue });
  }

  async saveAll(resourceId: string, resourceType: ResourceType, shareAnyonePermissionType: ActionType, isChangeShareAnyone: boolean): Promise<void> {
    await _DataCookShareStore.saveAll({
      resourceId: resourceId,
      resourceType: resourceType,
      shareAnyonePermissionType: shareAnyonePermissionType,
      isChangeShareAnyone: isChangeShareAnyone
    });
  }
}
