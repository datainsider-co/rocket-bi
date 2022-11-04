<template>
  <LayoutContent>
    <LayoutHeader :route="rootRoute" :title="handler.title" :icon="handler.headerIcon">
      <BreadcrumbComponent :breadcrumbs="handler.breadcrumbs"></BreadcrumbComponent>
      <DiIconTextButton class="ml-auto" title="Refresh" @click="onDirectoryIdChanged(currentDirectoryId)" event="mydata_refresh">
        <i class="di-icon-reset mydata-action-icon"></i>
      </DiIconTextButton>
    </LayoutHeader>
    <DiTable
      id="my-data-listing"
      :error-msg="handler.errorMsg"
      :headers="headers"
      :records="handler.directories"
      :status="handler.status"
      class="directory-table"
      @onClickRow="onClickRow"
      @onRetry="loadDirectories"
      @onSortChanged="handleSortChanged"
    >
      <template #empty>
        <EmptyDirectory class="h-100"></EmptyDirectory>
      </template>
    </DiTable>
  </LayoutContent>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import DiButton from '@/shared/components/common/DiButton.vue';
import { DirectoryListingEvents } from '@/screens/directory/views/DirectoryListing.vue';
import { DashboardId, DIException, Directory, DirectoryId, DirectoryPagingRequest, DirectoryType, Sort, SortDirection } from '@core/common/domain';
import { Routers, Status } from '@/shared';
import { Log } from '@core/utils/Log';
import { RouterUtils } from '@/utils/RouterUtils';
import { PopupUtils } from '@/utils/PopupUtils';
import { DirectoryListingHandler } from '@/screens/directory/views/mydata/directory-listing-handler/DirectoryListingHandler';
import { HeaderData, RowData } from '@/shared/models';
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';
import DiTable from '@/shared/components/common/di-table/DiTable.vue';
import { DefaultDirectoryId } from '@/screens/directory/views/mydata/DefaultDirectoryId';
import { DirectoryNameCell, IconActionCell, DateCell, UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import { StringUtils } from '@/utils/StringUtils';
import BreadcrumbComponent from '@/screens/directory/components/BreadcrumbComponent.vue';
import { ChartUtils, ListUtils } from '@/utils';
import { DirectoryModule } from '@/screens/directory/store/DirectoryStore';
import { Modals } from '@/utils/Modals';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { Track } from '@/shared/anotation/TrackingAnotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: {
    BreadcrumbComponent,
    EmptyDirectory,
    DiTable,
    DiButton,
    LayoutContent,
    LayoutHeader
  }
})
export default class MyData extends Vue {
  private sortBy = '';
  private sortDirection = SortDirection.Desc;
  @Prop()
  readonly handler!: DirectoryListingHandler;

  private get rootRoute() {
    const rootName = this.handler.getRootName();
    return {
      name: rootName,
      query: {
        token: RouterUtils.getToken(this.$route)
      }
    };
  }

  private get currentDirectoryId(): DirectoryId {
    return RouterUtils.parseToParamInfo(this.$route.params.name).idAsNumber() || this.defaultDirectoryId;
  }

  private get canClickRoot(): boolean {
    return ListUtils.isNotEmpty(this.handler.breadcrumbs);
  }

  private get defaultDirectoryId(): DirectoryId {
    switch (this.$route.name) {
      case Routers.SharedWithMe:
        return DefaultDirectoryId.SharedWithMe;
      case Routers.Recent:
        return DefaultDirectoryId.Recent;
      case Routers.Starred:
        return DefaultDirectoryId.Starred;
      case Routers.Trash:
        return DefaultDirectoryId.Trash;
      default:
        return DefaultDirectoryId.MyData;
    }
  }

  private isMobile = ChartUtils.isMobile();

  private get headers(): HeaderData[] {
    return [
      {
        key: 'name',
        label: 'Name',
        customRenderBodyCell: new DirectoryNameCell()
      },
      {
        key: 'owner',
        label: 'Owner',
        width: this.isMobile ? 120 : void 0,
        disableSort: true,
        customRenderBodyCell: new UserAvatarCell('owner.avatar', ['owner.fullName', 'owner.lastName', 'owner.email', 'owner.username'])
      },
      {
        key: 'updatedDate',
        label: 'Last Modified',
        disableSort: true,
        hiddenInMobile: true,
        customRenderBodyCell: new DateCell()
      },
      {
        key: 'action',
        label: 'Action',
        width: 120,
        disableSort: true,
        hiddenInMobile: true,
        customRenderBodyCell: this.buildActions(this.$route.name)
      }
    ];
  }

  @Watch('currentDirectoryId')
  onDirectoryIdChanged(newDirectoryId: DirectoryId) {
    // FIXME: Remove sort when navigate
    Log.debug('onDirectoryIdChanged::on directory changed');
    this.handler.loadDirectoryListing(newDirectoryId, this.createPaginationRequest());
  }

  created() {
    this.loadDirectories();
    document.addEventListener('resize', this.handleResize);
  }

  beforeDestroy() {
    document.removeEventListener('resize', this.handleResize);
  }

  private handleResize() {
    this.isMobile = ChartUtils.isMobile();
  }

  public createPaginationRequest(): DirectoryPagingRequest {
    if (this.sortBy) {
      return new DirectoryPagingRequest({
        sorts: [
          new Sort({
            field: this.sortBy,
            order: this.sortDirection
          })
        ],
        from: 0,
        size: 0
      });
    } else {
      return DirectoryPagingRequest.default();
    }
  }

