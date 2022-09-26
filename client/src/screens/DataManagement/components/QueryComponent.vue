<template>
  <Split :gutterSize="24" direction="vertical" @onDragEnd="resizeChart" class="query-component">
    <SplitArea :size="45" :minSize="150">
      <div class="query-input-container">
        <div class="flex-grow-1 overflow-hidden">
          <div class="formula-completion-input">
            <div class="padding-top"></div>
            <FormulaCompletionInput
              v-if="formulaController"
              ref="formulaCompletionInput"
              v-model="query"
              :formulaController="formulaController"
              :editorController="editorController"
              :fixedOverflowWidgets="true"
              class="query-input"
              placeholder="select * from..."
              @onExecute="handleQuery"
              @onSave="handleSave"
            />
          </div>
        </div>
        <div class="row-limit-container d-flex align-items-center" ref="actionRow">
          <div v-if="showAdHocAnalysis" class="d-flex w-100 align-items-center">
            <template v-if="listAdhocInfo.length > 0">
              <div class="list-viz-item">
                <vuescroll ref="viewAllScroll" :ops="horizontalScroll">
                  <div class="viz-item-scroll-body d-flex flex-row">
                    <template v-for="(item, index) in listAdhocInfo">
                      <div :key="index" class="d-flex">
                        <VisualizationItem
                          :key="index"
                          :id="'viz-item-' + index"
                          :isSelected="index === currentAdHocIndex"
                          :item="getVizItem(item.vizItem.type)"
                          class="viz-item mr-1"
                          type="mini"
                          @onClickItem="handleSelectChart(index)"
                        />
                      </div>
                    </template>
                  </div>
                </vuescroll>
              </div>
            </template>
            <DiButton
              ref="addChartButton"
              border
              v-if="isSuccessQuery && !isMobile()"
              id="add-new-table-display"
              class="btn-ghost default-button add-chart-button"
              title="Add Chart"
              @click="handleNewChart"
            >
              <i v-if="isAddChartLoading" class="fa fa-spin fa-spinner"></i>
              <i v-else class="di-icon-add"></i>
            </DiButton>
          </div>
          <div class="d-flex align-items-center ml-auto right-group">
            <i v-if="isSavingAdhocChart" class="fa fa-spin fa-spinner mr-2"></i>
            <DiButton
              border
              v-if="showAdHocAnalysis && showSaveQueryButton && mode !== queryModes.Dashboard && !isMobile()"
              :disabled="listAdhocInfo.length === 0 || !isDiffQuery"
              id="button-save-adhoc"
              class="btn-ghost default-button mr-2"
              :title="titleSaveAnalysis"
              tabindex="-1"
              @click="handleClickSaveAnalysis"
            >
            </DiButton>
            <DiButton
              v-if="showAdHocAnalysis && !isMobile()"
              border
              id="button-action"
              class="btn-ghost default-button action-button"
              title="Actions"
              tabindex="-1"
              @click="showActionOptions"
            ></DiButton>

            <DiButton primary :disabled="isExecutingQuery" :id="genBtnId('query')" class="btn-query flex-fill btn-primary" title="Execute" @click="handleQuery">
              <i v-if="isExecutingQuery" class="fa fa-spin fa-spinner"></i>
            </DiButton>
          </div>
        </div>
      </div>
    </SplitArea>
    <SplitArea :size="55">
      <!--        :style="{ height: `calc(100% - ${charHolderContainerHeight()}px)` }"-->
      <div v-if="currentAdhocAnalysis" class="query-result d-flex flex-column text-left h-100">
        <div class="table-container flex-grow-1 table-container-padding-15">
          <ChartHolder
            :isPreview="true"
            v-if="currentAdhocAnalysis"
            ref="chartHolder"
            :disablePagination="disablePagination"
            :meta-data="currentAdhocAnalysis.chartInfo"
            class="result-table position-relative"
            disableSort
            :disableEmptyChart="currentAdHocIndex === 0"
          ></ChartHolder>
          <div v-if="currentAdHocIndex !== 0" style="z-index: 2; background: transparent" class="chart-action">
            <i class="di-icon-edit p-2 btn-icon-border mr-2" @click="handleClickEditChart"></i>
            <i class="di-icon-delete p-2 btn-icon-border" @click="handleDeleteAdhocAnalysis(currentAdHocIndex)"></i>
          </div>
        </div>
      </div>
      <div v-else class="query-result d-flex align-items-center h-100 justify-content-center" style="font-weight: 500; padding: 8px">
        Write your SQL query above and then click Execute.<br />The results from your query will show up here.
      </div>
      <ChartBuilderComponent ref="chartBuilderComponent"></ChartBuilderComponent>
    </SplitArea>
    <ContextMenu id="save-query-menu" ref="contextMenu" :ignoreOutsideClass="['action-button']" minWidth="200px" textColor="#fff" z-index="2" />
  </Split>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import FormulaCompletionInput from '@/shared/components/FormulaCompletionInput/FormulaCompletionInput.vue';
