/*
 * @author: tvc12 - Thien Vi
 * @created: 6/9/21, 1:23 PM
 */

import { Component, Prop, Ref, Watch } from 'vue-property-decorator';
import NProgress from 'nprogress';
import { BPagination } from 'bootstrap-vue';
import { DefaultPaging, DefaultSettingColor } from '@/shared/enums';
import { PivotTableChartOption, PivotTableOptionData, PivotTableQuerySetting } from '@core/common/domain/model';
import { ClassProfiler } from '@/shared/profiler/Annotation';
import { HeaderData, Pagination, RowData } from '@/shared/models';
import { GroupTableResponse } from '@core/common/domain/response/query/GroupTableResponse';
import { AbstractTableResponse } from '@core/common/domain/response/query/AbstractTableResponse';
import Color from 'color';
import PaginationComponent from '@chart/table/Pagination.vue';
import { BaseWidget } from '@/screens/dashboard-detail/components/widget-container/BaseWidget';
import '../TableStyle.scss';
import { WidgetRenderer } from '@chart/widget-renderer';
import { DashboardControllerModule } from '@/screens/dashboard-detail/stores/controller/DashboardControllerStore';
import CustomTable from '@chart/custom-table/CustomTable.vue';
import { CustomBodyCellData, CustomFooterCellData, CustomHeaderCellData, CustomStyleData, CustomTableProp } from '@chart/custom-table/TableData';
import { PivotTableRenderer } from '@chart/table/pivot-table/render/PivotTableRenderer';
import { ListUtils, PopupUtils } from '@/utils';
import { TableBodyStyleRender } from '@chart/table/style-render/TableBodyStyleRender';
import { TableDataUtils } from '@chart/custom-table/TableDataUtils';
import { Log } from '@core/utils';
import { ObjectUtils } from '@core/utils/ObjectUtils';
import { StringUtils } from '@/utils/StringUtils';
import { ToggleCollapseData } from '@chart/custom-table/ToggleCollapseData';
import { PivotTableBodyStyleRender } from '@chart/table/pivot-table/style/body/PivotTableBodyStyleRender';
import { TableHeaderStyleRender } from '@chart/table/style-render/TableHeaderStyleRender';
import { TableFooterStyleRender } from '@chart/table/style-render/TableFooterStyleRender';
import { PivotTableFooterStyleRender } from '@chart/table/pivot-table/style/footer/PivotTableFooterStyleRender';
import { PivotTableHeaderStyleRender } from '@chart/table/pivot-table/style/header/PivotTableHeaderStyleRender';
import { TableStyleUtils } from '@chart/table/TableStyleUtils';
import { MouseEventData } from '@chart/BaseChart';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import { DIException, ExportType } from '@core/common/domain';
import { Di } from '@core/common/modules';
import { SummarizeFunction } from '@/shared/components/chat/controller/functions/SummarizeFunction';
import { ForecastFunction } from '@/shared/components/chat/controller/functions/ForecastFunction';

@Component({
  components: {
    PaginationComponent,
    CustomTable
  }
})
@ClassProfiler({ prefix: 'TableChart' })
export default class PivotTable extends BaseWidget {
  private readonly pagination: Pagination;
  private internalTableResponse: AbstractTableResponse;
  private isSmallContainer: boolean;
  private isShowEntries: boolean;
  protected renderer: WidgetRenderer<PivotTable> = new PivotTableRenderer();
  private bodyStyleRender!: TableBodyStyleRender;
  private headerStyleRender!: TableHeaderStyleRender;
  private footerStyleRender!: TableFooterStyleRender;

  @Prop({ required: true })
  private readonly querySetting!: PivotTableQuerySetting;

  @Prop({ required: true })
  private readonly chartData!: AbstractTableResponse;

  @Prop({ type: Boolean, default: false })
  private readonly isPreview?: boolean;

  @Prop({ type: Number, default: 1 })
  readonly tableChartTempId!: number;

  @Prop({ required: false, type: Boolean, default: false })
  readonly disableSort!: boolean;

  @Ref()
  private readonly tableContent?: HTMLElement;

  private maxHeight: number | null = null;

  @Ref()
  private refPaginationComponent!: PaginationComponent;

  private get refPagination(): BPagination {
    return this.refPaginationComponent.refPagination;
  }

  @Ref()
  private readonly divTableChart!: HTMLElement;

  @Ref('table')
  private readonly table?: CustomTable;