  private navigateRoot(): void {
    if (this.canClickRoot) {
      const rootName = this.handler.getRootName();
      this.$router.push({
        name: rootName,
        query: {
          token: RouterUtils.getToken(this.$route)
        }
      });
    }
  }

  private getCurrentSortDirection(field: string) {
    const currentSortDirection = this.sortBy === field ? this.sortDirection : SortDirection.Desc;
    switch (currentSortDirection) {
      case SortDirection.Desc:
        return SortDirection.Asc;
      case SortDirection.Asc:
        return SortDirection.Desc;
    }
  }

  private handleSortChanged(header: HeaderData) {
    const field = StringUtils.toSnakeCase(header.key);
    this.sortDirection = this.getCurrentSortDirection(field);
    this.sortBy = field;
    this.handler.loadDirectoryListing(this.currentDirectoryId, this.createPaginationRequest());
  }

  private loadDirectories() {
    this.handler.loadDirectoryListing(this.currentDirectoryId, this.createPaginationRequest(), true);
  }

  @Track(TrackEvents.MyDataSelectDirectory, { directory: (_: MyData, args: any) => args[0] })
  private async onClickRow(directory: Directory) {
    if (this.handler.isSupportedClickRow) {
      try {
        switch (directory.directoryType) {
          case DirectoryType.Dashboard:
            await this.navigateToDashboard(directory.dashboardId!, directory.name);
            break;
          case DirectoryType.Query:
            await this.navigateToAdhoc(directory.dashboardId!);
            break;
          default:
            await this.navigateToDirectory(directory.id, directory.name);
        }
      } catch (ex) {
        Log.error('onClickRow::error', ex);
      }
    }
  }

  private async navigateToDashboard(id: DashboardId, name: string): Promise<void> {
    await this.$router.push({
      name: Routers.Dashboard,
      params: {
        name: RouterUtils.buildParamPath(id, name)
      },
      query: {
        token: RouterUtils.getToken(this.$route)
      }
    });
  }

  private async navigateToDirectory(directoryId: DirectoryId, name: string): Promise<void> {
    await this.$router.push({
      name: Routers.AllData,
      params: {
        name: RouterUtils.buildParamPath(directoryId, name)
      },
      query: {
        token: RouterUtils.getToken(this.$route)
      }
    });
  }

  private async navigateToAdhoc(id: DashboardId): Promise<void> {
    await this.$router.push({
      name: Routers.QueryEditor,
      query: {
        token: RouterUtils.getToken(this.$router.currentRoute),
        adhoc: id.toString()
      }
    });
  }

  private buildActions(name: string | null | undefined) {
    switch (name) {
      case Routers.Trash:
        return this.buildTrashActions();
      default:
        return this.buildDefaultActions();
    }
  }

  private buildDefaultActions() {
    return new IconActionCell([
      {
        icon: 'di-icon-share d-none d-sm-block',
        click: (row: RowData) => this.$root.$emit(DirectoryListingEvents.ShowShareModal, row)
      },
      {
        icon: 'di-icon-setting',
        click: (row: RowData) => this.$root.$emit(DirectoryListingEvents.ShowMenuSettingDirectory, row, this.handler.getRootName())
      }
    ]);
  }

  private buildTrashActions() {
    return new IconActionCell([
      {
        icon: 'di-icon-restore',
        click: (row: any) => this.restore(row)
      },
      {
        icon: 'di-icon-delete',
        click: (row: any) => this.deleteDirectory(row)
      }
    ]);
  }

  @Track(TrackEvents.DirectoryRestore, {
    directory_id: (_: MyData, args: any) => args[0].id,
    directory_type: (_: MyData, args: any) => args[0].directoryType,
    directory_name: (_: MyData, args: any) => args[0].name
  })
  private async restore(directory: Directory) {
    try {
      DirectoryModule.setStatus(Status.Updating);
      await DirectoryModule.restore(directory.id);
      await this.handler.loadDirectoryListing(this.currentDirectoryId, this.createPaginationRequest());
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      PopupUtils.showError(exception.message);
      Log.error('restore::error', exception);
    } finally {
      DirectoryModule.setStatus(Status.Loaded);
    }
  }

  private deleteDirectory(directory: Directory) {
    const message = `Are you sure to delete ${directory.directoryType} '${directory.name}'?`;
    Modals.showConfirmationModal(message, {
      onOk: event => this.handleHardDelete(directory)
    });
  }

  @Track(TrackEvents.DirectoryHardRemove, {
    directory_id: (_: MyData, args: any) => args[0].id,
    directory_type: (_: MyData, args: any) => args[0].directoryType,
    directory_name: (_: MyData, args: any) => args[0].name
  })
  private async handleHardDelete(directory: Directory) {
    try {
      DirectoryModule.setStatus(Status.Updating);
      await DirectoryModule.hardDelete(directory.id);
      await this.handler.loadDirectoryListing(this.currentDirectoryId, this.createPaginationRequest());
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      PopupUtils.showError(exception.message);
      Log.error('restore::error', exception);
    } finally {
      DirectoryModule.setStatus(Status.Loaded);
    }
  }
}
</script>
<style scoped>
.directory-table {
  background-color: var(--directory-row-bg);
  flex: 1;
}
</style>
