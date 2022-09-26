<template>
  <b-modal
    id="mdShare"
    ref="mdShare"
    :footer-class="{ collapsed: !isHeaderCollapsed }"
    :header-class="{ collapsed: isHeaderCollapsed }"
    :hide-footer="!enableShareAnyone"
    centered
    class="modal-content"
    @hide="handleClose"
    @ok="done"
  >
    <template #modal-header>
      <b-container :class="getCursorClassForHeader" class="share-people-area" @click.prevent="isHeaderCollapsed && toggleExpanded()">
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
          <div class="d-flex flex-column mt-2 text-uppercase">
            <b-input
              :id="genInputId('search-share-with-people-and-group')"
              v-model="searchInput"
              class="p-3 h-42px"
              debounce="300"
              placeholder="Add people and groups"
              variant="dark"
            ></b-input>
            <UserItemListing
              :data="suggestedUsers"
              :error="suggestUserError"
              :is-show-popover.sync="isShowPopover"
              :status="getSuggestUserStatus"
              :target="genInputId('search-share-with-people-and-group')"
              @handleClickUserItem="handleClickUserItem"
            ></UserItemListing>
          </div>
          <StatusWidget :error="getSharedUserError" :status="getSharedUserStatus"></StatusWidget>
          <UserItemStatusListing
            v-if="isGetSharedUserLoaded"
            :data="resourceInfo.usersSharing"
            :organizationId="organizationId"
            :owner="resourceInfo.owner"
            :resource-id="resourceId"
            :resource-type="resourceType"
            :status-data="swmStatusData"
            @handleItemStatusChange="handleSharePermissionChange"
          ></UserItemStatusListing>
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
      <CollapseTransition>
        <b-container :class="getCursorClassForFooter" class="anyone-header-area" fluid="" @click.prevent="isCollapsed && toggleExpanded()">
          <b-container v-if="isHeaderCollapsed" key="collapsed" class="d-flex flex-column">
            <b-row class="share-anyone-header">
              <div class="get-link">
                <LinkIcon active></LinkIcon>
                <span>Get link</span>
              </div>
            </b-row>
            <div class="row share-anyone-action mb-3">
              <img src="@/assets/icon/users.svg" alt="user" />
              <div class="share-anyone-info">
                <span class="header">Anyone with the link</span>
                <span>Anyone on the internet with this link can {{ isEdit ? 'edit' : 'view' }}</span>
              </div>
              <DiDropdown :id="genDropdownId('share-anyone')" v-model="currentPermission" :data="permissionTypes" value-props="type" />
            </div>
            <b-row>
              <b-input-group>
                <b-input :value="link" class="p-3 h-42px width-fit input-link cursor-default" plaintext size="sm"></b-input>
                <b-input-group-append class="copy-reset">
                  <a
                    :id="genBtnId('copy-share-link')"
                    v-clipboard:copy="link"
                    v-clipboard:error="onError"
                    v-clipboard:success="onCopy"
                    class="copy-link"
                    href="#"
                  >
                    Copy link
                  </a>
                  <b-tooltip id="success-copy-tooltip" :disabled="true" :target="genBtnId('copy-share-link')" placement="left">
                    <div :class="tooltipBackground" class="custom-tooltip-body">{{ copyStatus }}</div>
                  </b-tooltip>
                  <b-tooltip id="error-copy-tooltip" :disabled="true" :target="genBtnId('copy-share-link')" placement="left">
                    <div :class="tooltipBackground" class="custom-tooltip-body">{{ copyStatus }}</div>
                  </b-tooltip>
                </b-input-group-append>
              </b-input-group>
            </b-row>
            <!--            <br />-->

            <div ref="embedded" class="row embedded">
              <DiButton v-if="isShareDashboard" :id="genBtnId('embedded-copy')" border title="Copy embed code" @click="handleCopyEmbedCode">
                <i class="di-icon-embed"></i>
              </DiButton>
              <b-tooltip id="success-embed-tooltip" :disabled="true" :target="genBtnId('embedded-copy')" placement="top">
                <div :class="tooltipBackground" class="custom-tooltip-body">
                  {{ copyStatus }}
                </div>
              </b-tooltip>
              <b-tooltip id="error-embed-tooltip" :disabled="true" :target="genBtnId('embedded-copy')" placement="top">
                <div :class="tooltipBackground" class="custom-tooltip-body">
                  {{ copyStatus }}
                </div>
              </b-tooltip>
            </div>
            <div class="row d-flex mar-t-24">
              <b-button :id="genBtnId('share-anyone-cancel')" class="flex-fill h-42px mr-1" variant="secondary mr" @click="cancel" event="share_cancel">
                Cancel
              </b-button>
              <b-button :id="genBtnId('share-anyone-done')" class="flex-fill h-42px ml-1" variant="primary" @click="ok">
                Apply
              </b-button>
            </div>
          </b-container>
          <b-container v-if="isCollapsed" :key="'expanded'" class="px-0 d-flex flex-row justify-content-between flex-auto" fluid="">
            <div class="share-anyone-header">
              <div class="get-link">
                <LinkIcon deactive></LinkIcon>
                <span>Get link</span>
              </div>
              <span class="cursor-pointer">Anyone on the internet with this link can <span v-if="isEdit">edit</span> <span v-else>view</span></span>
            </div>
            <div ref="container" class="d-flex flex-row ml-auto align-items-center">
              <!--              todo: don't delete this line below-->
              <b-input :value="link" class="p-3 h-42px width-fit input-link cursor-default d-none" plaintext size="sm"></b-input>
              <a :id="genBtnId('quick-copy')" class="mr-2 copy-link" href="#" @click.stop="handleCopyLinkShare"> Copy link</a>
              <b-tooltip id="success-quick-copy-tooltip" :disabled="true" :target="genBtnId('quick-copy')" placement="left">
                <div :class="tooltipBackground" class="custom-tooltip-body">
                  {{ copyStatus }}
                </div>
              </b-tooltip>
              <b-tooltip id="error-quick-copy-tooltip" :disabled="true" :target="genBtnId('quick-copy')" placement="left">
                <div :class="tooltipBackground" class="custom-tooltip-body">
                  {{ copyStatus }}
                </div>
              </b-tooltip>
            </div>
          </b-container>
        </b-container>
      </CollapseTransition>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { BModal } from 'bootstrap-vue';
