import { SortDirection } from '@core/domain/Request';
import { Log } from '@core/utils';
import { get, isFunction, isObject, isString } from 'lodash';
import { toNumber } from 'lodash';
import { HeaderCellData } from '@chart/CustomTable/Header/TableHeaderRenderEngine';

export class Pagination {
  public sortBy: string;
  public descending: boolean;
  public page: number;
  public rowsPerPage: number;
  public rowsNumber: number;
  /// key is Field name, value is SortDirection (example: {"Region", "DEC"})
  public sortAsMap: Map<string, SortDirection>;

  constructor(data: any = {}) {
    this.sortBy = data.sortBy || void 0;
    this.descending = data.descending || void 0;
    this.page = data.page || 1;
    this.rowsPerPage = data.rowsPerPage || 30;
    this.rowsNumber = data.rowsNumber || void 0;
    this.sortAsMap = data.sortAsMap ?? new Map();
  }

  static defaultPagination() {
    return new Pagination({ page: 2, rowsPerPage: -1 });
  }

  get from(): number {
    return (this.page - 1) * this.rowsPerPage;
  }

  get size(): number {
    return this.rowsPerPage;
  }

  updateSort(label: string) {
    const newDirection = this.getNewSortDirection(label);
    // FIXME: sortAsMap must sync with HeaderController in CustomTable.vue
    this.sortAsMap.clear();
    this.sortAsMap.set(label, newDirection);
    Log.debug('sort map in pagination: ', this.sortAsMap);
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
}

// Data from table
export interface HeaderData {
  key: string;
  label: string;
  total?: number;
  isTextLeft?: boolean;
  //True => Not format data
  isGroupBy?: boolean;
  children?: HeaderData[];
  width?: number;
  disableSort?: boolean;
  drilldownLevel?: number;
  formatterKey?: string;
  formatters?: HeaderData[];
  customRenderBodyCell?: CustomCell;
  customRenderHeader?: CustomHeader;
  hiddenInMobile?: boolean;
}

export interface IndexedData {
  rowSpan: number;
  colSpan: number;
  rowIndex: number;
  columnIndex: number;
}

export class IndexedHeaderData implements HeaderData, IndexedData {
  isGroupBy?: boolean;
  isTextLeft?: boolean;
  key: string;
  label: string;
  rowSpan: number;
  colSpan: number;
  rowIndex: number;
  columnIndex: number;
  total?: number;
  children: IndexedHeaderData[];
  width?: number;
  drilldownLevel: number;
  disableSort?: boolean;
  formatterKey?: string;
  parent?: IndexedHeaderData;
  formatters?: HeaderData[];
  customRenderBodyCell?: CustomCell;
  customRenderHeader?: CustomHeader;

  constructor(headerData: HeaderData, indexedData: IndexedData, children?: IndexedHeaderData[], parent?: IndexedHeaderData) {
    this.colSpan = indexedData.colSpan;
    this.rowSpan = indexedData.rowSpan;
    this.rowIndex = indexedData.rowIndex;
    this.columnIndex = indexedData.columnIndex;

    this.isTextLeft = headerData.isTextLeft;
    this.isGroupBy = headerData.isGroupBy;
    this.key = headerData.key;
    this.label = headerData.label;
    this.children = children ?? [];
    this.total = headerData.total;
    this.width = headerData.width;
    this.drilldownLevel = headerData.drilldownLevel ?? 0;
    this.disableSort = headerData.disableSort;
    this.formatterKey = headerData.formatterKey;
    this.parent = parent;
    this.formatters = headerData.formatters;
    this.customRenderBodyCell = headerData.customRenderBodyCell;
    this.customRenderHeader = headerData.customRenderHeader;
  }

  getRowIndexEnd(): number {
    return this.rowIndex + this.rowSpan;
  }

  getColumnIndexEnd(): number {
    return this.columnIndex + this.colSpan;
  }

  copyWith(obj: {
    isGroupBy?: boolean;
    isTextLeft?: boolean;
    key?: string;
    label?: string;
    rowSpan?: number;
    colSpan?: number;
    rowStart?: number;
    colStart?: number;
    value?: number;
    children?: IndexedHeaderData[];
    width?: number;
    drilldownLevel?: number;
    disableSort?: boolean;
    formatterKey?: string;
    parent?: IndexedHeaderData;
    formatters?: HeaderData[];
    customRenderBodyCell?: CustomCell;
    customRenderHeader?: CustomHeader;
  }): IndexedHeaderData {
    return new IndexedHeaderData(
      {
        key: obj.key ?? this.key,
        label: obj.label ?? this.label,
        isTextLeft: obj.isTextLeft ?? this.isTextLeft,
        isGroupBy: obj.isGroupBy ?? this.isGroupBy,
        total: obj.value ?? this.total,
        width: obj.width ?? this.width,
        disableSort: obj.disableSort ?? this.disableSort,
        drilldownLevel: obj.drilldownLevel ?? this.drilldownLevel,
        formatterKey: obj.formatterKey ?? this.formatterKey,
        formatters: obj.formatters ?? this.formatters,
        customRenderBodyCell: obj.customRenderBodyCell ?? this.customRenderBodyCell,
        customRenderHeader: obj.customRenderHeader ?? this.customRenderHeader
      },
      {
        rowSpan: obj.rowSpan ?? this.rowSpan,
        colSpan: obj.colSpan ?? this.colSpan,
        rowIndex: obj.rowStart ?? this.rowIndex,
        columnIndex: obj.colStart ?? this.columnIndex
      },
      obj.children ?? this.children,
      obj.parent ?? this.parent
    );
  }
}

export type CellRender = (rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number) => HTMLElement | HTMLElement[] | string;

export class CustomCell {
  customRender: CellRender;

  constructor(customRender: CellRender) {
    this.customRender = customRender;
  }

  static isCustomCell(obj: any): obj is CustomCell {
    return isFunction(obj?.customRender);
  }
}

type CustomRenderHeader = (headerData: IndexedHeaderData) => HTMLElement | HTMLElement[] | string;
export class CustomHeader {
  render: CustomRenderHeader;

  constructor(customRender: CustomRenderHeader) {
    this.render = customRender;
  }

  static isCustomHeader(obj: any): obj is CustomHeader {
    return isFunction(obj?.render);
  }
}

export interface RowData {
  isExpanded: boolean;
  children: RowData[];
  depth: number;
  parent?: RowData;

  [key: string]: any | CustomCell;
}

export class ViewPort {
  public fromColumnIndex: number;
  public columnSize: number;

  public rowIndexStart: number;
  public rowSize: number;

  constructor(columnStart: number, columnSize: number, rowStart: number, rowSize: number) {
    this.fromColumnIndex = columnStart;
    this.columnSize = columnSize;
    this.rowIndexStart = rowStart;
    this.rowSize = rowSize;
  }

  get rowIndexEnd() {
    return this.rowIndexStart + this.rowSize;
  }

  get toColumnIndex() {
    return this.fromColumnIndex + this.columnSize;
  }

  static default(): ViewPort {
    return new ViewPort(0, 0, 0, 0);
  }
}

export class RowDataUtils {
  static getData(rowData: RowData, header: HeaderData): any | undefined {
    const data = rowData[header.key];
    if (isString(data)) {
      return data || void 0;
    } else {
      return data;
    }
  }
  static getDataAsNumber(rowData: RowData, header: HeaderData): number {
    return toNumber(this.getData(rowData, header));
  }
}
