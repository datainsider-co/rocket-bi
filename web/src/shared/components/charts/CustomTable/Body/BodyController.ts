/*
 * @author: tvc12 - Thien Vi
 * @created: 5/16/21, 4:30 PM
 */

import { CustomCell, IndexedHeaderData, RowData, RowDataUtils, ViewPort } from '@/shared/models';
import { BodyCellData, BodyRowData } from '@chart/CustomTable/Body/TableBodyRenderEngine';
import { ListUtils } from '@/utils';
import { TableDataUtils } from '@chart/CustomTable/TableDataUtils';
import { CustomCellCallBack } from '@chart/CustomTable/TableData';
import { isFunction, isNumber } from 'lodash';
import { StringUtils } from '@/utils/string.utils';
import { Table } from 'ant-design-vue';
import { JsonUtils, Log } from '@core/utils';

export class BodyController {
  private mainHeaders: IndexedHeaderData[];
  private rows: RowData[];
  private onToggleCollapse?: (rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number) => void;
  private hasPinned: boolean;
  private numPinnedColumn: number;
  private minCellWidth: number;
  private formatter: (rowData: RowData, header: IndexedHeaderData) => string;
  private customCellCallBack?: CustomCellCallBack;

  constructor(
    mainHeaders: IndexedHeaderData[],
    rows: RowData[],
    hasPinned: boolean,
    numPinnedColumn: number,
    minCellWidth: number,
    formatter: (rowData: RowData, header: IndexedHeaderData) => string,
    onToggleCollapse?: (rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number) => void,
    customCellCallBack?: CustomCellCallBack
  ) {
    this.mainHeaders = mainHeaders;
    this.onToggleCollapse = onToggleCollapse;
    this.rows = rows;
    this.hasPinned = hasPinned;
    this.numPinnedColumn = numPinnedColumn;
    this.minCellWidth = minCellWidth;
    this.formatter = formatter;
    this.customCellCallBack = customCellCallBack;
  }

  getListRowData(viewPort: ViewPort): BodyRowData[] {
    const listBodyRowData: BodyRowData[] = [];
    const maxIndex = Math.min(viewPort.rowIndexEnd, this.rows.length);

    for (let rowIndex = viewPort.rowIndexStart; rowIndex < maxIndex; ++rowIndex) {
      const isEven = rowIndex % 2 == 0;
      const rowClass = isEven ? 'even' : 'odd';
      const rowData = this.rows[rowIndex];
      const bodyRowData: BodyRowData = {
        cells: this.createCells(rowData, rowIndex, viewPort.fromColumnIndex, viewPort.toColumnIndex),
        rowIndex: rowIndex,
        classList: [rowClass]
      };
      if (rowData.isExpanded) {
        bodyRowData.classList.push('expanded');
      }

      listBodyRowData.push(bodyRowData);
    }
    return listBodyRowData;
  }

  private createCells(rowData: RowData, rowIndex: number, columnStart: number, columnEnd: number): BodyCellData[] {
    const cells: BodyCellData[] = [];
    let currentColumnStart = columnStart;
    let lastPinnedColumnIndex = -1;
    let virtualExpandSize = 0;

    if (this.hasPinned) {
      const pinnedCells = this.createPinnedCells(rowData, rowIndex, this.numPinnedColumn);
      cells.push(...pinnedCells);
      currentColumnStart = TableDataUtils.calculatedColumnStart(this.numPinnedColumn, currentColumnStart);
      lastPinnedColumnIndex = this.numPinnedColumn - 1;
      virtualExpandSize = currentColumnStart - 1;
    } else {
      virtualExpandSize = currentColumnStart;
    }
    if (currentColumnStart > lastPinnedColumnIndex + 1) {
      const cell = this.createVirtualCell(virtualExpandSize, -1);
      cells.push(cell);
    }

    const maxSize = Math.min(columnEnd, this.mainHeaders.length);
    for (let columnIndex = currentColumnStart; columnIndex < maxSize; ++columnIndex) {
      const header = this.mainHeaders[columnIndex];
      const cell = this.createCell(rowData, rowIndex, header, columnIndex);
      cells.push(cell);
    }
    return cells;
  }

