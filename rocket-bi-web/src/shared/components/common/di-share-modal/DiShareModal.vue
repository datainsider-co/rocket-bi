<template>
  <b-modal
    id="mdShare"
    ref="mdShare"
    :footer-class="{ collapsed: !isHeaderCollapsed }"
    :header-class="{ collapsed: isHeaderCollapsed }"
    centered
    class="modal-content"
    @hidden="() => handleOnModalHidden()"
    @ok="event => done(event)"
  >
    <template #modal-header>
      <b-container :class="getCursorClassForHeader" class="share-people-area" @click.prevent="isHeaderCollapsed && expandShareUser()">
        <div v-if="isHeaderCollapsed" key="collapsed" class="share-people-collapsed">
          <div class="share-people-header p-md-0">
            <AddUserIcon deactive></AddUserIcon>
            <span>Share with people and group</span>
          </div>
          <template v-if="isSharePeopleEmpty">
            <span>No one has been added yet</span>
          </template>
          <template v-else>
            <span>Shared with {{ sharedUserNames }}</span>
          </template>
        </div>
        <template v-else>
          <div key="expanded" class="share-people-header p-md-0">
            <AddUserIcon active></AddUserIcon>
            <span>Share with people and group</span>
          </div>
        </template>
      </b-container>
    </template>
    <template #default="{ cancel, ok }">
      <CollapseTransition>
        <b-container v-if="isCollapsed" v-bind:key="'collapsed'" class="p-md-0 pad-y-15">
          <SearchUserInput class="search-user-input" placeholder="Add people and groups" @select="handleClickUserItem" ref="searchUserInput" />
          <StatusWidget :error="getSharedUserError" :status="getSharedUserStatus" @retry="loadResourceInfo(resourceData)"></StatusWidget>
          <SharePermissionManager
            v-if="getSharedUserStatus === Statuses.Loaded"
            :data="resourceInfo.usersSharing"
            :organizationId="organizationId"
            :owner="resourceInfo.owner"
            :resource-id="resourceId"
            :resource-type="resourceType"
            @onActionTypeChanged="handleActionTypeChanged"
          />
          <div class="row divider-top" />
          <div class="d-flex mb-2 mb-sm-4">
            <DiButton :id="genBtnId('share-cancel')" border class="flex-fill h-42px m-1" @click="cancel" placeholder="Cancel"></DiButton>
            <DiButton
              :id="genBtnId('share-done')"
              :disabled="isBtnLoading"
              :is-loading="isBtnLoading"
              primary
              class="flex-fill h-42px m-1"
              @click="ok"
              placeholder="Apply"
            ></DiButton>
          </div>
        </b-container>
      </CollapseTransition>
    </template>
    <template #modal-footer="{ cancel, ok }">
      <div class="w-100">
        <ShareAnyone
          v-if="enableShareAnyone"
          ref="shareAnyone"
          class="mt-2"
          v-model="currentPermission"
          :link="link"
          :is-btn-loading="isBtnLoading"
          :permission-token-response="permissionTokenResponse"
          :is-create-new-password="isCreatingPassword"
          :show-password-protection="isShowPasswordProtection"
          :link-handler="linkHandler"
          :passwordConfig.sync="editPasswordSetting"
          @ok="ok"
          @cancel="cancel"
          @expand="onShareAnyoneExpand"
          @resetPassword="resetPassword"
        />
      </div>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { BModal } from 'bootstrap-vue';
