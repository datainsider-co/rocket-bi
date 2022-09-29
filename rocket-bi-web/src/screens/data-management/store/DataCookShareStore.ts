import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Inject } from 'typescript-ioc';
import {
  GetUserSharingInfoRequest,
  ResourceInfo,
  RevokeShareRequest,
  SharedUserInfo,
  ShareWithUserRequest,
  UpdateShareRequest,
  UserProfile
} from '@core/common/domain';
import { PermissionProviders } from '@core/admin/domain/permissions/PermissionProviders';
import { ActionType, editActions, ResourceType } from '@/utils/PermissionUtils';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils/StringUtils';
import { DataCookShareService } from '@core/data-cook';

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.dataCookShareStore })
class DataCookShareStore extends VuexModule {
  resourceInfo: ResourceInfo | null = null;
  revokedUsers: string[] = []; //username
  editedUsers: Map<string, string[]> = new Map(); //shareId: id
  createdUsers: Map<string, string[]> = new Map();
  @Inject
  private readonly dataCookShareService!: DataCookShareService;

  get sharedUserInfos(): SharedUserInfo[] {
    return this.resourceInfo?.usersSharing ?? [];
  }

  get failUsernames() {
    return (response: Map<string, boolean>) => {
      const failedUsernames: string[] = [];
      for (const [username, result] of response) {
        if (!result) {
          failedUsernames.push(username);
        }
      }
      return failedUsernames;
    };
  }

