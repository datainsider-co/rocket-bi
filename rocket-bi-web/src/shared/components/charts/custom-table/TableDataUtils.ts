/*
 * @author: tvc12 - Thien Vi
 * @created: 5/10/21, 3:34 PM
 */

import { HeaderData, IndexedData, IndexedHeaderData, RowData, ViewPort } from '@/shared/models';
import { ChartUtils, ListUtils, RandomUtils } from '@/utils';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { isNumber, cloneDeep } from 'lodash';

export class TableDataUtils {
  static readonly FIRST_COLUMN_INDEX = 0;

  static getMainHeaders(headers: IndexedHeaderData[]): IndexedHeaderData[] {
    const appendNestedHeaders = (header: IndexedHeaderData, mainHeaders: IndexedHeaderData[]): void => {
      if (ListUtils.isEmpty(header.children)) {
        mainHeaders.push(header);
      } else {
        header.children!.forEach(header => {
          if (ListUtils.isEmpty(header.children)) {
            mainHeaders.push(header);
          } else {
            appendNestedHeaders(header, mainHeaders);
          }
        });
      }
    };
    const mainHeaders: IndexedHeaderData[] = [];
    headers.forEach(header => appendNestedHeaders(header, mainHeaders));
    return mainHeaders;
  }

  private static filterHeaders(headers: HeaderData[], isMobile: boolean) {
    if (isMobile) {
      return cloneDeep(headers).filter(header => header.hiddenInMobile !== true);
    } else {
      return cloneDeep(headers);
    }
  }

  static indexingHeaders(headers: HeaderData[], numRows: number): IndexedHeaderData[] {
    let previousHeader: IndexedHeaderData | undefined = void 0;
    const clonedHeaders = this.filterHeaders(headers, ChartUtils.isMobile());
    TableDataUtils.processFormatters(clonedHeaders);
    const finalHeaders = TableDataUtils.ignoreFormattingColumn(clonedHeaders);

    return finalHeaders.map((header, index) => {
      const currentColIndex = previousHeader?.getColumnIndexEnd() ?? 0;
      if (ListUtils.isEmpty(header.children)) {
        return (previousHeader = this.createDefaultIndexedHeader(header, currentColIndex, 0, numRows, 1));
      } else {
        const children = this.indexingNestedHeader(header.children!, currentColIndex, 1, numRows);
        previousHeader = this.createIndexedHeader(header, currentColIndex, 0, children);
        TableDataUtils.assignParent(children, previousHeader);
        return previousHeader;
      }
    });
  }

  static calculateColSpan(children: IndexedHeaderData[]): number {
    const numLeaf = this.getNumLeaf(children);
    if (numLeaf == children.length) {
      return children.length;
    } else {
      return children.reduce((previousValue, header) => previousValue + header.colSpan, 0);
    }
  }

  static getNumLeaf(headers: IndexedHeaderData[]): number {
    const header = ListUtils.getHead(headers);
    if (header && ListUtils.isNotEmpty(header.children)) {
      return headers.length * this.getNumLeaf(header.children);
    } else {
      return headers.length;
    }
  }

  static getDepth(header: HeaderData): number {
    if (ListUtils.isNotEmpty(header.children)) {
      const firstChild = header.children![0];
      return 1 + this.getDepth(firstChild);
    } else {
      return 1;
    }
  }

  static getIndexedHeaders(headers: IndexedHeaderData[], fromColumnIndex: number, toColumnIndex: number): IndexedHeaderData[] {
    const availableHeaders: IndexedHeaderData[] = [];

    for (let index = 0; index < headers.length; ++index) {
      const header = headers[index];
      const isInViewPort = this.isInViewPort(header, fromColumnIndex, toColumnIndex);
      if (isInViewPort) {
        const childrenInViewPort = this.getIndexedHeaders(header.children, fromColumnIndex, toColumnIndex);
        const newHeader = header.copyWith({ children: childrenInViewPort });
        availableHeaders.push(newHeader);
        continue;
      }
      const isOutRightViewPort = header.columnIndex > toColumnIndex;
      if (isOutRightViewPort) {
        break;
      }
    }

    return availableHeaders;
  }