import { FormulaController } from '@/shared/fomula/FormulaController';
import {
  ChartInfo,
  DatabaseSchema,
  InlineSqlView,
  QueryRelatedWidget,
  QuerySetting,
  RawQuerySetting,
  TableChartOption,
  TableSchema,
  WidgetCommonData
} from '@core/domain';
import ChartHolder from '@/screens/DashboardDetail/components/WidgetContainer/charts/ChartHolder.vue';
import { isFunction, get } from 'lodash';
import { StringUtils } from '@/utils/string.utils';
import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';
import { Log } from '@core/utils';
import { QueryUtils } from '@/screens/DataManagement/views/QueryEditor/QueryUtils';
import { Pagination } from '@/shared/models/table.modal';
import { ChartType, DataBuilderConstantsV35, HorizontalScrollConfig, Status, VisualizationItemData } from '@/shared';
import VisualizeSelectionModal from '@/screens/ChartBuilder/ConfigBuilder/ChartSelectionPanel/VisualizeSelectionModal.vue';
import ChartBuilder from '@/screens/ChartBuilder/DataCook/ChartBuilder.vue';
import EtlModal from '@/screens/DataCook/components/EtlModal/EtlModal.vue';
import { ChartInfoUtils, ListUtils, ChartUtils } from '@/utils';
import ChartBuilderModal from '@/screens/DashboardDetail/components/DataBuilderModal/ChartBuilderModal.vue';
import VisualizationItem from '@/screens/ChartBuilder/ConfigBuilder/ChartSelectionPanel/VisualizationItem.vue';
import ChartHolderController from '@/screens/DashboardDetail/components/WidgetContainer/charts/ChartHolderController';
import { _ChartStore, DashboardControllerModule, QuerySettingModule, WidgetModule } from '@/screens/DashboardDetail/stores';
import ChartBuilderComponent from '@/screens/DashboardDetail/components/DataBuilderModal/ChartBuilderComponent.vue';
import { BFormTextarea } from 'bootstrap-vue';
// @ts-ignore
import { Split, SplitArea } from 'vue-split-panel';
import { SchemaService } from '@core/schema/service/SchemaService';
import { Inject } from 'typescript-ioc';
import Swal from 'sweetalert2';
import { QueryEditorMode } from '../views/QueryEditor/QueryEditor.ctrl';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { EditorController } from '@/shared/fomula/EditorController';
import { Track } from '@/shared/anotation/TrackingAnotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { AdhocBuilderConfig, DefaultChartBuilderConfig } from '@/screens/DashboardDetail/components/DataBuilderModal/ChartBuilderConfig';

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
    ContextMenu
  }
})
export default class QueryComponent extends Vue {
  private readonly queryModes = QueryEditorMode;
  private readonly horizontalScroll = {
    ...HorizontalScrollConfig,
    bar: {
      background: 'var(--scrollbar-background)',
      size: '3px',
      minSize: 0.25
    }
  };

  private queryStatus = Status.Empty;
  private isAddChartLoading = false;
  isSavingAdhocChart = false;
  private query = '';
  private disablePagination = false;

  private listAdhocInfo: AdHocAnalysisInfo[] = [];
  private currentAdHocIndex = 0;
  private readonly tableSchemaAsMap = new Map<string, TableSchema>();
  $alert!: typeof Swal;

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

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isUpdateSchemaMode!: boolean;

  @Prop({ required: false, type: Number, default: QueryEditorMode.Query })
  private readonly mode!: QueryEditorMode;

  @Ref()
  private readonly formulaCompletionInput?: FormulaCompletionInput;

  @Ref()
  private chartHolder?: ChartHolderController;

  @Ref()
  private readonly chartBuilderComponent!: ChartBuilderComponent;

  @Ref()
  private readonly actionRow!: HTMLDivElement;

  @Ref()
  private readonly formulaInputPlaceholder?: BFormTextarea;

  @Ref()
  private readonly contextMenu!: ContextMenu;

  @Inject
  private readonly schemaService!: SchemaService;