import { Status } from '@/shared';
import { Log } from '@core/utils';
import { ShareModule } from '@/store/modules/ShareStore';
import { ActionType, ResourceType } from '@/utils/PermissionUtils';
import { CollapseTransition, FadeTransition } from 'vue2-transitions';
import { PermissionTokenResponse } from '@core/common/domain/response';
import UserItemListing from '@/shared/components/UserItemListing.vue';
import { Directory, DirectoryType, PasswordConfig, UserProfile } from '@core/common/domain/model';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { PopupUtils } from '@/utils/PopupUtils';
import { PermissionProviders } from '@core/admin/domain/permissions/PermissionProviders';
import { SharedUserInfo } from '@core/common/domain/response/resouce-sharing/SharedUserInfo';
import { ResourceInfo } from '@core/common/domain/response/resouce-sharing/ResourceInfo';
import { ShareHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareHandler';
import { ShareDatabaseHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareDatabaseHandler';
import { ShareDirectoryHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareDirectoryHandler';
import { LinkHandler } from '@/shared/components/common/di-share-modal/link-handler/LinkHandler';
import { ListUtils, StringUtils, TimeoutUtils } from '@/utils';
import DiShadowButton from '@/shared/components/common/DiShadowButton.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Track } from '@/shared/anotation/TrackingAnotation';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import CopyButton from '@/shared/components/common/di-share-modal/components/CopyButton.vue';
import SharePermissionManager from '@/shared/components/SharePermissionManager.vue';
import SearchUserInput from '@/shared/components/common/di-share-modal/components/share-user/SearchUserInput.vue';
import ShareAnyone from '@/shared/components/common/di-share-modal/components/share-anyone/ShareAnyone.vue';
import { ShareDirectoryLinkHandler } from '@/shared/components/common/di-share-modal/link-handler/ShareDirectoryLinkHandler';
import { ShareDashboardLinkHandler } from '@/shared/components/common/di-share-modal/link-handler/ShareDashboardLinkHandler';
import { DashboardMetaData } from '@core/common/domain/model/directory/directory-metadata/DashboardMetaData';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import { ShareQueryLinkHandler } from '@/shared/components/common/di-share-modal/link-handler/ShareQueryLinkHandler';
import { OrganizationStoreModule } from '@/store/modules/OrganizationStore';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';

export interface ResourceData {
  resourceType: ResourceType;
  resourceId: string;
  organizationId: string;
  creator?: string;
}

@Component({
  components: {
    CopyButton,
    DiButton,
    DiShadowButton,
    StatusWidget,
    UserItemListing,
    SharePermissionManager,
    CollapseTransition,
    FadeTransition,
    SearchUserInput,
    ShareAnyone
  }
})
export default class DiShareModal extends Vue {
  private readonly Statuses = Status;
  private resourceData: ResourceData | null = null;
  shareHandler: ShareHandler = new ShareDirectoryHandler();
  linkHandler: LinkHandler | null = null;
  isHeaderCollapsed = false;
  link = '';
  //
  resourceType: ResourceType = ResourceType.directory;
  organizationId = '';
  resourceId = '0';
  creator = '';
  //
  getSharedUserError = '';
  getSharedUserStatus: Status = Status.Loading;
  //
  permissionTokenResponse: PermissionTokenResponse | null = null;
  enableShareAnyone = false;
  isShowPasswordProtection = false;

  localPasswordSetting: PasswordConfig | null = null; ///Use for valid/reset password

  editPasswordSetting: PasswordConfig | null = null; ///Use for edit password

  private isBtnLoading = false;

  @Ref()
  mdShare!: BModal;

  @Ref()
  searchUserInput?: SearchUserInput;

  @Ref()
  shareAnyone?: ShareAnyone;

  private currentPermission: ActionType = ActionType.none;

  private get isSharePeopleEmpty(): boolean {
    return ListUtils.isEmpty(this.resourceInfo?.usersSharing);
  }

  get sharedUserNames(): string {
    const userInfos = this.resourceInfo?.usersSharing?.slice(0, 10) ?? [];
    return userInfos.map(userInfo => userInfo.user.getName).join(', ');
  }

  get resourceInfo(): ResourceInfo | null {
    return this.shareHandler.resourceInfo;
  }

  get isEdit() {
    return this.currentPermission === ActionType.edit;
  }

  private get isCollapsed() {
    return !this.isHeaderCollapsed;
  }

  private getCursorClass(isExpanded: boolean) {
    return isExpanded ? 'cursor-default' : 'cursor-pointer';
  }

  private get getCursorClassForHeader() {
    // return 'cursor-default';handleGetSuggestedUsers

    if (this.isHeaderCollapsed) {
      return 'cursor-pointer';
    } else {
      return 'cursor-default';
    }
  }

  @Track(TrackEvents.ShowShareModal, {
    resource_type: (_: DiShareModal, args: any) => args[0].resourceType,
    resource_id: (_: DiShareModal, args: any) => args[0].resourceId
  })
  showShareModal(
    resourceData: ResourceData,
    handler: ShareHandler,
    enableShareAnyone: boolean,
    linkHandler: LinkHandler | null = null,
    enablePassword: boolean,
    passwordSetting: PasswordConfig | null = null
  ) {
    this.resourceData = resourceData;
    this.init(resourceData, handler, linkHandler); ///K load
    this.loadResourceInfo(resourceData);
    this.initShareAnyone(enableShareAnyone);
    this.initPassword(enablePassword, passwordSetting);
    this.mdShare.show();
  }

  showShareDatabase(resourceData: ResourceData) {
    this.showShareModal(resourceData, new ShareDatabaseHandler(), false, null, false);
  }

  showShareDirectory(directory: Directory) {
    const directoryName = directory.name;
    const resourceData: ResourceData = {
      organizationId: OrganizationStoreModule.orgId,
      resourceType: ResourceType.directory,
      resourceId: directory.id.toString(),
      creator: directory?.owner?.username
    };
    const linkHandler: LinkHandler = new ShareDirectoryLinkHandler(resourceData.resourceId, directoryName);
    this.showShareModal(resourceData, new ShareDirectoryHandler(), true, linkHandler, false);
  }

  showShareDashboard(directory: Directory) {
    const directoryName = directory.name;
    this.resourceData = {
      organizationId: OrganizationStoreModule.orgId,
      resourceType: ResourceType.directory,
      resourceId: directory.id.toString(),
      creator: directory?.owner?.username
    };
    const linkHandler = new ShareDashboardLinkHandler(directory.dashboardId!.toString(), directoryName);
    const currentPassword = directory?.data ? (directory.data as DashboardMetaData)?.config ?? null : null;
    Log.debug('showShareDashboard::', currentPassword);
    this.showShareModal(this.resourceData, new ShareDirectoryHandler(), true, linkHandler, true, currentPassword);
  }

  showShareAdhocQuery(directory: Directory) {
    const directoryName = directory.name;
    this.resourceData = {
      organizationId: OrganizationStoreModule.orgId,
      resourceType: ResourceType.directory,
      resourceId: directory.id.toString(),
      creator: directory?.owner?.username
    };
    const linkHandler = new ShareQueryLinkHandler(directory.dashboardId!.toString(), directoryName);
    const currentPassword = directory?.data ? (directory.data as DashboardMetaData)?.config ?? null : null;
    Log.debug('showShareDashboard::', currentPassword);
    this.showShareModal(this.resourceData, new ShareDirectoryHandler(), true, linkHandler, true, currentPassword);
  }

  init(resource: ResourceData, handler: ShareHandler, linkHandler: LinkHandler | null = null) {
    this.isHeaderCollapsed = false;
    this.organizationId = resource.organizationId;
    this.resourceId = `${resource.resourceId}`;
    this.resourceType = resource.resourceType;
    this.creator = resource.creator ?? '';
    this.shareHandler = handler;
    this.linkHandler = linkHandler;
  }

  private initShareAnyone(enableShareAnyone: boolean) {
    this.enableShareAnyone = enableShareAnyone;
    if (enableShareAnyone) {
      this.handleGetToken().then(() => {
        if (this.permissionTokenResponse) {
          this.createLinkShare();
        }
      });
    }
  }

  private initPassword(enablePassword: boolean, passwordSetting: PasswordConfig | null = null) {
    Log.debug('initPassword::', enablePassword, this.isOwner, passwordSetting);
    this.isShowPasswordProtection = enablePassword && this.isOwner;
    this.localPasswordSetting = passwordSetting;
    this.editPasswordSetting = passwordSetting;
  }

  private get isOwner() {
    return AuthenticationModule.userProfile.username === this.creator;
  }

  private get isCreatingPassword(): boolean {
    return this.localPasswordSetting === null;
  }

  loadResourceInfo(resource: ResourceData) {
    this.getSharedUserStatus = Status.Loading;
    this.shareHandler
      .loadResourceInfo(resource.resourceType, `${resource.resourceId}`)
      .then(() => {
        Log.debug('DiShareModal::show::sharedUsersResponse::', this.resourceInfo);
        this.getSharedUserStatus = Status.Loaded;
      })
      .catch(err => {
        this.getSharedUserStatus = Status.Error;
        this.getSharedUserError = err.message;
        Log.debug('DiShareModal::show::err::', err.message);
      });
  }

  @Track(TrackEvents.SubmitShare, {
    resource_type: (_: DiShareModal, args: any) => _.resourceType,
    resource_id: (_: DiShareModal, args: any) => _.resourceId
  })
  private async done(event: Event): Promise<void> {
    try {
      event.preventDefault();
      this.isBtnLoading = true;
      const isShareAnyoneActionChange = this.checkShareAnyoneChange();
      await this.shareHandler.saveAll(this.resourceId.toString(), this.resourceType, this.currentPermission, isShareAnyoneActionChange);
      await this.updatePassword(this.editPasswordSetting?.enabled ?? false, this.editPasswordSetting);
      TrackingUtils.track(TrackEvents.SubmitShareOk, {});
      this.mdShare.hide();
      this.$emit('shared');
    } catch (e) {
      Log.error('DiShareModal::done::err::', e);
      PopupUtils.showError(e.message);
      TrackingUtils.track(TrackEvents.SubmitShareFail, { error: e.message });
    } finally {
      this.isBtnLoading = false;
    }
  }

  private handleOnModalHidden(): void {
    Log.debug('DiShareModal::handleClose::Modal Closing.');
    this.searchUserInput?.reset();
    this.link = '';
    this.permissionTokenResponse = null;
    this.isShowPasswordProtection = false;
    this.localPasswordSetting = null;
    this.editPasswordSetting = null;
    this.isBtnLoading = false;
    ShareModule.reset();
    Log.debug('DiShareModal::handleClose::Modal Closed');
  }

  checkShareAnyoneChange(): boolean {
    if (this.permissionTokenResponse) {
      const highestPermission: ActionType = PermissionProviders.getActionType(
        this.organizationId,
        this.resourceType,
        this.resourceId,
        this.permissionTokenResponse.permissions ?? []
      );
      return highestPermission !== this.currentPermission;
    }
    return false;
  }

  @Watch('isHeaderCollapsed')
  onOpenShareAnyone(isHeaderCollapsed: boolean) {
    if (isHeaderCollapsed && !this.permissionTokenResponse) {
      this.handleCreateToken().then(() => this.createLinkShare());
    }
  }

  async handleCreateToken() {
    try {
      this.permissionTokenResponse = await this.shareHandler.createShareAnyone(this.resourceType, this.resourceId.toString(), [ActionType.view]);
    } catch (e) {
      PopupUtils.showError(e.message);
    }
  }

  async handleGetToken() {
    this.permissionTokenResponse = await this.shareHandler.getShareAnyone(this.resourceType, this.resourceId.toString());
  }

  private createLinkShare() {
    if (this.permissionTokenResponse) {
      Log.debug('tokenResponse::', this.permissionTokenResponse);
      this.link = this.linkHandler?.createLink(this.permissionTokenResponse) ?? '';

      this.currentPermission = PermissionProviders.getActionType(
        this.organizationId,
        this.resourceType,
        this.resourceId,
        this.permissionTokenResponse.permissions ?? []
      );
      Log.debug('handleCreateLinkShare::currentPermission', this.currentPermission);
    }
  }

  @Watch('currentPermission')
  onShareAnyonePermissionChanged(permission: string) {
    TrackingUtils.track(TrackEvents.SelectShareAnyonePermission, { permission: permission });
  }

  @Track(TrackEvents.SelectShareUser, {
    username: (_: DiShareModal, args: any) => args[0].username,
    user_email: (_: DiShareModal, args: any) => args[0].email,
    resource_type: (_: DiShareModal, args: any) => args[0].resourceType,
    resource_id: (_: DiShareModal, args: any) => args[0].resourceId
  })
  private handleClickUserItem(userItemData: UserProfile) {
    Log.debug('DiShare::handleClickUserItem::data', userItemData);
    //todo: add new userItem to ShareStore
    this.shareHandler.addShareUser(this.organizationId, this.resourceType, this.resourceId.toString(), userItemData);
  }

  @Track(TrackEvents.SelectUserPermission, {
    username: (_: DiShareModal, args: any) => args[0].username,
    user_email: (_: DiShareModal, args: any) => args[0].email,
    permission: (_: DiShareModal, args: any) => args[1],
    resource_type: (_: DiShareModal, args: any) => args[0].resourceType,
    resource_id: (_: DiShareModal, args: any) => args[0].resourceId
  })
  private handleActionTypeChanged(userItemData: SharedUserInfo, actionType: ActionType) {
    Log.debug('change::', userItemData, actionType);
    this.shareHandler.updateSharePermission(userItemData, actionType);
  }

  private async resetPassword() {
    this.localPasswordSetting = null;
  }

  async updatePassword(enabled: boolean, config: PasswordConfig | null) {
    if (this.isShowPasswordProtection) {
      Log.debug('updatePassword::', enabled, config);
      if (!enabled || StringUtils.isEmpty(config?.hashedPassword ?? '')) {
        await this.shareHandler.removePassword(this.resourceId, this.resourceType);
        return;
      }
      if (this.isCreatingPassword && config && StringUtils.isNotEmpty(config.hashedPassword)) {
        await this.shareHandler.savePassword(this.resourceId, this.resourceType, config);
        return;
      }
    }
  }

  private expandShareUser() {
    this.isHeaderCollapsed = !this.isHeaderCollapsed;
    this.shareAnyone?.collapse();
  }

  private onShareAnyoneExpand() {
    this.isHeaderCollapsed = true;
  }
}
</script>

<style lang="scss" scoped src="./DiShareModal.scss"></style>
<style lang="scss">
#mdShare {
  .modal-dialog {
    max-width: 560px;
  }

  .status-loading {
    height: 56px !important;
  }

  .embedded {
    margin-top: 12px;
  }

  .select-container {
    margin: 0;
  }
}
</style>
