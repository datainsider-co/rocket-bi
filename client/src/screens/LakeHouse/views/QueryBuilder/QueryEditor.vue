<template>
  <Split :gutterSize="16" class="d-flex">
    <SplitArea :size="panelSize[0]" :minSize="0">
      <LakeTableListing
        ref="tableListing"
        :default-tbl-name-expanded="tableName"
        class="lake-query-editor--left"
        @createTable="showTableCreationModal"
        @onTablesChanged="handleTablesChanged"
        @clickField="handleClickField"
        @hook:mounted="initQueryBuilder"
      />
    </SplitArea>
    <SplitArea :size="panelSize[1]" :minSize="0">
      <div class="lake-query-editor--right ml-0 h-100">
        <!--      <LakeQueryComponent :periodicQueryInfo="periodicQueryInfo" :queryInfo="queryInfo" :tableName="tableName" :tables="tables"></LakeQueryComponent>-->
        <div class="runner-button">
          <DiButtonGroup :buttons="buttonInfos"></DiButtonGroup>
        </div>
        <router-view
          :job="job"
          :editorController="editorController"
          :queryInfo="queryInfo"
          :tableName="tableName"
          :tables="tables"
          class="query-editor-child"
        />
      </div>
      <TableCreationModal ref="tableCreationModal" @cancel="reset" @clickAddSource="showAddSourceModal" @submit="handleSubmitTable" />
      <SourceSelectionModal ref="sourceSelectionModal" @submit="handleSubmitSourceSelectionModal" />
      <PreviewTableDataModal ref="previewTableDataModal" @created="handleTableCreated" @onBack="handleEditTable" />
    </SplitArea>
  </Split>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Mixins } from 'vue-property-decorator';
import LakeTableListing from '@/screens/LakeHouse/Components/QueryBuilder/LakeTableListing.vue';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import LakeQueryComponent from '@/screens/LakeHouse/Components/QueryBuilder/LakeSQLQueryComponent.vue';
import { ParquetTableResponse, PeriodicQueryInfo, QueryInfo, QueryService, ScheduleService, TableInfo } from '@core/LakeHouse';
import { Inject } from 'typescript-ioc';
import { Log } from '@core/utils';
import DiButtonGroup, { ButtonInfo } from '@/shared/components/Common/DiButtonGroup.vue';
import { Routers } from '@/shared';
import { LakeJob } from '@core/LakeHouse/Domain/LakeJob/LakeJob';
import { LakeJobService } from '@core/LakeHouse/Service/LakeJobService';
import { toNumber } from 'lodash';
import { RouterUtils } from '@/utils/RouterUtils';
import { Breadcrumbs } from '@/shared/models';
import TableCreationModal from '@/screens/LakeHouse/Components/TableCreationModal.vue';
import SourceSelectionModal from '@/screens/LakeHouse/Components/SourceSelectionModal.vue';
import PreviewTableDataModal from '@/screens/LakeHouse/Components/PreviewTableDataModal.vue';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
import SplitPanelMixin from '@/shared/components/LayoutWrapper/SplitPanel.mixin';
import { Field } from '@core/domain';
import { EditorController } from '@/shared/fomula/EditorController';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';

@Component({
  components: {
    LakeQueryComponent,
    StatusWidget,
    LakeTableListing,
    DiButtonGroup,
    TableCreationModal,
    SourceSelectionModal,
    PreviewTableDataModal,
    Split,
    SplitArea
  }
})
export default class QueryEditor extends Mixins(SplitPanelMixin) {
  @Prop()
  job!: LakeJob | null;
  private tables: TableInfo[] = [];
  private queryInfo: QueryInfo | null = null;
  // private job: LakeJob | null = null;
  private periodicQueryInfo: PeriodicQueryInfo | null = null;
  private editorController = new EditorController();

  @Ref()
  private tableListing!: LakeTableListing;
  @Inject
  private readonly queryService!: QueryService;
  @Inject
  private readonly scheduleService!: ScheduleService;
  @Inject
  private readonly lakeJobService!: LakeJobService;
  @Ref()
  private readonly tableCreationModal!: TableCreationModal;

  @Ref()
  private readonly sourceSelectionModal!: SourceSelectionModal;

  @Ref()
  private readonly previewTableDataModal!: PreviewTableDataModal;

  private get queryId(): string | null {
    return (this.$route.query.id as any) ?? null;
  }

  private get activeJavaButtonInfo() {
    return this.$route.name === Routers.LakeJar;
  }

