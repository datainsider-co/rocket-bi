import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Inject } from 'typescript-ioc';
import { DashboardService, PermissionTokenService } from '@core/services';
import { DIException } from '@core/domain/Exception';
import { ActionType, editActions, ResourceType } from '@/utils/permission_utils';
import { PermissionTokenResponse } from '@core/domain/Response';
import { UsersResponse } from '@core/domain/Response/User/UsersResponse';
import { ShareService } from '@core/share/service/share_service';

import { UserProfile } from '@core/domain/Model';
import {
  CheckActionPermittedRequest,
  GetUserSharingInfoRequest,
  RevokeShareAnyoneRequest,
  RevokeShareRequest,
  ShareAnyoneRequest,
  ShareWithUserRequest,
  UpdateShareRequest
} from '@core/domain/Request/ShareRequest';
import { UserAdminService } from '@core/admin/service/UserAdminService';
import { SearchUserRequest } from '@core/admin/domain/request/SearchUserRequest';
import { SharedUserInfo } from '@core/domain/Response/ResouceSharing/SharedUserInfo';
import { PermissionProviders } from '@core/admin/domain/permissions/PermissionProviders';
import { Log } from '@core/utils';
import { ResourceInfo } from '@core/domain/Response/ResouceSharing/ResourceInfo';

export interface IdTokenData {
  id: number;
  token: PermissionTokenResponse;
}

export interface IdPermissionsData {
  id: number;
  permissions: ActionType[];
}

@Module({ store, name: Stores.shareStore, dynamic: true, namespaced: true })
class ShareStore extends VuexModule {
  mapIdAndToken: Map<number, PermissionTokenResponse> = new Map<number, PermissionTokenResponse>();
  suggestedUsersResponse: UsersResponse | null = null;
  resourceInfo: ResourceInfo | null = null;
  revokedUsers: string[] = []; //username
  editedUsers: Map<string, string[]> = new Map(); //shareId: id
  createdUsers: Map<string, string[]> = new Map();

  @Inject
  private dashboardService!: DashboardService;

  @Inject
  private permissionTokenService!: PermissionTokenService;

  @Inject
  userAdminService!: UserAdminService;

  @Inject
  shareService!: ShareService;

  get suggestedUsers(): UserProfile[] {
    return this.suggestedUsersResponse?.data ?? [];
  }

  get sharedUserInfos(): SharedUserInfo[] {
    return this.resourceInfo?.usersSharing ?? [];
  }

  @Action
  async shareDashboard(id: number): Promise<PermissionTokenResponse> {
    const maybeToken: PermissionTokenResponse | undefined = this.mapIdAndToken.get(id);
    if (maybeToken) {
      return Promise.resolve(maybeToken);
    } else {
      try {
        const chartQueryResponse: PermissionTokenResponse = await this.dashboardService.share(id);
        this.cacheToken({ id: id, token: chartQueryResponse });
        return chartQueryResponse;
      } catch (e) {
        // TODO: trace exception of share
        return Promise.reject(e);
      }
    }
  }

  // @Action
  // updateTokenPermissionByDashboardId(payload: IdPermissionsData): Promise<boolean> {
  //   const { id, permissions } = payload;
  //   const maybePermissionTokenResponse: PermissionTokenResponse | undefined = this.mapIdAndToken.get(id);
  //   if (maybePermissionTokenResponse) {
  //     const newPermissions = PermissionProviders.buildPermissionsFromActions(ResourceType.dashboard, id, permissions);
  //     return this.permissionTokenService.updateToken(maybePermissionTokenResponse.tokenId, newPermissions).then((isSuccess: boolean) => {
  //       if (isSuccess) {
  //         this.cacheToken({
  //           id: id,
  //           token: {
  //             ...maybePermissionTokenResponse,
  //             permissions: newPermissions
  //           }
  //         });
  //       }
  //       return isSuccess;
  //     });
  //   } else {
  //     return Promise.reject(new DIException('Token not exists'));
  //   }
  // }

  @Mutation
  cacheToken(payload: IdTokenData) {
    this.mapIdAndToken.set(payload.id, payload.token);
  }

  @Action({ rawError: true })
  getSuggestedUsers(request: SearchUserRequest) {
    return this.userAdminService.getSuggestedUsers(request).then(resp => {
      this.saveSuggestedUsersResponse({ suggestedUserResponse: resp });
    });
  }

  @Mutation
  saveSuggestedUsersResponse(payload: { suggestedUserResponse: UsersResponse }) {
    this.suggestedUsersResponse = payload.suggestedUserResponse;
  }

  @Action({ rawError: true })
  loadResourceInfo(request: GetUserSharingInfoRequest) {
    return this.shareService.getResourceInfo(request).then(resp => {
      this.saveSharedUsers({ sharedUsersResponse: resp });
      Log.debug('ShareStore::getSharedUsers::resp::', resp);
    });
  }

  @Mutation
  saveSharedUsers(payload: { sharedUsersResponse: ResourceInfo }) {
    this.resourceInfo = payload.sharedUsersResponse;
  }