  constructor() {
    super();
    NProgress.configure({ easing: 'ease', speed: 500, showSpinner: false });
    this.internalTableResponse = GroupTableResponse.empty();
    this.isShowEntries = true;
    this.isSmallContainer = false;
    this.pagination = new Pagination({ page: 1, rowsPerPage: this.defaultRowsPerPage });
  }

  private get vizSetting(): PivotTableChartOption | null {
    return this.querySetting.getChartOption<PivotTableChartOption>() ?? null;
  }

  private get chartId() {
    return this.tableChartTempId;
  }

  get title(): string {
    return this.vizSetting?.getTitle() ?? '';
  }

  get subTitle(): string {
    return this.vizSetting?.getSubtitle() ?? '';
  }

  private get backgroundColor() {
    return this.vizSetting?.getBackgroundColor() || '#00000000';
  }

  private get headerColor() {
    const color = new Color(this.backgroundColor);
    return color.alpha(1).toString();
  }

  private get textColor() {
    return this.vizSetting?.getTextColor() || '#FFFFFFCC';
  }

  ///Title Style

  get titleStyle() {
    const options = this.vizSetting?.options ?? {};
    const titleStyle = {
      color: this.vizSetting?.getTitleColor(),
      'font-size': this.vizSetting?.getTitleFontSize(),
      'text-align': this.vizSetting?.getTitleAlign(),
      'font-family': options.title?.style?.fontFamily,
      'font-weight': options.title?.style?.fontWeight,
      'font-style': options.title?.style?.fontStyle,
      'background-color': options.title?.backgroundColor,
      'white-space': options.title?.isWordWrap ? 'pre-wrap' : 'nowrap'
    };
    return ObjectUtils.removeKeyIfValueNotExist(titleStyle);
  }

  get titleAlign() {
    return this.vizSetting?.getTitleAlign();
  }

  ///Subtitle Style

  get subtitleStyle() {
    const options = this.vizSetting?.options ?? {};
    const subtitleStyle = {
      color: this.vizSetting?.getSubtitleColor(),
      'font-size': this.vizSetting?.getSubtitleFontSize(),
      'text-align': this.vizSetting?.getSubtitleAlign(),
      'font-family': options.subtitle?.style?.fontFamily,
      'font-weight': options.subtitle?.style?.fontWeight,
      'font-style': options.subtitle?.style?.fontStyle,
      'text-decoration': options.subtitle?.style?.textDecoration,
      'background-color': options.subtitle?.backgroundColor,
      'white-space': options.subtitle?.isWordWrap ? 'pre-wrap' : 'nowrap'
    };
    return ObjectUtils.removeKeyIfValueNotExist(subtitleStyle);
  }

  get subtitleAlign() {
    return this.vizSetting?.getSubtitleAlign();
  }

  get tableStyle() {
    return {
      '--background-color': this.backgroundColor,
      ...this.getPivotSettingStyle(this.vizSetting)
    };
  }

  private get perPageBackgroundColor() {
    if (!this.backgroundColor) {
      return DefaultSettingColor.defaultBackgroundColor;
    }
    return this.backgroundColor;
  }

  private get totalRows() {
    return this.internalTableResponse.total;
  }

  private get defaultRowsPerPage() {
    return DefaultPaging.DefaultPageSize;
  }

  get nprocessParentId() {
    return `table-chart-${this.chartId}`;
  }

  private get headers(): HeaderData[] {
    if (this.querySetting.canDrilldown()) {
      return this.assignDrilldownLevel(this.internalTableResponse.headers, this.querySetting.getDrilldownLevel());
    } else {
      return this.internalTableResponse.headers;
    }
  }

  private assignDrilldownLevel(headers: HeaderData[], level: number): HeaderData[] {
    const firstColumn: HeaderData | undefined = ListUtils.getHead(headers);
    if (firstColumn) {
      firstColumn.drilldownLevel = level;
    }
    return headers;
  }

  private get rows(): any[][] {
    return this.internalTableResponse.records;
  }

  mounted() {
    this.renderer = this.getTableRenderer();
    this.initCustomStyle();
    this.$nextTick(() => {
      this.onResize();
    });
  }

  private initCustomStyle() {
    const themeColor = this.baseThemeColor;
    this.bodyStyleRender = new PivotTableBodyStyleRender(this.internalTableResponse, this.querySetting, themeColor);
    this.footerStyleRender = new PivotTableFooterStyleRender(this.internalTableResponse, this.querySetting, themeColor);
    this.headerStyleRender = new PivotTableHeaderStyleRender(this.internalTableResponse, this.querySetting, themeColor);
  }