  private get activeSqlButtonInfo() {
    return this.$route.name === Routers.LakeSqlQueryEditor;
  }

  private get schedulerId(): string | null {
    return (this.$route.query.schedulerId as any) ?? null;
  }

  private get panelSize() {
    return this.getPanelSizeHorizontal();
  }

  /**
   * Thứ tự ưu tiên SchedulerID => QueryId => TableName
   */
  private get tableName(): string | null {
    const tableName = (this.$route.query.tableName as any) ?? null;
    if (this.schedulerId) {
      return null;
    } else if (this.queryId) {
      return null;
    } else {
      return tableName;
    }
  }

  private get buttonInfos(): ButtonInfo[] {
    return [
      { displayName: 'SQL', isActive: this.activeSqlButtonInfo, onClick: this.handleSelectSqlRunner },
      { displayName: 'Java', isActive: this.activeJavaButtonInfo, onClick: this.handleSelectJavaRunner }
      // { displayName: 'Python', onClick: this.handleSelectPythonRunner }
    ];
  }

  public reset() {
    this.sourceSelectionModal.reset();
  }

  showAddSourceModal(selectedPaths: string[]) {
    //show add source modal
    Log.debug('handleShowAddSourceModal', this.sourceSelectionModal);
    this.sourceSelectionModal.show(selectedPaths);
  }

  private async initQueryBuilder() {
    await this.tableListing.handleLoadTables();
    await this.handleLoadOutputs();
    if (this.schedulerId) {
      // await this.handleLoadLakeJob(this.schedulerId!);
    } else if (this.queryId) {
      await this.handleLoadQueryInfo(this.queryId);
    }
  }

  private async handleLoadOutputs() {
    //TODO: add function here
  }

  private async handleLoadQueryInfo(queryId: string) {
    try {
      const response = await this.queryService.getQueryInfo(queryId);
      this.queryInfo = response.data ?? null;
    } catch (ex) {
      Log.error('handleLoadQueryInfo::', ex);
    }
  }

  private async handleLoadLakeJob(queryId: string) {
    try {
      //todo: get job
      // const response = await this.scheduleService.getPeriodicQueryInfo(queryId);
      //   this.periodicQueryInfo = response.data ?? null;
      const lakeJobInfo = await this.lakeJobService.get(toNumber(queryId));
      this.job = lakeJobInfo.job;
      if (this.job) {
        this.$emit('breadcrumbChange', [new Breadcrumbs({ text: this.job.name, to: '#' })]);
      }
    } catch (ex) {
      Log.error('handleLoadPeriodicQueryInfo::', ex);
    }
  }

  private handleTablesChanged(tables: TableInfo[]) {
    this.tables = tables;
  }

  private handleSelectJavaRunner() {
    RouterUtils.to(Routers.LakeJar);
  }

  private handleSelectSqlRunner() {
    RouterUtils.to(Routers.LakeSqlQueryEditor);
  }

  private handleSelectPythonRunner() {
    RouterUtils.to(Routers.LakePythonQueryEditor);
  }

  private handleSubmitSourceSelectionModal(selectedSource: string[]) {
    this.sourceSelectionModal.hide();
    this.tableCreationModal.addSources(selectedSource);
  }

  private handleSubmitTable(payload: { response: ParquetTableResponse; table: TableInfo; isEdit: boolean }) {
    this.tableCreationModal.hide();
    this.previewTableDataModal.show(payload);
  }
  private async handleTableCreated(tableInfo: TableInfo) {
    await this.tableListing.handleLoadTables();
  }

  private showTableCreationModal() {
    this.tableCreationModal.create();
  }

  private handleEditTable(tableInfo: TableInfo) {
    this.tableCreationModal.edit(tableInfo);
  }

  private handleClickField(field: Field) {
    const query = FormulaUtils.toQuery(field.tblName, field.fieldName);
    this.editorController.appendText(query);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.lake-query-editor {
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
    display: flex;
    flex-direction: column;
    flex: 5;
    margin-left: 16px;
    //overflow: auto;
    //min-width: 580px;
    //min-height: 300px;
    border-radius: 4px;

    .status-loading {
      border-radius: 4px;
    }

    .runner-button {
      background: var(--secondary);
      text-align: left;
      padding-left: 16px;
      padding-top: 12px;
    }

    .query-editor-child {
      display: flex;
      flex: 1;

      .lake-query-component--editor {
        border-top-right-radius: 0;
        border-top-left-radius: 0;
      }
    }
  }
}
</style>
