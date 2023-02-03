import { ActionType, ResourceType } from '@/utils/PermissionUtils';
import {
  PasswordSetting,
  DirectoryType,
  GetUserSharingInfoRequest,
  PasswordConfig,
  PermissionTokenResponse,
  ResourceInfo,
  SharedUserInfo,
  UserProfile
} from '@core/common/domain';
import { SaveShareData, ShareModule } from '@/store/modules/ShareStore';
import { Log } from '@core/utils';
import { ShareHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareHandler';
import { DashboardService, DirectoryService } from '@core/common/services';
import { Di } from '@core/common/modules';
import { DirectoryMetadata } from '@core/common/domain/model/directory/directory-metadata/DirectoryMetadata';

export class ShareDirectoryHandler implements ShareHandler {
  private readonly directoryService = Di.get(DirectoryService);
  private readonly dashboardService = Di.get(DashboardService);
  private static readonly directoryMapper: Map<ResourceType, DirectoryType> = new Map([[ResourceType.directory, DirectoryType.Dashboard]]);

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

  updateSharePermission(userData: SharedUserInfo, toActionType: ActionType): void {
    ShareModule.updateSharePermission({ userData: userData, editedValue: toActionType });
  }

  async saveAll(resourceId: string, resourceType: ResourceType, shareAnyonePermissionType: ActionType, isChangeShareAnyone: boolean): Promise<void> {
    const shareData: SaveShareData = {
      resourceId: resourceId,
      resourceType: resourceType,
      shareAnyonePermissionType: shareAnyonePermissionType,
      isChangeShareAnyone: isChangeShareAnyone
    };
    await Promise.all([
      ShareModule.createShareInfo(shareData),
      ShareModule.editShareInfo(shareData),
      ShareModule.revokeShareInfo(shareData),
      ShareModule.shareAnyone(shareData)
    ]);
  }

  async savePassword(resourceId: string, resourceType: ResourceType, password: PasswordConfig) {
    try {
      const directory = await this.directoryService.get(+resourceId);
      ///Create extraData if old directory(not have extra data in directory)
      Log.debug('savePassword::', directory, !directory.data);
      if (!directory.data) {
        directory.data = DirectoryMetadata.default(ShareDirectoryHandler.directoryMapper.get(resourceType)!);
      }
      Log.debug('savePassword::', directory.data);
      if (PasswordSetting.is(directory.data)) {
        directory.data.setPassword(password.hashedPassword!).setEnable(password.enabled);
        await this.directoryService.update(directory);
      }
    } catch (ex) {
      Log.error(ex);
    }
  }

  async removePassword(resourceId: string, resourceType: ResourceType) {
    try {
      const directory = await this.directoryService.get(+resourceId);
      if (PasswordSetting.is(directory?.data)) {
        directory.data.removePassword();
        await this.directoryService.update(directory);
      }
    } catch (ex) {
      Log.error(ex);
    }
  }
}