  @Watch('defaultQuery')
  private onDefaultQueryChanged(newValue: string) {
    Log.debug('Change query::', this.query, newValue);
    this.query = newValue;
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

  private get isSuccessQuery() {
    return this.queryStatus === Status.Loaded;
  }

  private get isExecutingQuery() {
    return this.queryStatus === Status.Loading;
  }

  private isMobile() {
    return ChartUtils.isMobile();
  }

  created() {
    this.query = this.defaultQuery;
    window.addEventListener('resize', this.resizeChart);
  }

  resizeChart() {
    this.$root.$emit(DashboardEvents.ResizeWidget, this.currentAdhocAnalysis.chartInfo.id);
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
    return this.currentQuery;
  }

  @Emit('onUpdateTable')
  private emitUpdateTable(event: Event) {
    return this.currentQuery;
  }

  private showActionOptions(event: MouseEvent) {
    const mouseEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'button-action', 64, 8);
    const saveOptions = [
      {
        text: 'Create Table From Query',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        hidden: this.showCreateTableButton && this.isUpdateSchemaMode,
        click: () => {
          this.contextMenu.hide();
          return this.emitCreateTable(mouseEvent);
        }
      },
      {
        text: 'Update Table From Query',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        hidden: this.showCreateTableButton && !this.isUpdateSchemaMode,
        click: () => {
          this.contextMenu.hide();
          return this.emitUpdateTable(mouseEvent);
        }
      },
      {
        text: 'Save Chart As',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        click: () => {
          this.contextMenu.hide();
          this.emitSaveAdhoc(mouseEvent, this.currentAdhocAnalysis.chartInfo);
        }
      },
      {
        text: 'Save Analysis As',
        disabled: ListUtils.isEmpty(this.listAdhocInfo),
        click: () => {
          this.contextMenu.hide();
          const saveAs = true;
          this.emitSaveQuery(mouseEvent, saveAs);
        },
        hidden: this.mode !== QueryEditorMode.Dashboard
      }
    ].filter(option => !option.hidden);
    this.contextMenu.show(mouseEvent, saveOptions);
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
  private async handleQuery() {
    try {
      this.disablePagination = this.isLimitQuery;
      const chartInfo = this.buildAdhocChart(this.currentQuery);
      const pagination = this.disablePagination ? Pagination.defaultPagination() : void 0;
      await this.renderChart(chartInfo, pagination);
      this.updateAdHoc(new AdHocAnalysisInfo(chartInfo), 0);
    } catch (e) {
      Log.error('QueryComponent::handleQuery::error::', e.message);
    }
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

  updateAdHoc(adHocAnalysis: AdHocAnalysisInfo, index: number) {
    if (this.listAdhocInfo[index]) {
      this.$set(this.listAdhocInfo, index, adHocAnalysis);
    } else {
      this.listAdhocInfo.push(adHocAnalysis);
    }
    this.currentAdHocIndex = index;
    this.query = adHocAnalysis.query;
    this.scrollTo(`viz-item-${index}`);
  }

  private buildAdhocChart(query: string): ChartInfo {
    const id = get(this.listAdhocInfo, '[0].chartInfo.id', ChartInfoUtils.getNextId());
    const querySetting: QuerySetting = RawQuerySetting.fromQuery(query);
    const defaultChartOption = TableChartOption.getDefaultChartOption();
    defaultChartOption.setOption('header.color', '#FFFFFF');
    querySetting.setChartOption(defaultChartOption);
    const commonSetting: WidgetCommonData = { id: id, name: '', description: '' };
    return new ChartInfo(commonSetting, querySetting);
  }

  private async renderChart(chartInfo: ChartInfo, pagination?: Pagination) {
    this.queryStatus = Status.Loading;
    QuerySettingModule.setQuerySetting({ id: chartInfo.id, query: chartInfo.setting });
    await DashboardControllerModule.renderChart({ id: chartInfo.id, forceFetch: true, pagination: pagination });
    this.queryStatus = _ChartStore.statuses[chartInfo.id];
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
      const tableSchema = await this.getOrDetectAdhocTable(this.currentQuery);
      this.chartBuilderComponent.showModal({
        selectedTables: [tableSchema.name],
        database: DatabaseSchema.adhoc(tableSchema),
        onCompleted: this.handleAddChart,
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
  private handleSelectChart(index: number) {
    this.currentAdHocIndex = index;
    this.query = this.currentAdhocAnalysis.query;
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
      const tableSchema: TableSchema = await this.getOrDetectAdhocTable(currentView.query.query, currentView.aliasName);
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
      const adhocChart = chartInfo.copyWithId(this.currentAdhocAnalysis.chartInfo.id);
      this.updateAdHoc(new AdHocAnalysisInfo(adhocChart), this.currentAdHocIndex);
      await this.renderChart(adhocChart);
      this.$emit('onUpdateChart', adhocChart);
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
  async handleAddChart(chartInfo: ChartInfo) {
    try {
      const adhocChart = chartInfo.copyWithId(ChartInfoUtils.getNextId());
      this.updateAdHoc(new AdHocAnalysisInfo(adhocChart), this.listAdhocInfo.length);
      await this.renderChart(adhocChart);
      ///Call Api create widget if is in Dashboard mode
      this.$emit('onCreateChart', adhocChart);
    } catch (e) {
      Log.error('QueryComponent::handleAddChart::error::', e);
    }
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
    this.emitSaveQuery(mouseEvent, saveAs);
  }

  private get titleSaveAnalysis(): string {
    switch (this.mode) {
      case QueryEditorMode.Dashboard:
        return 'Update analysis';
      default:
        return 'Save Analysis';
    }
  }

  private get isDiffQuery(): boolean {
    return this.query !== this.defaultQuery;
  }

  getQuery() {
    return this.buildAdhocChart(this.query);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.query-component {
  .query-input-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px 16px 12px;

    .add-chart-button {
      @media screen and (max-width: 1080px) {
        margin-top: 8px;
      }
    }

    .viz-item-scroll-body {
      //height: 50px;

      .viz-item {
        .visualization-item-mini {
          padding: 4px;
          width: 26px;
          height: 26px;

          img {
            height: 16px;
            width: 16px;
          }
        }
      }
    }
  }

  .line {
    height: 42px;
    border-right: 1px solid black;
    margin-right: 4px;
  }

  .formula-completion-input.placeholder {
    padding-left: 19px;
    padding-top: 16px;
    //height: 235px !important;
    height: 100% !important;
  }

  .formula-completion-input {
    text-align: left;
    background-color: var(--input-background-color) !important;
    border-radius: 4px;
    //height: 30% !important;
    //min-height: 235px;
    height: 100% !important;

    .padding-top {
      background-color: var(--editor-color);
      height: 16px;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }

    .query-input {
      height: calc(100% - 16px) !important;
      min-height: 134px;

      .view-lines {
        border-radius: 0;
        text-align: left;
      }

      .overflow-guard {
        border-radius: 4px;
      }

      .monaco-editor {
        border-radius: 0 0 4px 4px;

        &,
        .margin,
        .monaco-editor-background,
        .inputarea.ime-input {
          background-color: var(--editor-color);
        }
      }
    }
  }

  .row-limit-container {
    margin-top: 12px;

    .list-viz-item {
      max-width: 300px;
    }

    .right-group {
    }

    @media screen and (max-width: 1080px) {
      flex-direction: column-reverse;
      .list-viz-item {
        max-width: calc(100% - 100.5px);
        margin-top: 8px;
      }
    }
  }

  .default-button {
    font-size: 14px;
    height: 26px;
  }

  .btn-query {
    height: 26px;
    margin-left: 8px;
    width: 76px;
    justify-content: center;

    .title {
      font-size: 14px;
      font-weight: normal;
      width: fit-content;
    }
  }

  .select-per-page-list {
    input {
      width: 40px;
    }
  }

  .result {
    @include bold-text();
    font-size: 16px;
    margin-bottom: 16px;
    margin-top: 27px;
  }

  .query-result {
    .table-container-padding-15 {
      padding: 15px;
    }

    .result-table .empty-widget {
      background-color: var(--panel-background-color);
    }

    .result-table .table-chart-container .table-chart-pagination-content {
      --header-background-color: var(--accent);
      --table-page-active-color: var(--white);
    }

    .table-container {
      position: relative;

      .chart-action {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
      }
    }

    .table-container,
    .infinite-table {
      //border-radius: 4px;
      //box-shadow: 0 2px 8px 0 #0000001a;
      max-height: 100%;
      overflow: auto;

      table {
        border-collapse: separate;
        border-spacing: 0;
        margin-bottom: 0 !important;

        td,
        th {
          font-size: 14px;
          padding: 10px 12px;
        }

        thead {
          position: sticky;
          top: 0;
          z-index: 1;

          th {
            background-color: var(--header-background-color, #131d26);
            border-top: none;
            color: var(--table-header-color, #ffffff);
          }
        }

        tbody {
          tr {
            &.even td {
              background-color: var(--row-even-background-color, #00000033);
              color: var(--row-even-color, #ffffffcc);
            }

            &.odd td {
              background-color: var(--row-odd-background-color, #0000001a);
              color: var(--row-odd-color, #ffffffcc);
            }
          }
        }

        tr {
          th,
          td {
            border: none;
            border-right: 1px solid #ffffff14;
          }

          th:last-child,
          td:last-child {
            border-right: none;
          }
        }
      }
    }

    .table-chart-container {
      padding: 0;

      .table-chart-header-content {
        display: none;
      }

      //.table-chart-table-content {
      //  background: var(--panel-background-color);
      //}
    }
  }
}
</style>