  @Action({ rawError: true })
  loadResourceInfo(request: GetUserSharingInfoRequest) {
    return this.dataCookShareService.getResourceInfo(request.resourceId).then(resp => {
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
      //todo: check before add new
      // check if not exist list shared user, show item(add list shared user) and add username to create share with view permission
      const sharedUserInfo: SharedUserInfo | undefined = this.resourceInfo.usersSharing.find(item => item.user.username === payload.userProfile.username);
      if (!sharedUserInfo) {
        const newSharedUserInfo: SharedUserInfo = {
          id: '',
          user: payload.userProfile,
          permissions: [PermissionProviders.buildPermission(payload.organizationId, payload.resourceType, ActionType.view, payload.resourceId)]
        };
        this.resourceInfo.usersSharing.unshift(newSharedUserInfo);
        this.createdUsers.set(newSharedUserInfo.user.username, [ActionType.view]);
      }
      Log.debug('DataCookShareStore::updateSharePermission::createdUsers', this.createdUsers);
    }
  }

  @Action({ rawError: true })
  saveAll(payload: { resourceId: string; resourceType: ResourceType; shareAnyonePermissionType: ActionType; isChangeShareAnyone: boolean }): Promise<any[]> {
    const promiseAll: Promise<any>[] = [];
    promiseAll.push(this.sharePermission({ resourceId: payload.resourceId, resourceType: payload.resourceType }));
    promiseAll.push(this.updatePermission({ resourceId: payload.resourceId, resourceType: payload.resourceType }));
    promiseAll.push(this.revokePermission({ resourceId: payload.resourceId, resourceType: payload.resourceType }));

    Log.debug('DataCookShareStore::revokeUser::', this.revokedUsers);
    Log.debug('DataCookShareStore::revokeUser::', this.createdUsers);
    Log.debug('DataCookShareStore::revokeUser::', this.editedUsers);
    return Promise.all(promiseAll);
  }

  @Action
  sharePermission(payload: { resourceId: string; resourceType: ResourceType }): Promise<any> {
    if (this.createdUsers.size > 0) {
      const createShareRequest: ShareWithUserRequest = {
        resourceId: payload.resourceId,
        resourceType: payload.resourceType,
        userActions: this.createdUsers
      };
      return this.dataCookShareService.share(createShareRequest);
    }
    return Promise.resolve();
  }

  @Action
  updatePermission(payload: { resourceId: string; resourceType: ResourceType }): Promise<any> {
    if (this.editedUsers.size > 0) {
      const editShareRequest: UpdateShareRequest = {
        resourceId: payload.resourceId,
        resourceType: payload.resourceType,
        shareIdActions: this.editedUsers
      };
      return this.dataCookShareService.update(editShareRequest);
    }
    return Promise.resolve();
  }

  @Action
  revokePermission(payload: { resourceId: string; resourceType: ResourceType }): Promise<any> {
    if (this.revokedUsers.length > 0) {
      const revokeShareRequest: RevokeShareRequest = {
        resourceId: payload.resourceId.toString(),
        resourceType: payload.resourceType,
        usernames: this.revokedUsers
      };
      return this.dataCookShareService.revoke(revokeShareRequest);
    }
    return Promise.resolve();
  }

  //todo: change
  @Action
  updateSharePermission(payload: { userData: SharedUserInfo; editedValue: string }) {
    const { userData, editedValue } = payload;
    if (StringUtils.isEmpty(userData.id)) {
      this.updatePermissionWithNotSharedUser({ userData: userData, editedValue: editedValue });
    } else {
      this.deleteSharedUser(userData);
      this.updatePermissionWithSharedUser({ userData: userData, editedValue: editedValue });
    }

    Log.debug('DataCookShareStore::updateSharePermission::createdUsers', this.createdUsers);
    Log.debug('DataCookShareStore::updateSharePermission::revokedUsers', this.revokedUsers);
    Log.debug('DataCookShareStore::updateSharePermission::editedUsers', this.editedUsers);
  }

  @Action
  updatePermissionWithSharedUser(payload: { userData: SharedUserInfo; editedValue: string }) {
    const { userData, editedValue } = payload;
    if (editedValue.includes(ActionType.view)) {
      this.setEditedUser({ shareId: userData.id, actions: [ActionType.view] });
    } else if (editedValue.includes(ActionType.edit)) {
      this.setEditedUser({ shareId: userData.id, actions: editActions });
    } else if (editedValue.includes(ActionType.none)) {
      this.setRevokeUser(userData.user.username);
    }
  }

  @Mutation
  setRevokeUser(username: string) {
    this.revokedUsers.push(username);
  }

  @Mutation
  setEditedUser(payload: { shareId: string; actions: string[] }) {
    this.editedUsers.set(payload.shareId, payload.actions);
  }

  @Action
  updatePermissionWithNotSharedUser(payload: { userData: SharedUserInfo; editedValue: string }) {
    if (payload.editedValue.includes(ActionType.edit)) {
      this.setCreatedUser({ username: payload.userData.user.username, actions: editActions });
    } else if (payload.editedValue.includes(ActionType.view)) {
      this.setCreatedUser({ username: payload.userData.user.username, actions: [ActionType.view] });
    } else if (payload.editedValue.includes(ActionType.none)) {
      this.deleteCreatedUser(payload.userData.user.username);
    }
  }

  @Mutation
  setCreatedUser(payload: { username: string; actions: string[] }) {
    this.createdUsers.set(payload.username, payload.actions);
  }

  @Action
  deleteSharedUser(sharedUserInfo: SharedUserInfo) {
    this.deleteCreatedUser(sharedUserInfo.user.username);
    this.deleteCreatedUser(sharedUserInfo.id);
    const usernameIndex = this.revokedUsers.findIndex(username => username === sharedUserInfo.user.username);
    if (usernameIndex > -1) {
      this.deleteRevokeUser(usernameIndex);
    }
  }

  @Mutation
  deleteCreatedUser(username: string) {
    this.createdUsers.delete(username);
  }

  @Mutation
  deleteEditedUser(shareId: string) {
    this.editedUsers.delete(shareId);
  }

  @Mutation
  deleteRevokeUser(usernameIndex: number) {
    this.revokedUsers.splice(usernameIndex, 1);
  }

  @Mutation
  reset() {
    this.revokedUsers = []; //username
    this.editedUsers = new Map(); //shareId: id
    this.createdUsers = new Map();
    //todo : call at close modal
  }
}

export const _DataCookShareStore: DataCookShareStore = getModule(DataCookShareStore);
