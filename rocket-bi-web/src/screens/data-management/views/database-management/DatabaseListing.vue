<template>
  <LayoutContent>
    <LayoutHeader :title="title" :icon="icon">
      <div class="action-bar d-flex ml-auto">
        <SearchInput class="search-database-input" hint-text="Search database" @onTextChanged="handleKeywordChange" />
        <!--        <di-button id="refresh-database" class="ml-1" title="Refresh" @click="reloadData">-->
        <!--          <i class="di-icon-reset" />-->
        <!--        </di-button>-->
        <DiIconTextButton title="Refresh" @click="reloadData" :event="trackEvents.DatabaseManagementRefresh">
          <i class="di-icon-reset database-listing-action-icon"></i>
        </DiIconTextButton>
        <!--        <di-button :id="genBtnId('add-database')" title="Add">-->
        <!--          <img alt="" src="@/assets/icon/ic_add.svg" />-->
        <!--        </di-button>-->
      </div>
    </LayoutHeader>
    <DiTable
      id="database-listing"
      :error-msg="tableErrorMessage"
      :headers="databaseHeaders"
      :records="databaseListing"
      :status="tableStatus"
      :total="totalRecord"
      class="database-table layout-content-panel"
      @onClickRow="navigateToSchema"
      @onRetry="handleLoadData"
    >
      <template #empty>
        <template v-if="isAllDatabaseRoute">
          <EmptyComponent class="h-100" title="Your database is empty">
            <i class="di-icon-database"></i>
          </EmptyComponent>
        </template>
        <template v-else>
          <EmptyComponent class="h-100" title="Your trash is empty">
            <i class="di-icon-delete"></i>
          </EmptyComponent>
        </template>
      </template>
    </DiTable>
    <DiShareModal ref="shareDatabaseModal" />
    <DiRenameModal ref="renameModal" />
  </LayoutContent>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { CustomCell, HeaderData, IndexedHeaderData, RowData } from '@/shared/models';
