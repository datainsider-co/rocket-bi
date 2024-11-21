/* eslint-disable @typescript-eslint/no-use-before-define */
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Inject } from 'typescript-ioc';
import { DashboardService, PermissionTokenService } from '@core/common/services';
import { ActionType, ActionTypeMapActions, ResourceType } from '@/utils/PermissionUtils';
import { PermissionTokenResponse } from '@core/common/domain/response';
import { UsersResponse } from '@core/common/domain/response/user/UsersResponse';
import { ShareService } from '@core/share/service/ShareService';

import { UserProfile } from '@core/common/domain/model';
import {
  CheckActionPermittedRequest,
  GetUserSharingInfoRequest,
  RevokeShareAnyoneRequest,
  RevokeShareRequest,
  ShareAnyoneRequest,
  ShareWithUserRequest,
  UpdateShareRequest
} from '@core/common/domain/request/ShareRequest';
import { UserAdminService } from '@core/admin/service/UserAdminService';
import { SearchUserRequest } from '@core/admin/domain/request/SearchUserRequest';
import { SharedUserInfo } from '@core/common/domain/response/resouce-sharing/SharedUserInfo';
import { Log } from '@core/utils';
import { ResourceInfo } from '@core/common/domain/response/resouce-sharing/ResourceInfo';
import { ListUtils, MapUtils } from '@/utils';
import { PermissionProviders } from '@core/admin/domain/permissions/PermissionProviders';

export interface IdTokenData {
  id: number;
  token: PermissionTokenResponse;
}

export interface IdPermissionsData {
  id: number;
  permissions: ActionType[];
}

export interface SaveShareData {
  resourceId: string;
  resourceType: ResourceType;
  shareAnyonePermissionType: ActionType;
  isChangeShareAnyone: boolean;
}

@Module({ store, name: Stores.ShareStore, dynamic: true, namespaced: true })
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
  loadSuggestedUsers(request: SearchUserRequest) {
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
      const { userProfile } = payload;
      const isShared = this.resourceInfo.usersSharing.some(user => user.user.username === userProfile.username);
      if (!isShared) {
        const sharedInfo: SharedUserInfo = SharedUserInfo.new(userProfile);
        const viewPermission = PermissionProviders.buildPermission(payload.organizationId, payload.resourceType, ActionType.view, payload.resourceId);
        sharedInfo.permissions = [viewPermission];
        this.resourceInfo.usersSharing = [sharedInfo, ...this.resourceInfo.usersSharing];
        ShareModule.updateSharePermission({
          userData: sharedInfo,
          editedValue: ActionType.view
        });
      }
    } else {
      Log.error('ShareModule::updateSharePermission::resourceInfo is null');
    }
  }

  @Action
  async createShareInfo(payload: SaveShareData): Promise<void> {
    const isNotEmpty: boolean = this.createdUsers.size > 0;
    Log.debug('ShareStore::createShareInfo::called createdUsers is not empty::', isNotEmpty);
    if (isNotEmpty) {
      const request: ShareWithUserRequest = {
        resourceId: payload.resourceId,
        resourceType: payload.resourceType,
        userActions: this.createdUsers
      };
      Log.debug('ShareStore::createShareInfo::request::', request);
      const result: Map<string, boolean> = await this.shareService.create(request);
      Log.debug('ShareStore::createShareInfo::result::', result);
    }
  }

  @Action
  async editShareInfo(payload: SaveShareData): Promise<void> {
    const isNotEmpty: boolean = this.editedUsers.size > 0;
    Log.debug('ShareStore::editShareInfo::called shareIdActions is not empty::', isNotEmpty);
    if (isNotEmpty) {
      const request: UpdateShareRequest = {
        resourceId: payload.resourceId,
        resourceType: payload.resourceType,
        shareIdActions: this.editedUsers
      };
      const result: Map<string, string[]> = await this.shareService.editSharedPermission(request);
      Log.debug('ShareStore::editShareInfo::result::', result);
    }
  }

  @Action
  async revokeShareInfo(payload: SaveShareData): Promise<void> {
    const isNotEmpty: boolean = ListUtils.isNotEmpty(this.revokedUsers);
    Log.debug('ShareStore::revokeShareInfo::called usernames is not empty::', isNotEmpty);
    if (isNotEmpty) {
      const request: RevokeShareRequest = {
        resourceId: payload.resourceId.toString(),
        resourceType: payload.resourceType,
        usernames: this.revokedUsers
      };
      const result: Map<string, boolean> = await this.shareService.revokeSharedPermission(request);
      Log.debug('ShareStore::revokeShareInfo::result::', result);
    }
  }

  @Action
  async shareAnyone(payload: SaveShareData): Promise<void> {
    Log.debug('ShareStore::shareAnyone::called::payload.isChangeShareAnyone', payload.isChangeShareAnyone);

    if (payload.isChangeShareAnyone) {
      const request: ShareAnyoneRequest = {
        resourceType: payload.resourceType,
        resourceId: payload.resourceId,
        actions: []
      };
      switch (payload.shareAnyonePermissionType) {
        case ActionType.none:
          await this.revokeShareWithAnyone({
            resourceType: payload.resourceType,
            resourceId: payload.resourceId
          });
          break;
        default:
          request.actions = ActionTypeMapActions[payload.shareAnyonePermissionType];
          await this.updateShareAnyone(request);
          break;
      }
    }
  }

  @Mutation
  updateSharePermission(payload: { userData: SharedUserInfo; editedValue: ActionType }) {
    Log.debug('updateSharePermission::payload', payload.userData);
    const { userData, editedValue } = payload;
    if (userData.id) {
      Log.debug('ShareModule::updateSharePermission::edit exits user for share', userData.id, 'type', editedValue);
      ShareModule.handleEditExistsUser(payload);
    } else {
      Log.debug('ShareModule::updateSharePermission::edit new user', 'type is', editedValue);
      ShareModule.handleEditNewUser(payload);
    }
  }

  @Mutation
  private handleEditNewUser(payload: { userData: SharedUserInfo; editedValue: ActionType }) {
    const { userData, editedValue } = payload;
    const targetUsername: string = userData.user.username;

    switch (editedValue) {
      case ActionType.none:
        this.createdUsers.delete(targetUsername);
        break;
      default:
        this.createdUsers.set(targetUsername, ActionTypeMapActions[editedValue]);
        break;
    }
  }

  @Mutation
  private handleEditExistsUser(payload: { userData: SharedUserInfo; editedValue: ActionType }) {
    const { userData, editedValue } = payload;
    const targetUsername: string = userData.user.username;

    this.createdUsers.delete(targetUsername);
    this.editedUsers.delete(userData.id);
    this.revokedUsers = this.revokedUsers.filter(item => item !== targetUsername);

    switch (editedValue) {
      case ActionType.none:
        this.revokedUsers.push(targetUsername);
        break;
      default:
        this.editedUsers.set(userData.id.toString(), ActionTypeMapActions[editedValue]);
        break;
    }
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
  }
}

export const ShareModule: ShareStore = getModule(ShareStore);
