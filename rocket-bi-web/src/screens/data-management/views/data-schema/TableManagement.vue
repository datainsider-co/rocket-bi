<template>
  <div class="db-schema">
    <div class="db-schema-header justify-content-between">
      <div class="db-schema-title text-nowrap">
        <i class="fa fa-database text-muted"> </i>
        <span class="db-schema-header--dbname">
          <span v-if="model.database.name">{{ model.database.name }}</span>
        </span>
      </div>
      <div v-if="!isMobile" class="db-schema-action">
        <DiSearchInput border v-model="keyword" placeholder="Search tables..." />
        <DiIconTextButton :id="genBtnId('create-table')" class="mr-2 d-none d-sm-flex" title="New table" @click="handleCreateTable">
          <i class="di-icon-add icon-title"></i>
        </DiIconTextButton>
        <PopoverV2 class="dropdown" auto-hide>
          <DiIconTextButton id="db-action" title="Action">
            <i class="di-icon-setting"></i>
          </DiIconTextButton>
          <template v-slot:menu>
            <div class="dropdown-menu">
              <!--              <a @click.prevent="renameDatabase" href="#" class="dropdown-item">Rename Database</a>-->
              <a @click.prevent="shareDatabase" href="#" class="dropdown-item">Share Database</a>
              <a @click.prevent="deleteDatabase" href="#" class="dropdown-item">Delete Database</a>
            </div>
          </template>
        </PopoverV2>
      </div>
    </div>
    <div class="db-schema-info">
      <div ref="tableContainer" class="db-schema-info--body">
        <DiTable
          v-if="totalTables > 0"
          :allowShowEmpty="false"
          :error-msg="error"
          :getMaxHeight="getMaxHeight"
          :headers="dbHeader"
          :records="tables"
          :status="tableStatus"
          :total="totalTables"
          @onClickRow="handleClickTable"
        />
        <EmptyWidget v-else>
          <template #icon>
            <div class="db-schema-tips--icon">
              <i class="di-icon-schema"></i>
            </div>
          </template>
          No tables
        </EmptyWidget>
      </div>
    </div>
    <DiRenameModal ref="createTableModal" title="Create Table" label="Table name" placeholder="Input table name" action-name="Create" />
    <ContextMenu ref="contextMenu" :ignoreOutsideClass="listIgnoreClassForContextMenu" minWidth="168px" textColor="var(--text-color)" />
    <DiRenameModal ref="renameModal" :title="renameModalTitle" />
    <DiShareModal ref="shareDatabaseModal" />
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { DataSchemaModel, RenameActions } from '@/screens/data-management/views/data-schema/model';
import { CustomCell, HeaderData, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import moment from 'moment';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { ContextMenuItem, Routers, Status } from '@/shared';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import { DatabaseSchema, DIException, TableSchema } from '@core/common/domain';
import { Modals } from '@/utils/Modals';
import { Log } from '@core/utils';
import Swal from 'sweetalert2';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { DataManagementModule } from '@/screens/data-management/store/DataManagementStore';
import { PopupUtils } from '@/utils/PopupUtils';
import { ChartUtils, ListUtils } from '@/utils';
import EmptyWidget from '@/screens/dashboard-detail/components/widget-container/charts/error-display/EmptyWidget.vue';
import DiShareModal, { ResourceData } from '@/shared/components/common/di-share-modal/DiShareModal.vue';
import { ResourceType } from '@/utils/PermissionUtils';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import { StringUtils } from '@/utils/StringUtils';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation/TrackingAnotation';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({ components: { EmptyWidget, DiRenameModal, ContextMenu, DiShareModal, PopoverV2 } })
export default class TableManagement extends Vue {
  private readonly trackEvents = TrackEvents;

  @Prop({ type: Object, required: false })
  private model?: DataSchemaModel;

  @Ref()
  private readonly createTableModal!: DiRenameModal;

  @Ref()
  private readonly tableContainer?: HTMLDivElement;

  @Ref()
  private readonly contextMenu!: ContextMenu;

  @Ref()
  private readonly renameModal!: DiRenameModal;

  @Ref()
  shareDatabaseModal?: DiShareModal;

  private error = '';
  private keyword = '';
  private tableStatus: Status = Status.Loaded;
  private listIgnoreClassForContextMenu = ['btn-icon-text'];
  private renameModalTitle = 'Rename';

  private get dbHeader(): HeaderData[] {
    return this.model?.database
      ? [
          {
            key: 'displayName',
            label: 'Name',
            disableSort: true,
            customRenderBodyCell: new CustomCell(rowData => {
              const data = rowData?.name || '--';
              const iconElement = HtmlElementRenderUtils.renderIcon('di-icon-table table-icon');
              const dataElement = HtmlElementRenderUtils.renderText(data, 'span', 'table-name');
              return HtmlElementRenderUtils.renderAction([iconElement, dataElement], 8, 'database-name-container');
            })
          },
          {
            key: 'owner',
            label: 'Owner',
            disableSort: true,
            customRenderBodyCell: new UserAvatarCell('owner.avatar', ['owner.fullName', 'owner.lastName', 'owner.email', 'owner.username']),
            width: this.isMobile ? 120 : 240
          },
          {
            key: 'createdTime',
            label: 'Created Time',
            hiddenInMobile: true,
            disableSort: true,
            customRenderBodyCell: new CustomCell(rowData => {
              const data = rowData?.createdTime ? moment(rowData?.createdTime).format('MMM DD, YYYY hh:mm A') : '--';
              return HtmlElementRenderUtils.renderText(data, 'span');
            }),
            width: 240
          },
          {
            key: 'action',
            label: 'Action',
            hiddenInMobile: true,
            disableSort: true,
            width: 80
          }
        ]
      : [];
  }

  private get isMobile() {
    return ChartUtils.isMobile();
  }

  private get tables(): any[] {
    return (
      this.model?.database?.tables
        .filter(table => StringUtils.isIncludes(this.keyword, table.name) || StringUtils.isIncludes(this.keyword, table.displayName))
        .map(table => {
          return {
            ///Add creator from database
            ///Override if table has other creator
            owner: DatabaseSchemaModule.dbOwnerAsMap.get(table.dbName),
            ///Add create time from database
            ///Override if table has time creation
            createdTime: this.model?.database.createdTime,
            action: new CustomCell(this.renderTableAction),
            ...table
          };
        }) ?? []
    );
  }

  private get totalTables(): number {
    return this.model?.database.tables.length ?? 0;
  }

  @Watch('model', { deep: true })
  private onModelChanged() {
    this.keyword = '';
  }

  private renderTableAction(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement {
    const table: TableSchema = TableSchema.fromObject(rowData as any);
    //Button Rename
    const buttonRename = HtmlElementRenderUtils.renderIcon('di-icon-edit btn-icon-border p-1 share-icon', event => {
      event.stopPropagation();
      this.renameModalTitle = `Rename table`;
      const data: any = {
        model: {
          database: this.model?.database,
          table: table
        },
        action: RenameActions.table
      };
      this.renameModal.show(table.name, (newName: string) => {
        this.handleRename(newName, data);
      });
      TrackingUtils.track(TrackEvents.DataSchemaRenameTable, { database: this.model?.database, table: table });
    });
    buttonRename.setAttribute('data-title', 'Rename');
    TableTooltipUtils.configTooltip(buttonRename);
    //Button Delete
    const buttonDelete = HtmlElementRenderUtils.renderIcon('di-icon-delete btn-icon-border p-1 delete-icon', event => {
      event.stopPropagation();
      this.handleConfirmDeleteTable(event, table);
    });
    buttonDelete.setAttribute('data-title', 'Delete');
    TableTooltipUtils.configTooltip(buttonDelete);
    return HtmlElementRenderUtils.renderAction([buttonRename, buttonDelete], 16, 'action-container');
  }

  @Track(TrackEvents.DataSchemaHardRemoveTable, {
    table_name: (_: TableManagement, args: any) => args[1].name,
    database_name: (_: TableManagement, args: any) => args[1].dbName
  })
  private handleConfirmDeleteTable(event: MouseEvent, table: TableSchema) {
    event.stopPropagation();
    Modals.showConfirmationModal(`Are you sure to delete table '${table.displayName}'?`, {
      onOk: () => this.handleDeleteTable(table)
    });
  }

  private getMaxHeight(enablePagination: boolean) {
    return this.tableContainer?.clientHeight ?? 700;
  }

  @Track(TrackEvents.DataSchemaCreateTable, {
    table_name: (_: TableManagement, args: any) => _.model?.database.name,
    database_name: (_: TableManagement, args: any) => _.model?.table?.name
  })
  private handleCreateTable() {
    const tableName = '';
    this.showTableCreationModal(tableName);
  }

  private showActionMenu(event: MouseEvent) {
    const actions = this.getMenuAction(this.model!);
    const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'db-action', 80);
    this.contextMenu.show(buttonEvent, actions);
  }

  @Track(TrackEvents.DataSchemaRenameDatabase, {
    database_name: (_: TableManagement) => _.model?.database.name
  })
  private renameDatabase() {
    if (this.model) {
      const data: any = {
        model: this.model,
        action: RenameActions.database
      };
      this.renameModalTitle = `Rename database`;
      this.renameModal.show(this.model.database.displayName, (newName: string) => {
        this.handleRename(newName, data);
      });
    }
  }

  @Track(TrackEvents.DataSchemaShareDatabase, {
    database_name: (_: TableManagement) => _.model?.database.name
  })
  private shareDatabase() {
    const dataManager = Di.get(DataManager);
    const organizationId = dataManager.getUserInfo()?.organization.organizationId!;
    const resourceData: ResourceData = {
      organizationId: organizationId,
      resourceType: ResourceType.database,
      resourceId: this.model!.database.name
    };
    this.shareDatabaseModal?.showShareDatabase(resourceData);
  }

  @Track(TrackEvents.DataSchemaHardRemoveDatabase, {
    database_name: (_: TableManagement) => _.model?.database.name
  })
  private deleteDatabase() {
    Modals.showConfirmationModal(`Are you sure to delete database '${this.model!.database.displayName}'?`, {
      onOk: () => this.handleDeleteDatabase(this.model!.database)
    });
  }

  private getMenuAction(model: DataSchemaModel): ContextMenuItem[] {
    return [
      {
        text: `Rename database`,
        click: () => {
          const data: any = {
            model: model,
            action: RenameActions.database
          };
          this.renameModalTitle = `Rename database`;
          this.contextMenu.hide();
          this.renameModal.show(model.database.displayName, (newName: string) => {
            this.handleRename(newName, data);
          });
        }
      },

      {
        text: `Share database`,
        disabled: this.model?.database == undefined,
        click: () => {
          this.contextMenu.hide();
          const dataManager = Di.get(DataManager);
          const organizationId = dataManager.getUserInfo()?.organization.organizationId!;
          const resourceData: ResourceData = {
            organizationId: organizationId,
            resourceType: ResourceType.database,
            resourceId: this.model!.database.name
          };
          this.shareDatabaseModal?.showShareDatabase(resourceData);
        }
      },
      {
        text: `Delete database`,
        disabled: this.model?.database == undefined,
        click: () => {
          this.contextMenu.hide();
          Modals.showConfirmationModal(`Are you sure to delete database '${this.model!.database.displayName}'?`, {
            onOk: () => this.handleDeleteDatabase(this.model!.database)
          });
        }
      }
    ] as ContextMenuItem[];
  }

  private showTableCreationModal(tableName: string) {
    this.createTableModal.show(tableName, newName => {
      this.handleSubmitTableName(newName, this.model!.database);
    });
  }

  @Track(TrackEvents.DataSchemaSubmitHardRemoveTable, {
    table_name: (_: TableManagement, args: any) => args[0].name,
    database_name: (_: TableManagement, args: any) => args[0].dbName
  })
  private async handleDeleteTable(table: TableSchema) {
    try {
      this.tableStatus = Status.Updating;
      const isSuccess = await DatabaseSchemaModule.dropTable({ dbName: table.dbName, tblName: table.name });
      if (isSuccess) {
        const tables = ListUtils.remove(this.model!.database!.tables, target => target.name === table.name);
        this.model!.database!.tables = tables;
        DatabaseSchemaModule.selectDatabase(table.dbName).then(() => {
          this.$emit('dropTable', table);
        });
      } else {
        PopupUtils.showError(`Can't delete ${table.displayName}`);
        return Promise.reject(new DIException(`Can't delete ${table.displayName}`));
      }
      this.tableStatus = Status.Loaded;
    } catch (ex) {
      this.tableStatus = Status.Loaded;
      await Swal.fire({
        icon: 'error',
        title: 'Delete table error',
        html: ex.message
      });
    }
  }

  private async handleSubmitTableName(displayName: string, databaseSchema?: DatabaseSchema) {
    try {
      Log.debug('TableManagement::handleSubmitTableName:: displayName', displayName);
      this.ensureNewTable(databaseSchema);
      this.ensureTableName(displayName, databaseSchema);
      this.$emit('onCreatedTable', displayName);
    } catch (ex) {
      Log.error('TableManagement::handleSubmitTableName::error::', ex);
      this.createTableModal.setError(ex.message);
    }
  }

  private ensureTableName(name: string, databaseSchema?: DatabaseSchema): void {
    const existTableName = databaseSchema?.tables?.find(table => table.name === name.trim());
    if (!name.trim()) {
      throw new DIException('Table name is required.');
    } else if (name.length > 250) {
      throw new DIException('Max length is 250 chars.');
      // eslint-disable-next-line no-useless-escape
    } else if (ListUtils.isEmpty(name.match(/^[^\\\/\?\*\"\>\<\:\|]*$/))) {
      throw new DIException('Table name can\'t contain any of the following characters: /\\"?*&#62;&#60;:|');
    } else if (existTableName) {
      throw new DIException('Table name already exists');
    }
  }

  @Track(TrackEvents.DataSchemaSelectTable, {
    database_name: (_: TableManagement) => _.model?.table?.dbName,
    table_name: (_: TableManagement) => _.model?.table?.name
  })
  @Emit('onClickTable')
  private handleClickTable(table: any) {
    return TableSchema.fromObject(table);
  }

  private ensureNewTable(database: DatabaseSchema | undefined) {
    if (!database?.name) {
      throw new DIException('Database not found!');
    }
  }

  private async handleRename(newName: string, data: { model: DataSchemaModel; action: RenameActions }) {
    try {
      const { model, action } = data;
      this.renameModal.hide();
      this.tableStatus = Status.Updating;
      switch (action) {
        case RenameActions.database: {
          TrackingUtils.track(TrackEvents.DatabaseSubmitRename, { database_new_name: newName, database_old_name: this.model?.database.name });
          const schemaUpdated = await DataManagementModule.updateDatabaseDisplayName({
            newDisplayName: newName,
            dbSchema: model.database
          });
          DatabaseSchemaModule.setDatabaseSchema(schemaUpdated);
          this.tableStatus = Status.Loaded;
          break;
        }
        case RenameActions.table: {
          TrackingUtils.track(TrackEvents.TableSubmitRename, { table_new_name: newName, table_old_name: this.model?.table?.name });
          const schemaUpdated = await DataManagementModule.updateTableName({
            newName: newName,
            dbSchema: model.database,
            table: model.table!
          });
          DatabaseSchemaModule.setDatabaseSchema(schemaUpdated);
          this.$emit('updateDatabase', schemaUpdated);
          this.tableStatus = Status.Loaded;
          break;
        }
        case RenameActions.column:
          this.tableStatus = Status.Loaded;
          break;
      }
    } catch (e) {
      Log.error(e);
      this.tableStatus = Status.Loaded;
      await Swal.fire({
        icon: 'error',
        title: 'Rename Error',
        html: e.message
      });
    }
  }

  @Track(TrackEvents.DataSchemaSubmitHardRemoveDatabase, {
    database_name: (_: TableManagement) => _.model?.database.name
  })
  private async handleDeleteDatabase(db: DatabaseSchema) {
    try {
      this.tableStatus = Status.Updating;
      //todo: deleteData
      await DatabaseSchemaModule.moveToTrash(db.name);
      await DatabaseSchemaModule.loadAllDatabaseSchemas();
      await this.$router.push({
        name: Routers.AllDatabase
      });
    } catch (e) {
      const exception = DIException.fromObject(e);
      PopupUtils.showError(exception.message);
      Log.error('TableManagement', e.message);
    } finally {
      this.tableStatus = Status.Loaded;
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/_button.scss';
@import '~@/themes/scss/di-variables';
.db-schema {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  text-align: left;

  .db-schema-header {
    display: flex;
    align-items: center;
    font-size: 16px;
    margin-bottom: 1rem;
    //flex-wrap: wrap;

    .db-schema-header--dbname {
      margin: 0 10px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .db-schema-header--tblname {
      margin: 0 10px;
    }
  }
  .db-schema-title {
    display: flex;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 10px;
    height: 42px;
  }

  .db-schema-action {
    display: flex;
    margin-left: auto;
    flex-direction: row;
    align-items: center;
    //height: 42px;

    > .di-search--input {
      width: 220px;
      margin-right: 8px;
      @media screen and (max-width: 800px) {
        width: 180px !important;
      }

      @media screen and (max-width: 650px) {
        display: none;
      }
    }
  }

  .db-schema-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;

    .db-schema-info--body {
      flex: 1;
      overflow: hidden;

      .db-schema-tips--icon {
        font-size: 40px;
        margin-bottom: 16px;
        line-height: 1;
        opacity: 0.5;
      }
    }
  }

  ::v-deep {
    .table-name {
      font-weight: 500;
    }
  }
}
</style>