import { ActionNode, Status } from '@/shared';
import { Log, UrlUtils } from '@core/utils';
import { ShareModule } from '@/store/modules/share.store';
import { ActionType, PERMISSION_ACTION_NODES, ResourceType } from '@/utils/permission_utils';
import { CollapseTransition, FadeTransition } from 'vue2-transitions';
import { PermissionTokenResponse } from '@core/domain/Response';
import VueClipboard from 'vue-clipboard2';
import UserItemStatusListing from '@/shared/components/UserItemStatusListing.vue';
import UserItemListing from '@/shared/components/UserItemListing.vue';
import { UserProfile } from '@core/domain/Model';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { PopupUtils } from '@/utils/popup.utils';
import { PermissionProviders } from '@core/admin/domain/permissions/PermissionProviders';
import { SharedUserInfo } from '@core/domain/Response/ResouceSharing/SharedUserInfo';
import { ResourceInfo } from '@core/domain/Response/ResouceSharing/ResourceInfo';
import { ShareHandler } from '@/shared/components/Common/DiShareModal/ShareHandler/ShareHandler';
import { ShareDatabaseHandler } from '@/shared/components/Common/DiShareModal/ShareHandler/ShareDatabaseHandler';
import { ShareDirectoryHandler } from '@/shared/components/Common/DiShareModal/ShareHandler/ShareDirectoryHandler';
import { LinkHandler } from '@/shared/components/Common/DiShareModal/LinkHandler/LinkHandler';
import { ListUtils } from '@/utils';
import DiShadowButton from '@/shared/components/Common/DiShadowButton.vue';
import DiButton from '@/shared/components/Common/DiButton.vue';
import { Track } from '@/shared/anotation/TrackingAnotation';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

VueClipboard.config.autoSetContainer = true;
Vue.use(VueClipboard);

export enum CopyStatus {
  Failed = 'Failed',
  Success = 'Copied'
}

export interface ResourceData {
  resourceType: ResourceType;
  resourceId: string;
  organizationId: string;
}

@Component({
  components: {
    DiButton,
    DiShadowButton,
    StatusWidget,
    UserItemListing,
    UserItemStatusListing,
    CollapseTransition,
    FadeTransition
  }
})
export default class DiShareModal extends Vue {
  static readonly SHOWING_DURATION = 1000;
  shareHandler: ShareHandler = new ShareDirectoryHandler();
  linkHandler: LinkHandler | null = null;
  items: any[];
  fields: any[];
  title: string;
  selected: any;
  isHeaderCollapsed = false;
  link = '';
  searchInput = '';
  isShowPopover = false;
  resourceType: ResourceType = ResourceType.directory;
  resourceId = '0';
  getSharedUserStatus: Status = Status.Loading;
  getSharedUserError = '';
  getSuggestUserStatus: Status = Status.Loaded;
  suggestUserError = '';
  permissionTokenResponse: PermissionTokenResponse | null = null;
  copyStatus: CopyStatus = CopyStatus.Failed;
  organizationId = '';
  enableShareAnyone = false;
  @Ref()
  mdShare!: BModal;
  private readonly permissionTypes: ActionNode[] = PERMISSION_ACTION_NODES;
  private currentPermission: ActionType = ActionType.none;

