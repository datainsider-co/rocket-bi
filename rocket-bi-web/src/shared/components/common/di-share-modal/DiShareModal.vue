<template>
  <b-modal
    id="mdShare"
    ref="mdShare"
    :footer-class="{ collapsed: !isHeaderCollapsed }"
    :header-class="{ collapsed: isHeaderCollapsed }"
    centered
    class="modal-content"
    @hide="handleClose"
    @ok="done"
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
          <SearchUserInput @select="handleClickUserItem" ref="searchUserInput" />
          <StatusWidget :error="getSharedUserError" :status="getSharedUserStatus"></StatusWidget>
          <SharePermissionManager
            v-if="getSharedUserStatus === Statuses.Loaded"
            :data="resourceInfo.usersSharing"
            :organizationId="organizationId"
            :owner="resourceInfo.owner"
            :resource-id="resourceId"
            :resource-type="resourceType"
            :status-data="swmStatusData"
            @handleItemStatusChange="handleSharePermissionChange"
          />
          <div class="row divider-top" />
          <div class="d-flex mb-2 mb-sm-4">
            <b-button :id="genBtnId('share-cancel')" class="flex-fill h-42px m-1" variant="secondary" @click="cancel" event="share_cancel">
              Cancel
            </b-button>
            <b-button :id="genBtnId('share-done')" class="flex-fill h-42px m-1" variant="primary" @click="ok">
              Apply
            </b-button>
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
          :link="link"
          :permission-token-response="permissionTokenResponse"
          :current-permission="currentPermission"
          :link-handler="linkHandler"
          @ok="ok"
          @cancel="cancel"
          @expand="onShareAnyoneExpand"
        />
        <PasswordProtection
          v-if="enablePasswordProtection"
          ref="passwordProtection"
          :is-create-new="isCreatingPassword"
          :config.sync="editPasswordSetting"
          class="mt-2"
          @ok="ok"
          @cancel="cancel"
          @expand="onPasswordProtectionExpand"
          @reset="resetPassword"
        />
      </div>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { BModal } from 'bootstrap-vue';
import { ActionNode, Status } from '@/shared';
import { Log, UrlUtils } from '@core/utils';
import { ShareModule } from '@/store/modules/ShareStore';
import { ActionType, PERMISSION_ACTION_NODES, ResourceType } from '@/utils/PermissionUtils';
import { CollapseTransition, FadeTransition } from 'vue2-transitions';
import { PermissionTokenResponse } from '@core/common/domain/response';
import UserItemListing from '@/shared/components/UserItemListing.vue';
import { Directory, PasswordConfig, UserProfile } from '@core/common/domain/model';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { PopupUtils } from '@/utils/PopupUtils';
import { PermissionProviders } from '@core/admin/domain/permissions/PermissionProviders';
import { SharedUserInfo } from '@core/common/domain/response/resouce-sharing/SharedUserInfo';
import { ResourceInfo } from '@core/common/domain/response/resouce-sharing/ResourceInfo';
import { ShareHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareHandler';
import { ShareDatabaseHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareDatabaseHandler';
import { ShareDirectoryHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareDirectoryHandler';
import { LinkHandler } from '@/shared/components/common/di-share-modal/link-handler/LinkHandler';
import { ListUtils, SecurityUtils, StringUtils } from '@/utils';
import DiShadowButton from '@/shared/components/common/DiShadowButton.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Track } from '@/shared/anotation/TrackingAnotation';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import CopyButton from '@/shared/components/common/di-share-modal/components/CopyButton.vue';
import SharePermissionManager from '@/shared/components/SharePermissionManager.vue';
import SearchUserInput from '@/shared/components/common/di-share-modal/components/share-user/SearchUserInput.vue';
import PasswordProtection from '@/shared/components/common/di-share-modal/components/password-protection/PasswordProtection.vue';
import ShareAnyone from '@/shared/components/common/di-share-modal/components/share-anyone/ShareAnyone.vue';
import { ShareDirectoryLinkHandler } from '@/shared/components/common/di-share-modal/link-handler/ShareDirectoryLinkHandler';
import { ShareDashboardLinkHandler } from '@/shared/components/common/di-share-modal/link-handler/ShareDashboardLinkHandler';
import { DashboardMetaData } from '@core/common/domain/model/directory/directory-metadata/DashboardMetaData';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';

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
    PasswordProtection,
    ShareAnyone
  }
})
export default class DiShareModal extends Vue {
  private readonly Statuses = Status;
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
  enablePasswordProtection = false;

  localPasswordSetting: PasswordConfig | null = null; ///Use for valid/reset password

  editPasswordSetting: PasswordConfig | null = null; ///Use for edit password

  @Ref()
  mdShare!: BModal;

  @Ref()
  searchUserInput!: SearchUserInput;