  // TODO: improve here
  static getExpandedRows(rows: RowData[]): RowData[] {
    const appendNestedRows = (rowData: RowData, allExpandedRows: RowData[]): void => {
      if (rowData.isExpanded) {
        for (let index = 0; index < rowData.children.length; ++index) {
          const row = rowData.children[index];
          allExpandedRows.push(row);
          appendNestedRows(row, allExpandedRows);
        }
      }
    };

    const allExpandedRows = [];
    for (let index = 0; index < rows.length; ++index) {
      const row = rows[index];
      allExpandedRows.push(row);
      appendNestedRows(row, allExpandedRows);
    }
    return allExpandedRows;
  }

  static setDepth(children: RowData[], depth: number): RowData[] {
    children.forEach(row => (row.depth = depth));
    return children;
  }

  static toPx(num: number): string {
    return `${num}px`;
  }

  // otherwise, start = next of last pinned index
  static calculatedColumnStart(numPinnedColumn: number, columnStart: number): number {
    const lastPinnedIndex = numPinnedColumn - 1;
    return columnStart > lastPinnedIndex ? columnStart : lastPinnedIndex + 1;
  }

  static createVirtualHeader(
    headers: IndexedHeaderData[],
    viewport: ViewPort,
    hasPinned: boolean,
    lastPinnedIndex: number,
    depth = 0
  ): IndexedHeaderData | undefined {
    const firstHeaderInViewPort: IndexedHeaderData | undefined = this.findFirstHeaderInViewPort(headers, viewport);
    if (firstHeaderInViewPort) {
      const currentPinnedIndex = hasPinned ? lastPinnedIndex : -1;
      const canRenderVirtual = hasPinned ? firstHeaderInViewPort.columnIndex > lastPinnedIndex : firstHeaderInViewPort.columnIndex > 0;
      if (canRenderVirtual) {
        const indexedData: IndexedData = {
          columnIndex: currentPinnedIndex + 1,
          rowIndex: depth,
          colSpan: firstHeaderInViewPort.columnIndex - (currentPinnedIndex + 1),
          rowSpan: firstHeaderInViewPort.rowSpan
        };
        const virtualHeader = new IndexedHeaderData({ key: RandomUtils.nextString(), label: '' }, indexedData, []);
        if (ListUtils.isNotEmpty(firstHeaderInViewPort.children)) {
          const subHeader = this.createVirtualHeader(firstHeaderInViewPort.children, viewport, hasPinned, lastPinnedIndex, depth + 1);
          virtualHeader.children = subHeader ? [subHeader] : [];
        }
        return virtualHeader;
      } else {
        return void 0;
      }
    }
  }

  static findFirstHeaderInViewPort(headers: IndexedHeaderData[], viewport: ViewPort): IndexedHeaderData | undefined {
    return headers.find(header => this.isInViewPort(header, viewport.fromColumnIndex, viewport.toColumnIndex));
  }

  static getIndexedHeadersAsList(headers: IndexedHeaderData[]): IndexedHeaderData[][] {
    return [headers, ...this.getSubHeadersAsList(headers)];
  }

  static getSubHeadersAsList(currentHeaders: IndexedHeaderData[]): IndexedHeaderData[][] {
    if (ListUtils.isEmpty(currentHeaders)) {
      return [];
    } else {
      const subHeaders: IndexedHeaderData[] = currentHeaders.flatMap(header => header.children ?? []);
      return [subHeaders, ...this.getSubHeadersAsList(subHeaders)];
    }
  }

  // update render column render start
  // base column index start >= the last pinned index => nothing change

  static createCustomWidthStyle(width: number): any {
    return {
      '--column-width': TableDataUtils.toPx(width),
      '--max-column-width': TableDataUtils.toPx(width)
    };
  }

  static setStyle(cellElement: HTMLTableDataCellElement, customStyle: CustomStyleData | undefined) {
    if (customStyle) {
      const style: any = customStyle.css ?? {};
      Object.keys(style).forEach(key => {
        const value = style[key];
        cellElement.style.setProperty(key, value);
      });
      Object.assign(cellElement.style, style);
    }
  }

  static getFixedWidth(headers: IndexedHeaderData[]): number {
    return headers.filter(header => isNumber(header.width)).reduce((previousValue, header) => previousValue + header.width!, 0);
  }