  private getTableRenderer(): WidgetRenderer<PivotTable> {
    return new PivotTableRenderer();
  }

  resize(): void {
    this.onResize();
  }

  @Watch('chartData', { immediate: true, deep: true })
  private onChartDataChanged(newResponse: AbstractTableResponse) {
    this.internalTableResponse = newResponse;
  }

  @Watch('internalTableResponse', { immediate: true, deep: true })
  handleInternalTableResponseChanged() {
    this.initCustomStyle();
    this.initEngine();
    // this.table?.reRender();
  }

  @Watch('vizSetting', { immediate: true, deep: true })
  onChartSettingChanged() {
    this.initCustomStyle();
    this.initEngine();
    this.$nextTick(() => {
      this.table?.reRender();
    });
  }

  @Watch('baseThemeColor')
  onBaseThemeChanged() {
    this.initCustomStyle();
    this.initEngine();
    this.$nextTick(() => {
      this.table?.reRender();
    });
  }

  private initEngine() {
    this.renderer = this.getTableRenderer();
  }

  async onPageChanged(page: number) {
    this.showLoading();
    this.pagination.page = page;
    this.internalTableResponse = await this.handlePagingAction();
    this.handleResponsiveForPagingControl();
    this.hideLoading();
  }

  async handleSortChanged(header: HeaderData) {
    this.showLoading();
    this.pagination.updateSort(header.label);
    this.internalTableResponse = await this.handlePagingAction();
    this.hideLoading();
  }

  async perPageChanged(value: number) {
    this.showLoading();
    this.pagination.rowsPerPage = value;
    this.pagination.page = 1;
    this.internalTableResponse = await this.handlePagingAction();
    this.hideLoading();
  }

  private async handlePagingAction(): Promise<AbstractTableResponse> {
    const payload = { widgetId: this.chartId, pagination: this.pagination };
    return DashboardControllerModule.loadDataWithPagination(payload).then(data => data as AbstractTableResponse);
  }

  private onResize() {
    this.updateTableSize();
    this.handleResponsiveForPagingControl();
    this.initEngine();
  }

  private handleResponsiveForPagingControl() {
    if (this.divTableChart) {
      if (this.refPagination) {
        this.showAllPagingControl();
        if (this.divTableChart.clientWidth <= 400) {
          this.hidePagingNumberAndFirstLastControl();
          this.isShowEntries = false;
        }
        if (this.divTableChart.clientWidth <= 200) {
          this.isSmallContainer = true;
          this.isShowEntries = false;
        }
      } else {
        if (this.divTableChart.clientWidth > 200) {
          this.isSmallContainer = false;
          this.isShowEntries = false;
        }
      }
    }
  }

  private showAllPagingControl() {
    this.isShowEntries = true;
    for (let index = 0; index < this.refPagination.$el.children.length; index++) {
      // @ts-ignore
      this.refPagination.$el.children[index].hidden = false;
    }
  }

  private hidePagingNumberAndFirstLastControl() {
    let showItem = 5;
    if (this.refPagination.$el.children.length === 5) {
      showItem = 3;
    }
    if (this.refPagination.$el.children.length === 6) {
      showItem = 4;
    }
    for (let index = 0; index < this.refPagination.$el.children.length; index++) {
      const element = this.refPagination.$el.children[index];
      if (index !== 1 && index !== showItem && !element.classList.contains('active')) {
        // @ts-ignore
        element.hidden = true;
      }
    }
  }

  private updateTableSize() {
    this.maxHeight = this.tableContent?.clientHeight ?? 300;
  }

  get tableProps(): CustomTableProp {
    return {
      id: this.chartId,
      maxHeight: this.maxHeight,
      rows: this.rows,
      headers: this.headers,
      isShowFooter: this.isShowFooter,
      enableScrollBar: this.enableScrollBar,
      hasPinned: this.hasPinned,
      disableSort: this.disableSort,
      customCellCallBack: {
        customBodyCellStyle: this.customRenderCellStyle,
        customHeaderCellStyle: this.customHeaderCellStyle,
        customFooterCellStyle: this.customFooterCellStyle,
        onContextMenu: this.showContextMenu
      },
      customToggleCollapseFn: this.handleToggleCollapse,
      extraData: this.vizSetting?.options
    };
  }

  private get hasPinned(): boolean {
    return ListUtils.isNotEmpty(this.querySetting.rows);
  }

