import { Component, Emit, Inject, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import FormulaCompletionInput from '@/shared/components/formula-completion-input/FormulaCompletionInput.vue';
import { FormulaController } from '@/shared/fomula/FormulaController';
import {
  ChartInfo,
  DashboardId,
  DatabaseInfo,
  createQueryParameter,
  DIException,
  ExportType,
  InlineSqlView,
  ParamValueType,
  Position,
  QueryParameter,
  QueryRelatedWidget,
  QuerySetting,
  RawQuerySetting,
  TableChartOption,
  TableSchema,
  WidgetCommonData
} from '@core/common/domain';
import ChartHolder from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';
import { cloneDeep, get, isArray, isFunction, isObject, toNumber } from 'lodash';
import { StringUtils } from '@/utils/StringUtils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { Log } from '@core/utils';
import { QueryUtils } from '@/screens/data-management/views/query-editor/QueryUtils';
import { Pagination } from '@/shared/models/CustomCell';
import { ChartType, ContextMenuItem, DataBuilderConstantsV35, HorizontalScrollConfig, Status, VisualizationItemData } from '@/shared';
import VisualizeSelectionModal from '@/screens/chart-builder/config-builder/chart-selection-panel/VisualizeSelectionModal.vue';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { ChartInfoUtils, ChartUtils, ListUtils, PopupUtils } from '@/utils';
import ChartBuilderModal from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderModal.vue';
import VisualizationItem from '@/screens/chart-builder/config-builder/chart-selection-panel/VisualizationItem.vue';
import { ChartDataModule, DashboardControllerModule, QuerySettingModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import ChartBuilderComponent from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderComponent.vue';
import { BFormTextarea } from 'bootstrap-vue';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
import { SchemaService } from '@core/schema/service/SchemaService';
import { Inject as ioc } from 'typescript-ioc';
import Swal from 'sweetalert2';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { EditorController } from '@/shared/fomula/EditorController';
import { Track } from '@/shared/anotation/TrackingAnotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { AdhocBuilderConfig } from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderConfig';
import ParameterModal from '@/screens/data-management/components/ParameterModal.vue';
import ParamItem from '@/screens/data-management/components/ParamItem.vue';
import LoadingComponent from '@/shared/components/LoadingComponent.vue';
import { QueryEditorMode } from '@/screens/data-management/views/query-editor/QueryEditorMode';
import { DataManager } from '@core/common/services';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';

class AdHocAnalysisInfo {
  chartInfo: ChartInfo;

  get vizItem(): VisualizationItemData {
    const chartType = this.chartInfo.extraData?.currentChartType ?? ChartType.Table;
    return DataBuilderConstantsV35.ALL_ITEMS_AS_MAP.get(chartType)!;
  }

  get query(): string {
    return ListUtils.getHead(this.chartInfo.setting.sqlViews)?.query.query ?? '';
  }

  get rawQuery(): string {
    const rawQueryInOptions = this.chartInfo.setting.getChartOption()?.options.rawQuery;
    return rawQueryInOptions || this.query;
  }

  constructor(chartInfo: ChartInfo) {
    this.chartInfo = chartInfo;
  }
}

@Component({
  components: {
    LoadingComponent,
    ChartBuilderModal,
    FormulaCompletionInput,
    ChartHolder,
    VisualizeSelectionModal,
    EtlModal,
    VisualizationItem,
    ChartBuilderComponent,
    Split,
    SplitArea,
    ContextMenu,
    ParameterModal,
    ParamItem
  }
})
export default class QueryComponent extends Vue {
  protected readonly QUERY_PARAM_REGEX = new RegExp('{{\\s*\\w+\\s*}}', 'g');
  protected readonly queryModes = QueryEditorMode;
  protected readonly Statuses = Status;
  protected readonly horizontalScroll = {
    ...HorizontalScrollConfig,
    bar: {
      background: 'var(--scrollbar-background)',
      size: '3px',
      minSize: 0.25
    }
  };

  protected queryStatus = Status.Empty;
  protected errorMsg = '';
  protected isAddChartLoading = false;
  isSavingAdhocChart = false;
  protected query = '';
  protected disablePagination = false;

  protected listAdhocInfo: AdHocAnalysisInfo[] = [];
  parameters: QueryParameter[] = [];

  parameterValues: Map<string, any> = new Map();
  protected currentAdHocIndex = 0;
  protected readonly tableSchemaAsMap = new Map<string, TableSchema>();
  $alert!: typeof Swal;
  @Prop({ required: false, type: String, default: '' })
  protected tempQuery!: string;

  @Prop({ required: false, type: String, default: '' })
  protected readonly defaultQuery!: string;

  @Prop({ required: false, type: Boolean, default: true })
  protected readonly showCreateTableButton!: boolean;

  @Prop({ required: false, type: Object })
  protected readonly formulaController!: FormulaController;

  @Prop({ required: true, type: Object })
  protected readonly editorController!: EditorController;

  @Prop({ required: false, type: Function })
  protected convertor?: (query: string) => string;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly isQueryOnFirstTime!: boolean;

  @Prop({ required: false, type: Boolean, default: true })
  protected readonly showAdHocAnalysis!: boolean;

  @Prop({ required: false, type: Number, default: QueryEditorMode.Query })
  protected readonly mode!: QueryEditorMode;

  @Prop({ required: false, type: Boolean, default: true })
  protected readonly showParameter!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly isReadOnly!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly isEnableDownloadCsv!: boolean;

  @Ref()
  protected readonly formulaCompletionInput?: FormulaCompletionInput;

  @Ref()
  protected readonly chartBuilderComponent!: ChartBuilderComponent;

  @Ref()
  protected readonly contextMenu!: ContextMenu;

  @ioc
  protected readonly schemaService!: SchemaService;

  @Ref()
  protected readonly paramModal!: ParameterModal;

  @Inject({ from: 'preProcessQuery', default: undefined })
  protected readonly preProcessQuery?: (url: string) => Promise<string>;

  timeout: number | undefined = void 0;

  @Watch('defaultQuery')
  protected onDefaultQueryChanged(newValue: string) {
    Log.debug('Change query::', this.query, newValue);
    this.query = newValue;
  }

  protected get showAddChartButton(): boolean {
    Log.debug('showAddChartButton::', this.queryStatus === Status.Loaded, this.isMobile());
    return this.queryStatus === Status.Loaded && !this.isMobile();
  }

  protected isMobile() {
    return ChartUtils.isMobile();
  }

  @Watch('showParameter')
  onShowParamChanged() {
    if (!this.showParameter) {
      this.parameters = [];
      this.parameterValues = new Map();
    }
  }

  created() {
    this.query = this.defaultQuery;
    window.addEventListener('resize', this.resizeChart);
  }

  resizeChart() {
    this.$root.$emit(DashboardEvents.ResizeWidget, this.currentAdhocAnalysis.chartInfo.id);
  }

  getParamsSize(): number {
    return Object.entries(this.parameters).length;
  }

  mounted() {
    if (this.isQueryOnFirstTime && StringUtils.isNotEmpty(this.query)) {
      this.handleExecuteQuery();
    }
    this.trackEventAdhocMode();
  }

  protected trackEventAdhocMode() {
    switch (this.mode) {
      case QueryEditorMode.Dashboard: {
        TrackingUtils.track(TrackEvents.AdhocEditMode, { adhoc_id: this.$route.query?.adhoc });
        break;
      }
      case QueryEditorMode.Query:
        TrackingUtils.track(TrackEvents.AdhocCreateMode, {});
        break;
    }
  }

  get currentQuery(): string {
    return isFunction(this.convertor) ? this.convertor(this.query) : this.query;
  }

  protected onClickPlaceholder() {
    this.formulaCompletionInput?.focus();
  }

  @Track(TrackEvents.AdhocCreateTableFromQuery)
  @Emit('onCreateTable')
  protected emitCreateTable(event: Event) {
    return this.assignQueryParameter(this.currentQuery, this.parameters, this.parameterValues);
  }

  @Emit('onUpdateTable')
  protected emitUpdateTable(event: Event) {
    return this.currentQuery;
  }

  protected getSaveOptions(mouseEvent: MouseEvent): ContextMenuItem[] {
    return [
      {
        text: 'Create Table',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        hidden: this.isReadOnly || !AuthenticationModule.isLoggedIn || (this.showCreateTableButton && this.mode === QueryEditorMode.EditTable),
        click: () => {
          this.contextMenu.hide();
          return this.emitCreateTable(mouseEvent);
        }
      },
      {
        text: 'Download CSV',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        hidden: !this.isEnableDownloadCsv,
        click: () => {
          this.contextMenu.hide();
          return this.handleExport(this.currentAdhocAnalysis, ExportType.CSV);
        }
      },
      {
        text: 'Download Excel',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        hidden: !this.isEnableDownloadCsv,
        click: () => {
          this.contextMenu.hide();
          return this.handleExport(this.currentAdhocAnalysis, ExportType.XLSX);
        }
      },
      {
        text: 'Add Chart To Dashboard',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        hidden: this.isReadOnly || !AuthenticationModule.isLoggedIn,
        click: () => {
          this.contextMenu.hide();
          this.emitSaveAdhoc(mouseEvent, this.currentAdhocAnalysis.chartInfo);
        }
      },
      {
        text: 'Create Analysis',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        hidden: this.isReadOnly || !AuthenticationModule.isLoggedIn || this.mode !== QueryEditorMode.Dashboard,
        click: () => {
          this.contextMenu.hide();
          this.emitSaveQuery(mouseEvent, true);
        }
      }
    ];
  }

  showSaveOptions(event: MouseEvent) {
    const mouseEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'button-action', 64, 8);
    const options = this.getSaveOptions(event);
    this.showActionOptions(mouseEvent, options);
  }

  protected showActionOptions(event: Event, action: ContextMenuItem[]) {
    this.contextMenu.show(
      event,
      action.filter(option => !option.hidden)
    );
  }

  @Track(TrackEvents.SaveQueryToCurrentChart, {
    query: (_: QueryComponent, args: any) => _.query,
    chart_title: (_: QueryComponent, args: any) => args[1].name ?? 'Untitled chart',
    chart_type: (_: QueryComponent, args: any) => args[1].extraData?.currentChartType,
    chart_query: (_: QueryComponent, args: any) => _.currentAdhocAnalysis.query,
    chart_id: (_: ChartBuilderModal, args: any) => args[1].id
  })
  @Emit('onSaveAdhoc')
  protected emitSaveAdhoc(event: Event, chartInfo: ChartInfo) {
    Log.debug('event::emitSaveAdhoc', event);
    return { event: event, chart: chartInfo };
  }

  @Track(TrackEvents.AdhocSaveAnalysis, {
    chart_titles: (_: QueryComponent, args: any) => _.listAdhocInfo.map(adhoc => adhoc.chartInfo?.name ?? 'Untitled chart').join(','),
    chart_types: (_: QueryComponent, args: any) => _.listAdhocInfo.map(adhoc => adhoc.chartInfo.extraData?.currentChartType).join(','),
    chart_queries: (_: QueryComponent, args: any) => _.listAdhocInfo.map(adhoc => adhoc.query).join(',')
  })
  @Emit('onSaveQuery')
  protected emitSaveQuery(event: Event, saveAs: boolean) {
    return { mouseEvent: event, saveAs: saveAs };
  }

  @Track(TrackEvents.ExecuteQuery, { query: (_: QueryComponent) => _.query })
  async handleExecuteQuery(): Promise<void> {
    try {
      this.errorMsg = '';
      this.queryStatus = Status.Loading;
      const finalQuery: string = await this.getProcessedQuery();
      Log.debug('Query::handleQuery::finalQuery::', finalQuery);
      this.disablePagination = QueryUtils.isLimitQuery(finalQuery);
      const chart: ChartInfo =
        this.currentAdHocIndex === 0
          ? this.buildMainAdhocChart(StringUtils.fixCommentInSql(finalQuery), this.parameters)
          : this.buildAdhocChart(StringUtils.fixCommentInSql(finalQuery), this.parameters);
      const adhocInfo = new AdHocAnalysisInfo(chart);
      const pagination = this.disablePagination ? Pagination.defaultPagination() : void 0;
      await this.renderChart(adhocInfo.chartInfo, pagination);
      this.setAdHoc(adhocInfo, this.currentAdHocIndex);
      this.goToAdHoc(this.currentAdHocIndex);
      // if (isSelectAllText) {
      //   this.updateQuery(adhoc.query);
      // }
      this.$emit('query', this.query);
    } catch (e) {
      Log.error('Query::handleQuery::error::', e);
      this.queryStatus = Status.Error;
      this.errorMsg = e.message;
    }
  }

  protected async getProcessedQuery(): Promise<string> {
    const isSelectAllText = this.editorController.isSelectingAll();
    const query = isSelectAllText ? this.currentQuery : this.editorController.getSelectedText();
    return this.preProcessQuery ? await this.preProcessQuery(query) : query;
  }

  protected assignQueryParameter(query: string, params: QueryParameter[], paramValue: Map<string, string>) {
    let newQuery = cloneDeep(query);
    Log.debug('assignQueryParameter::', params);
    params.forEach(param => {
      const paramsKey = param.displayName;
      const regex = StringUtils.buildQueryParamRegex(paramsKey);
      const valueType = param?.valueType ?? ParamValueType.text;
      const value = paramValue.get(paramsKey) ?? param?.value ?? '';
      const normalizeValue = QuerySetting.formatParamValue(valueType, value);
      newQuery = newQuery.replaceAll(regex, normalizeValue);
    });
    return StringUtils.fixCommentInSql(newQuery);
  }

  protected async handleSave(event: Event) {
    switch (this.mode) {
      case QueryEditorMode.Dashboard: {
        this.handleClickSaveAnalysis(event);
        break;
      }
      case QueryEditorMode.EditTable: {
        this.emitUpdateTable(event);
        break;
      }
      case QueryEditorMode.Query: {
        this.handleClickSaveAnalysis(event);
        break;
      }
    }
  }

  goToAdHoc(index: number) {
    this.currentAdHocIndex = index;
    this.scrollTo(`viz-item-${index}`);
  }

  updateQuery(query: string) {
    this.query = query;
  }

  setAdHoc(adHocAnalysis: AdHocAnalysisInfo, index: number) {
    if (this.listAdhocInfo[index]) {
      this.$set(this.listAdhocInfo, index, adHocAnalysis);
    } else {
      this.listAdhocInfo.push(adHocAnalysis);
    }
  }

  protected getParameterNormalizeValues(params: QueryParameter[], paramValues: Map<string, any>): Record<string, string> {
    Log.debug('getParameterNormalizeValues::', params, paramValues);
    const result: Record<string, string> = {};
    const paramAsMap: Map<string, QueryParameter> = new Map(params.map(param => [param.displayName, param]));
    paramValues.forEach((value, key) => {
      const valueType: ParamValueType = paramAsMap.get(key)?.valueType ?? ParamValueType.text;
      result[key] = QuerySetting.formatParamValue(valueType, value);
    });
    return result;
  }

  protected buildMainAdhocChart(query: string, params: QueryParameter[]): ChartInfo {
    const id = get(this.listAdhocInfo, '[0].chartInfo.id', ChartInfoUtils.getNextId());
    const queryParams = this.getParameterNormalizeValues(params, this.parameterValues);
    const querySetting: QuerySetting = RawQuerySetting.fromQuery(query).withQueryParameters(queryParams);
    const defaultChartOption = TableChartOption.getDefaultChartOption();
    defaultChartOption.setOption('header.color', '#FFFFFF');
    defaultChartOption.setOption('queryParameter', params);
    defaultChartOption.setOption('rawQuery', query);
    querySetting.setChartOption(defaultChartOption);
    const commonSetting: WidgetCommonData = {
      id: id,
      name: '',
      description: '',
      extraData: {
        currentChartType: ChartType.Table
      }
    };
    Log.debug('buildMainAdhocChart::', querySetting);
    return new ChartInfo(commonSetting, querySetting);
  }

  protected buildAdhocChart(query: string, params: QueryParameter[]) {
    const cloneChartInfo: ChartInfo = cloneDeep(this.currentAdhocAnalysis.chartInfo);
    const aliasName = get(cloneChartInfo, `setting.sqlViews[0].aliasName`, '');
    const queryParams = this.getParameterNormalizeValues(params, this.parameterValues);
    cloneChartInfo.setting.withQueryParameters(queryParams);
    cloneChartInfo.setting.updateInlineView(aliasName, query);
    cloneChartInfo.setting.getChartOption()?.setOption('queryParameter', params);
    cloneChartInfo.setting.getChartOption()?.setOption('rawQuery', query);
    return cloneChartInfo;
  }

  protected async renderChart(chartInfo: ChartInfo, pagination?: Pagination, forceFetch = true): Promise<void> {
    this.queryStatus = Status.Loading;
    QuerySettingModule.setQuerySetting({ id: chartInfo.id, query: chartInfo.setting });
    await DashboardControllerModule.renderChart({ id: chartInfo.id, forceFetch: forceFetch, pagination: pagination });
    this.queryStatus = ChartDataModule.statuses[chartInfo.id];
    this.errorMsg = ChartDataModule.mapErrorMessage[chartInfo.id] ?? '';
  }

  scrollTo(id: string) {
    this.$nextTick(() => {
      const chartIcon = document.getElementById(id);
      chartIcon?.scrollIntoView({
        block: 'end',
        behavior: 'smooth'
      });
    });
  }

  @Track(TrackEvents.AdhocAddChart, { query: (_: QueryComponent) => _.query })
  protected async handleNewChart() {
    try {
      this.isAddChartLoading = true;
      const tableSchema = await this.getOrDetectAdhocTable(this.assignQueryParameter(this.currentQuery, this.parameters, this.parameterValues));
      const queryParams = this.getParameterNormalizeValues(this.parameters, this.parameterValues);
      this.chartBuilderComponent.showModal({
        selectedTables: [tableSchema.name],
        database: DatabaseInfo.adhoc(tableSchema),
        onCompleted: chartInfo => this.handleAddChart(chartInfo, StringUtils.fixCommentInSql(this.query), this.parameters, queryParams),
        config: AdhocBuilderConfig
      });
      this.isAddChartLoading = false;
    } catch (e) {
      Log.error('QueryComponent::handleNewChart::error::', e);
      this.isAddChartLoading = false;
      await this.$alert.fire({
        icon: 'error',
        title: 'Create ad-hoc analysis failure, try again later!',
        confirmButtonText: 'OK',
        showCancelButton: false
      });
    }
  }

  protected async getOrDetectAdhocTable(query: string, tblName?: string): Promise<TableSchema> {
    if (tblName && this.tableSchemaAsMap.has(tblName)) {
      return this.tableSchemaAsMap.get(tblName)!;
    } else {
      const tableSchema = await this.schemaService.detectTableSchema(query);
      tableSchema.name = tblName ?? tableSchema.name;
      this.tableSchemaAsMap.set(tableSchema.name, tableSchema);
      return tableSchema;
    }
  }

  @Track(TrackEvents.AdhocSelectChart, {
    chart_query: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].query,
    chart_title: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].chartInfo?.name ?? 'Untitled chart',
    chart_type: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].chartInfo?.extraData?.currentChartType,
    chart_id: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].chartInfo?.id
  })
  protected async handleSelectChart(index: number): Promise<void> {
    this.currentAdHocIndex = index;
    const selectedAdhoc: AdHocAnalysisInfo | undefined = this.listAdhocInfo[index];
    if (selectedAdhoc) {
      try {
        this.errorMsg = '';
        this.query = selectedAdhoc.rawQuery;
        this.disablePagination = QueryUtils.isLimitQuery(selectedAdhoc.rawQuery);
        this.setParameters(selectedAdhoc.chartInfo.setting.getChartOption()?.options.queryParameter);
        await this.renderChart(selectedAdhoc.chartInfo, void 0, false);
      } catch (ex) {
        Log.error('QueryComponent::handleSelectChart::error::', ex);
        this.errorMsg = ex.message;
        this.queryStatus = Status.Error;
      }
    }
  }

  get currentAdhocAnalysis(): AdHocAnalysisInfo {
    return this.listAdhocInfo[this.currentAdHocIndex];
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.resizeChart);
  }

  protected getVizItem(chartType: ChartType): VisualizationItemData | null {
    return DataBuilderConstantsV35.ALL_ITEMS_AS_MAP.get(chartType) ?? null;
  }

  @Track(TrackEvents.AdhocConfigChart, {
    chart_query: (_: QueryComponent, args: any) => _.currentAdhocAnalysis.query,
    chart_title: (_: QueryComponent, args: any) => _.currentAdhocAnalysis.chartInfo?.name ?? 'Untitled chart',
    chart_type: (_: QueryComponent, args: any) => _.currentAdhocAnalysis.chartInfo?.extraData?.currentChartType,
    chart_id: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].chartInfo?.id
  })
  protected async handleClickEditChart() {
    try {
      this.isAddChartLoading = true;
      const inlineViews: InlineSqlView[] = this.currentAdhocAnalysis.chartInfo.setting.sqlViews;
      const currentView: InlineSqlView = ListUtils.getHead(inlineViews)!;
      const tableSchema: TableSchema = await this.getOrDetectAdhocTable(
        this.assignQueryParameter(this.currentQuery, this.parameters, this.parameterValues),
        currentView.aliasName
      );
      Log.debug('Selected Table::', tableSchema.name);

      this.chartBuilderComponent.showModal({
        chart: this.currentAdhocAnalysis.chartInfo,
        selectedTables: [tableSchema.name],
        database: DatabaseInfo.adhoc(tableSchema),
        onCompleted: this.handleEditChart,
        config: AdhocBuilderConfig
      });
      this.isAddChartLoading = false;
    } catch (e) {
      Log.error('QueryComponent::handleClickEditChart::error::', e);
      this.isAddChartLoading = false;
      await this.$alert.fire({
        icon: 'error',
        title: 'Edit ad-hoc analysis failure, try again later!',
        confirmButtonText: 'OK',
        showCancelButton: false
      });
    }
  }

  @Track(TrackEvents.AdhocDeleteChart, {
    chart_query: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].query,
    chart_type: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].chartInfo?.extraData?.currentChartType,
    chart_title: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].chartInfo?.name ?? 'Untitled chart',
    chart_id: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].chartInfo?.id
  })
  protected async handleDeleteAdhocAnalysis(index: number) {
    try {
      ///Call Api delete widget if is in Dashboard mode
      if (this.mode == QueryEditorMode.Dashboard) {
        await WidgetModule.handleDeleteWidget(this.listAdhocInfo[index]!.chartInfo);
      }
      ///
      const nextChart = this.listAdhocInfo[index + 1];
      const previousChart = this.listAdhocInfo[index - 1];
      //remove item at index
      this.listAdhocInfo = ListUtils.removeAt(this.listAdhocInfo, index);
      const selectedChart = nextChart ?? previousChart;
      if (selectedChart) {
        const index = this.listAdhocInfo.indexOf(selectedChart);
        this.handleSelectChart(index);
      } else {
        this.currentAdHocIndex = 0;
        this.query = '';
      }
    } catch (e) {
      Log.error('QueryComponent::handleDeleteAdhocAnalysis::Error::', e);
    }
  }

  @Track(TrackEvents.AdhocSubmitConfigChart, {
    chart_query: (_: QueryComponent, args: any) => _.currentAdhocAnalysis.query,
    chart_type: (_: QueryComponent, args: any) => _.currentAdhocAnalysis.chartInfo?.extraData?.currentChartType,
    chart_title: (_: QueryComponent, args: any) => args[0].chartInfo?.name ?? 'Untitled chart',
    chart_id: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].chartInfo?.id
  })
  async handleEditChart(chartInfo: ChartInfo) {
    try {
      const adhoc = new AdHocAnalysisInfo(chartInfo.copyWithId(this.currentAdhocAnalysis.chartInfo.id));
      this.setAdHoc(adhoc, this.currentAdHocIndex);
      this.updateQuery(adhoc.rawQuery);
      this.goToAdHoc(this.currentAdHocIndex);
      await this.renderChart(adhoc.chartInfo);
      this.$emit('onUpdateChart', adhoc.chartInfo);
    } catch (e) {
      Log.debug('QueryComponent::handleEditChart::Error::', e);
    }
  }

  @Track(TrackEvents.AdhocSubmitAddChart, {
    chart_query: (_: QueryComponent, args: any) => _.query,
    chart_title: (_: QueryComponent, args: any) => args[0].chartInfo?.name ?? 'Untitled chart',
    chart_type: (_: QueryComponent, args: any) => args[0].chartInfo?.extraData?.currentChartType,
    chart_id: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].chartInfo?.id
  })
  async handleAddChart(chartInfo: ChartInfo, currentQuery: string, params: QueryParameter[], paramsValue: Record<string, any>) {
    try {
      const analysisInfo = await this.createWidget(this.buildAddAdhocAnalysis(chartInfo, currentQuery, params, paramsValue));
      this.setAdHoc(analysisInfo, this.listAdhocInfo.length);
      this.updateQuery(analysisInfo.rawQuery);
      this.goToAdHoc(this.listAdhocInfo.length - 1);
      await this.renderChart(analysisInfo.chartInfo);
    } catch (e) {
      Log.error('QueryComponent::handleAddChart::error::', e);
    }
  }

  ///return null not have id in router
  protected get queryDashboardId(): DashboardId | null {
    return toNumber(this.$route.query.adhoc) || null;
  }

  protected validDashboard() {
    const dashboardId = this.queryDashboardId;
    if (!dashboardId) {
      PopupUtils.showError('Analysis Not Found!');
      throw new DIException('Analysis Not Found!');
    }
  }

  protected async createWidget(adhoc: AdHocAnalysisInfo): Promise<AdHocAnalysisInfo> {
    if (this.mode === QueryEditorMode.Dashboard) {
      this.validDashboard();
      const widgetCreated = await WidgetModule.handleCreateNewWidget({
        widget: adhoc.chartInfo,
        position: Position.default(),
        dashboardId: this.queryDashboardId!
      });
      return new AdHocAnalysisInfo(widgetCreated as ChartInfo);
    } else {
      return adhoc;
    }
  }

  protected buildAddAdhocAnalysis(
    chartInfo: ChartInfo,
    currentQuery: string,
    params: QueryParameter[],
    paramsValue: Record<string, string>
  ): AdHocAnalysisInfo {
    const newChartInfo = chartInfo.copyWithId(ChartInfoUtils.getNextId());
    const defaultChartOption = newChartInfo.setting.getChartOption() || TableChartOption.getDefaultChartOption();
    defaultChartOption.setOption('queryParameter', params);
    defaultChartOption.setOption('rawQuery', currentQuery);
    newChartInfo.setting.setChartOption(defaultChartOption);
    const aliasName: string = ListUtils.getHead(newChartInfo.setting.sqlViews)?.aliasName ?? '';
    newChartInfo.setting.updateInlineView(aliasName, currentQuery);
    newChartInfo.setting.withQueryParameters(paramsValue);
    return new AdHocAnalysisInfo(newChartInfo);
  }

  get allChartInfos(): ChartInfo[] {
    return this.listAdhocInfo.map(adhocChart => adhocChart.chartInfo);
  }

  setWidgets(widgets: QueryRelatedWidget[]) {
    this.listAdhocInfo = widgets
      .filter((widget): widget is ChartInfo => ChartInfo.isChartInfo(widget))
      .map(chart => {
        return new AdHocAnalysisInfo(chart);
      });
  }

  setParameters(params: QueryParameter[] | Record<string, QueryParameter> | undefined | null) {
    if (isArray(params)) {
      Log.debug('setParameters::', params);
      this.parameters = params;
    } else if (isObject(params)) {
      ///Get value (Type QueryParameter) in Object, map it to List
      this.parameters = Object.values(params);
    } else {
      this.parameters = [];
    }
    this.parameterValues = new Map(this.parameters.map(param => [param.displayName, param.value]));
    this.$forceUpdate();
  }

  selectChart(index: number) {
    if (index <= this.listAdhocInfo.length - 1) {
      this.onClickPlaceholder();
      this.handleSelectChart(index);
      //hard code to fix status
      this.queryStatus = ChartDataModule.statuses[this.listAdhocInfo[index].chartInfo.id];
    }
  }

  protected get showSaveQueryButton(): boolean {
    return this.mode !== QueryEditorMode.EditTable;
  }

  protected handleClickSaveAnalysis(event: Event) {
    const mouseEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'button-save-adhoc', 0, 8);
    const isSaveAs = this.mode === QueryEditorMode.Query;
    this.emitSaveQuery(mouseEvent, isSaveAs);
  }

  protected onAddParam(index: number): void {
    const paramName = `untitled_param_${index}`;
    const param: QueryParameter | undefined = this.parameters.find(param => param.displayName === paramName);
    if (param) {
      this.onAddParam(index + 1);
      return;
    } else {
      const parameter: QueryParameter = createQueryParameter();
      parameter.displayName = paramName;
      this.setParameter(parameter);
      const paramSQLSyntax = ` {{ ${paramName} }}`;
      this.editorController.multiAppendText(paramSQLSyntax, true);
      if (this.mode === QueryEditorMode.Dashboard) {
        this.emitSaveQuery(new Event(''), false);
      }
      return;
    }
  }

  setParameter(parameter: QueryParameter, index?: number): void {
    if (index !== undefined) {
      this.parameters.splice(index, 0, parameter);
    } else {
      this.parameters.push(parameter);
    }
    this.parameterValues.set(parameter.displayName, parameter.value);
    this.$forceUpdate();
  }

  protected onConfigParam(event: MouseEvent, param: QueryParameter, currentValue: any) {
    const target = `action-${param.displayName}`;
    const mouseEvent = HtmlElementRenderUtils.fixMenuOverlap(event, target, 0, 8);
    const options = this.getParamOptions(param, currentValue);
    this.showActionOptions(mouseEvent, options);
  }

  protected getParamOptions(param: QueryParameter, currentValue: any): ContextMenuItem[] {
    return [
      {
        text: 'Edit',
        click: () => {
          this.contextMenu.hide();
          this.editParam(param);
        }
      },
      {
        text: 'Set Value as Default',
        hidden: param.value === currentValue,
        click: () => {
          this.contextMenu.hide();
          const paramIndex = this.parameters.findIndex(target => param.displayName === target.displayName);
          if (paramIndex >= 0) {
            this.parameters[paramIndex].value = currentValue;
            if (this.mode === QueryEditorMode.Dashboard) {
              this.emitSaveQuery(new Event(''), false);
            }
          }
        }
      },
      {
        text: 'Delete',
        click: async () => {
          this.contextMenu.hide();
          const { isConfirmed } = await this.showEnsureModal(
            'Delete Parameter',
            `Are you sure that you want to remove this parameter ${param.displayName}?`,
            'Yes',
            'No'
          );
          if (isConfirmed) {
            this.deleteParam(param, deletedParam => this.replaceParamInQuery(deletedParam, ''));
          }
        }
      }
    ];
  }

  protected onQueryChanged() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      Log.debug('QueryComponent::query', this.query);
      const paramRegex = this.QUERY_PARAM_REGEX;
      const params: RegExpMatchArray | null = this.query.match(paramRegex);
      const unUsedParamKeys = this.getQueryParamsNotUse(this.query, this.parameters);
      if (ListUtils.isNotEmpty(unUsedParamKeys)) {
        this.deleteMultiParams(unUsedParamKeys, false);
      }
      this.buildQueryParams(params ?? []);
    }, 1000);
  }

  protected buildQueryParams(params: RegExpMatchArray) {
    params.forEach(param => {
      ///{{ value test}} -> value_test
      const paramName = param
        .replaceAll('{{', '')
        .replaceAll('}}', '')
        .trim();
      const parameter = this.parameters.find(target => target.displayName === paramName);
      ///Create if not exist param
      if (parameter) {
        return;
      } else {
        const currentValue = this.parameterValues.get(paramName);
        Log.debug('buildQueryParams::', this.parameterValues);
        const queryParam: QueryParameter = {
          displayName: paramName,
          valueType: ParamValueType.text,
          value: currentValue !== undefined ? currentValue : '',
          list: null
        };
        this.setParameter(queryParam);
      }
    });
  }

  protected getQueryParamsNotUse(query: string, queryParams: QueryParameter[]): string[] {
    const result: string[] = [];
    const allParamKeys = queryParams.map(param => param.displayName);
    allParamKeys.forEach(paramKey => {
      const regex = StringUtils.buildQueryParamRegex(paramKey);
      if (!this.query.match(regex)) {
        result.push(paramKey);
      }
    });
    return result;
  }

  protected async updateParamValue(paramKey: string, value: any) {
    this.parameterValues.set(paramKey, value);
    this.$forceUpdate();
    return this.handleExecuteQuery();
  }

  protected editParam(param: QueryParameter) {
    const oldName = param.displayName;
    // const oldValue = param.value;
    this.paramModal.show(param, async (edited: QueryParameter) => {
      const indexOfOldParam = this.parameters.findIndex(target => target.displayName === oldName);
      this.deleteParam(param);
      this.setParameter(edited, indexOfOldParam);
      this.replaceParamInQuery(param, `{{ ${edited.displayName} }}`);
      if (param.value !== edited.value) {
        await this.handleExecuteQuery();
      }
      if (this.mode === QueryEditorMode.Dashboard) {
        this.emitSaveQuery(new Event(''), false);
      }
    });
  }

  protected replaceParamInQuery(param: QueryParameter, value: string) {
    const regex = StringUtils.buildQueryParamRegex(param.displayName);
    this.query = this.query.replaceAll(regex, value);
  }

  protected deleteMultiParams(paramKeys: string[], deleteCurrentValue: boolean) {
    paramKeys.forEach(key => {
      this.parameters = ListUtils.remove(this.parameters, param => param.displayName === key);
      // delete this.parameterValues[key];
    });
    this.$forceUpdate();
    if (this.mode === QueryEditorMode.Dashboard) {
      this.emitSaveQuery(new Event(''), false);
    }
  }

  protected deleteParam(param: QueryParameter, onDeleted?: (param: QueryParameter) => void) {
    this.parameters = ListUtils.remove(this.parameters, taget => taget.displayName === param.displayName);
    this.$forceUpdate();
    if (this.mode === QueryEditorMode.Dashboard) {
      this.emitSaveQuery(new Event(''), false);
    }
    onDeleted ? onDeleted(param) : void 0;
    this.$emit('delete', param);
  }

  protected async showEnsureModal(title: string, html: string, confirmButtonText?: string, cancelButtonText?: string) {
    //@ts-ignore
    return this.$alert.fire({
      icon: 'warning',
      title: title,
      html: html,
      confirmButtonText: confirmButtonText ?? 'Yes',
      showCancelButton: true,
      cancelButtonText: cancelButtonText ?? 'No'
    });
  }

  protected get titleSaveAnalysis(): string {
    switch (this.mode) {
      case QueryEditorMode.Dashboard:
        return this.tempQuery !== this.currentQuery ? 'Save*' : 'Save';
      default:
        return 'Save Analysis';
    }
  }

  getQuery() {
    return this.buildMainAdhocChart(this.query, this.parameters);
  }

  protected async handleExport(adhoc: AdHocAnalysisInfo, type: ExportType) {
    const id: number = adhoc.chartInfo.id;
    await DashboardControllerModule.handleExport({ widgetId: id, type: type });
  }

  protected get isTestAccount(): boolean {
    return DataManager.isTestAccount();
  }
}
