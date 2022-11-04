<template>
  <LayoutWrapper ref="layoutWrapper">
    <LayoutSidebar :items="navItems">
      <template v-slot:top>
        <PopoverV2 class="dropdown" auto-hide>
          <DiShadowButton id="create-directory" class="create-directory mb-0" title="New" :event="trackEvents.MyDataCreate">
            <i class="di-icon-add"></i>
          </DiShadowButton>
          <template v-slot:menu>
            <div class="dropdown-menu">
              <a @click.prevent="showCreateDirectoryModal(parentId)" class="dropdown-item" href="#">Folder</a>
              <a @click.prevent="showCreateDashboardModal(parentId)" class="dropdown-item" href="#">Dashboard</a>
            </div>
          </template>
        </PopoverV2>
      </template>
    </LayoutSidebar>
    <router-view ref="myData" class="my-data-listing"></router-view>
    <ContextMenu ref="diContextMenu" :ignoreOutsideClass="listIgnoreClassForContextMenu" minWidth="250px" textColor="var(--text-color)" />
    <DirectoryCreate ref="mdCreateDirectory" />
    <DirectoryRename ref="mdRenameDirectory" />
    <DiShareModal ref="mdShareDirectory" />

    <MyDataPickDirectory ref="directoryPicker" @selectDirectory="handleMoveToDirectory" />
  </LayoutWrapper>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import DirectoryCreate from '@/screens/directory/components/DirectoryCreate.vue';
import DirectoryRename from '@/screens/directory/components/DirectoryRename.vue';
import DiShareModal, { ResourceData } from '@/shared/components/common/di-share-modal/DiShareModal.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { CreateDashboardRequest, CreateDirectoryRequest, Directory, DirectoryId, DirectoryType } from '@core/common/domain';
import { ResourceType } from '@/utils/PermissionUtils';
import { Log } from '@core/utils';
import { DirectoryModule } from '@/screens/directory/store/DirectoryStore';
import { PopupUtils } from '@/utils/PopupUtils';
import { ContextMenuItem, CreateDirectoryMenuItem, DirectoryMenuItem, Routers, Status } from '@/shared';
import { RouterEnteringHook } from '@/shared/components/vue-hook/RouterEnteringHook';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import { RouterUtils } from '@/utils/RouterUtils';
import NavigationPanel, { NavigationItem } from '@/shared/components/common/NavigationPanel.vue';
import { DataManager } from '@core/common/services';
import { Di } from '@core/common/modules';
import MyData from '@/screens/directory/views/mydata/MyData.vue';
import { ShareDirectoryLinkHandler } from '@/shared/components/common/di-share-modal/link-handler/ShareDirectoryLinkHandler';
import { LinkHandler } from '@/shared/components/common/di-share-modal/link-handler/LinkHandler';
import { ShareDashboardLinkHandler } from '@/shared/components/common/di-share-modal/link-handler/ShareDashboardLinkHandler';
import { DefaultDirectoryId } from '@/screens/directory/views/mydata/DefaultDirectoryId';
import { Modals } from '@/utils/Modals';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { LayoutSidebar, LayoutWrapper } from '@/shared/components/layout-wrapper';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import MyDataPickDirectory from '@/screens/lake-house/components/move-file/MyDataPickDirectory.vue';

export enum DirectoryListingEvents {
  ShowMenuCreateDirectory = 'show-menu-create-directory',
  ShowShareModal = 'show-share-modal',
  ShowMenuSettingDirectory = 'show-menu-setting-directory',
  RestoreDirectory = 'restore-directory'
}

@Component({
  components: {
    NavigationPanel,
    DirectoryCreate,
    DirectoryRename,
    DiShareModal,
    LayoutWrapper,
    LayoutSidebar,
    PopoverV2,
    MyDataPickDirectory
  }
})
export default class DirectoryListing extends Vue implements RouterEnteringHook {
  private readonly trackEvents = TrackEvents;

  private listIgnoreClassForContextMenu = ['di-icon-setting', 'create-directory'];
  private dataManager = Di.get(DataManager);

  @Ref()
  private diContextMenu!: ContextMenu;

  @Ref()
  private mdCreateDirectory!: DirectoryCreate;