  @Mutation
  addNewShareUser(payload: { userProfile: UserProfile; organizationId: string; resourceId: string; resourceType: ResourceType }) {
    if (this.resourceInfo) {
      const newUserSharingInfo: SharedUserInfo = {
        id: '',
        user: payload.userProfile,
        permissions: [PermissionProviders.buildPermission(payload.organizationId, payload.resourceType, ActionType.view, payload.resourceId)]
      };
      //todo: check before add new
      // check not exist newUserSharingInfo
      const item = this.resourceInfo.usersSharing.find(item => item.user.username === newUserSharingInfo.user.username);
      if (!item) {
        this.resourceInfo.usersSharing.unshift(newUserSharingInfo);
        this.createdUsers.set(newUserSharingInfo.user.username, [ActionType.view]);
      }
      Log.debug('ShareModule::updateSharePermission::newUserSharingInfo', newUserSharingInfo);
      Log.debug('ShareModule::updateSharePermission::createdUsers', this.createdUsers);
    }
  }

  @Action({ rawError: true })
  saveAll(payload: { resourceId: string; resourceType: ResourceType; shareAnyonePermissionType: ActionType; isChangeShareAnyone: boolean }): Promise<any[]> {
    const createShareRequest: ShareWithUserRequest = { resourceId: payload.resourceId, resourceType: payload.resourceType, userActions: this.createdUsers };
    const editShareRequest: UpdateShareRequest = { resourceId: payload.resourceId, resourceType: payload.resourceType, shareIdActions: this.editedUsers };
    const revokeShareRequest: RevokeShareRequest = {
      resourceId: payload.resourceId.toString(),
      resourceType: payload.resourceType,
      usernames: this.revokedUsers
    };

    const promiseAll: Promise<any>[] = [];
    if (this.createdUsers.size > 0) {
      promiseAll.push(this.shareService.create(createShareRequest));
    }
    if (this.editedUsers.size > 0) {
      promiseAll.push(this.shareService.editSharedPermission(editShareRequest));
    }
    if (this.revokedUsers.length > 0) {
      promiseAll.push(this.shareService.revokeSharedPermission(revokeShareRequest));
    }

    const request: ShareAnyoneRequest = {
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      actions: []
    };
    if (payload.isChangeShareAnyone) {
      switch (payload.shareAnyonePermissionType) {
        case ActionType.edit:
          request.actions = editActions;
          promiseAll.push(this.updateShareAnyone(request));
          break;
        case ActionType.view:
          request.actions = [ActionType.view];
          promiseAll.push(this.updateShareAnyone(request));
          break;
        case ActionType.none:
          //reject share anyone
          promiseAll.push(
            this.revokeShareWithAnyone({
              resourceType: payload.resourceType,
              resourceId: payload.resourceId
            })
          );
          break;
        default:
          break;
      }
    }

    return Promise.all(promiseAll);
  }

  //todo: change
  @Mutation
  updateSharePermission(payload: { userData: SharedUserInfo; editedValue: string }) {
    if (payload.userData.id === '') {
      if (payload.editedValue.includes(ActionType.edit)) {
        this.createdUsers.set(payload.userData.user.username, editActions);
      } else if (payload.editedValue.includes(ActionType.view)) {
        this.createdUsers.set(payload.userData.user.username, [ActionType.view]);
      } else if (payload.editedValue.includes(ActionType.none)) {
        this.createdUsers.delete(payload.userData.user.username);
      }
    } else {
      this.createdUsers.delete(payload.userData.user.username);
      this.editedUsers.delete(payload.userData.id);
      const usernameIndex = this.revokedUsers.findIndex(username => username === payload.userData.user.username);
      if (usernameIndex > -1) {
        this.revokedUsers.splice(usernameIndex, 1);
      }
      if (payload.editedValue.includes(ActionType.view)) {
        this.editedUsers.set(payload.userData.id.toString(), [ActionType.view]);
      } else if (payload.editedValue.includes(ActionType.edit)) {
        this.editedUsers.set(payload.userData.id.toString(), editActions);
      } else if (payload.editedValue.includes(ActionType.none)) {
        this.revokedUsers.push(payload.userData.user.username);
      }
    }

    Log.debug('ShareModule::updateSharePermission::createdUsers', this.createdUsers);
    Log.debug('ShareModule::updateSharePermission::revokedUsers', this.revokedUsers);
    Log.debug('ShareModule::updateSharePermission::editedUsers', this.editedUsers);
  }

  @Action({ rawError: true })
  getShareWithAnyone(request: { resourceId: number; resourceType: ResourceType }): Promise<PermissionTokenResponse | null> {
    return this.shareService.getShareAnyoneInfo(request).then(resp => resp);
  }

  @Action({ rawError: true })
  shareWithAnyone(request: ShareAnyoneRequest): Promise<PermissionTokenResponse> {
    return this.shareService.shareWithAnyone(request);
  }

  @Action({ rawError: true })
  revokeShareWithAnyone(request: RevokeShareAnyoneRequest) {
    return this.shareService.revokeShareWithAnyone(request);
  }

  @Action({ rawError: true })
  updateShareAnyone(request: ShareAnyoneRequest) {
    return this.shareService.updateShareAnyone(request);
  }

  @Action({ rawError: true })
  isPermittedForUser(request: CheckActionPermittedRequest) {
    return this.shareService.isPermittedForUser(request);
  }

  @Mutation
  reset() {
    // this.mapIdAndToken = new Map<number, PermissionTokenResponse>();
    this.suggestedUsersResponse = null;
    this.revokedUsers = []; //username
    this.editedUsers = new Map(); //shareId: id
    this.createdUsers = new Map();
    //todo : call at close modal
  }
}

export const ShareModule: ShareStore = getModule(ShareStore);
