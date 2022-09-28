/*
 * @author: tvc12 - Thien Vi
 * @created: 11/16/21, 3:50 PM
 */

import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import FormulaCompletionInput from '@/shared/components/FormulaCompletionInput/FormulaCompletionInput.vue';
import Editor from '@/screens/LakeHouse/Components/QueryBuilder/Editor.vue';
import DiButton from '@/shared/components/Common/DiButton.vue';
import DiIconTextButton from '@/shared/components/Common/DiIconTextButton.vue';
import DiButtonGroup, { ButtonInfo } from '@/shared/components/Common/DiButtonGroup.vue';
import DiTable from '@/shared/components/Common/DiTable/DiTable.vue';
import { Routers, Status } from '@/shared';
import EmptyWidget from '@/screens/DashboardDetail/components/WidgetContainer/charts/ErrorDisplay/EmptyWidget.vue';
import {
  CheckQueryResponse,
  CheckRequest,
  ExecuteQueryResponse,
  ExecuteRequest,
  Priority,
  QueryAction,
  QueryInfo,
  QueryResultResponse,
  QueryService,
  QueryState,
  ScheduleService,
  SparkQueryRequest,
  TableInfo
} from '@core/LakeHouse';
import { Log } from '@core/utils';
import { LakeHouseSchemaUtils } from '@core/LakeHouse/Utils/LakeHouseSchemaUtils';
import { HeaderData, Pagination, RowData } from '@/shared/models';
import { Inject } from 'typescript-ioc';
import { Modals } from '@/utils/modals';
import { TimeoutUtils } from '@/utils';
import { DIException } from '@core/domain';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import { PopupUtils } from '@/utils/popup.utils';
import { RouterUtils } from '@/utils/RouterUtils';
import { SparkFormulaController } from '@/shared/fomula/Spark/SparkFormulaController';
import { monaco } from 'monaco-editor-vue';
import { StringUtils } from '@/utils/string.utils';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { SQLJob } from '@core/LakeHouse/Domain/LakeJob/SQLJob';
import { LakeJob } from '@core/LakeHouse/Domain/LakeJob/LakeJob';
import SQLLakeJobConfigModal from '@/screens/LakeHouse/views/Job/ConfigModals/SQLLakeJobConfigModal.vue';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
import { EditorController } from '@/shared/fomula/EditorController';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({
  components: {
    EmptyWidget,
    DiTable,
    DiButtonGroup,
    DiIconTextButton,
    DiButton,
    Editor,
    FormulaCompletionInput,
    SQLLakeJobConfigModal,
    Split,
    SplitArea
  }
})
export default class LakeSQLQueryComponent extends Vue {
  private static DELAY_TIME = 1000;
  static readonly BytesPerRow = 128;
  private status = Status.Loaded;
  private msg = '';
  private query = '';
  private formulaController = new SparkFormulaController([]);
  private isShowDefault = true;
  private isExecutingQuery = false;
  private headers: HeaderData[] = [];
  private records: RowData[] = [];
  private total = 0;
  private currentQueryId: string | null = null;
  private resultPath: string | null = null;
  private queryState: QueryState | null = null;
  private from = 0;
  // size calculated in bytes
  private size = 20 * LakeSQLQueryComponent.BytesPerRow;
  private isShowJobModalConfig = false;
  private sqlCloneJob: SQLJob = SQLJob.create(this.query);

  private get isLoading(): boolean {
    return this.status === Status.Loading;
  }

  @Inject
  private readonly queryService!: QueryService;

  @Inject
  private readonly scheduleService!: ScheduleService;

  @Prop({ required: false, type: Array, default: [] })
  private readonly tables!: TableInfo[];

  @Prop({ required: false })
  private readonly queryInfo?: QueryInfo;

  @Prop({ required: false })
  private readonly job?: SQLJob;

  @Prop({ required: false })
  private readonly tableName?: string;

  @Prop({ required: true, type: Object })
  private readonly editorController!: EditorController;

  @Ref('result-element')
  private readonly resultElement!: HTMLDivElement;

  private get hasQuery() {
    return StringUtils.isNotEmpty(this.query);
  }