  private get enableScrollBar(): boolean {
    return true;
    // if (this.vizSetting && Scrollable.isScrollable(this.vizSetting)) {
    //   return this.vizSetting.enableScrollBar();
    // } else {
    //   return false;
    // }
  }

  private get isShowFooter(): boolean {
    return ListUtils.isNotEmpty(this.querySetting.rows) && !!this.vizSetting?.enableFooter?.call(this.vizSetting);
  }

  get paginationProps(): any {
    return {
      isShowEntries: this.isShowEntries,
      pagination: this.pagination,
      perPageBackgroundColor: this.perPageBackgroundColor,
      totalRows: this.totalRows,
      enable: this.enablePagination
    };
  }

  private customRenderCellStyle(data: CustomBodyCellData): CustomStyleData {
    return this.bodyStyleRender.createStyle(data);
  }

  get enablePagination(): boolean {
    const isNotLoadAll = this.internalTableResponse.total !== this.internalTableResponse.records.length;
    const isShowPagination = isNotLoadAll || this.internalTableResponse.total > 20;
    return ListUtils.isNotEmpty(this.querySetting.rows) && isShowPagination;
  }

  get headerProps() {
    const currentSetting: PivotTableOptionData = this.vizSetting?.options ?? {};
    const props = {
      enableTitle: (currentSetting.title?.enabled ?? true) && StringUtils.isNotEmpty(currentSetting.title?.text),
      enableSubtitle: (currentSetting.subtitle?.enabled ?? true) && StringUtils.isNotEmpty(currentSetting.subtitle?.text),
      title: this.title ?? currentSetting.title?.text,
      subTitle: this.subTitle,
      titleAlign: this.titleAlign ?? currentSetting.title?.align,
      subtitleAlign: this.subtitleAlign,
      titleStyle: this.titleStyle ?? currentSetting.title?.style,
      subtitleStyle: this.subtitleStyle
    };
    return props;
  }

  private handleToggleCollapse(payload: ToggleCollapseData): void {
    const { reRender, rowData, updateRows, rows } = payload;
    rowData.isExpanded = !rowData.isExpanded;
    if (rowData.isExpanded) {
      this.handleLoadSubRow(payload);
    } else {
      const clonedRows: RowData[] = TableDataUtils.getExpandedRows(rows);
      updateRows(clonedRows);
    }
    reRender();
  }

  private async handleLoadSubRow(payload: ToggleCollapseData): Promise<void> {
    try {
      this.showLoading();
      const { reRender, rowData, updateRows, rows, header } = payload;
      const depth: number = (rowData.depth ?? 0) + 1;
      const children: RowData[] = await this.getSubRows(rowData, header.key);
      const childrenWithExtraData = TableDataUtils.assignExtraData(children, { depth: depth, parent: rowData });
      Object.assign(rowData.children, childrenWithExtraData);
      const clonedRows: RowData[] = TableDataUtils.getExpandedRows(rows);
      updateRows(clonedRows);
      reRender();
      this.hideLoading();
    } catch (ex) {
      Log.error('handleLoadSubRow::error', ex);
      this.hideLoading();
    }
  }

  private async getSubRows(rowData: RowData, valueKey: string): Promise<RowData[]> {
    if (ListUtils.isNotEmpty(rowData.children)) {
      return rowData.children;
    } else {
      return DashboardControllerModule.loadSubRows({
        id: this.chartId,
        setting: this.querySetting,
        pagination: this.pagination,
        currentRow: rowData,
        valueKey: valueKey
      });
    }
  }

  private showLoading() {
    NProgress.configure({ parent: `#${this.nprocessParentId}` }).start();
  }

  private hideLoading() {
    NProgress.configure({ parent: `#${this.nprocessParentId}` }).done();
  }

