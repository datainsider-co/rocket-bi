<template>
  <div class="custom-table">
    <div :class="tableClass" :style="tableStyle" class="infinite-table">
      <vuescroll ref="tableBoundary" :style="tableBoundaryStyle" class="table-boundary" @handle-scroll="handleOnScroll">
        <div :style="scrollerStyle" class="fake-scroll-area"></div>
        <table ref="table" :class="{ 'hide-footer': !isShowFooter }"></table>
      </vuescroll>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { HeaderData, IndexedHeaderData, RowData } from '@/shared/models';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { ListUtils, TimeoutUtils } from '@/utils';
import { TableDataUtils } from '@chart/custom-table/TableDataUtils';
import { DebounceAction } from '@/shared/anotation/DebounceAction';
import { SortDirection } from '@core/common/domain/request';
import { TableController, TableProperties } from '@chart/custom-table/TableController';
import { ViewportController } from '@chart/custom-table/ViewportController';
import { Log, NumberUtils } from '@core/utils';
import { CustomCellCallBack } from '@chart/custom-table/TableData';
import { ToggleCollapseCallBack } from '@chart/custom-table/ToggleCollapseCallBack';
import { TableExtraData } from '@chart/custom-table/TableExtraData';
import vuescroll from 'vuescroll';
import { MethodProfiler } from '@/shared/profiler/Annotation';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';

@Component
export default class CustomTable extends Vue {
  private static readonly DEFAULT_COLUMN_WIDTH = 150;
  private defaultColumnWidth = CustomTable.DEFAULT_COLUMN_WIDTH;

  private tableWidth = 0;
  private totalHeight = 0;
  private totalWidth = 0;

  private scroller: any = void 0;
  // Shadow copy of rows
  private clonedRows: RowData[] = [];
  private mainHeaders: IndexedHeaderData[] = [];
  private sortAsMap = new Map<string, SortDirection>();

  private tableController: TableController = new TableController();
  private viewportController!: ViewportController;

  @Prop({ required: true, type: [String, Number] })
  private readonly id!: string;

  @Prop({ required: true, type: Array })
  private readonly rows!: RowData[];

  @Prop({ required: false, type: Number, default: 48 })
  private readonly rowHeight!: number;

  @Prop({ required: true, type: Array })
  private readonly headers!: HeaderData[];

  @Prop({ required: false, type: Number, default: 300 })
  private readonly maxHeight!: number;

  @Prop({ required: false, type: Number })
  private readonly cellWidth?: number;

  @Prop({ required: false, type: Boolean, default: true })
  private readonly isShowFooter!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private hasPinned!: boolean;

  @Prop({ required: false, type: Number, default: 1, validator: (value: any): boolean => value > 0 })
  private numPinnedColumn!: number;

  @Prop({ required: false, type: Boolean, default: false })
  private enableScrollBar!: boolean;

  @Prop({ required: false })
  private customCellCallBack?: CustomCellCallBack;

  @Prop({ required: false, type: Function })
  private customToggleCollapseFn?: ToggleCollapseCallBack;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disableSort!: boolean;

  @Prop({
    required: false,
    default: () => {
      return {};
    }
  })
  private readonly extraData!: TableExtraData;

  @Ref('table')
  private readonly table?: HTMLElement;

  @Ref()
  private readonly tableBoundary?: vuescroll;

  private get indexedHeaders(): IndexedHeaderData[] {
    const numRows = this.numHeaderRows;
    return TableDataUtils.indexingHeaders(this.headers, numRows);
  }

  private get numHeaderRows(): number {
    const header = this.headers.find(header => ListUtils.isNotEmpty(header.children));
    if (header) {
      return TableDataUtils.getDepth(header);
    } else {
      return 1;
    }
  }

  private get tableStyle(): CSSStyleDeclaration {
    return {
      // height: '100%',
      '--column-width': this.toPx(this.defaultColumnWidth),
      '--body-cell-height': this.toPx(this.currentRowHeight),
      '--header-cell-height': this.toPx(this.rowHeight),
      '--footer-cell-height': this.toPx(this.currentRowHeight),
      '--max-column-width': this.toPx(this.defaultColumnWidth)
    } as any;
  }

  private get tableBoundaryStyle(): CSSStyleDeclaration {
    return {
      height: this.toPx(this.maxHeight ?? 300)
    } as any;
  }

  private get tableClass(): any {
    return {
      'custom-scroll-bar': this.enableScrollBar
    };
  }

  private get scrollerStyle(): any {
    return { height: this.toPx(this.totalHeight), width: this.toPx(this.totalWidth) };
  }

