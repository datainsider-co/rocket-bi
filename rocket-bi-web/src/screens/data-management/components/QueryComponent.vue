<template>
  <Split :gutterSize="24" direction="vertical" @onDragEnd="resizeChart" class="query-component">
    <SplitArea :size="45" :minSize="150">
      <div class="query-input-container">
        <div class="d-flex row query-header">
          <div class="query-title">Build Query</div>
          <slot name="header"></slot>
        </div>
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
              @input="onQueryChanged"
            />
          </div>
        </div>
        <div style="max-height: 10vh" v-if="showParameter">
          <vuescroll>
            <div class="param-listing">
              <ParamItem
                v-for="(param, key) in parameters"
                :key="key"
                :param="param"
                @select="addParamToQuery"
                @change="updateParamValue"
                @edit="onConfigParam"
              />
              <DiButton border id="button-query-param" class="btn-ghost default-button" title="Add Param" tabindex="-1" @click="onAddParam">
                <i class="di-icon-add"></i>
              </DiButton>
            </div>
          </vuescroll>
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
              @click="showSaveOptions"
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
      <div v-if="errorMsg" class="query-result d-flex align-items-center h-100 p-3 text-danger text-center">
        <vuescroll class="query-result--error">
          <pre>{{ errorMsg }}</pre>
        </vuescroll>
      </div>
      <LoadingComponent v-else-if="isLoading" class="query-result d-flex align-items-center h-100 justify-content-center" />
      <div v-else-if="currentAdhocAnalysis" class="query-result d-flex flex-column text-left h-100">
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
    <ParameterModal ref="paramModal" />
  </Split>
</template>