  @Ref()
  shareAnyone!: ShareAnyone;
  @Ref()
  passwordProtection!: PasswordProtection;

  private currentPermission: ActionType = ActionType.none;

  private dataManager = Di.get(DataManager);

  private get isSharePeopleEmpty(): boolean {
    return ListUtils.isEmpty(this.resourceInfo?.usersSharing);
  }

  get sharedUserNames(): string {
    const userInfos = this.resourceInfo?.usersSharing?.slice(0, 10) ?? [];
    return userInfos.map(userInfo => userInfo.user.getName).join(', ');
  }

  get swmStatusData(): ActionNode[] {
    return PERMISSION_ACTION_NODES;
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
      organizationId: this.dataManager.getUserInfo()?.organization.organizationId!,
      resourceType: ResourceType.directory,
      resourceId: directory.id.toString(),
      creator: directory.owner.username
    };
    const linkHandler: LinkHandler = new ShareDirectoryLinkHandler(resourceData.resourceId, directoryName);
    this.showShareModal(resourceData, new ShareDirectoryHandler(), true, linkHandler, false);
  }

  showShareDashboard(directory: Directory) {
    const directoryName = directory.name;
    const resourceData: ResourceData = {
      organizationId: this.dataManager.getUserInfo()?.organization.organizationId!,
      resourceType: ResourceType.directory,
      resourceId: directory.id.toString(),
      creator: directory.owner.username
    };
    const linkHandler = new ShareDashboardLinkHandler(directory.dashboardId!.toString(), directoryName);
    const currentPassword = directory?.data ? (directory.data as DashboardMetaData)?.config ?? null : null;
    Log.debug('showShareDashboard::', currentPassword);
    this.showShareModal(resourceData, new ShareDirectoryHandler(), true, linkHandler, true, currentPassword);
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
    Log.debug('initPassword::', enablePassword, this.isOwner);
    this.enablePasswordProtection = enablePassword && this.isOwner;
    this.localPasswordSetting = passwordSetting;
    this.editPasswordSetting = passwordSetting;
  }

  private get isOwner() {
    const localUsername = Di.get(DataManager).getUserInfo()?.username ?? '';
    if (!localUsername) {
      return false;
    }
    if (!this.creator) {
      return false;
    }
    return localUsername === this.creator;
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
  async done() {
    try {
      this.mdShare.hide();
      const isShareAnyoneActionChange = this.checkShareAnyoneChange();

      await this.shareHandler.saveAll(this.resourceId.toString(), this.resourceType, this.currentPermission, isShareAnyoneActionChange);
      await this.updatePassword(this.enablePasswordProtection, this.editPasswordSetting);
      TrackingUtils.track(TrackEvents.SubmitShareOk, {});
      this.$emit('shared');
    } catch (e) {
      PopupUtils.showError(e.message);
      TrackingUtils.track(TrackEvents.SubmitShareFail, { error: e.message });
    }
  }

  handleClose() {
    Log.debug('DiShareModal::handleClose::Modal Closed.');
    this.searchUserInput.reset();
    this.link = '';
    this.permissionTokenResponse = null;
    this.enablePasswordProtection = false;
    this.localPasswordSetting = null;
    this.editPasswordSetting = null;
    ShareModule.reset();
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
  private handleSharePermissionChange(userItemData: SharedUserInfo, permission: string) {
    Log.debug('change::', userItemData, permission);
    this.shareHandler.updateSharePermission(userItemData, permission);
  }

  private async resetPassword() {
    try {
      await this.shareHandler.removePassword(this.resourceId, this.resourceType);
      this.localPasswordSetting = null;
      this.editPasswordSetting = { enabled: true, hashedPassword: '' };
    } catch (ex) {
      Log.error(ex);
    }
  }

  async updatePassword(enabled: boolean, config: PasswordConfig | null) {
    Log.debug('updatePassword::', enabled, config);
    if (!enabled) {
      return;
    }
    if (this.isCreatingPassword && config && StringUtils.isNotEmpty(config.hashedPassword)) {
      await this.shareHandler.savePassword(this.resourceId, this.resourceType, config);
      return;
    }
  }

  private expandShareUser() {
    this.isHeaderCollapsed = !this.isHeaderCollapsed;
    this.shareAnyone.collapse();
    this.passwordProtection?.collapse();
  }

  private onShareAnyoneExpand() {
    this.isHeaderCollapsed = true;
    this.passwordProtection?.collapse();
  }

  private onPasswordProtectionExpand() {
    this.isHeaderCollapsed = true;
    this.shareAnyone.collapse();
    if (this.editPasswordSetting === null) {
      this.editPasswordSetting = { enabled: true, hashedPassword: '' };
    }
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

  #swm-select-share-anyone {
    height: 32px;
  }
}
</style>