  static getTotalColumnNonFixWidth(headers: IndexedHeaderData[]): number {
    return headers.filter(header => !isNumber(header.width)).length;
  }

  static assignExtraData(children: RowData[], extraData: any): RowData[] {
    children.forEach(row => Object.assign(row, extraData));
    return children;
  }

  private static indexingNestedHeader(headers: HeaderData[], colIndex: number, rowIndex: number, numRows: number): IndexedHeaderData[] {
    let previousHeader: IndexedHeaderData | undefined = void 0;
    let currentColIndex = colIndex;
    return headers.map((header, index) => {
      currentColIndex += previousHeader?.colSpan ?? 0;
      if (ListUtils.isEmpty(header.children)) {
        return (previousHeader = this.createDefaultIndexedHeader(header, currentColIndex, rowIndex, numRows - 1, 1));
      } else {
        const children = this.indexingNestedHeader(header.children!, currentColIndex, rowIndex + 1, numRows);
        previousHeader = this.createIndexedHeader(header, currentColIndex, rowIndex, children);
        TableDataUtils.assignParent(children, previousHeader);
        return previousHeader;
      }
    });
  }

  private static createDefaultIndexedHeader(header: HeaderData, colIndex: number, rowIndex: number, rowSpan: number, colSpan: number): IndexedHeaderData {
    return new IndexedHeaderData(header, {
      columnIndex: colIndex,
      rowIndex: rowIndex,
      rowSpan: rowSpan,
      colSpan: colSpan
    });
  }

  private static createIndexedHeader(header: HeaderData, colIndex: number, rowIndex: number, children: IndexedHeaderData[]): IndexedHeaderData {
    const colSpan = this.calculateColSpan(children);
    const indexedData: IndexedData = {
      columnIndex: colIndex,
      rowIndex: rowIndex,
      colSpan: colSpan,
      rowSpan: 1
    };
    return new IndexedHeaderData(header, indexedData, children);
  }

  private static isInViewPort(header: IndexedHeaderData, fromColumnIndex: number, toColumnIndex: number): boolean {
    const isLeftOutSideViewPort = header.columnIndex < fromColumnIndex;
    if (isLeftOutSideViewPort) {
      const isRightInViewPort = header.columnIndex <= toColumnIndex && header.getColumnIndexEnd() > fromColumnIndex;
      const isRightGreaterRightViewPort = header.getColumnIndexEnd() > fromColumnIndex && header.getColumnIndexEnd() <= toColumnIndex;
      return isRightInViewPort || isRightGreaterRightViewPort;
    } else {
      const isLeftInViewport = header.columnIndex < toColumnIndex;
      const isRightInViewPort = header.getColumnIndexEnd() <= toColumnIndex;
      return isLeftInViewport || isRightInViewPort;
    }
  }

  private static ignoreFormattingColumn(headers: HeaderData[]): HeaderData[] {
    // for debug
    if (window.showFormattingColumn) {
      return headers;
    }
    const ignoredHeaders: HeaderData[] = [];
    headers.forEach(header => {
      if (!header.formatterKey) {
        if (ListUtils.isNotEmpty(header.children)) {
          header.children = TableDataUtils.ignoreFormattingColumn(header.children!);
        }
        ignoredHeaders.push(header);
      }
    });
    return ignoredHeaders;
  }

  /**
   * Move formatter to key formatters of parent call.
   * @param headers
   * @private
   */
  private static processFormatters(headers: HeaderData[]) {
    headers.forEach(header => {
      if (ListUtils.isNotEmpty(header.children)) {
        header.formatters = this.getFormatters(header.children ?? []);
        // for debug
        if (!window.showFormattingColumn) {
          header.children = ListUtils.removeEnd(header.children ?? [], header.formatters.length);
        }
        TableDataUtils.processFormatters(header.children ?? []);
      }
    });
  }

  private static getFormatters(headers: HeaderData[]): HeaderData[] {
    return headers.filter(header => !!header.formatterKey);
  }

  private static assignParent(children: IndexedHeaderData[], previousHeader: IndexedHeaderData) {
    children.forEach(header => {
      Object.assign(header, {
        parent: previousHeader
      });
    });
  }
}