<script lang="ts">
import { Component, Emit, Inject, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import FormulaCompletionInput from '@/shared/components/formula-completion-input/FormulaCompletionInput.vue';
import { FormulaController } from '@/shared/fomula/FormulaController';
import {
  ChartInfo,
  ChartOption,
  DatabaseSchema,
  defaultQueryParameter,
  InlineSqlView,
  ParamValueType,
  QueryParameter,
  QueryRelatedWidget,
  QuerySetting,
  RawQuerySetting,
  TableChartOption,
  TableSchema,
  WidgetCommonData
} from '@core/common/domain';
import ChartHolder from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder.vue';
import { cloneDeep, get, isFunction } from 'lodash';
import { StringUtils } from '@/utils/StringUtils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { Log } from '@core/utils';
import { QueryUtils } from '@/screens/data-management/views/query-editor/QueryUtils';
import { Pagination } from '@/shared/models/CustomCell';
import { ChartType, ContextMenuItem, DataBuilderConstantsV35, HorizontalScrollConfig, Status, VisualizationItemData } from '@/shared';
import VisualizeSelectionModal from '@/screens/chart-builder/config-builder/chart-selection-panel/VisualizeSelectionModal.vue';
import ChartBuilder from '@/screens/chart-builder/data-cook/ChartBuilder.vue';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { ChartInfoUtils, ChartUtils, ListUtils, RandomUtils } from '@/utils';
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
import { QueryEditorMode } from '../views/query-editor/QueryEditor';
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
  private errorMsg = '';
  private isAddChartLoading = false;
  isSavingAdhocChart = false;
  private query = '';
  private disablePagination = false;

  private listAdhocInfo: AdHocAnalysisInfo[] = [];
  private parameters: Record<string, QueryParameter> = {};

  private parameterValues: Record<string, any> = {};
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

  @Prop({ required: false, type: Boolean, default: true })
  private readonly showParameter!: boolean;

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
  private get isLoading(): boolean {
    return this.queryStatus === Status.Loading;
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
    return this.assignQueryParameter(this.currentQuery, this.parameterValues);
  }

  @Emit('onUpdateTable')
  private emitUpdateTable(event: Event) {
    return this.currentQuery;
  }

  private getSaveOptions(mouseEvent: MouseEvent): ContextMenuItem[] {
    return [
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
      Log.debug('Query::handleQuery');
      this.disablePagination = this.isLimitQuery;
      const isSelectAllText = this.editorController.isSelectingAll();
      const query = isSelectAllText ? this.currentQuery : this.editorController.getSelectedText();
      const queryProcessed: string = this.preProcessQuery ? await this.preProcessQuery(query) : query;
      const adhoc = new AdHocAnalysisInfo(this.buildAdhocChart(queryProcessed, this.parameters));
      const pagination = this.disablePagination ? Pagination.defaultPagination() : void 0;
      await this.renderChart(adhoc.chartInfo, pagination);
      this.updateAdHoc(adhoc, 0);
      this.goToAdHoc(0);
      // if (isSelectAllText) {
      //   this.updateQuery(adhoc.query);
      // }
    } catch (e) {
      this.renderChartError(e.message);
    }
  }

  private assignQueryParameter(query: string, params: Record<string, QueryParameter>) {
    let result = cloneDeep(query);
    for (const paramsKey in params) {
      const regex = new RegExp(`{{\\s*${paramsKey}\\s*}}`, 'g');
      const normalizeValue = QuerySetting.formatParamValue(this.parameters[paramsKey].valueType ?? ParamValueType.text, params[paramsKey]);
      result = result.replaceAll(regex, normalizeValue);
    }
    return result;
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

  updateAdHoc(adHocAnalysis: AdHocAnalysisInfo, index: number) {
    if (this.listAdhocInfo[index]) {
      this.$set(this.listAdhocInfo, index, adHocAnalysis);
    } else {
      this.listAdhocInfo.push(adHocAnalysis);
    }
  }

  private getParameterNormalizeValues(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in this.parameterValues) {
      // Log.debug('getParameterNormalizeValues::', key, this.parameters[key]?.value, this.parameterValues[key], QuerySetting.formatParamValue(this.parameters[key]?.value ?? ParamValueType.text, this.parameterValues[key]));
      const currentValue = StringUtils.isNotEmpty(this.parameterValues[key]) ? this.parameterValues[key] : this.parameters[key].value;
      result[key] = QuerySetting.formatParamValue(this.parameters[key]?.valueType ?? ParamValueType.text, currentValue);
    }
    return result;
  }

  private buildAdhocChart(query: string, params: Record<string, QueryParameter>): ChartInfo {
    const id = get(this.listAdhocInfo, '[0].chartInfo.id', ChartInfoUtils.getNextId());
    const queryParams = this.getParameterNormalizeValues();
    const querySetting: QuerySetting = RawQuerySetting.fromQuery(query).withQueryParameters(queryParams);
    const defaultChartOption = TableChartOption.getDefaultChartOption();
    defaultChartOption.setOption('header.color', '#FFFFFF');
    defaultChartOption.setOption('queryParameter', params);
    querySetting.setChartOption(defaultChartOption);
    const commonSetting: WidgetCommonData = { id: id, name: '', description: '' };
    Log.debug('buildAdhocChart::', querySetting);
    return new ChartInfo(commonSetting, querySetting);
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
      const tableSchema = await this.getOrDetectAdhocTable(this.assignQueryParameter(this.currentQuery, this.parameterValues));
      this.chartBuilderComponent.showModal({
        selectedTables: [tableSchema.name],
        database: DatabaseSchema.adhoc(tableSchema),
        onCompleted: chartInfo => this.handleAddChart(chartInfo, this.query, this.parameters, this.parameterValues),
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
      const tableSchema: TableSchema = await this.getOrDetectAdhocTable(
        this.assignQueryParameter(this.currentQuery, this.parameterValues),
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
      this.updateAdHoc(adhoc, this.currentAdHocIndex);
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
      const analysisInfo: AdHocAnalysisInfo = this.buildAddAdhocAnalysis(chartInfo, currentQuery, params, paramsValue);
      this.updateAdHoc(analysisInfo, this.listAdhocInfo.length);
      this.updateQuery(analysisInfo.query);
      this.goToAdHoc(this.listAdhocInfo.length - 1);
      await this.renderChart(analysisInfo.chartInfo);
      ///Call Api create widget if is in Dashboard mode
      this.$emit('onCreateChart', analysisInfo);
    } catch (e) {
      Log.error('QueryComponent::handleAddChart::error::', e);
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
    this.parameters = params;
    for (const paramsKey in params) {
      this.parameterValues[paramsKey] = params[paramsKey].value;
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
    this.emitSaveQuery(mouseEvent, saveAs);
  }

  private onAddParam() {
    const newParam = defaultQueryParameter();
    newParam.displayName = `untitle_param_${RandomUtils.nextInt()}`;
    this.setParameter(newParam);
    this.query = this.query.concat(` {{${newParam.displayName}}}`);
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
            this.deleteParam(param);
          }
        }
      }
    ];
  }

  private onQueryChanged() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      Log.debug('QueryComponent::query', this.query);
      const paramRegex = new RegExp('{{\\s*\\w+\\s*}}', 'g');
      const params: RegExpMatchArray | null = this.query.match(paramRegex);
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
        const queryParam: QueryParameter = {
          displayName: paramName,
          valueType: ParamValueType.text,
          value: ''
        };
        this.setParameter(queryParam);
      }
    });
  }

  private updateParamValue(paramKey: string, value: any) {
    Log.debug('updateParamValue::', paramKey, value);
    this.parameterValues[paramKey] = value;
  }

  private addParamToQuery(param: QueryParameter) {
    // const queryCursors = this.editorController.getCursor();
    // const text = ` {{${param.displayName}}}`;
    // if (queryCursors.length > 0) {
    //   this.query = StringUtils.insertAt(this.query, text, queryCursors[0]);
    // } else {
    //   this.editorController.appendText(text, true);
    // }
    // Log.debug('onSelectParam::query', this.query);
  }

  private editParam(param: QueryParameter) {
    const oldName = param.displayName;
    // const oldValue = param.value;
    this.paramModal.show(param, (edited: QueryParameter) => {
      this.deleteParam(param);
      this.setParameter(edited);
      const regex = new RegExp(`{{\\s*${oldName}\\s*}}`, 'g');
      this.query = this.query.replaceAll(regex, `{{ ${edited.displayName} }}`);
    });
  }

  private deleteParam(param: QueryParameter) {
    delete this.parameters[param.displayName];
    delete this.parameterValues[param.displayName];
    this.$forceUpdate();
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
        return 'Update analysis';
      default:
        return 'Save Analysis';
    }
  }

  private get isDiffQuery(): boolean {
    return this.query !== this.defaultQuery;
  }

  getQuery() {
    return this.buildAdhocChart(this.query, this.parameters);
  }

  private renderChartError(message: string) {
    Log.error(message);
    this.queryStatus = Status.Error;
    this.errorMsg = message;
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

    .query-header {
      padding-right: 16px;
      padding-left: 16px;
      margin-bottom: 8px;
      align-items: center;

      .query-title {
        @include bold-text-14();
        margin-right: 12px;
      }
    }

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

  .param-listing {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
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
    .loading-icon {
      background: var(--panel-background-color);
    }
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

    &--error .__view {
      display: flex;
      align-items: center;
      pre {
        flex: 1;
        margin: 0;
        text-align: left;
        color: var(--danger);
        white-space: pre-wrap;
      }
    }
  }
}
</style>
