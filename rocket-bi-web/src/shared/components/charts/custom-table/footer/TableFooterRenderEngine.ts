/*
 * @author: tvc12 - Thien Vi
 * @created: 5/16/21, 6:10 PM
 */

import { TableDataUtils } from '@chart/custom-table/TableDataUtils';
import { isNumber } from 'lodash';
import { CustomStyleData, IconStyle } from '@chart/custom-table/TableData';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import { TableBodyRenderEngine } from '@chart/custom-table/body/TableBodyRenderEngine';

export interface FooterCellData {
  left?: number;
  columnIndex: number;
  colSpan: number;
  rowSpan: number;
  data: string;
  classList: string[];
  width?: number;
  customStyle?: CustomStyleData;
}

export class TableFooterRenderEngine {
  renderFooter(footerCells: FooterCellData[]): HTMLElement {
    const footer = document.createElement('tfoot');
    const elements: HTMLElement[] = footerCells.map(cell => this.renderFooterCell(cell));
    footer.append(...elements);
    return footer;
  }

  private bindConfigToCell(cellElement: HTMLTableDataCellElement, cellData: FooterCellData) {
    cellElement.setAttribute('col-index', cellData.columnIndex.toString());
    cellElement.colSpan = cellData.colSpan;
    cellElement.rowSpan = cellData.rowSpan;
    cellElement.classList.add(...cellData.classList);
    if (isNumber(cellData.width)) {
      cellElement.style.left = TableDataUtils.toPx(cellData.width);
    }

    if (isNumber(cellData.left)) {
      cellElement.style.left = TableDataUtils.toPx(cellData.left);
    }
    TableDataUtils.setStyle(cellElement, cellData.customStyle);
  }

  private renderFooterCell(cellData: FooterCellData): HTMLElement {
    const td = document.createElement('td');
    this.bindConfigToCell(td, cellData);
    this.bindTooltipToCell(td, cellData);
    this.bindDataToCell(td, cellData);
    return td;
  }

  private bindTooltipToCell(cellElement: HTMLTableDataCellElement, cellData: FooterCellData) {
    if (cellData.data) {
      cellElement.setAttribute('data-title', cellData.data);
      TableTooltipUtils.configTooltip(cellElement);
    }
  }

  private bindDataToCell(cellElement: HTMLTableDataCellElement, cellData: FooterCellData) {
    const element = TableBodyRenderEngine.renderIconAndDataAsHTML(cellData.customStyle?.icon, cellData.data);
    cellElement.insertAdjacentHTML('beforeend', element);
  }
}
