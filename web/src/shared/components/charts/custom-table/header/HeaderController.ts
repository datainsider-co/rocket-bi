/*
 * @author: tvc12 - Thien Vi
 * @created: 5/16/21, 3:28 PM
 */

import { CustomHeader, HeaderData, IndexedHeaderData, RowData, ViewPort } from '@/shared/models';
import { SortDirection } from '@core/common/domain/request';
import { HeaderCellData } from '@chart/custom-table/header/TableHeaderRenderEngine';
import { TableDataUtils } from '@chart/custom-table/TableDataUtils';
import { DomUtils, ListUtils } from '@/utils';
import { isFunction, isNumber } from 'lodash';
import { CustomCellCallBack, CustomStyleData } from '@chart/custom-table/TableData';
import { JsonUtils } from '@core/utils';

export type HeaderRowData = HeaderCellData[];

export class HeaderController {
  private hasPinned: boolean;
  private numPinnedSize: number;
  private headers: IndexedHeaderData[];
  private mainHeaders: IndexedHeaderData[];
  private rows: RowData[];
  private sortAsMap: Map<string, SortDirection>;
  private onClickSort?: (header: HeaderData) => void;
  private cellWidth: number;
  private cellHeight: number;
  private customCellCallBack?: CustomCellCallBack;
  private disableSort: boolean;

  constructor(
    hasPinned: boolean,
    numPinnedSize: number,
    headers: IndexedHeaderData[],
    mainHeaders: IndexedHeaderData[],
    rows: RowData[],
    cellWidth: number,
    cellHeight: number,
    sortAsMap: Map<string, SortDirection>,
    onClickSort?: (header: HeaderData) => void,
    customCellCallBack?: CustomCellCallBack,
    disableSort?: boolean
  ) {
    this.hasPinned = hasPinned;
    this.numPinnedSize = numPinnedSize;
    this.headers = headers;
    this.mainHeaders = mainHeaders;
    this.rows = rows;
    this.sortAsMap = sortAsMap;
    this.onClickSort = onClickSort;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.customCellCallBack = customCellCallBack;
    this.disableSort = disableSort ?? false;
  }

  setHeaders(headers: IndexedHeaderData[]) {
    this.headers = headers;
  }

  setMainHeaders(mainHeaders: IndexedHeaderData[]) {
    this.mainHeaders = mainHeaders;
  }

  setRows(rows: RowData[]) {
    this.rows = rows;
  }

  getAllHeaderRowData(viewport: ViewPort): HeaderRowData[] {
    const pinnedHeaders: HeaderRowData[] = this.getPinnedHeaders();
    const virtualHeaders: HeaderRowData[] = this.getVirtualHeaders(viewport);
    const currentHeaders: HeaderRowData[] = this.getHeaders(viewport);
    return this.mergeHeaderRowData(pinnedHeaders, virtualHeaders, currentHeaders);
  }

  private mergeHeaderRowData(pinnedHeaders: HeaderRowData[], virtualHeaders: HeaderRowData[], currentHeaders: HeaderRowData[]): HeaderRowData[] {
    const maxRows = Math.max(pinnedHeaders.length, virtualHeaders.length, currentHeaders.length);
    const allHeaderRowData = [];
    for (let index = 0; index < maxRows; ++index) {
      const pinnedRowHeaders: HeaderCellData[] = pinnedHeaders[index] ?? [];
      const virtualRowHeaders: HeaderCellData[] = virtualHeaders[index] ?? [];
      const rowHeaders: HeaderCellData[] = currentHeaders[index] ?? [];
      allHeaderRowData.push(pinnedRowHeaders.concat(virtualRowHeaders, rowHeaders));
    }
    return allHeaderRowData;
  }

  private calculatedFromIndex(currentFromColumnIndex: number): number {
    if (this.hasPinned && currentFromColumnIndex < this.numPinnedSize) {
      return this.numPinnedSize;
    } else {
      return currentFromColumnIndex;
    }
  }

  private getHeaders(viewport: ViewPort): HeaderRowData[] {
    const fromColumnIndex: number = this.calculatedFromIndex(viewport.fromColumnIndex);
    const indexedHeaders: IndexedHeaderData[] = TableDataUtils.getIndexedHeaders(this.headers, fromColumnIndex, viewport.toColumnIndex);
    const allHeadersAsList: IndexedHeaderData[][] = TableDataUtils.getIndexedHeadersAsList(indexedHeaders).filter(ListUtils.isNotEmpty);
    return allHeadersAsList.map(headers => this.toHeaderRowData(headers));
  }

  private toHeaderRowData(headers: IndexedHeaderData[]): HeaderRowData {
    return headers.map(header => this.toHeaderCellData(header));
  }

  private toVirtualHeaderRowData(headers: IndexedHeaderData[]): HeaderRowData {
    return headers.map(header => this.toVirtualHeaderCellData(header));
  }

  private toPinnedHeaderRow(headers: IndexedHeaderData[]): HeaderRowData {
    return headers.map(header => this.toPinnedHeaderCellData(header));
  }