import { DefaultPaging, Routers, Status } from '@/shared';
import { Log } from '@core/utils';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { PopupUtils } from '@/utils/PopupUtils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { DIException } from '@core/common/domain';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import SearchInput from '@/shared/components/SearchInput.vue';
import { ShortSchemaResponse } from '@core/data-warehouse/ShortSchemaResponse';
import { toNumber } from 'lodash';
import DiShareModal, { ResourceData } from '@/shared/components/common/di-share-modal/DiShareModal.vue';
import { ResourceType } from '@/utils/PermissionUtils';
import { ShareHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareHandler';
import { ShareDatabaseHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareDatabaseHandler';
import { StringUtils } from '@/utils/StringUtils';
import moment from 'moment';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { DataManager } from '@core/common/services';
import { UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import { Modals } from '@/utils/Modals';
import EmptyComponent from '@/screens/data-management/views/database-management/EmptyComponent.vue';
import { ChartUtils, RouterUtils } from '@/utils';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { DataManagementModule } from '@/screens/data-management/store/DataManagementStore';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { OrganizationStoreModule } from '@/store/modules/OrganizationStore';

enum DatabaseCategory {
  Database = 'database',
  Trash = 'trash'
}

@Component({
  components: {
    DiShareModal,
    SearchInput,
    StatusWidget,
    EmptyComponent,
    DiRenameModal,
    LayoutContent,
    LayoutHeader
  }
})
export default class DatabaseListing extends Vue {
  private readonly trackEvents = TrackEvents;
  shareDatabaseHandler: ShareHandler = new ShareDatabaseHandler();

  @Prop({ required: true })
  label!: DatabaseCategory;
  @Ref()
  shareDatabaseModal?: DiShareModal;
  @Ref()
  renameModal?: DiRenameModal;

  private dropdownData: DropdownData[] = [
    {
      label: DatabaseCategory.Database
    },
    {
      label: DatabaseCategory.Trash
    }
  ];
  private keyword = '';
  private from = toNumber(this.$router.currentRoute.query?.from) ?? 0;
  private size = DefaultPaging.DefaultPageSize;
  private tableErrorMessage = '';
  private tableStatus: Status = Status.Loading;

  private get isAllDatabaseRoute() {
    return this.label === DatabaseCategory.Database;
  }

  private get title() {
    if (this.isAllDatabaseRoute) return 'All Databases';
    return 'Trash';
  }

  private get isMobile() {
    return ChartUtils.isMobile();
  }

  private get icon() {
    if (this.isAllDatabaseRoute) return 'di-icon-database';
    return 'di-icon-delete';
  }

  private get databaseHeaders(): HeaderData[] {
    return [
      {
        key: 'databaseDisplayName',
        label: 'Name',
        disableSort: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const data = rowData?.database.displayName ?? '--';
          const iconElement = HtmlElementRenderUtils.renderIcon('di-icon-database database-img');
          const dataElement = HtmlElementRenderUtils.renderText(data, 'span', 'database-name font-weight-bold');
          return HtmlElementRenderUtils.renderAction([iconElement, dataElement], 16, 'database-name-container');
        })
      },
      {
        key: 'owner',
        label: 'Owner',
        disableSort: true,
        customRenderBodyCell: new UserAvatarCell('owner.avatar', ['owner.fullName', 'owner.lastName', 'owner.email', 'owner.username']),
        width: this.isMobile ? 120 : 280
      },
      {
        key: 'customCreatedTime',
        label: 'Created Time',
        disableSort: true,
        hiddenInMobile: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const data = rowData?.database?.createdTime ? moment(rowData?.database?.createdTime).format('MMM DD, YYYY hh:mm A') : '--';
          return HtmlElementRenderUtils.renderText(data, 'span');
        }),
        width: 200
      },
      {
        key: 'action',
        label: 'Action',
        disableSort: true,
        hiddenInMobile: true,
        width: 120
      }
    ];
  }

  private get totalRecord(): number {
    if (this.isAllDatabaseRoute) {
      return DataManagementModule.databaseListingResponse?.total ?? 0;
    } else {
      return DataManagementModule.trashDatabaseListingResponse?.total ?? 0;
    }
  }

  protected get databaseInfos(): ShortSchemaResponse[] {
    if (this.isAllDatabaseRoute) {
      return DataManagementModule.databaseListingResponse?.data ?? [];
    } else {
      return DataManagementModule.trashDatabaseListingResponse?.data ?? [];
    }
  }

  protected get databaseListing(): RowData[] {
    return this.databaseInfos
      .filter(item => StringUtils.isEmpty(this.keyword) || StringUtils.isIncludes(this.keyword, item.database.displayName))
      .map(databaseInfo => {
        return {
          ...databaseInfo,
          isExpanded: false,
          children: [],
          depth: 0,
          action: new CustomCell(this.renderDatabaseAction)
        };
      });
  }

  @Watch('label')
  async onLabelChange(newValue: DatabaseCategory) {
    await this.handleLoadData();
  }

  created() {
    this.handleLoadData();
  }

  beforeDestroy() {
    DataManagementModule.reset();
  }

  private async loadData(from: number, size: number) {
    if (this.isAllDatabaseRoute) {
      return DataManagementModule.loadDatabaseListing({ from: from, size: size });
    } else {
      return DataManagementModule.loadListTrashDatabase({ from: from, size: size });
    }
  }

  private async handleLoadData() {
    try {
      this.showLoading();
      await this.loadData(0, 1000);
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('DatabaseManagement::loadListDatabase::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  private async reloadData() {
    try {
      this.showLoading();
      await this.loadData(0, 1000);
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('DatabaseManagement::loadListDatabase::exception::', exception.message);
      throw new DIException(exception.message);
    }
  }

  private handleKeywordChange(value: string) {
    this.keyword = value;
  }

  private renderDatabaseAction(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement {
    const database: ShortSchemaResponse = ShortSchemaResponse.fromObject(rowData);
    switch (this.label) {
      case DatabaseCategory.Database: {
        //Button Share
        const buttonShare = HtmlElementRenderUtils.renderIcon('di-icon-share btn-icon-border border-24px share-icon', event =>
          this.showShareDatabaseModal(event, database)
        );
        buttonShare.setAttribute('data-title', 'Share');
        TableTooltipUtils.configTooltip(buttonShare);
        //Button Delete
        const buttonDelete = HtmlElementRenderUtils.renderIcon('di-icon-delete btn-icon-border border-24px delete-icon', event =>
          this.handleConfirmSortDeleteDatabase(event, database)
        );
        buttonDelete.setAttribute('data-title', 'Delete');
        TableTooltipUtils.configTooltip(buttonDelete);
        return HtmlElementRenderUtils.renderAction([buttonShare, buttonDelete], 12, 'action-container');
      }
      default: {
        //Button Recover
        const buttonRecover = HtmlElementRenderUtils.renderIcon('di-icon-restore btn-icon-border border-24px restore-icon', event =>
          this.handleConfirmRestoreDatabase(event, database)
        );
        buttonRecover.setAttribute('data-title', 'Recover');
        TableTooltipUtils.configTooltip(buttonRecover);
        //Button Delete Forever
        const buttonDelete = HtmlElementRenderUtils.renderIcon('di-icon-delete btn-icon-border border-24px delete-icon', event =>
          this.handleConfirmDeleteDatabase(event, database)
        );
        buttonDelete.setAttribute('data-title', 'Delete');
        TableTooltipUtils.configTooltip(buttonDelete);
        return HtmlElementRenderUtils.renderAction([buttonRecover, buttonDelete], 19, 'action-container');
      }
    }
  }

  @Track(TrackEvents.DatabaseManagementShareDatabase, {
    database_name: (_: DatabaseListing, args: any) => args[1].database.name
  })
  private showShareDatabaseModal(event: MouseEvent, schemaInfo: ShortSchemaResponse) {
    event.stopPropagation();
    const organizationId = OrganizationStoreModule.orgId;
    const resourceData: ResourceData = {
      organizationId: organizationId,
      resourceType: ResourceType.database,
      resourceId: schemaInfo.database.name
    };
    this.shareDatabaseModal?.showShareDatabase(resourceData);
    Log.debug('onClickDeleteInRow::', schemaInfo);
  }

  @Track(TrackEvents.DatabaseManagementMoveToTrash, {
    database_name: (_: DatabaseListing, args: any) => args[1].database.name
  })
  private handleConfirmSortDeleteDatabase(event: MouseEvent, schemaInfo: ShortSchemaResponse) {
    event.stopPropagation();
    Modals.showConfirmationModal(`Are you sure you want to permanently delete database '${schemaInfo.database.displayName}'?`, {
      onOk: () => this.handleDeleteDatabase(schemaInfo)
    });
  }

  @Track(TrackEvents.DatabaseManagementHardRemove, {
    database_name: (_: DatabaseListing, args: any) => args[1].database.name
  })
  private handleConfirmDeleteDatabase(event: MouseEvent, schemaInfo: ShortSchemaResponse) {
    event.stopPropagation();
    Modals.showConfirmationModal(`Are you sure you want to permanently delete database '${schemaInfo.database.displayName}'?`, {
      onOk: () => this.handleDeleteDatabase(schemaInfo)
    });
  }

  @Track(TrackEvents.DatabaseManagementRestore, {
    database_name: (_: DatabaseListing, args: any) => args[1].database.name
  })
  private handleConfirmRestoreDatabase(event: MouseEvent, schemaInfo: ShortSchemaResponse) {
    event.stopPropagation();
    Modals.showConfirmationModal(`Are you sure to restore database '${schemaInfo.database.displayName}'?`, {
      onOk: () => this.handleRecoverDatabase(schemaInfo)
    });
  }

  @Track(TrackEvents.DatabaseSubmitRestore, {
    database_name: (_: DatabaseListing, args: any) => args[0].database.name
  })
  private async handleRecoverDatabase(schemaInfo: ShortSchemaResponse) {
    try {
      this.showUpdating();
      //todo: recoverData
      await DatabaseSchemaModule.restoreDatabase(schemaInfo.database.name);
      await DatabaseSchemaModule.loadShortDatabaseInfos(true);
      await this.loadData(0, 1000);
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('DatabaseManagement::deleteDataSource::error::', e.message);
    } finally {
      this.showLoaded();
    }
  }

  /**
   * @deprecated this method unsupported for now
   * @param schemaInfo
   * @private
   */
  @Track(TrackEvents.DatabaseSubmitMoveToTrash, {
    database_name: (_: DatabaseListing, args: any) => args[0].database.name
  })
  private async handleMoveToTrashDatabase(schemaInfo: ShortSchemaResponse) {
    try {
      this.showUpdating();
      //todo: deleteData
      await DatabaseSchemaModule.moveToTrash(schemaInfo.database.name);
      await this.loadData(0, 1000);
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('DatabaseManagement::handleMoveToTrashDatabase::error::', e.message);
    } finally {
      this.showLoaded();
    }
  }

  @Track(TrackEvents.DatabaseSubmitHardRemove, {
    database_name: (_: DatabaseListing, args: any) => args[0].database.name
  })
  private async handleDeleteDatabase(schemaInfo: ShortSchemaResponse) {
    try {
      this.showUpdating();
      await DatabaseSchemaModule.deleteDatabase(schemaInfo.database.name);
      await this.loadData(0, 1000);
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('DatabaseManagement::handleMoveToTrashDatabase::error::', e.message);
    } finally {
      this.showLoaded();
    }
  }

  private showUpdating() {
    this.tableStatus = Status.Updating;
  }

  private showLoading() {
    this.tableStatus = Status.Loading;
  }

  private showLoaded() {
    this.tableStatus = Status.Loaded;
  }

  private showError(message: string) {
    this.tableStatus = Status.Error;
    this.tableErrorMessage = message;
  }

  @Track(TrackEvents.DatabaseManagementSelectDatabase, {
    database_name: (_: DatabaseListing, args: any) => args[0].database.name
  })
  private navigateToSchema(data: RowData): void {
    Log.debug('DatabaseListing::click::', data.database.name);
    RouterUtils.to(Routers.DataSchema, {
      query: {
        database: data.database.name
        // table: tableName
      }
    });
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.database {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 28px - 68px);

  .database-name-container {
    display: flex;
    align-items: center;
  }

  .database-listing-action-icon {
    font-size: 16px;
    color: var(--directory-header-icon-color);
  }

  .database-img {
    font-size: 24px;
  }

  .user-avt {
    margin-right: 8px;
    width: 24px;
    height: 24px;
  }

  .action-container {
    display: flex;
    align-items: center;
  }

  .share-icon,
  .restore-icon,
  .delete-icon {
    font-size: 14px;
    padding: 6px;
  }

  .share-icon {
    opacity: 0.8;
  }

  > header {
    display: flex;
    height: 33px;
    justify-content: space-between;

    @media screen and (max-width: 700px) {
      align-items: center;
    }

    > .database-title {
      align-items: center;
      display: flex;
      flex: 1;
      font-size: 24px;
      font-stretch: normal;
      font-style: normal;
      font-weight: 500;
      height: 28px;
      letter-spacing: 0.2px;
      line-height: 1.4;
      margin-right: 8px;
      overflow: hidden;

      > .root-title {
        align-items: center;
        display: flex;

        i {
          margin-right: 16px;
          color: var(--directory-header-icon-color);
        }
      }
    }

    .action-bar {
      //align-items: baseline;
      margin-top: 3px;
      height: 28px;
    }

    .search-input {
      @media screen and (max-width: 800px) {
        width: 155px !important;
      }
    }

    #refresh-database {
      padding: 0;
      margin-bottom: 0;
      margin-top: 3px;
      //i {
      //  margin-bottom: 3px !important;
      //}

      &.hide {
        display: none !important;
      }

      &:hover,
      &:active {
        background: unset !important;
      }

      @media screen and (max-width: 800px) {
        .title {
          display: none;
        }
      }
    }
  }

  > .database-divider {
    background-color: var(--text-color);
    height: 0.5px;
    margin-bottom: 16px;
    margin-top: 12.5px;
    opacity: 0.2;
  }

  > .database-table {
    background-color: var(--directory-row-bg);
    flex: 1;
  }

  .database-name {
    @include semi-bold-14();
    color: var(--text-color);
    font-weight: 500;
  }
}
</style>