  @Watch('queryInfo', { immediate: true, deep: true })
  private onQueryInfoChanged(queryInfo: QueryInfo) {
    if (queryInfo && queryInfo.state === QueryState.SUCCEEDED) {
      Log.debug('onQueryInfoChanged::', queryInfo);
      this.currentQueryId = queryInfo.id;
      this.resultPath = queryInfo.resultPath;
      this.queryState = QueryState.SUCCEEDED;
      this.query = queryInfo.query;
      this.handleShowResult();
    }
  }

  @Watch('job', { immediate: true, deep: true })
  private onSQLJobChanged(sqlJob: SQLJob) {
    if (sqlJob) {
      Log.debug('onPeriodicQueryInfoChanged::', sqlJob);
      this.queryState = null;
      this.query = sqlJob.query;
      this.sqlCloneJob = sqlJob;
      this.handleTestQuery();
    } else {
      this.query = '';
      this.sqlCloneJob = SQLJob.create(this.query);
    }
  }

  @Watch('tables')
  private initFormulaController(tables: TableInfo[]) {
    this.formulaController.dispose();
    this.formulaController = new SparkFormulaController(tables ?? []);
    this.formulaController.init(monaco);
  }

  @Track(TrackEvents.LakeSqlJobBuilderView)
  mounted() {
    this.initFormulaController(this.tables);
  }

  @Watch('tableName', { immediate: true })
  private onTableNameChanged(tableName: string) {
    if (StringUtils.isEmpty(this.query) && StringUtils.isNotEmpty(tableName)) {
      this.query = `select * from ${FormulaUtils.escape(tableName)}`;
      this.handleTestQuery();
    }
  }

  private get isShowResult(): boolean {
    return this.queryState === QueryState.SUCCEEDED;
  }

  @Track(TrackEvents.LakeJobSQLTestQuery, {
    query: (_: LakeSQLQueryComponent) => _.query
  })
  private async handleTestQuery() {
    try {
      this.initQueryState();
      this.showLoading(true);
      const response: CheckQueryResponse = await this.queryService
        .action(QueryAction.Check, new CheckRequest(this.query))
        .then(resp => CheckQueryResponse.fromObject(resp));
      this.renderTable(response.outputFields, response.data, response.total);
      this.showLoading(false);
    } catch (ex) {
      Log.error('handleTestQuery::', ex);
      this.showError(ex.message);
    }
  }

  private renderTable(outputFields: string[], data: string[][], total: number) {
    const tableResponse = LakeHouseSchemaUtils.toTableResponse(outputFields, data, total);
    this.headers = tableResponse.headers;
    this.records = tableResponse.records;
    this.total = Math.floor(tableResponse.total / LakeSQLQueryComponent.BytesPerRow);
  }

  private showLoading(isLoading: boolean) {
    if (isLoading) {
      this.status = Status.Loading;
    } else {
      this.status = Status.Loaded;
    }
  }

  private showError(message: string) {
    this.status = Status.Error;
    this.msg = message;
  }

  @Track(TrackEvents.LakeJobSQLExecuteQuery, {
    query: (_: LakeSQLQueryComponent) => _.query
  })
  @AtomicAction({ timeUnlockAfterComplete: 100 })
  private async handleExecuteQuery() {
    try {
      this.isExecutingQuery = true;
      this.resetExecuteQueryResult();
      this.initQueryState();
      this.showLoading(true);
      const currentQueryId = await this.executeQuery(this.query);
      this.setQueryId(currentQueryId);
      await this.ensureExecuteSucceeded(currentQueryId);
      await this.viewResult(currentQueryId, this.from, this.size);
      this.showLoading(false);
    } catch (ex) {
      Log.error('handleExecuteQuery::', ex);
      this.showError(ex.message);
    } finally {
      this.isExecutingQuery = false;
    }
  }

  private confirmCancelExecuteQuery() {
    Modals.showConfirmationModal('Are you really want to cancel this query?', {
      onOk: () => this.handleCancelExecuteQuery(this.currentQueryId!)
    });
  }

  private async ensureExecuteSucceeded(queryId: string): Promise<void> {
    const response = await this.queryService.getQueryState(queryId);
    switch ((response.code as any) as QueryState) {
      case QueryState.RUNNING:
      case QueryState.WAITING:
        await TimeoutUtils.sleep(LakeSQLQueryComponent.DELAY_TIME);
        return this.ensureExecuteSucceeded(queryId);
      case QueryState.SUCCEEDED:
        return Promise.resolve();
      case QueryState.CANCELLED:
        return Promise.reject(new DIException('Execute Query Cancelled'));
      case QueryState.FAILED:
        return Promise.reject(new DIException('Execute Query Failed'));
      default:
        return Promise.reject(new DIException(response.msg ?? 'Execute Query Failed'));
    }
  }