  /**
   *     Hiên tại height = padding Top + Padding Bottom + ContentHeight - Border width
   *     Thuộc tính của table: box-sizing: border-box. như vậy border càng tăng thì ContentHeight sẽ càng giảm.
   *     Phải đổi thuộc tính của toàn bảng về content box để giữ cố định ContentHeight
   *     Nếu đổi box-sizing => bắt buộc phải tính lại toàn bộ size của table, như width - height
   */
  // FIXME: sử dụng Boxsizng: content-box cho table
  private get currentRowHeight(): number {
    const rowPadding = NumberUtils.fromPx(this.extraData.grid?.horizontal?.rowPadding) || 0;
    const paddingY: number = rowPadding * 2;
    return this.rowHeight + paddingY;
  }

  mounted() {
    this.mainHeaders = TableDataUtils.getMainHeaders(this.indexedHeaders);
    this.clonedRows = TableDataUtils.getExpandedRows(this.rows);
    window.addEventListener('resize', this.handleWindowResize);
    this.$root.$on(DashboardEvents.ResizeWidget, this.handleResizeWidget);
    this.initTable();
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.handleWindowResize);
    this.$root.$off(DashboardEvents.ResizeWidget, this.handleResizeWidget);
  }

  /**
   * Rerender lại table, nếu force thì table sẽ init lại từ đầu
   */
  public reRender(force?: boolean): void {
    if (force) {
      this.mainHeaders = TableDataUtils.getMainHeaders(this.indexedHeaders);
      this.clonedRows = TableDataUtils.getExpandedRows(this.rows);
      this.initTable();
    } else if (this.tableController && this.viewportController) {
      this.renderChunk(this.tableController, this.viewportController);
    }
  }

  clearSort() {
    this.sortAsMap.clear();
  }

  setSort(key: string, direction: SortDirection) {
    this.clearSort();
    this.sortAsMap.set(key, direction);
  }

  @Watch('extraData.grid.horizontal.rowPadding')
  private handleOnPaddingYChange(): void {
    this.initTable();
  }

  private getTableProperties(): TableProperties {
    return {
      hasPinned: this.hasPinned,
      numPinnedColumn: this.numPinnedColumn,
      emitOnSortChanged: this.handleOnSortChanged,
      sortAsMap: this.sortAsMap,
      headers: this.indexedHeaders,
      cellWidth: this.defaultColumnWidth,
      cellHeight: this.currentRowHeight,
      headerCellHeight: this.rowHeight,
      toggleCollapse: this.toggleCollapse,
      rows: this.clonedRows,
      mainHeaders: this.mainHeaders,
      customCellCallBack: this.customCellCallBack,
      extraData: this.extraData,
      disableSort: this.disableSort
    };
  }

  private handleResizeWidget(id: string): void {
    if (this.id == id) {
      this.initTable();
    }
  }

  private handleWindowResize(): void {
    this.initTable();
  }

  private calculateColumnWidth(screenSize: DOMRect, headers: IndexedHeaderData[], minColumnWidth?: number): number {
    const { width } = screenSize;
    const columnWidth = minColumnWidth ?? CustomTable.DEFAULT_COLUMN_WIDTH;
    const numColumnNonFixWidth = TableDataUtils.getTotalColumnNonFixWidth(headers);
    const fixedWidth = TableDataUtils.getFixedWidth(headers);
    const tableWidth = numColumnNonFixWidth * columnWidth + fixedWidth;

    if (tableWidth > width) {
      return columnWidth;
    } else {
      const unfixedWidth = width - fixedWidth;
      return unfixedWidth / numColumnNonFixWidth;
    }
  }

  private getTotalWidth(): number {
    const columnWidth = this.cellWidth ?? CustomTable.DEFAULT_COLUMN_WIDTH;
    const numColumnNonFixWidth = TableDataUtils.getTotalColumnNonFixWidth(this.mainHeaders);
    const fixedWidth = TableDataUtils.getFixedWidth(this.mainHeaders);
    return numColumnNonFixWidth * columnWidth + fixedWidth;
  }

  @DebounceAction({ timeDebounce: 350 })
  private initTable() {
    this.scroller = this.createScroller();

    if (this.tableBoundary) {
      const screenBoundary: DOMRect = this.tableBoundary.$el.getBoundingClientRect();
      Log.debug('initTable::width', screenBoundary.width, 'height::', screenBoundary.height);
      this.defaultColumnWidth = this.calculateColumnWidth(screenBoundary, this.mainHeaders, this.cellWidth);
      this.initController();
      this.viewportController.init(screenBoundary.width, screenBoundary.height);
      this.renderChunk(this.tableController, this.viewportController);
    }
  }

  private handleOnScroll(vertical: any, horizontal: any, event: MouseEvent): void {
    const targetEl = event.target as HTMLElement;
    const top = targetEl.scrollTop;
    const left = targetEl.scrollLeft;
    if (this.viewportController.canRepaint(top, left)) {
      this.viewportController.move(top, left);
      this.renderChunk(this.tableController, this.viewportController);
    }
    if (vertical.process === 1) {
      this.$emit('scrollEnd');
    } else if (vertical.process >= 0.6) {
      this.tableBoundary?.stop();
      this.$emit('beforeScrollEnd');
    }
  }

  @Watch('rows')
  private onDataChanged(newRows: RowData[]) {
    this.mainHeaders = TableDataUtils.getMainHeaders(this.indexedHeaders);
    this.clonedRows = TableDataUtils.getExpandedRows(this.rows);
    this.initTable();
  }

  private createScroller() {
    const div = document.createElement('div');
    div.classList.add('scroller');
    return div;
  }

  private toPx(num: number): string {
    return `${num}px`;
  }

  private toggleCollapse(rowData: RowData, rowIndex: number, header: HeaderData, columnIndex: number): void {
    if (this.customToggleCollapseFn) {
      this.customToggleCollapseFn({
        rowData: rowData,
        rowIndex: rowIndex,
        header: header,
        columnIndex: columnIndex,
        reRender: this.reRender,
        rows: this.rows,
        updateRows: (rows: RowData[]) => (this.clonedRows = rows)
      });
    } else {
      this._toggleCollapse(rowData, rowIndex, header, columnIndex);
    }
  }

  private _toggleCollapse(rowData: RowData, rowIndex: number, header: HeaderData, columnIndex: number): void {
    rowData.isExpanded = !rowData.isExpanded;
    const depth = (rowData.depth ?? 0) + 1;
    rowData.children = TableDataUtils.setDepth(rowData.children ?? [], depth);
    this.clonedRows = TableDataUtils.getExpandedRows(this.rows);
    this.renderChunk(this.tableController, this.viewportController);
  }

  private renderHeader(fragment: DocumentFragment, tableController: TableController, viewportController: ViewportController): void {
    const viewport = viewportController.getViewport();
    const header = tableController.renderHeader(viewport);
    fragment.append(header);
    this.tableWidth =
      this.tableWidth || [...header.querySelectorAll('tr th')].reduce((accum, el: any) => accum + el.offsetWidth, 0) + this.mainHeaders.length + 3;
  }

  private renderBody(fragment: DocumentFragment, tableController: TableController, viewPortController: ViewportController): void {
    const tbody: HTMLElement = this.tableController.renderBody(viewPortController.getViewport());
    fragment.appendChild(tbody);
  }

  private renderScroller(fragment: DocumentFragment, tableController: TableController): void {
    const viewport = this.viewportController.getViewport();
    this.scroller.style.height = this.toPx(viewport.rowIndexStart * this.currentRowHeight);
    this.scroller.style.width = this.toPx(viewport.fromColumnIndex * this.defaultColumnWidth);

    fragment.append(this.scroller);
  }

  private renderFooter(fragment: DocumentFragment, tableController: TableController, viewportController: ViewportController): void {
    const footer = tableController.renderFooter(viewportController.getViewport());
    fragment.appendChild(footer);
  }

  private canRenderFooter(): boolean {
    return this.isShowFooter;
  }

  // có thể add debounce for smooth
  @MethodProfiler({ name: 'renderChunk', prefix: 'CustomTable' })
  private renderChunk(tableController: TableController, viewportController: ViewportController): void {
    if (this.table) {
      TableTooltipUtils.hideTooltip();
      tableController.init(this.getTableProperties());
      const fragment: DocumentFragment = document.createDocumentFragment();
      this.renderScroller(fragment, tableController);
      this.renderHeader(fragment, tableController, viewportController);
      this.renderBody(fragment, tableController, viewportController);

      if (this.canRenderFooter()) {
        this.renderFooter(fragment, tableController, viewportController);
      }

      this.totalHeight = this.currentRowHeight * this.rows.length;
      this.totalWidth = this.getTotalWidth();

      this.table.innerHTML = '';
      this.table.append(fragment);
    }
  }

  @Emit('sortChanged')
  private handleOnSortChanged(header: HeaderData): HeaderData {
    this.renderChunk(this.tableController, this.viewportController);
    Log.debug('handleOnSortChanged::', header.label);
    return header;
  }

  private initController() {
    this.viewportController = new ViewportController(this.currentRowHeight, this.defaultColumnWidth);
  }
}
</script>

<style lang="scss" src="./Table.scss"></style>
