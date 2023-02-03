import { UserFullDetailInfo, UserProfile } from '@core/common/domain/model';
import { PermissionGroup } from '@core/admin/domain/permissions/PermissionGroup';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Inject } from 'typescript-ioc';
import { UserAdminService } from '@core/admin/service/UserAdminService';
import { PermissionAdminService } from '@core/admin/service/PermissionAdminService';
import { DIException } from '@core/common/domain/exception';
import { ChangePermissionRequest } from '@core/admin/domain/request/ChangePermissionRequest';
import { EditUserProfileRequest } from '@core/admin/domain/request/EditUserProfileRequest';
import { DeleteUserRequest } from '@core/admin/domain/request/TransferUserDataConfig';
import { UserDetailPanelType } from '@/screens/user-management/store/Enum';
import { Log } from '@core/utils';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import { EditUserPropertyRequest } from '@core/admin/domain/request/EditUserPropertyRequest';
import { cloneDeep } from 'lodash';

@Module({ namespaced: true, store: store, dynamic: true, name: Stores.userProfileDetailStore })
class UserDetailStore extends VuexModule {
  currentDetailPanelType: UserDetailPanelType = UserDetailPanelType.UserPrivilege;
  userFullDetailInfo: UserFullDetailInfo | null = null;
  selectedUsername = '';
  permissionGroups: PermissionGroup[] = [];
  // contains all permissions of all groups.
  selectedPermissions: string[] = [];
  dataManager = Di.get(DataManager);
  @Inject
  private userManagementService!: UserAdminService;

  @Inject
  permissionAdminService!: PermissionAdminService;

  @Action({ rawError: true })
  loadUserFullDetailInfo(): Promise<void> {
    return this.userManagementService.getUserFullDetailInfo(this.selectedUsername).then(userFullDetailInfo => {
      this.setUserFullDetailInfo({ userFullDetailInfo });
    });
  }

  @Mutation
  switchDetailPanelType(panelType: UserDetailPanelType) {
    this.currentDetailPanelType = panelType;
  }

  @Mutation
  setUserFullDetailInfo(payload: { userFullDetailInfo: UserFullDetailInfo }) {
    this.userFullDetailInfo = payload.userFullDetailInfo;
  }

  @Action({ rawError: true })
  async loadSupportPermissionGroups() {
    return await this.permissionAdminService
      .getSupportPermissionGroups()
      .then(resp => {
        this.setPermissionGroups({ groups: resp });
      })
      .catch(err => {
        const error = DIException.fromObject(err);
        Log.debug('UserManagementProfileStore::getSupportPermissionGroups::error::', error.message);
      });
  }

  @Mutation
  setPermissionGroups(payload: { groups: PermissionGroup[] }) {
    this.permissionGroups = payload.groups;
  }

  @Action({ rawError: true })
  async savePermissions() {
    const excludePermissions = await this.getExcludePermissions();
    const includedPermissions = await this.getIncludedPermissions();
    const username = this.userFullDetailInfo?.profile?.username ?? this.selectedUsername;
    const request = new ChangePermissionRequest(username, includedPermissions, excludePermissions);
    return await this.permissionAdminService.changePermissions(request).then(() => {
      this.loadSelectedPermissions();
    });
  }

  @Action
  getExcludePermissions(): Promise<string[]> {
    const result: string[] = [];
    this.permissionGroups.forEach(group => {
      result.push(...group.getExcludedPermissions(this.selectedPermissions));
    });
    return Promise.resolve(result);
  }

  @Action
  getIncludedPermissions(): Promise<string[]> {
    const result: string[] = [];
    this.permissionGroups.forEach(group => {
      result.push(...group.getIncludedPermissions(this.selectedPermissions));
    });
    return Promise.resolve(result);
  }

  @Action({ rawError: true })
  loadSelectedPermissions(): Promise<void> {
    const permissions = UserDetailStore.getAllPermissionsFromGroups(this.permissionGroups);
    return this.permissionAdminService
      .getPermittedPermissions(this.selectedUsername, permissions)
      .then(resp => this.setSelectedPermissions({ newSelectedPermissions: resp }));
  }

  static getAllPermissionsFromGroups(permissionGroups: PermissionGroup[]): string[] {
    return permissionGroups?.flatMap(group => group.getAllPermissions()) ?? [];
  }

  @Action({ rawError: true })
  async deleteCurrentUser(transferToEmail?: string): Promise<boolean> {
    if (this.selectedUsername) {
      const request = new DeleteUserRequest(this.selectedUsername, transferToEmail);
      Log.debug('deleted user id', this.selectedUsername, 'transfer for', transferToEmail);
      return this.userManagementService.delete(request);
    } else {
      return Promise.resolve(true);
    }
  }

  @Action({ rawError: true })
  deactivateUser() {
    return this.userManagementService.deactivate(this.selectedUsername).then(() => this.loadUserFullDetailInfo());
  }

  @Action({ rawError: true })
  activateUser(): Promise<void> {
    return this.userManagementService.activate(this.selectedUsername).then(() => this.loadUserFullDetailInfo());
  }

  @Action
  updateSelectedPermissions(selectedPermissions: string[]) {
    this.setSelectedPermissions({ newSelectedPermissions: selectedPermissions });
  }

  @Mutation
  setSelectedPermissions(payload: { newSelectedPermissions: string[] }) {
    this.selectedPermissions = payload.newSelectedPermissions;
  }

  @Action({ rawError: true })
  editUserProfile(newProfile: EditUserProfileRequest): Promise<UserProfile> {
    return this.userManagementService.editUserProfile(newProfile).then(resp => {
      this.setUserProfile({ userProfile: resp });
      return resp;
    });
  }

  @Action
  updateUserProperties(request: EditUserPropertyRequest) {
    return this.userManagementService.updateUserProperties(request).then(resp => {
      this.setUserProfile({ userProfile: resp });
      return resp;
    });
  }

  @Mutation
  setUserProfile(payload: { userProfile: UserProfile }) {
    if (this.userFullDetailInfo) {
      this.userFullDetailInfo.profile = payload.userProfile;
    }
  }

  @Mutation
  setSelectedUsername(payload: { username: string }) {
    this.selectedUsername = payload.username;
  }

  @Mutation
  reset() {
    this.selectedPermissions = [];
    this.permissionGroups = [];
    this.userFullDetailInfo = null;
    this.currentDetailPanelType = UserDetailPanelType.UserPrivilege;
  }
}

export const UserDetailModule = getModule(UserDetailStore);