  @Ref()
  private mdRenameDirectory!: DirectoryRename;

  @Ref()
  private mdShareDirectory!: DiShareModal;

  @Ref()
  private readonly myData?: MyData;

  @Ref()
  private readonly layoutWrapper!: LayoutWrapper;

  @Ref()
  private readonly directoryPicker!: MyDataPickDirectory;

  private get navItems(): NavigationItem[] {
    return [
      {
        id: 'mydata',
        displayName: 'All Data',
        icon: 'di-icon-my-data',
        to: '/mydata'
      },
      {
        id: 'shared-with-me',
        displayName: 'Shared With Me',
        icon: 'di-icon-share-with-me',
        to: '/shared'
      },
      {
        id: 'recent',
        displayName: 'Recent',
        icon: 'di-icon-recent',
        to: '/recent'
      },
      {
        id: 'starred',
        displayName: 'Starred',
        icon: 'di-icon-star',
        to: '/starred'
      },
      {
        id: 'trash',
        displayName: 'Trash',
        icon: 'di-icon-delete',
        to: '/trash'
      }
    ];
  }

  private get parentId() {
    return RouterUtils.parseToParamInfo(this.$route.params.name).idAsNumber() || DefaultDirectoryId.MyData;
  }

  beforeRouteEnter(to: Route, from: Route, next: NavigationGuardNext<any>) {
    if (RouterUtils.isLogin() || RouterUtils.getToken(to)) {
      next();
    } else {
      next({ name: Routers.Login });
    }
  }

  mounted() {
    this.$root.$on(DirectoryListingEvents.ShowShareModal, this.showShareModal);
    this.$root.$on(DirectoryListingEvents.ShowMenuSettingDirectory, this.showMenuSettingDirectory);
  }

  beforeDestroy() {
    this.$root.$off(DirectoryListingEvents.ShowShareModal, this.showShareModal);
    this.$root.$off(DirectoryListingEvents.ShowMenuSettingDirectory, this.showMenuSettingDirectory);
  }

  showContextMenu(items: ContextMenuItem[], target: string, event: Event) {
    const newEvent = HtmlElementRenderUtils.fixMenuOverlap(event, target, 0, 8);
    this.diContextMenu.show(newEvent, items);
  }

  showMenuCreateDirectory(event: MouseEvent) {
    const items = this.getCreateMenuItem(this.parentId);
    this.showContextMenu(items, 'create-directory', event);
  }

  showMenuSettingDirectory(item: Directory, routerName: Routers) {
    // this.tblDirectoryListing.selectRow(index);
    const menuItems = this.getDirectoryMenuItem(item, routerName).filter(item => !item?.hidden);
    this.diContextMenu.show(event, menuItems);
  }

  private showShareModal(item: Directory) {
    this.diContextMenu.hide();
    const organizationId = this.dataManager.getUserInfo()?.organization.organizationId!;
    const resourceData: ResourceData = {
      organizationId: organizationId,
      resourceType: ResourceType.directory,
      resourceId: item.id.toString()
    };
    let linkHandler: LinkHandler = new ShareDirectoryLinkHandler(item.id.toString(), item.name);
    if (item.dashboardId) {
      linkHandler = new ShareDashboardLinkHandler(item.dashboardId.toString(), item.name);
    }
    this.mdShareDirectory.showShareDirectory(resourceData, linkHandler);
    Log.debug('Share::item', item);
  }

  @Track(TrackEvents.MyDataDirectoryRename, { directory: (_: DirectoryListing, args: any) => args[0] })
  private showRenameModal(item: Directory) {
    this.diContextMenu.hide();
    this.mdRenameDirectory.show(item);
  }

  private showMoveModal(e: Event, directory: Directory) {
    this.directoryPicker.show(e, [directory.id], directory.id);
  }

  private async softDelete(item: Directory) {
    try {
      await DirectoryModule.softDelete(item.id);
    } catch (err) {
      PopupUtils.showError(err.message);
    }
  }