  private toPinnedHeaderCellData(header: IndexedHeaderData): HeaderCellData {
    const cellData = this.toHeaderCellData(header);
    cellData.left = header.columnIndex * this.cellWidth;
    cellData.classList.push('pinned');
    return cellData;
  }

  private toVirtualHeaderCellData(header: IndexedHeaderData): HeaderCellData {
    const cellData = this.toHeaderCellData(header);
    cellData.width = header.colSpan * this.cellWidth;
    return cellData;
  }

  private toHeaderCellData(header: IndexedHeaderData): HeaderCellData {
    return {
      rowSpan: header.rowSpan,
      colSpan: header.colSpan,
      colIndex: header.columnIndex,
      top: header.rowIndex * this.cellHeight,
      data: header.label,
      left: void 0,
      classList: this.getClassList(header),
      hasSort: this.hasSort(header),
      onClick: () => this.handleSort(header),
      sortDirection: this.sortAsMap.get(header.label) ?? SortDirection.Asc,
      customStyle: this.createCustomStyle(header),
      cellContent: this.renderCustom(header)
    };
  }

  private renderCustom(header: IndexedHeaderData): HTMLElement | HTMLElement[] | string | undefined {
    if (CustomHeader.isCustomHeader(header.customRenderHeader)) {
      return header.customRenderHeader.render(header);
    } else {
      return void 0;
    }
  }

  private handleSort(header: IndexedHeaderData): void {
    // TODO: hardcode disable sort with pivot
    const enablePivotSort = this.enablePivotSort(header) && !header.disableSort && !this.disableSort;
    if (enablePivotSort) {
      const currentSortDirection = this.getNewSortDirection(header.label);
      // FIXME: sortAsMap must sync with Pagination
      this.sortAsMap.clear();
      this.sortAsMap.set(header.label, currentSortDirection);
      this.onClickSort?.call(this, header);
    }
  }

  private enablePivotSort(header: IndexedHeaderData): boolean {
    // TODO: hardcode disable sort with pivot
    return !(ListUtils.isNotEmpty(header.children) || header.rowIndex > 0);
  }

  private getNewSortDirection(label: string) {
    const currentSortDirection = this.sortAsMap.get(label) ?? SortDirection.Desc;
    switch (currentSortDirection) {
      case SortDirection.Desc:
        return SortDirection.Asc;
      case SortDirection.Asc:
        return SortDirection.Desc;
    }
  }

  private hasSort(header: IndexedHeaderData): boolean {
    const enablePivotSort = this.enablePivotSort(header);
    const hasLabel = !!header.label;
    const enableSort = !header.disableSort;
    return enableSort && enablePivotSort && hasLabel && this.sortAsMap.has(header.label);
  }

  private getClassList(header: IndexedHeaderData): string[] {
    const classList: string[] = [];
    if (header.key == '0' || !!header.key) {
      classList.push('cursor-pointer');
    }
    return classList;
  }

  private getVirtualHeaders(viewport: ViewPort): HeaderRowData[] {
    const virtualHeader: IndexedHeaderData | undefined = TableDataUtils.createVirtualHeader(this.headers, viewport, this.hasPinned, this.numPinnedSize - 1);
    if (virtualHeader) {
      const flattenHeaders: IndexedHeaderData[][] = TableDataUtils.getIndexedHeadersAsList([virtualHeader]).filter(ListUtils.isNotEmpty);
      return this.removeHeaderHasEmptySize(flattenHeaders).map(header => this.toVirtualHeaderRowData(header));
    }
    return [];
  }

  private removeHeaderHasEmptySize(listVirtualHeaders: IndexedHeaderData[][]): IndexedHeaderData[][] {
    return listVirtualHeaders.map(headers => headers.filter(header => header.colSpan != 0));
  }

  private getPinnedHeaders(): HeaderRowData[] {
    if (this.hasPinned) {
      const pinnedHeaders: IndexedHeaderData[] = this.headers.slice(0, this.numPinnedSize);
      const flattenHeaders: IndexedHeaderData[][] = TableDataUtils.getIndexedHeadersAsList(pinnedHeaders);
      return flattenHeaders.map(header => this.toPinnedHeaderRow(header)).filter(ListUtils.isNotEmpty);
    } else {
      return [];
    }
  }

  private createCustomStyle(header: IndexedHeaderData): CustomStyleData | undefined {
    const customStyle: CustomStyleData = { css: {} as any };
    this.configCustomWidth(customStyle, header);
    this.configCustomStyle(customStyle, header, this.customCellCallBack);
    return customStyle;
  }

  private configCustomWidth(customStyle: CustomStyleData, header: IndexedHeaderData) {
    if (isNumber(header.width)) {
      Object.assign(customStyle, {
        css: TableDataUtils.createCustomWidthStyle(header.width)
      });
    }
  }

  private configCustomStyle(customStyle: CustomStyleData, header: IndexedHeaderData, customCellCallBack: CustomCellCallBack | undefined) {
    if (customCellCallBack && customCellCallBack.customHeaderCellStyle) {
      const currentStyle: CustomStyleData = customCellCallBack.customHeaderCellStyle({ header: header });
      JsonUtils.mergeDeep(customStyle, currentStyle);
    }
  }
}
