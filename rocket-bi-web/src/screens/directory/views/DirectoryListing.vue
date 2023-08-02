<template>
  <LayoutWrapper ref="layoutWrapper">
    <LayoutSidebar :items="navItems">
      <template v-slot:top>
        <PopoverV2 class="dropdown" auto-hide placement="bottom-start">
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
    <DiRenameModal ref="createDirectoryModal" title="Create Folder" label="Folder name" placeholder="Type folder name" action-name="Create" />
    <DiRenameModal ref="createDashboardModal" title="Create Dashboard" label="Dashboard name" placeholder="Type dashboard name" action-name="Create" />
    <DirectoryRename ref="mdRenameDirectory" />
    <DiShareModal ref="mdShareDirectory" @shared="reload" />

    <MyDataPickDirectory ref="directoryPicker" @selectDirectory="handleMoveToDirectory" />
    <MyDataPickDirectory ref="copyDashboardPicker" @selectDirectory="copy" />
    <PasswordModal ref="passwordModal"></PasswordModal>
  </LayoutWrapper>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import DirectoryRename from '@/screens/directory/components/DirectoryRename.vue';
import DiShareModal from '@/shared/components/common/di-share-modal/DiShareModal.vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import {
  CreateDashboardRequest,
  CreateDirectoryRequest,
  Dashboard,
  DashboardId,
  DIException,
  Directory,
  DirectoryId,
  DirectoryType
} from '@core/common/domain';
import { Log } from '@core/utils';
import { DirectoryModule } from '@/screens/directory/store/DirectoryStore';
import { PopupUtils } from '@/utils/PopupUtils';
import { ContextMenuItem, CreateDirectoryMenuItem, DirectoryMenuItem, Routers, Status } from '@/shared';
import { RouterEnteringHook } from '@/shared/components/vue-hook/RouterEnteringHook';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import { RouterUtils } from '@/utils/RouterUtils';
import NavigationPanel, { NavigationItem } from '@/shared/components/common/NavigationPanel.vue';
import { DashboardService, DataManager } from '@core/common/services';
import { Di } from '@core/common/modules';
import MyData from '@/screens/directory/views/mydata/MyData.vue';
import { DefaultDirectoryId } from '@/screens/directory/views/mydata/DefaultDirectoryId';
import { Modals } from '@/utils/Modals';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { LayoutSidebar, LayoutWrapper } from '@/shared/components/layout-wrapper';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import MyDataPickDirectory from '@/screens/lake-house/components/move-file/MyDataPickDirectory.vue';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import router from '@/router/Router';
import PasswordModal from '@/screens/dashboard-detail/components/PasswordModal.vue';

export enum DirectoryListingEvents {
  ShowMenuCreateDirectory = 'show-menu-create-directory',
  ShowShareModal = 'show-share-modal',
  ShowMenuSettingDirectory = 'show-menu-setting-directory',
  RestoreDirectory = 'restore-directory'
}

@Component({
  components: {
    NavigationPanel,
    DirectoryRename,
    DiShareModal,
    LayoutWrapper,
    LayoutSidebar,
    PopoverV2,
    MyDataPickDirectory,
    PasswordModal
  }
})
export default class DirectoryListing extends Vue implements RouterEnteringHook {
  private readonly trackEvents = TrackEvents;

  private listIgnoreClassForContextMenu = ['di-icon-setting', 'create-directory'];
  private dataManager = DataManager;

  @Ref()
  private diContextMenu!: ContextMenu;

  @Ref()
  private createDirectoryModal!: DiRenameModal;

  @Ref()
  private createDashboardModal!: DiRenameModal;

  @Ref()
  private mdRenameDirectory!: DirectoryRename;

  @Ref()
  private mdShareDirectory!: DiShareModal;

  @Ref()
  private readonly passwordModal!: PasswordModal;

  @Ref()
  private readonly myData?: MyData;

  @Ref()
  private readonly layoutWrapper!: LayoutWrapper;

  @Ref()
  private readonly directoryPicker!: MyDataPickDirectory;

  @Ref()
  private readonly copyDashboardPicker!: MyDataPickDirectory;

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