  private async handleCancelExecuteQuery(queryId: string) {
    try {
      await this.queryService.action(QueryAction.Cancel, new SparkQueryRequest(queryId));
      this.currentQueryId = null;
      this.isExecutingQuery = false;
      this.isShowDefault = true;
    } catch (ex) {
      Log.error('handleCancelExecuteQuery::', ex);
      PopupUtils.showError(ex.message);
    }
  }

  private async executeQuery(query: string) {
    const request = new ExecuteRequest(query, Priority.Normal);
    const response = await this.queryService.action(QueryAction.Execute, request);
    const queryResponse = ExecuteQueryResponse.fromObject(response);
    return queryResponse.queryId;
  }

  private async viewResult(queryId: string, from?: number, size?: number) {
    const response: QueryResultResponse = await this.queryService.getQueryResult(queryId, from, size);
    this.renderTable(response.outputFields, response.data, response.total);
    this.resultPath = response.resultPath ?? null;
    this.queryState = QueryState.SUCCEEDED;
  }

  private async handleViewFileResult() {
    await RouterUtils.to(Routers.LakeExplorer, { query: { path: this.resultPath! } });
  }

  private async handleShowResult(from?: number, size?: number) {
    try {
      this.initQueryState();
      this.showLoading(true);
      await this.viewResult(this.currentQueryId!, from, size);
      this.showLoading(false);
    } catch (ex) {
      Log.error('handleShowResult::', ex);
      this.showError(ex.message);
    }
  }

  private initQueryState() {
    this.isShowDefault = false;
    this.from = 0;
    this.size = 20 * LakeSQLQueryComponent.BytesPerRow;
  }

  private resetExecuteQueryResult() {
    this.queryState = null;
    this.resultPath = null;
  }

  private setQueryId(queryId: string) {
    this.currentQueryId = queryId;
    this.$router.replace({
      query: {
        id: queryId
      }
    });
  }

  private calculatedHeight(isShowPagination: boolean) {
    if (isShowPagination) {
      // 40 is padding bottom
      return this.resultElement.clientHeight - 56 - 40;
    } else {
      return this.resultElement.clientHeight - 56;
    }
  }

  private onPageChanged(pagination: Pagination) {
    this.from = (pagination.page - 1) * pagination.rowsPerPage * LakeSQLQueryComponent.BytesPerRow;
    this.size = pagination.rowsPerPage * LakeSQLQueryComponent.BytesPerRow;
    this.handleLoadMore(this.from!, this.size!);
  }

  private async handleLoadMore(from: number, size: number) {
    try {
      this.initQueryState();
      this.status = Status.Updating;
      await this.viewResult(this.currentQueryId!, from, size);
      this.showLoading(false);
    } catch (ex) {
      Log.error('handleShowResult::', ex);
      this.showError(ex.message);
    }
  }

  private openJobModalConfig() {
    if (this.hasQuery || this.isLoading) {
      this.sqlCloneJob.query = this.query;
      this.isShowJobModalConfig = true;
    }
  }

  private handleAddJob() {
    try {
      this.openJobModalConfig();
    } catch (e) {
      Log.error(e);
    } finally {
      this.trackEventCreateOrEditSqlJob();
    }
  }
  private trackEventCreateOrEditSqlJob() {
    if (this.sqlCloneJob.isCreate) {
      TrackingUtils.track(TrackEvents.LakeCreateSQLJob, { query: this.query });
    } else {
      TrackingUtils.track(TrackEvents.LakeEditSQLJob, { query: this.sqlCloneJob.query, job_name: this.sqlCloneJob.name, job_id: this.sqlCloneJob.name });
    }
  }

  private get titleAddJob() {
    const isEditJob = !this.sqlCloneJob.isCreate;
    return isEditJob ? 'Edit Job' : 'Create Job';
  }

  private handleJobCreated() {
    RouterUtils.to(Routers.LakeJob);
  }
}