  private getDirectoryMenuItem(directory: Directory, routerName: Routers): ContextMenuItem[] {
    return [
      {
        text: DirectoryMenuItem.Rename,
        click: () => {
          this.showRenameModal(directory);
        }
      },
      {
        text: DirectoryMenuItem.MoveTo,
        hidden: routerName !== Routers.AllData,
        click: (e: Event) => {
          this.showMoveModal(e, directory);
        }
      },
      this.getStarMenuItem(directory),
      {
        text: DirectoryMenuItem.Remove,
        click: () => {
          this.confirmDeleteDirectory(directory);
        }
      }
    ];
  }

  private getStarMenuItem(directory: Directory): ContextMenuItem {
    if (directory.isStarred) {
      return {
        text: DirectoryMenuItem.RemoveFromStarred,
        click: () => {
          this.diContextMenu.hide();
          this.removeStar(directory);
        }
      };
    } else {
      return {
        text: DirectoryMenuItem.AddToStarred,
        click: () => {
          this.diContextMenu.hide();
          this.star(directory);
        }
      };
    }
  }

  private showCreateDashboardModal(parentId?: DirectoryId) {
    this.layoutWrapper.toggleSidebar(false);
    this.diContextMenu.hide();
    const newDashboard = new CreateDashboardRequest('', parentId || 0);
    this.mdCreateDirectory.show(newDashboard);
  }

  private showCreateDirectoryModal(parentId?: DirectoryId) {
    this.layoutWrapper.toggleSidebar(false);
    this.diContextMenu.hide();
    const newDirectory = new CreateDirectoryRequest({
      isRemoved: false,
      parentId: parentId || 0,
      directoryType: DirectoryType.Directory
    });
    this.mdCreateDirectory.show(newDirectory);
  }

  private getCreateMenuItem(parentId?: DirectoryId): ContextMenuItem[] {
    return [
      {
        text: CreateDirectoryMenuItem.Folder,
        click: () => {
          this.showCreateDirectoryModal(parentId);
        }
      },
      {
        text: CreateDirectoryMenuItem.Dashboard,
        click: () => {
          this.showCreateDashboardModal(parentId);
        }
      }
    ];
  }

  @Track(TrackEvents.DirectoryStar, {
    directory_id: (_: DirectoryListing, args: any) => args[0].id,
    directory_type: (_: DirectoryListing, args: any) => args[0].directoryType,
    directory_name: (_: DirectoryListing, args: any) => args[0].name
  })
  private async star(directory: Directory) {
    try {
      await DirectoryModule.star(directory.id);
    } catch (ex) {
      Log.error('star::error', ex);
    }
  }

  @Track(TrackEvents.DirectoryRemoveStar, {
    directory_id: (_: DirectoryListing, args: any) => args[0].id,
    directory_type: (_: DirectoryListing, args: any) => args[0].directoryType,
    directory_name: (_: DirectoryListing, args: any) => args[0].name
  })
  private async removeStar(directory: Directory) {
    try {
      await DirectoryModule.removeStar(directory.id);
    } catch (ex) {
      Log.error('removeStar::error', ex);
    }
  }

  @Track(TrackEvents.DirectoryMoveToTrash, {
    directory_id: (_: DirectoryListing, args: any) => args[0].id,
    directory_type: (_: DirectoryListing, args: any) => args[0].directoryType,
    directory_name: (_: DirectoryListing, args: any) => args[0].name
  })
  private confirmDeleteDirectory(directory: Directory) {
    this.diContextMenu.hide();
    Log.debug('DeleteDirectory::', directory);
    Modals.showConfirmationModal(`Are you sure to delete ${directory.directoryType} '${directory.name}' ?`, {
      onOk: () => this.softDelete(directory)
    });
  }

  private async handleMoveToDirectory(parentId: DirectoryId, directoryId: DirectoryId) {
    try {
      Log.debug('DirectoryListing::handleMoveToDirectory::id::', parentId, directoryId);
      DirectoryModule.setStatus(Status.Updating);
      await DirectoryModule.moveDirectory({ id: directoryId, parentId: parentId });
      await this.myData?.handler.loadDirectoryListing(parentId, this.myData?.createPaginationRequest());
    } catch (e) {
      Log.error('DirectoryListing::handleMoveToDirectory::error::', e);
      PopupUtils.showError(e.message);
    } finally {
      DirectoryModule.setStatus(Status.Loaded);
    }
  }
}
</script>