    switch (item.directoryType) {
      case DirectoryType.Directory:
        this.mdShareDirectory.showShareDirectory(item);
        break;
      case DirectoryType.Query:
        this.mdShareDirectory.showShareAdhocQuery(item);
        break;
      case DirectoryType.Dashboard:
        this.mdShareDirectory.showShareDashboard(item);
        break;
    }
    Log.debug('Share::item', item);
  }

  @Track(TrackEvents.MyDataDirectoryRename, { directory: (_: DirectoryListing, args: any) => args[0] })
  private showRenameModal(item: Directory) {
    this.diContextMenu.hide();
    this.mdRenameDirectory.show(item);
  }

  @Track(TrackEvents.DuplicateDirectory, { directory: (_: DirectoryListing, args: any) => args[0] })
  private async duplicate(item: Directory) {
    try {
      this.diContextMenu.hide();
      DirectoryModule.setStatus(Status.Updating);
      switch (item.directoryType) {
        case DirectoryType.Dashboard:
        case DirectoryType.Query: {
          this.passwordModal.requirePassword(item, item.owner?.username || item.ownerId, async () => {
            await this.duplicateDashboard(item, this.parentId);
            await this.reload();
            // DirectoryModule.setStatus(Status.Loaded);
          });

          DirectoryModule.setStatus(Status.Loaded);
          break;
        }
        default: {
          Log.error(`Unsupported duplicate type ${item.directoryType}`);
          DirectoryModule.setStatus(Status.Loaded);
          PopupUtils.showError('Unsupported duplicate data');
        }
      }
    } catch (ex) {
      Log.error('Duplicate::error', ex);
      PopupUtils.showError(`Duplicate failed cause ${ex.message}`);
      DirectoryModule.setStatus(Status.Loaded);
    }
  }

  private async duplicateDashboard(item: Directory, parentId: DashboardId): Promise<Dashboard> {
    Log.debug('duplicate dashboard', item);
    if (item.dashboardId) {
      const dashboardService = Di.get<DashboardService>(DashboardService);
      const dashboard = await dashboardService.get(item.dashboardId);
      const request: CreateDashboardRequest = CreateDashboardRequest.fromDashboard(item.directoryType, parentId, dashboard);
      return await DirectoryModule.createDashboard(request);
    } else {
      return Promise.reject(new DIException('Dashboard id is not found'));
    }
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
        text: DirectoryMenuItem.Duplicate,
        click: () => {
          this.duplicate(directory);
        },
        hidden: directory.directoryType === DirectoryType.Directory
      },
      {
        text: DirectoryMenuItem.Copy,
        click: (event: MouseEvent) => {
          this.copyDashboardPicker.show(event, [directory.id], directory);
        },
        hidden: directory.directoryType === DirectoryType.Directory
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
    this.createDashboardModal.show('', async (name: string) => {
      try {
        this.createDashboardModal.setLoading(true);
        const request = CreateDashboardRequest.createDashboardRequest({ name: name, parentDirectoryId: parentId || 0 });
        const dashboard = await DirectoryModule.createDashboard(request);
        this.createDashboardModal.hide();
        this.createDashboardModal.setLoading(false);
        this.navigateToDashboard(dashboard.id, dashboard.name);
      } catch (ex) {
        Log.error('CreateDashboard::error', ex);
        this.createDashboardModal.setError(ex.message);
        this.createDashboardModal.setLoading(false);
      }
    });
  }

  private async navigateToDashboard(dashboardId: number, name: string): Promise<void> {
    await RouterUtils.to(Routers.Dashboard, {
      params: {
        name: RouterUtils.buildParamPath(dashboardId, name)
      },
      query: {
        token: RouterUtils.getToken(router.currentRoute)
      }
    });
  }

  private showCreateDirectoryModal(parentId?: DirectoryId) {
    this.layoutWrapper.toggleSidebar(false);
    this.diContextMenu.hide();
    const newDirectory = new CreateDirectoryRequest({
      isRemoved: false,
      parentId: parentId || 0,
      directoryType: DirectoryType.Directory
    });
    this.createDirectoryModal.show('', async (newName: string) => {
      try {
        this.createDirectoryModal.setLoading(true);
        newDirectory.name = newName;
        const directory = await DirectoryModule.createFolder(newDirectory);
        this.createDirectoryModal.hide();
        this.createDirectoryModal.setLoading(false);
        this.navigateToDirectory(directory.id, directory.name);
      } catch (ex) {
        Log.error('CreateDirectory::error', ex);
        this.createDirectoryModal.setError(ex.message);
        this.createDirectoryModal.setLoading(false);
      }
    });
  }

  private async navigateToDirectory(directoryId: number, name: string): Promise<void> {
    await RouterUtils.to(Routers.AllData, {
      name: Routers.AllData,
      params: {
        name: RouterUtils.buildParamPath(directoryId, name)
      },
      query: {
        token: RouterUtils.getToken(router.currentRoute)
      }
    });
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

  private async copy(parentId: DirectoryId, directory: Directory) {
    switch (directory.directoryType) {
      case DirectoryType.Dashboard:
      case DirectoryType.Query: {
        await this.copyDashboardTo(parentId, directory);
        break;
      }
      default: {
        PopupUtils.showError('Copy directory is not supported');
        break;
      }
    }
  }

  private async copyDashboardTo(toParentId: DirectoryId, currentDashboard: Directory) {
    this.passwordModal.requirePassword(currentDashboard, currentDashboard.owner?.username || currentDashboard.ownerId, async () => {
      try {
        DirectoryModule.setStatus(Status.Updating);
        await this.duplicateDashboard(currentDashboard, toParentId);
        await this.navigateToDirectory(toParentId, '');
        DirectoryModule.setStatus(Status.Loaded);
      } catch (ex) {
        PopupUtils.showError(ex.message);
        DirectoryModule.setStatus(Status.Loaded);
      }
    });
  }

  private async reload() {
    try {
      DirectoryModule.setStatus(Status.Updating);
      await this.myData?.handler.loadDirectoryListing(this.myData?.currentDirectoryId, this.myData?.createPaginationRequest());
    } catch (e) {
      Log.error('DirectoryListing::handleMoveToDirectory::error::', e);
      PopupUtils.showError(e.message);
    } finally {
      DirectoryModule.setStatus(Status.Loaded);
    }
  }
}
</script>