  private get isSharePeopleEmpty(): boolean {
    return ListUtils.isEmpty(this.resourceInfo?.usersSharing);
  }

  get sharedUserNames(): string {
    const userInfos = this.resourceInfo?.usersSharing?.slice(0, 10) ?? [];
    return userInfos.map(userInfo => userInfo.user.getName).join(', ');
  }

  constructor() {
    super();
    this.title = 'All data';
    // TODO: it's temp data, need to update late
    this.items = [
      {
        id: 1,
        name: 'Customer demands'
      },
      {
        id: 2,
        name: 'Business 2017'
      },
      {
        id: 3,
        name: 'Customer trending'
      },
      {
        id: 4,
        name: 'Marketing test'
      }
    ];
    this.fields = [
      {
        key: 'name',
        sortable: false,
        label: 'Name',
        tdClass: 'td-text-style-primary text-left',
        thClass: 'th-text-style text-left'
      },
      {
        key: 'selected',
        tdClass: 'td-text-style-primary text-right',
        thClass: 'th-text-style text-right'
      }
    ];
  }

  get swmStatusData(): ActionNode[] {
    return PERMISSION_ACTION_NODES;
  }

  get suggestedUsers(): UserProfile[] {
    return ShareModule.suggestedUsers;
  }

  get sharedUserInfos(): SharedUserInfo[] {
    return this.shareHandler.sharedUserInfos;
  }

  get resourceInfo(): ResourceInfo | null {
    return this.shareHandler.resourceInfo;
  }

  get isGetSharedUserLoaded(): boolean {
    return this.getSharedUserStatus === Status.Loaded;
  }

  get isEdit() {
    return this.currentPermission === ActionType.edit;
  }

  get tooltipBackground() {
    return {
      'tooltip-basic-bg': this.copyStatus === CopyStatus.Failed,
      'tooltip-success-bg': this.copyStatus === CopyStatus.Success
    };
  }

  private get isCollapsed() {
    return !this.isHeaderCollapsed;
  }

  private get getCursorClassForHeader() {
    // return 'cursor-default';handleGetSuggestedUsers

    if (this.isHeaderCollapsed) {
      return 'cursor-pointer';
    } else {
      return 'cursor-default';
    }
  }

  private get getCursorClassForFooter() {
    if (this.isCollapsed) {
      return 'cursor-pointer';
    } else {
      return 'cursor-default';
    }
  }

  private get isShareDashboard() {
    return this.linkHandler!.resourceType === ResourceType.dashboard;
  }

  @Track(TrackEvents.ShowShareModal, {
    resource_type: (_: DiShareModal, args: any) => args[0].resourceType,
    resource_id: (_: DiShareModal, args: any) => args[0].resourceId
  })
  showShareModal(resourceData: ResourceData, handler: ShareHandler, enableShareAnyone: boolean, linkHandler: LinkHandler | null = null) {
    this.init(resourceData.organizationId, resourceData.resourceType, resourceData.resourceId);
    this.enableShareAnyone = enableShareAnyone;
    this.shareHandler = handler;
    this.linkHandler = linkHandler;
    this.loadResourceInfo(resourceData.resourceType, resourceData.resourceId);

    if (enableShareAnyone) {
      this.handleGetToken().then(() => {
        if (this.permissionTokenResponse) {
          this.createLinkShare();
        }
      });
    }
    this.mdShare.show();
  }

  showShareDatabase(resourceData: ResourceData) {
    this.showShareModal(resourceData, new ShareDatabaseHandler(), false);
  }

  showShareDirectory(resourceData: ResourceData, linkHandler: LinkHandler) {
    this.showShareModal(resourceData, new ShareDirectoryHandler(), true, linkHandler);
  }

  init(organizationId: string, resourceType: ResourceType, resourceId: string) {
    this.isHeaderCollapsed = false;
    this.organizationId = organizationId;
    this.resourceId = resourceId;
    this.resourceType = resourceType;
  }

  loadResourceInfo(resourceType: ResourceType, resourceId: string) {
    this.getSharedUserStatus = Status.Loading;
    this.shareHandler
      .loadResourceInfo(resourceType, resourceId.toString())
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

  selectedRow(item: any, index: number, event: any) {
    Log.debug(item);
  }

  addNewFolder() {
    Log.debug('addNewFolder');
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
      TrackingUtils.track(TrackEvents.SubmitShareOk, {});
    } catch (e) {
      PopupUtils.showError(e.message);
      TrackingUtils.track(TrackEvents.SubmitShareFail, { error: e.message });
    }
  }

