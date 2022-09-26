/*
 * @author: tvc12 - Thien Vi
 * @created: 5/14/21, 11:14 AM
 */

import { BodyRowData, TableBodyRenderEngine } from '@chart/CustomTable/Body/TableBodyRenderEngine';
import { FooterCellData, TableFooterRenderEngine } from '@chart/CustomTable/Footer/TableFooterRenderEngine';
import { HeaderData, IndexedHeaderData, RowData, ViewPort } from '@/shared/models';
import { TableHeaderRenderEngine } from '@chart/CustomTable/Header/TableHeaderRenderEngine';
import { HeaderController, HeaderRowData } from '@chart/CustomTable/Header/HeaderController';
import { HeaderControllerBuilder } from '@chart/CustomTable/Header/HeaderControllerBuilder';
import { SortDirection } from '@core/domain/Request';
import { BodyController } from '@chart/CustomTable/Body/BodyController';
import { BodyControllerBuilder } from '@chart/CustomTable/Body/BodyControllerBuilder';
import { FooterController } from '@chart/CustomTable/Footer/FooterController';
import { CustomCellCallBack } from '@chart/CustomTable/TableData';
import { TableExtraData } from '@chart/CustomTable/TableExtraData';

export interface TableProperties {
  rows: RowData[];
  mainHeaders: IndexedHeaderData[];
  headers: IndexedHeaderData[];
  headerCellHeight: number;
  cellHeight: number;
  cellWidth: number;
  toggleCollapse: (rowData: RowData, rowIndex: number, header: HeaderData, columnIndex: number) => void;
  sortAsMap: Map<string, SortDirection>;
  emitOnSortChanged: (header: HeaderData) => void;
  hasPinned: boolean;
  numPinnedColumn: number;
  customCellCallBack?: CustomCellCallBack;
  extraData: TableExtraData;
  disableSort: boolean;
}

export class TableController {
  private headerController!: HeaderController;
  private bodyController!: BodyController;
  private bodyRenderEngine!: TableBodyRenderEngine;
  private footerRenderEngine!: TableFooterRenderEngine;
  private footerController!: FooterController;

  init(tableData: TableProperties) {
    const {
      mainHeaders,
      rows,
      toggleCollapse,
      cellHeight,
      headerCellHeight,
      cellWidth,
      headers,
      sortAsMap,
      emitOnSortChanged,
      hasPinned,
      numPinnedColumn,
      customCellCallBack,
      extraData,
      disableSort
    } = tableData;
    this.bodyRenderEngine = new TableBodyRenderEngine();
    this.footerRenderEngine = new TableFooterRenderEngine();
    this.headerController = new HeaderControllerBuilder()
      .withCellInfo(cellWidth, headerCellHeight)
      .withHeaderData(headers, mainHeaders)
      .withRowData(rows)
      .withSortData(sortAsMap, emitOnSortChanged)
      .withPinnedData(hasPinned, numPinnedColumn)
      .withCustomRender(customCellCallBack)
      .withDisableSort(disableSort)
      .build();

    this.bodyController = new BodyControllerBuilder()
      .withDefaultFormatter()
      .withTableData(mainHeaders, rows)
      .withMinCellWidth(cellWidth)
      .withPinnedData(hasPinned, numPinnedColumn)
      .withToggleCollapseEvent(toggleCollapse)
      .withCustomRender(customCellCallBack)
      .build();
    this.footerController = new FooterController(mainHeaders, cellWidth, hasPinned, numPinnedColumn, extraData, customCellCallBack);
  }

  renderFooter(viewPort: ViewPort): any {
    const cellData: FooterCellData[] = this.footerController.getFooterCellData(viewPort);
    return this.footerRenderEngine.renderFooter(cellData);
  }

  renderBody(viewPort: ViewPort): HTMLElement {
    const listCellData: BodyRowData[] = this.bodyController.getListRowData(viewPort);
    return this.bodyRenderEngine.renderBody(listCellData);
  }

  renderHeader(viewport: ViewPort): HTMLElement {
    const listCellData: HeaderRowData[] = this.headerController.getAllHeaderRowData(viewport);
    return TableHeaderRenderEngine.renderHeaders(listCellData);
  }
}
