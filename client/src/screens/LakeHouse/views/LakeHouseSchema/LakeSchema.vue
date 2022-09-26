<template>
  <LayoutWrapper no-sidebar>
    <LayoutContent>
      <LayoutHeader title="Schema Management" icon="di-icon-schema"> </LayoutHeader>
      <Split :gutterSize="16" class="d-flex">
        <SplitArea :size="panelSize[0]" :minSize="0">
          <LakeTableListing
            ref="tableListing"
            :default-tbl-name-expanded="currentTableName"
            class="lake-schema--left"
            @createTable="showTableCreationModal"
            @nodeclick="handleClickNode"
            @onTablesChanged="handleTableChanged"
            @hook:mounted="initLakeSchema"
          />
        </SplitArea>
        <SplitArea :size="panelSize[1]" :minSize="0">
          <TableSchemaInfo
            ref="tableSchemaInfo"
            :is-loading="isLoading"
            :tableInfo="currentTableInfo"
            @onDeleteTable="handleDeleteTable"
            @onEditTable="handleEditTable"
            class="layout-content-panel d-block"
          ></TableSchemaInfo>
          <TableCreationModal ref="tableCreationModal" @cancel="reset" @clickAddSource="showAddSourceModal" @submit="handleSubmitTable" />
          <SourceSelectionModal ref="sourceSelectionModal" @submit="handleSubmitSourceSelectionModal" />
          <PreviewTableDataModal ref="previewTableDataModal" @created="handleTableCreated" @onBack="handleEditTable" />
        </SplitArea>
      </Split>
    </LayoutContent>
  </LayoutWrapper>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator';
import DiPage from '@/screens/LakeHouse/Components/QueryBuilder/DiPage.vue';
import LakeTableListing from '@/screens/LakeHouse/Components/QueryBuilder/LakeTableListing.vue';
import TableSchemaInfo from '@/screens/LakeHouse/views/LakeHouseSchema/LakeTableInfo.vue';
import { SlTreeNode } from '@/shared/components/builder/treemenu/SlVueTree';
import { TableSchema } from '@core/domain';
import { Log } from '@core/utils';
import { DropTableRequest, ParquetTableResponse, TableAction, TableInfo, TableManagementService } from '@core/LakeHouse';
import { ListUtils } from '@/utils';
import { RouterUtils } from '@/utils/RouterUtils';
import { Routers } from '@/shared';
import { Inject } from 'typescript-ioc';
import { PopupUtils } from '@/utils/popup.utils';
import TableCreationModal from '@/screens/LakeHouse/Components/TableCreationModal.vue';
import SourceSelectionModal from '@/screens/LakeHouse/Components/SourceSelectionModal.vue';
import PreviewTableDataModal from '@/screens/LakeHouse/Components/PreviewTableDataModal.vue';
import { LoggedInScreen } from '@/shared/components/VueHook/LoggedInScreen';
import { LayoutContent, LayoutHeader, LayoutWrapper } from '@/shared/components/LayoutWrapper';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
import SplitPanelMixin from '@/shared/components/LayoutWrapper/SplitPanel.mixin';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({
  components: {
    LakeTableListing,
    TableSchemaInfo,
    TableCreationModal,
    SourceSelectionModal,
    PreviewTableDataModal,
    LayoutWrapper,
    LayoutContent,
    LayoutHeader,
    Split,
    SplitArea
  }
})
export default class LakeSchema extends Mixins(LoggedInScreen, SplitPanelMixin) {
  private tables: TableInfo[] = [];

  private isLoading = true;

  @Inject
  private readonly tableService!: TableManagementService;

  @Ref()
  private readonly tableCreationModal!: TableCreationModal;

  @Ref()
  private readonly sourceSelectionModal!: SourceSelectionModal;

  @Ref()
  private readonly previewTableDataModal!: PreviewTableDataModal;
  @Ref()
  private readonly tableListing!: LakeTableListing;

  @Ref()
  private readonly tableSchemaInfo!: TableSchemaInfo;

  private get currentTableName(): string | null {
    return (this.$route.query.tableName as any) ?? null;
  }

  private get currentTableInfo(): TableInfo | null {
    return this.tables.find(table => table.tableName === this.currentTableName) ?? null;
  }

  private get panelSize() {
    return this.getPanelSizeHorizontal();
  }

  showAddSourceModal(selectedPaths: string[]) {
    //show add source modal
    Log.debug('handleShowAddSourceModal', this.sourceSelectionModal);
    this.sourceSelectionModal.show(selectedPaths);
  }

  public reset() {
    this.sourceSelectionModal.reset();
  }

  private handleTableChanged(tables: TableInfo[]) {
    try {
      this.tables = tables;
      const tableName: string | null = this.currentTableName || ListUtils.getHead(tables)?.tableName || null;
      this.selectTable(tableName);
      TrackingUtils.track(TrackEvents.LakeSchemaViewTable, { table_name: tableName });
    } catch (ex) {
      Log.error('handleTableChanged::error', ex);
    }
  }

  private selectTable(tableName: string | null | undefined) {
    if (tableName && this.currentTableName !== tableName) {
      this.updateRouter(tableName);
    }
  }

  private updateRouter(tableName: string) {
    RouterUtils.to(Routers.LakeHouseSchema, { replace: true, query: { tableName: tableName } });
  }

  private async initLakeSchema() {
    this.isLoading = true;
    await this.tableListing.handleLoadTables();
    this.isLoading = false;
  }

  private handleClickNode(node: SlTreeNode<TableSchema>, event: Event) {
    const tableName = node.data?.displayName;
    if (!node.isLeaf) {
      this.selectTable(tableName);
    }
  }

  private handleEditTable(tableInfo: TableInfo) {
    Log.debug('handleEditTable');
    this.tableCreationModal.edit(tableInfo);
  }

  @Track(TrackEvents.LakeSchemaSubmitDeleteTable, {
    table_id: (_: LakeSchema, args: any) => args[0]
  })
  private async handleDeleteTable(tableId: string) {
    try {
      this.isLoading = true;
      await this.tableService.action(TableAction.Drop, new DropTableRequest(tableId));
      const newTables = this.tables.filter(table => table.id !== tableId);
      const tableName = ListUtils.getHead(newTables)?.tableName ?? '';
      this.updateRouter(tableName);
      this.tableListing.renderTables(newTables);
    } catch (ex) {
      Log.error('handleDeleteTable::', ex);
      PopupUtils.showError(ex.message);
    } finally {
      this.isLoading = false;
    }
  }

  private showTableCreationModal() {
    this.tableCreationModal.create();
  }

  private handleSubmitTable(payload: { response: ParquetTableResponse; table: TableInfo; isEdit: boolean }) {
    this.tableCreationModal.hide();
    this.previewTableDataModal.show(payload);
  }

  private handleSubmitSourceSelectionModal(selectedSource: string[]) {
    this.sourceSelectionModal.hide();
    this.tableCreationModal.addSources(selectedSource);
  }

  private async handleTableCreated(tableInfo: TableInfo) {
    this.selectTable(tableInfo.tableName);
    await this.tableListing.handleLoadTables();
    this.tableSchemaInfo?.reload();
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.lake-schema {
  display: flex;
  flex-direction: row;
  height: 100%;
  padding: 0 24px 16px;

  &--left {
    background: var(--secondary);
    border-radius: 4px;
    flex: 1;
    min-width: 246px;
  }

  &--right {
    background: var(--secondary);
    border-radius: 4px;
    flex: 5;
    margin-left: 16px;
    min-height: 450px;
    min-width: 580px;
    overflow: auto;
  }
}
</style>