  handleClose() {
    Log.debug('DiShareModal::handleClose::Modal Closed.');
    this.searchInput = '';
    this.link = '';
    this.permissionTokenResponse = null;
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

  onRowSelected(item: any) {
    Log.debug(item);
    this.selected = item;
  }

  @Watch('searchInput')
  handleSearchInputChange(newValue: string) {
    if (newValue.trim() !== '') {
      this.isShowPopover = true;
      this.handleGetSuggestedUsers();
    } else {
      this.isShowPopover = false;
    }
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

  @Track(TrackEvents.CopyShareWithAnyone, {
    resource_type: (_: DiShareModal, args: any) => args[0].resourceType,
    resource_id: (_: DiShareModal, args: any) => args[0].resourceId
  })
  copyLink() {
    this.$copyText(this.link, this.$refs.container)
      .then(() => {
        //success copy link
        Log.debug('copied link:: ', this.link);
        this.showTooltip('success-quick-copy-tooltip', CopyStatus.Success, DiShareModal.SHOWING_DURATION);
      })
      .catch(err => {
        //copy failed
        Log.error('Copied Failed::error::', err);
        this.showTooltip('error-quick-copy-tooltip', CopyStatus.Failed, DiShareModal.SHOWING_DURATION);
      });
  }

  private get dashboardEmbeddedCode() {
    return UrlUtils.createDashboardEmbedCode(this.linkHandler!.id, this.permissionTokenResponse?.tokenId ?? '');
  }

  copyEmbedCode() {
    this.$copyText(this.dashboardEmbeddedCode, this.$refs.embedded)
      .then(() => {
        //success copy link
        Log.debug('copied embedded code:: ', this.dashboardEmbeddedCode);

        this.showTooltip('success-embed-tooltip', CopyStatus.Success, DiShareModal.SHOWING_DURATION);
      })
      .catch(err => {
        //copy failed
        Log.error('Copied Failed::error::', err);
        this.showTooltip('error-embed-tooltip', CopyStatus.Failed, DiShareModal.SHOWING_DURATION);
      });
  }

  //show tooltip during showing duration time
  showTooltip(tooltipId: string, status: CopyStatus, showingDuration: number) {
    try {
      this.displayTooltipWithId(tooltipId);
      this.copyStatus = status;
      this.waitToHideTooltip(tooltipId, showingDuration);
    } catch (e) {
      Log.debug('DiShareModel::ShowTooltip::Err::', e.message);
    }
  }

  displayTooltipWithId(tooltipId: string) {
    this.$root.$emit('bv::show::tooltip', tooltipId);
  }

  handleCopyLinkShare() {
    if (this.permissionTokenResponse) {
      this.copyLink();
    } else {
      this.handleCreateToken().then(() => {
        this.createLinkShare();
        this.copyLink();
      });
    }
  }

  @Track(TrackEvents.CopyEmbeddedCode, {
    resource_type: (_: DiShareModal, args: any) => args[0].resourceType,
    resource_id: (_: DiShareModal, args: any) => args[0].resourceId
  })
  handleCopyEmbedCode() {
    this.copyEmbedCode();
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

  @Track(TrackEvents.CopyShareWithAnyone, {
    resource_type: (_: DiShareModal, args: any) => args[0].resourceType,
    resource_id: (_: DiShareModal, args: any) => args[0].resourceId
  })
  private onCopy(e: any) {
    Log.debug('You just copied: ' + e.text);
    this.showTooltip('success-copy-tooltip', CopyStatus.Success, DiShareModal.SHOWING_DURATION);
  }

  private onError(e: any) {
    Log.debug('Failed to copy texts');
    this.showTooltip('error-copy-tooltip', CopyStatus.Failed, DiShareModal.SHOWING_DURATION);
  }

  private toggleExpanded() {
    this.isHeaderCollapsed = !this.isHeaderCollapsed;
  }

  private handleGetSuggestedUsers() {
    //todo: refactor fixed value
    this.getSuggestUserStatus = Status.Loading;
    ShareModule.getSuggestedUsers({ keyword: this.searchInput, from: 0, size: 100 })
      .then(() => {
        this.getSuggestUserStatus = Status.Loaded;
      })
      .catch(err => {
        this.getSuggestUserStatus = Status.Error;
        this.suggestUserError = err.message;
        Log.debug('DiShareModal::handleGetSuggestedUsers::err::', err);
      });
    Log.debug('DiShareModal::handleGetSuggestedUsers::suggestedUsers::', ShareModule.suggestedUsers);
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

  private waitToHideTooltip(tooltipId: string, showingDuration: number) {
    return setTimeout(() => {
      this.$root.$emit('bv::hide::tooltip', tooltipId);
    }, showingDuration);
  }
}
</script>

<style lang="scss" scoped src="./di-share-modal.scss"></style>
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
