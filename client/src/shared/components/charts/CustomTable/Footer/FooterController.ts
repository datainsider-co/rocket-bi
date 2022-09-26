/*
 * @author: tvc12 - Thien Vi
 * @created: 5/10/21, 7:17 PM
 */

import { IndexedHeaderData, ViewPort } from '@/shared/models';
import { StringUtils } from '@/utils/string.utils';
import { TableDataUtils } from '@chart/CustomTable/TableDataUtils';
import { FooterCellData } from '@chart/CustomTable/Footer/TableFooterRenderEngine';
import { isNumber } from 'lodash';
import { TableExtraData } from '@chart/CustomTable/TableExtraData';
import { CustomCellCallBack, CustomStyleData } from '@chart/CustomTable/TableData';
import { JsonUtils } from '@core/utils';

export class FooterController {
  private mainHeaders: IndexedHeaderData[];
  private cellWidth: number;
  private numPinnedColumn: number;
  private hasPinned: boolean;
  private extraData: TableExtraData;
  private defaultFooterLabel: string;
  private customCellCallBack?: CustomCellCallBack;

  constructor(
    mainHeaders: IndexedHeaderData[],
    cellWidth: number,
    hasPinned: boolean,
    numPinnedColumn: number,
    extraData?: TableExtraData,
    customCellCallBack?: CustomCellCallBack
  ) {
    this.mainHeaders = mainHeaders;
    this.cellWidth = cellWidth;
    this.hasPinned = hasPinned;
    this.numPinnedColumn = numPinnedColumn;
    this.extraData = extraData ?? {};
    this.defaultFooterLabel = this.extraData.total?.label?.text ?? 'Total';
    this.customCellCallBack = customCellCallBack;
  }

  getFooterCellData(viewPort: ViewPort): FooterCellData[] {
    let currentColumnStart = viewPort.fromColumnIndex;
    const listFooterCellData: FooterCellData[] = [];
    let lastPinnedColumnIndex = -1;
    let virtualExpandSize = 0;

    if (this.hasPinned) {
      const pinnedCells: FooterCellData[] = this.createPinnedCells(this.numPinnedColumn);
      listFooterCellData.push(...pinnedCells);
      currentColumnStart = TableDataUtils.calculatedColumnStart(this.numPinnedColumn, currentColumnStart);
      lastPinnedColumnIndex = this.numPinnedColumn - 1;
      virtualExpandSize = currentColumnStart - 1;
    } else {
      virtualExpandSize = currentColumnStart;
    }

    if (currentColumnStart > lastPinnedColumnIndex + 1) {
      const virtualCell: FooterCellData = this.createVirtualCell(virtualExpandSize);
      listFooterCellData.push(virtualCell);
    }

    const colEnd = Math.min(this.mainHeaders.length, viewPort.toColumnIndex);
    for (let colIndex = currentColumnStart; colIndex < colEnd; ++colIndex) {
      const header = this.mainHeaders[colIndex];
      const cell = this.createCell(header);
      listFooterCellData.push(cell);
    }

    return listFooterCellData;
  }

  private createPinnedCells(numPinnedColumn: number): FooterCellData[] {
    const listPinnedCells: FooterCellData[] = [];
    const maxNumPinnedCell: number = Math.min(this.mainHeaders.length, numPinnedColumn);
    for (let colIndex = 0; colIndex < maxNumPinnedCell; ++colIndex) {
      const header: IndexedHeaderData = this.mainHeaders[colIndex];
      const cell = this.createCell(header);
      cell.classList.push('pinned');
      cell.left = colIndex * this.cellWidth;
      listPinnedCells.push(cell);
    }

    return listPinnedCells;
  }

  private createVirtualCell(expandedSize: number): FooterCellData {
    return {
      rowSpan: 1,
      columnIndex: -1,
      data: '',
      classList: [],
      colSpan: expandedSize
    };
  }

  private createCell(header: IndexedHeaderData): FooterCellData {
    return {
      columnIndex: header.columnIndex,
      colSpan: 1,
      rowSpan: 1,
      data: this.getTextWillRender(header),
      classList: [],
      customStyle: this.createCustomStyle(header)
    };
  }

  private getTextWillRender(header: IndexedHeaderData): string {
    const isFirstColumn = header.columnIndex == 0;
    return isFirstColumn ? this.defaultFooterLabel : StringUtils.formatDisplayNumber(header.total);
  }

  private createCustomStyle(header: IndexedHeaderData) {
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
    if (customCellCallBack && customCellCallBack.customFooterCellStyle) {
      const currentStyle: CustomStyleData = customCellCallBack.customFooterCellStyle({ header: header });
      JsonUtils.mergeDeep(customStyle, currentStyle);
    }
  }
}
