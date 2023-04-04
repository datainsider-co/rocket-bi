import { Component, Emit, Inject, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import FormulaCompletionInput from '@/shared/components/formula-completion-input/FormulaCompletionInput.vue';
import { FormulaController } from '@/shared/fomula/FormulaController';
import {
  ChartInfo,
  DashboardId,
  DatabaseSchema,
  defaultQueryParameter,
  DIException,
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
import { cloneDeep, get, isFunction, toNumber } from 'lodash';
import { StringUtils } from '@/utils/StringUtils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { Log, UrlUtils } from '@core/utils';
import { QueryUtils } from '@/screens/data-management/views/query-editor/QueryUtils';
import { Pagination } from '@/shared/models/CustomCell';
import { ChartType, ContextMenuItem, DataBuilderConstantsV35, HorizontalScrollConfig, Status, VisualizationItemData } from '@/shared';
import VisualizeSelectionModal from '@/screens/chart-builder/config-builder/chart-selection-panel/VisualizeSelectionModal.vue';
import ChartBuilder from '@/screens/chart-builder/data-cook/ChartBuilder.vue';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { ChartInfoUtils, ChartUtils, ListUtils, PopupUtils } from '@/utils';
import ChartBuilderModal from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderModal.vue';
import VisualizationItem from '@/screens/chart-builder/config-builder/chart-selection-panel/VisualizationItem.vue';
import { _ChartStore, DashboardControllerModule, QuerySettingModule, WidgetModule } from '@/screens/dashboard-detail/stores';
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
import { ParameterToChartResolverBuilder } from '@/screens/data-management/components/parameter-to-chart-builder/ParameterToChartResolverBuilder';
import { ParameterToChartResolver } from '@/screens/data-management/components/parameter-to-chart-builder/ParameterToChartResolver';
import { TextParamToChartHandler } from '@/screens/data-management/components/parameter-to-chart-builder/TextParamToChartHandler';

class AdHocAnalysisInfo {
  chartInfo: ChartInfo;

  get vizItem(): VisualizationItemData {
    const chartType = this.chartInfo.extraData?.currentChartType ?? ChartType.Table;
    return DataBuilderConstantsV35.ALL_ITEMS_AS_MAP.get(chartType)!;
  }

  get query(): string {
    return ListUtils.getHead(this.chartInfo.setting.sqlViews)?.query.query ?? '';
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
    ChartBuilder,
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
  private static readonly TEST_ACCOUNT = 'bot@datainsider.co';
  private readonly QUERY_PARAM_REGEX = new RegExp('{{\\s*\\w+\\s*}}', 'g');
  private readonly queryModes = QueryEditorMode;
  private readonly Statuses = Status;
  private readonly horizontalScroll = {
    ...HorizontalScrollConfig,
    bar: {
      background: 'var(--scrollbar-background)',
      size: '3px',
      minSize: 0.25
    }
  };

  private queryStatus = Status.Empty;
  private errorMsg = '';
  private isAddChartLoading = false;
  isSavingAdhocChart = false;
  private query = '';
  private disablePagination = false;

  private listAdhocInfo: AdHocAnalysisInfo[] = [];
  parameters: Record<string, QueryParameter> = {};

  private parameterValues: Record<string, any> = {};
  private currentAdHocIndex = 0;
  private readonly tableSchemaAsMap = new Map<string, TableSchema>();
  $alert!: typeof Swal;
  @Prop({ required: false, type: String, default: '' })
  private tempQuery!: string;

  @Prop({ required: false, type: String, default: '' })
  private readonly defaultQuery!: string;

  @Prop({ required: false, type: Boolean, default: true })
  private readonly showCreateTableButton!: boolean;

  @Prop({ required: false, type: Object })
  private readonly formulaController!: FormulaController;

  @Prop({ required: true, type: Object })
  private readonly editorController!: EditorController;

  @Prop({ required: false, type: Function })
  private convertor?: (query: string) => string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isQueryOnFirstTime!: boolean;

  @Prop({ required: false, type: Boolean, default: true })
  private readonly showAdHocAnalysis!: boolean;

  @Prop({ required: false, type: Number, default: QueryEditorMode.Query })
  private readonly mode!: QueryEditorMode;

  @Prop({ required: false, type: Boolean, default: true })
  private readonly showParameter!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isReadOnly!: boolean;

  @Ref()
  private readonly formulaCompletionInput?: FormulaCompletionInput;

  @Ref()
  private chartHolder?: ChartHolder;

  @Ref()
  private readonly chartBuilderComponent!: ChartBuilderComponent;

  @Ref()
  private readonly actionRow!: HTMLDivElement;

  @Ref()
  private readonly formulaInputPlaceholder?: BFormTextarea;

  @Ref()
  private readonly contextMenu!: ContextMenu;

  @ioc
  private readonly schemaService!: SchemaService;
  @ioc
  private readonly dataManager!: DataManager;

  @Ref()
  private readonly paramModal!: ParameterModal;

  @Inject({ from: 'preProcessQuery', default: undefined })
  private readonly preProcessQuery?: (url: string) => Promise<string>;

  timeout: number | undefined = void 0;

  @Watch('defaultQuery')
  private onDefaultQueryChanged(newValue: string) {
    Log.debug('Change query::', this.query, newValue);
    this.query = newValue;
  }

  private get showAddChartButton(): boolean {
    Log.debug('showAddChartButton::', this.queryStatus === Status.Loaded, this.isMobile());
    return this.queryStatus === Status.Loaded && !this.isMobile();
  }

  private get isLimitQuery() {
    return QueryUtils.isLimitQuery(this.query);
  }

  private charHolderContainerHeight() {
    Log.debug('actionRow::', this.actionRow.clientHeight);
    return this.actionRow.clientHeight + 16 + this.queryEditorHeight() + 16 + 16;
  }

  private queryEditorHeight() {
    return this.formulaCompletionInput?.$el.clientHeight ?? this.formulaInputPlaceholder?.$el.clientHeight ?? 0;
  }

  private isMobile() {
    return ChartUtils.isMobile();
  }

  @Watch('showParameter')
  onShowParamChanged() {
    if (!this.showParameter) {
      this.parameters = {};
      this.parameterValues = {};
    }
  }

  created() {
    this.query = this.defaultQuery;
    window.addEventListener('resize', this.resizeChart);
  }

  resizeChart() {
    this.$root.$emit(DashboardEvents.ResizeWidget, this.currentAdhocAnalysis.chartInfo.id);
  }

  getLengthOfParams() {
    return Object.entries(this.parameters).length;
  }

  mounted() {
    if (this.isQueryOnFirstTime && StringUtils.isNotEmpty(this.query)) {
      this.handleQuery();
    }
    this.trackEventAdhocMode();
  }

  private trackEventAdhocMode() {
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

  private onClickPlaceholder() {
    this.formulaCompletionInput?.focus();
  }

  @Track(TrackEvents.AdhocCreateTableFromQuery)
  @Emit('onCreateTable')
  private emitCreateTable(event: Event) {
    return this.assignQueryParameter(this.currentQuery, this.parameters, this.parameterValues);
  }

  @Emit('onUpdateTable')
  private emitUpdateTable(event: Event) {
    return this.currentQuery;
  }

  private getSaveOptions(mouseEvent: MouseEvent): ContextMenuItem[] {
    return [
      {
        text: 'Create Table',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        hidden: this.showCreateTableButton && this.mode === QueryEditorMode.EditTable,
        click: () => {
          this.contextMenu.hide();
          return this.emitCreateTable(mouseEvent);
        }
      },
      {
        text: 'Download CSV',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        click: () => {
          this.contextMenu.hide();
          return this.handleExportToCsv(this.currentAdhocAnalysis);
        }
      },
      {
        text: 'Add Chart To Dashboard',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        click: () => {
          this.contextMenu.hide();
          this.emitSaveAdhoc(mouseEvent, this.currentAdhocAnalysis.chartInfo);
        }
      },
      {
        text: 'Create Analysis',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        click: () => {
          this.contextMenu.hide();
          const saveAs = true;
          this.emitSaveQuery(mouseEvent, saveAs);
        },
        hidden: this.mode !== QueryEditorMode.Dashboard
      }
    ];
  }

  showSaveOptions(event: MouseEvent) {
    const mouseEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'button-action', 64, 8);
    const options = this.getSaveOptions(event);
    this.showActionOptions(mouseEvent, options);
  }

  private showActionOptions(event: Event, action: ContextMenuItem[]) {
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
  private emitSaveAdhoc(event: Event, chartInfo: ChartInfo) {
    Log.debug('event::emitSaveAdhoc', event);
    return { event: event, chart: chartInfo };
  }

  @Track(TrackEvents.AdhocSaveAnalysis, {
    chart_titles: (_: QueryComponent, args: any) => _.listAdhocInfo.map(adhoc => adhoc.chartInfo?.name ?? 'Untitled chart').join(','),
    chart_types: (_: QueryComponent, args: any) => _.listAdhocInfo.map(adhoc => adhoc.chartInfo.extraData?.currentChartType).join(','),
    chart_queries: (_: QueryComponent, args: any) => _.listAdhocInfo.map(adhoc => adhoc.query).join(',')
  })
  @Emit('onSaveQuery')
  private emitSaveQuery(event: Event, saveAs: boolean) {
    return { mouseEvent: event, saveAs: saveAs };
  }

  @Track(TrackEvents.ExecuteQuery, { query: (_: QueryComponent) => _.query })
  async handleQuery() {
    try {
      this.errorMsg = '';
      this.queryStatus = Status.Loading;
      this.disablePagination = this.isLimitQuery;
      const queryProcessed = await this.getProcessedQuery();
      Log.debug('Query::handleQuery::queryProcessed::', queryProcessed);
      const chart: ChartInfo =
        this.currentAdHocIndex === 0
          ? this.buildMainAdhocChart(StringUtils.fixCommentInSql(queryProcessed), this.parameters)
          : this.buildAdhocChart(StringUtils.fixCommentInSql(queryProcessed), this.parameters);
      const adhocInfo = new AdHocAnalysisInfo(chart);
      const pagination = this.disablePagination ? Pagination.defaultPagination() : void 0;
      await this.renderChart(adhocInfo.chartInfo, pagination);
      this.setAdHoc(adhocInfo, this.currentAdHocIndex);
      this.goToAdHoc(this.currentAdHocIndex);
      // if (isSelectAllText) {
      //   this.updateQuery(adhoc.query);
      // }
    } catch (e) {
      Log.error(e);
      this.renderChartError(e.message);
    }
  }

  private async getProcessedQuery(): Promise<string> {
    const isSelectAllText = this.editorController.isSelectingAll();
    const query = isSelectAllText ? this.currentQuery : this.editorController.getSelectedText();
    return this.preProcessQuery ? await this.preProcessQuery(query) : query;
  }

  private assignQueryParameter(query: string, params: Record<string, QueryParameter>, paramValue: Record<string, string>) {
    let newQuery = cloneDeep(query);
    Log.debug('assignQueryParameter::', params);
    for (const paramsKey in params) {
      const regex = StringUtils.buildQueryParamRegex(paramsKey);
      const valueType = params[paramsKey]?.valueType ?? ParamValueType.text;
      const value = paramValue[paramsKey] ?? params[paramsKey]?.value ?? '';
      const normalizeValue = QuerySetting.formatParamValue(valueType, value);
      newQuery = newQuery.replaceAll(regex, normalizeValue);
    }
    return StringUtils.fixCommentInSql(newQuery);
  }

  private async handleSave(event: Event) {
    switch (this.mode) {
      case QueryEditorMode.Dashboard:
        {
          this.handleClickSaveAnalysis(event);
        }
        break;
      case QueryEditorMode.EditTable:
        {
          this.emitUpdateTable(event);
        }
        break;
      case QueryEditorMode.Query:
        break;
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

  private getParameterNormalizeValues(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in this.parameterValues) {
      Log.debug('getParameterNormalizeValues', this.parameters[key]);
      const valueType = this.parameters[key]?.valueType ?? ParamValueType.text;
      const value = this.parameterValues[key] ?? this.parameters[key]?.value ?? '';
      result[key] = QuerySetting.formatParamValue(valueType, value);
    }
    return result;
  }

  private buildMainAdhocChart(query: string, params: Record<string, QueryParameter>): ChartInfo {
    const id = get(this.listAdhocInfo, '[0].chartInfo.id', ChartInfoUtils.getNextId());
    const queryParams = this.getParameterNormalizeValues();
    const querySetting: QuerySetting = RawQuerySetting.fromQuery(query).withQueryParameters(queryParams);
    const defaultChartOption = TableChartOption.getDefaultChartOption();
    defaultChartOption.setOption('header.color', '#FFFFFF');
    defaultChartOption.setOption('queryParameter', params);
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

  private buildAdhocChart(query: string, params: Record<string, QueryParameter>) {
    const cloneChartInfo: ChartInfo = cloneDeep(this.currentAdhocAnalysis.chartInfo);
    const aliasName = get(cloneChartInfo, `setting.sqlViews[0].aliasName`, '');
    const queryParams = this.getParameterNormalizeValues();
    cloneChartInfo.setting.withQueryParameters(queryParams);
    cloneChartInfo.setting.updateInlineView(aliasName, query);
    cloneChartInfo.setting.getChartOption()?.setOption('queryParameter', params);
    return cloneChartInfo;
  }

  private async renderChart(chartInfo: ChartInfo, pagination?: Pagination) {
    this.queryStatus = Status.Loading;
    QuerySettingModule.setQuerySetting({ id: chartInfo.id, query: chartInfo.setting });
    await DashboardControllerModule.renderChart({ id: chartInfo.id, forceFetch: true, pagination: pagination });
    this.queryStatus = _ChartStore.statuses[chartInfo.id];
    this.errorMsg = _ChartStore.mapErrorMessage[chartInfo.id] ?? '';
  }

  private reRenderChart() {
    // todo: Re-render chart for update UI
    this.$root.$emit(DashboardEvents.ResizeWidget, this.currentAdhocAnalysis.chartInfo.id);
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
  private async handleNewChart() {
    try {
      this.isAddChartLoading = true;
      const tableSchema = await this.getOrDetectAdhocTable(this.assignQueryParameter(this.currentQuery, this.parameters, this.parameterValues));
      const queryParams = this.getParameterNormalizeValues();
      this.chartBuilderComponent.showModal({
        selectedTables: [tableSchema.name],
        database: DatabaseSchema.adhoc(tableSchema),
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

  private async getOrDetectAdhocTable(query: string, tblName?: string): Promise<TableSchema> {
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
  private async handleSelectChart(index: number) {
    this.currentAdHocIndex = index;
    this.query = this.currentAdhocAnalysis.query;
    this.setParameters(this.currentAdhocAnalysis.chartInfo.setting.getChartOption()?.options.queryParameter ?? {});
  }

  get currentAdhocAnalysis(): AdHocAnalysisInfo {
    return this.listAdhocInfo[this.currentAdHocIndex];
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.resizeChart);
  }

  private getVizItem(chartType: ChartType): VisualizationItemData | null {
    return DataBuilderConstantsV35.ALL_ITEMS_AS_MAP.get(chartType) ?? null;
  }

  @Track(TrackEvents.AdhocConfigChart, {
    chart_query: (_: QueryComponent, args: any) => _.currentAdhocAnalysis.query,
    chart_title: (_: QueryComponent, args: any) => _.currentAdhocAnalysis.chartInfo?.name ?? 'Untitled chart',
    chart_type: (_: QueryComponent, args: any) => _.currentAdhocAnalysis.chartInfo?.extraData?.currentChartType,
    chart_id: (_: QueryComponent, args: any) => _.listAdhocInfo[args[0]].chartInfo?.id
  })
  private async handleClickEditChart() {
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
        database: DatabaseSchema.adhoc(tableSchema),
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
  private async handleDeleteAdhocAnalysis(index: number) {
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
      this.updateQuery(adhoc.query);
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
  async handleAddChart(chartInfo: ChartInfo, currentQuery: string, params: Record<string, QueryParameter>, paramsValue: Record<string, any>) {
    try {
      const analysisInfo = await this.createWidget(this.buildAddAdhocAnalysis(chartInfo, currentQuery, params, paramsValue));
      this.setAdHoc(analysisInfo, this.listAdhocInfo.length);
      this.updateQuery(analysisInfo.query);
      this.goToAdHoc(this.listAdhocInfo.length - 1);
      await this.renderChart(analysisInfo.chartInfo);
    } catch (e) {
      Log.error('QueryComponent::handleAddChart::error::', e);
    }
  }

  ///return null not have id in router
  private get queryDashboardId(): DashboardId | null {
    return toNumber(this.$route.query.adhoc) || null;
  }

  private validDashboard() {
    const dashboardId = this.queryDashboardId;
    if (!dashboardId) {
      PopupUtils.showError('Analysis Not Found!');
      throw new DIException('Analysis Not Found!');
    }
  }

  private async createWidget(adhoc: AdHocAnalysisInfo): Promise<AdHocAnalysisInfo> {
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

  private buildAddAdhocAnalysis(
    chartInfo: ChartInfo,
    currentQuery: string,
    params: Record<string, QueryParameter>,
    paramsValue: Record<string, string>
  ): AdHocAnalysisInfo {
    const newChartInfo = chartInfo.copyWithId(ChartInfoUtils.getNextId());
    const defaultChartOption = newChartInfo.setting.getChartOption() || TableChartOption.getDefaultChartOption();
    defaultChartOption.setOption('queryParameter', params);
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

  setParameters(params: Record<string, QueryParameter>) {
    Log.debug('setParameters::', params);
    this.parameters = params;
    for (const paramsKey in params) {
      this.parameterValues[paramsKey] = this.parameterValues[paramsKey] ?? params[paramsKey]?.value ?? '';
    }
    this.$forceUpdate();
  }

  selectChart(index: number) {
    if (index <= this.listAdhocInfo.length - 1) {
      this.onClickPlaceholder();
      this.handleSelectChart(index);
      //hard code to fix status
      this.queryStatus = _ChartStore.statuses[this.listAdhocInfo[index].chartInfo.id];
    }
  }

  private get showSaveQueryButton(): boolean {
    return this.mode !== QueryEditorMode.EditTable;
  }

  private handleClickSaveAnalysis(event: Event) {
    const mouseEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'button-save-adhoc', 0, 8);
    const saveAs = this.mode === QueryEditorMode.Query;
    this.emitSaveQuery(mouseEvent, true);
  }

  private onAddParam(index: number) {
    const paramName = `untitle_param_${index}`;
    if (this.parameters[paramName] !== undefined) {
      this.onAddParam(index + 1);
      return;
    } else {
      const newParam = defaultQueryParameter();
      newParam.displayName = `untitle_param_${index}`;
      this.setParameter(newParam);
      this.query = this.query.concat(` {{${newParam.displayName}}}`);
      if (this.mode === QueryEditorMode.Dashboard) {
        this.emitSaveQuery(new Event(''), false);
      }
      return;
    }
  }

  setParameter(parameter: QueryParameter) {
    this.parameters[parameter.displayName] = parameter;
    this.parameterValues[parameter.displayName] = parameter.value;
    this.$forceUpdate();
  }

  private onConfigParam(event: MouseEvent, param: QueryParameter, currentValue: any) {
    const target = `action-${param.displayName}`;
    const mouseEvent = HtmlElementRenderUtils.fixMenuOverlap(event, target, 0, 8);
    const options = this.getParamOptions(param, currentValue);
    this.showActionOptions(mouseEvent, options);
  }

  private getParamOptions(param: QueryParameter, currentValue: any): ContextMenuItem[] {
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
          this.parameters[param.displayName].value = currentValue;
          if (this.mode === QueryEditorMode.Dashboard) {
            this.emitSaveQuery(new Event(''), false);
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

  private onQueryChanged() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      Log.debug('QueryComponent::query', this.query);
      const paramRegex = this.QUERY_PARAM_REGEX;
      const params: RegExpMatchArray | null = this.query.match(paramRegex);
      const unUsedParamKeys = this.getQueryParamsNotUse(this.query, this.parameters);
      this.deleteMultiParams(unUsedParamKeys, false);
      this.buildQueryParams(params ?? []);
    }, 1000);
  }

  private buildQueryParams(params: RegExpMatchArray) {
    params.forEach(param => {
      ///{{ value test}} -> value_test
      const paramName = param
        .replaceAll('{{', '')
        .replaceAll('}}', '')
        .trim();
      if (this.parameters[paramName] !== undefined) {
        return;
      } else {
        const currentValue = this.parameterValues[paramName];
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

  private getQueryParamsNotUse(query: string, currentParams: Record<string, QueryParameter>): string[] {
    const result: string[] = [];
    const allParamKeys = Object.keys(currentParams);
    allParamKeys.forEach(paramKey => {
      const regex = StringUtils.buildQueryParamRegex(paramKey);
      if (!this.query.match(regex)) {
        result.push(paramKey);
      }
    });
    return result;
  }

  private async updateParamValue(paramKey: string, value: any) {
    Log.debug('updateParamValue::', paramKey, value);
    this.parameterValues[paramKey] = value;
    return this.handleQuery();
  }

  private editParam(param: QueryParameter) {
    const oldName = param.displayName;
    // const oldValue = param.value;
    this.paramModal.show(param, async (edited: QueryParameter) => {
      this.deleteParam(param);
      this.setParameter(edited);
      this.replaceParamInQuery(param, `{{ ${edited.displayName} }}`);
      if (param.value !== edited.value) {
        await this.handleQuery();
      }
      if (this.mode === QueryEditorMode.Dashboard) {
        this.emitSaveQuery(new Event(''), false);
      }
    });
  }

  private replaceParamInQuery(param: QueryParameter, value: string) {
    const regex = StringUtils.buildQueryParamRegex(param.displayName);
    this.query = this.query.replaceAll(regex, value);
  }

  private deleteMultiParams(paramKeys: string[], deleteCurrentValue: boolean) {
    paramKeys.forEach(key => {
      delete this.parameters[key];
      // delete this.parameterValues[key];
    });
    this.$forceUpdate();
    if (this.mode === QueryEditorMode.Dashboard) {
      this.emitSaveQuery(new Event(''), false);
    }
  }

  private deleteParam(param: QueryParameter, onDeleted?: (param: QueryParameter) => void) {
    delete this.parameters[param.displayName];
    // delete this.parameterValues[param.displayName];
    this.$forceUpdate();
    if (this.mode === QueryEditorMode.Dashboard) {
      this.emitSaveQuery(new Event(''), false);
    }
    onDeleted ? onDeleted(param) : void 0;
    this.$emit('delete', param);
  }

  private async showEnsureModal(title: string, html: string, confirmButtonText?: string, cancelButtonText?: string) {
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

  private get titleSaveAnalysis(): string {
    switch (this.mode) {
      case QueryEditorMode.Dashboard:
        return this.tempQuery !== this.currentQuery ? 'Save*' : 'Save';
      default:
        return 'Save Analysis';
    }
  }

  private get isDiffQuery(): boolean {
    return this.query !== this.defaultQuery;
  }

  getQuery() {
    return this.buildMainAdhocChart(this.query, this.parameters);
  }

  private renderChartError(message: string) {
    Log.error(message);
    this.queryStatus = Status.Error;
    this.errorMsg = message;
  }

  private async handleExportToCsv(adhoc: AdHocAnalysisInfo) {
    try {
      const id: number = adhoc.chartInfo.id;
      const csvDownloadLink: string = await DashboardControllerModule.exportAsCsv({ widgetId: id });
      UrlUtils.downloadCsvUrl(csvDownloadLink);
    } catch (ex) {
      Log.error(ex);
      PopupUtils.showError(ex.message);
    }
  }

  private get isTestAccount(): boolean {
    return this.dataManager.getUserProfile()?.email === QueryComponent.TEST_ACCOUNT;
  }
}