  private createPinnedCells(rowData: RowData, rowIndex: number, numFixedColumn: number): BodyCellData[] {
    const maxNumPinnedCell = Math.min(this.mainHeaders.length, numFixedColumn);
    const cells: BodyCellData[] = [];
    for (let columnIndex = 0; columnIndex < maxNumPinnedCell; ++columnIndex) {
      const header = this.mainHeaders[columnIndex];
      const cell: BodyCellData = this.createCell(rowData, rowIndex, header, columnIndex);
      cell.classList.push('pinned');
      cell.left = columnIndex * this.minCellWidth;
      cells.push(cell);
    }

    return cells;
  }

  private createCell(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): BodyCellData {
    const canDrilldown = (rowData.depth ?? 0) + 1 < header.drilldownLevel;
    const isExpandable: boolean = !!header.isGroupBy && (canDrilldown || ListUtils.isNotEmpty(rowData.children));
    const cell: BodyCellData = {
      data: '',
      classList: [],
      columnIndex: columnIndex,
      isExpandable: isExpandable,
      isExpanded: rowData.isExpanded,
      onToggleCollapse: () => this.onToggleCollapse?.call(this, rowData, rowIndex, header, columnIndex),
      onContextMenu: this.customCellCallBack?.onContextMenu,
      onClick: this.createOnClickEvent(rowData, rowIndex, header, columnIndex)
    };

    this.bindDataToCell(cell, rowData, rowIndex, header, columnIndex);
    this.bindClassToCell(cell, isExpandable);
    this.bindPaddingToCell(cell, isExpandable, rowData);
    this.bindCustomWidthToCell(cell, header.width);
    this.bindStyleToCell(cell, rowData, rowIndex, header, columnIndex);
    return cell;
  }

  private createOnClickEvent(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): (() => void) | undefined {
    const onClickRowFunction = this.customCellCallBack?.onClickRow;
    if (isFunction(onClickRowFunction)) {
      return () => {
        onClickRowFunction({
          rowData: rowData,
          rowIndex: rowIndex,
          columnIndex: columnIndex,
          header: header
        });
      };
    } else {
      return void 0;
    }
  }

  private createVirtualCell(expandedSize: number, columnIndex: number): BodyCellData {
    return {
      data: '',
      classList: [],
      columnIndex: columnIndex,
      isExpandable: false,
      isExpanded: false,
      colSpan: expandedSize
    };
  }

  private bindDataToCell(cell: BodyCellData, rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): void {
    const currentData: any | CustomCell = RowDataUtils.getData(rowData, header);
    if (CustomCell.isCustomCell(currentData)) {
      cell.customCellContent = currentData.customRender(rowData, rowIndex, header, columnIndex);
    } else if (CustomCell.isCustomCell(header.customRenderBodyCell)) {
      cell.customCellContent = header.customRenderBodyCell.customRender(rowData, rowIndex, header, columnIndex);
    } else {
      cell.data = this.formatter(rowData, header);
    }
  }

  private bindClassToCell(cell: BodyCellData, isExpandable: boolean) {
    if (isExpandable) {
      cell.classList.push('expandable');
    }
  }

  private bindPaddingToCell(cell: BodyCellData, isExpandable: boolean, rowData: RowData) {
    const additionPadding = isExpandable ? 12 : 20;
    if (rowData.depth > 0) {
      cell.paddingLeft = additionPadding + rowData.depth * 12;
    }
  }

  private bindStyleToCell(cell: BodyCellData, rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number) {
    if (this.customCellCallBack && this.customCellCallBack.customBodyCellStyle) {
      const oldStyle = cell.customStyle ?? {};
      const customStyle = this.customCellCallBack.customBodyCellStyle({
        rowData: rowData,
        rowIndex: rowIndex,
        columnIndex: columnIndex,
        header: header
      });
      cell.customStyle = JsonUtils.mergeDeep(oldStyle, customStyle);
    }
  }

  private bindCustomWidthToCell(cell: BodyCellData, width?: number) {
    if (isNumber(width)) {
      const customWidthStyle: any = TableDataUtils.createCustomWidthStyle(width);
      const oldStyle = cell.customStyle ?? {};
      cell.customStyle = JsonUtils.mergeDeep(oldStyle, { css: customWidthStyle });
    }
  }
}