  private getPivotSettingStyle(setting?: PivotTableChartOption | null) {
    const currentSetting: PivotTableOptionData = setting?.options ?? {};
    const widgetColor: string | undefined = currentSetting.background;
    const baseThemeColor: string = this.baseThemeColor;
    const cssObject = {
      '--table-header-color': currentSetting.header?.style?.color,
      '--header-background-color': TableStyleUtils.combineColor(baseThemeColor, currentSetting.header?.backgroundColor, widgetColor),
      '--header-font-family': currentSetting.header?.style?.fontFamily,
      '--header-font-size': StringUtils.toPx(currentSetting.header?.style?.fontSize),
      '--header-white-space': currentSetting.header?.isWordWrap ? 'normal' : void 0,
      '--header-text-align': currentSetting.header?.align,
      // row
      '--row-even-color': currentSetting.value?.color,
      '--row-even-background-color': TableStyleUtils.combineColor(baseThemeColor, currentSetting.value?.backgroundColor, widgetColor),
      '--row-odd-color': currentSetting.value?.alternateColor,
      '--row-odd-background-color': TableStyleUtils.combineColor(baseThemeColor, currentSetting.value?.alternateBackgroundColor, widgetColor),
      '--row-font-family': currentSetting.value?.style?.fontFamily,
      '--row-font-size': StringUtils.toPx(currentSetting.value?.style?.fontSize),
      '--row-white-space': currentSetting.value?.style?.isWordWrap ? 'normal' : void 0,
      // '--row-text-align': currentSetting.value?.align,
      // footer
      '--footer-color': currentSetting.total?.label?.style?.color,
      '--footer-background-color': TableStyleUtils.combineColor(baseThemeColor, currentSetting.total?.backgroundColor, widgetColor),
      '--footer-font-family': currentSetting.total?.label?.style?.fontFamily,
      '--footer-font-size': StringUtils.toPx(currentSetting.total?.label?.style?.fontSize),
      '--footer-white-space': currentSetting.total?.label?.style?.isWordWrap ? 'normal' : void 0,
      '--footer-text-align': currentSetting.total?.label?.align,
      //grid
      ...TableStyleUtils.getGridStyle(currentSetting.grid),
      '--grid-horizontal-padding': StringUtils.toPx(currentSetting.grid?.horizontal?.rowPadding),
      // tooltip
      '--tooltip-background-color': currentSetting.tooltip?.backgroundColor,
      '--tooltip-color': currentSetting.tooltip?.valueColor,
      '--tooltip-font-family': currentSetting.tooltip?.fontFamily,
      // toggle icon
      '--toggle-icon-background-color': currentSetting.toggleIcon?.backgroundColor,
      '--toggle-icon-color': currentSetting.toggleIcon?.color,
      // paging
      '--table-page-active-color': currentSetting.header?.style?.color
    };
    return ObjectUtils.removeKeyIfValueNotExist(cssObject);
  }

  private customHeaderCellStyle(cellData: CustomHeaderCellData) {
    return this.headerStyleRender.createStyle(cellData);
  }

  private customFooterCellStyle(cellData: CustomFooterCellData) {
    return this.footerStyleRender.createStyle(cellData);
  }

  private showContextMenu(mouseData: MouseEventData<string>): void {
    TableTooltipUtils.hideTooltip();
    Log.debug('pivot::showContextMenu', mouseData);
    this.$root.$emit(DashboardEvents.ClickDataPoint, this.chartId, mouseData);
  }

  async export(type: ExportType): Promise<void> {
    await DashboardControllerModule.handleExport({ widgetId: this.chartId, type: type });
  }

  async copyToAssistant(): Promise<void> {
    try {
      const type = ExportType.CSV;
      const widgetData = await DashboardControllerModule.getWidgetData({ widgetId: this.chartId, type: type });
      this.$root.$emit(DashboardEvents.ParseToAssistant, widgetData);
    } catch (e) {
      Log.error(e);
    }
  }

  get fncPayload() {
    return {
      type: 'Pivot table',
      response: this.internalTableResponse,
      format: GroupTableResponse.empty()
    };
  }

  async foreCast(): Promise<void> {
    try {
      this.showLoading();
      const forecastData = (await Di.get(ForecastFunction).execute(this.fncPayload)) as AbstractTableResponse;
      Log.debug(`foreCast::`, forecastData);

      this.internalTableResponse = forecastData;
    } catch (e) {
      Log.error(e);
      PopupUtils.showError(DIException.fromObject(e).getPrettyMessage());
    } finally {
      this.hideLoading();
    }
  }

  async summarize() {
    try {
      this.showLoading();
      const content = await Di.get(SummarizeFunction).execute(this.fncPayload);
      this.$root.$emit(DashboardEvents.ShowEditDescriptionModal, this.chartId, content);
      Log.debug('summarize::', content);
    } catch (ex) {
      Log.error(ex);
      const exception = DIException.fromObject(ex);
      PopupUtils.showError(exception.getPrettyMessage());
    } finally {
      this.hideLoading();
    }
  }

  handleOnRightClick(e: MouseEvent) {
    Log.debug('PivotTable::handleOnClick::event::', e);
    e.preventDefault();
    this.showContextMenu(new MouseEventData<string>(e, ''));
  }
}
