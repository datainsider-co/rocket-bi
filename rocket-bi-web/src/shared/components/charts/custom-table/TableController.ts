/*
 * @author: tvc12 - Thien Vi
 * @created: 5/14/21, 11:14 AM
 */

import { BodyRowData, TableBodyRenderEngine } from '@chart/custom-table/body/TableBodyRenderEngine';
import { FooterCellData, TableFooterRenderEngine } from '@chart/custom-table/footer/TableFooterRenderEngine';
import { HeaderData, IndexedHeaderData, RowData, ViewPort } from '@/shared/models';
import { TableHeaderRenderEngine } from '@chart/custom-table/header/TableHeaderRenderEngine';
import { HeaderController, HeaderRowData } from '@chart/custom-table/header/HeaderController';
import { HeaderControllerBuilder } from '@chart/custom-table/header/HeaderControllerBuilder';
import { SortDirection } from '@core/common/domain/request';
import { BodyController } from '@chart/custom-table/body/BodyController';
import { BodyControllerBuilder } from '@chart/custom-table/body/BodyControllerBuilder';
import { FooterController } from '@chart/custom-table/footer/FooterController';
import { CustomCellCallBack } from '@chart/custom-table/TableData';
import { TableExtraData } from '@chart/custom-table/TableExtraData';

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
