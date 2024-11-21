/*
 * @author: tvc12 - Thien Vi
 * @created: 5/16/21, 3:37 PM
 */

import { HeaderData, IndexedHeaderData, RowData } from '@/shared/models';
import { SortDirection } from '@core/common/domain/request';
import { HeaderController } from '@chart/custom-table/header/HeaderController';
import { Log } from '@core/utils';
import { CustomCellCallBack } from '@chart/custom-table/TableData';

export class HeaderControllerBuilder {
  private hasPinned = false;
  private numPinnedSize = 1;
  private headers: IndexedHeaderData[] = [];
  private mainHeaders: IndexedHeaderData[] = [];
  private rows: RowData[] = [];
  private sortAsMap: Map<string, SortDirection> = new Map<string, SortDirection>();
  private onClickSort?: (header: HeaderData) => void;
  private cellWidth = 0;
  private cellHeight = 0;
  private customCellCallBack?: CustomCellCallBack;
  private disableSort = false;

  withPinnedData(hasPinned: boolean, numPinnedSize: number): HeaderControllerBuilder {
    this.hasPinned = hasPinned;
    this.numPinnedSize = numPinnedSize;
    return this;
  }

  withHeaderData(headers: IndexedHeaderData[], mainHeaders: IndexedHeaderData[]): HeaderControllerBuilder {
    this.headers = headers;
    this.mainHeaders = mainHeaders;
    return this;
  }

  withRowData(rows: RowData[]): HeaderControllerBuilder {
    this.rows = rows;
    return this;
  }

  withSortData(sortAsMap: Map<string, SortDirection>, onClickSort?: (header: HeaderData) => void): HeaderControllerBuilder {
    this.sortAsMap = sortAsMap;
    this.onClickSort = onClickSort;
    return this;
  }

  withCustomRender(customCellCallBack?: CustomCellCallBack): HeaderControllerBuilder {
    this.customCellCallBack = customCellCallBack;
    return this;
  }

  withCellInfo(cellWidth: number, cellHeight: number): HeaderControllerBuilder {
    this.cellHeight = cellHeight;
    this.cellWidth = cellWidth;
    return this;
  }

  withDisableSort(disableSort: boolean) {
    this.disableSort = disableSort;
    return this;
  }

  build(): HeaderController {
    return new HeaderController(
      this.hasPinned,
      this.numPinnedSize,
      this.headers,
      this.mainHeaders,
      this.rows,
      this.cellWidth,
      this.cellHeight,
      this.sortAsMap,
      this.onClickSort,
      this.customCellCallBack,
      this.disableSort
    );
  }
}
