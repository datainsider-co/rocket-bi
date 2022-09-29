/*
 * @author: tvc12 - Thien Vi
 * @created: 5/16/21, 3:46 PM
 */

import { TableDataUtils } from '@chart/custom-table/TableDataUtils';
import { SortDirection } from '@core/common/domain/request';
import { isArray, isNumber, isString } from 'lodash';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import { Log } from '@core/utils';

export interface HeaderCellData {
  rowSpan: number;
  colSpan: number;
  colIndex: number;
  top: number;
  left?: number;
  width?: number;
  classList: string[];
  onClick: () => void;
  data: string;
  hasSort: boolean;
  sortDirection: SortDirection;
  customStyle?: CustomStyleData;
  cellContent?: HTMLElement | HTMLElement[] | string;
}

export class TableHeaderRenderEngine {
  static renderHeaders(listHeaderCells: HeaderCellData[][]): HTMLElement {
    const header: HTMLElement = document.createElement('thead');
    const elements = listHeaderCells.map(TableHeaderRenderEngine.renderMultiCellHeader);
    header.append(...elements);
    return header;
  }

  private static renderMultiCellHeader(headers: HeaderCellData[]): HTMLElement {
    const elements: HTMLElement[] = headers.map(TableHeaderRenderEngine.renderSingleCellHeader);
    const rowElement = document.createElement('tr');
    rowElement.append(...elements);
    return rowElement;
  }

  private static renderSingleCellHeader(headerCellData: HeaderCellData): HTMLElement {
    const cellElement: HTMLTableHeaderCellElement = document.createElement('th');
    const resizer = TableHeaderRenderEngine.createResizer();
    resizer.addEventListener('click', e => {
      e.stopPropagation();
    });
    resizer.addEventListener('mousedown', e => TableHeaderRenderEngine.handleResizerMousedown(e, resizer, cellElement));

    TableHeaderRenderEngine.bindConfigToCell(cellElement, headerCellData);
    TableHeaderRenderEngine.bindDataToCell(cellElement, headerCellData);
    TableHeaderRenderEngine.addSortElementIfExist(cellElement, headerCellData);
    TableHeaderRenderEngine.bindTooltipToCell(cellElement, headerCellData);
    cellElement.appendChild(resizer);
    return cellElement;
  }

  private static handleResizerMousedown(e: MouseEvent, resizer: HTMLElement, headerCellElement: HTMLElement) {
    const handleMousemove = (e: MouseEvent) => TableHeaderRenderEngine.handleResizerMousemove(e, resizer, headerCellElement);
    document.addEventListener('mousemove', handleMousemove);
    document.addEventListener(
      'mouseup',
      e => {
        Log.debug('TableHeaderRenderEngine::handleResizerMousedown::removeEvent');
        document.removeEventListener('mousemove', handleMousemove);
        e.stopPropagation();
      },
      { once: true }
    );
  }

  private static handleResizerMousemove(e: MouseEvent, resizer: HTMLElement, headerCellElement: HTMLElement) {
    Log.debug('TableHeaderRenderEngine::handleResizerMousemove::call');
    const clientLeft = headerCellElement.getBoundingClientRect().left;
    headerCellElement.style.width = `${e.clientX - clientLeft + resizer.clientWidth / 2}px`;
    headerCellElement.style.maxWidth = `${e.clientX - clientLeft + resizer.clientWidth / 2}px`;
    headerCellElement.style.minWidth = `${e.clientX - clientLeft + resizer.clientWidth / 2}px`;
  }

  private static createResizer(): HTMLElement {
    const resizer = document.createElement('div');
    resizer.classList.add('resizer');
    return resizer;
  }

  private static bindConfigToCell(cellElement: HTMLTableHeaderCellElement, headerCellData: HeaderCellData): void {
    cellElement.rowSpan = headerCellData.rowSpan;
    cellElement.colSpan = headerCellData.colSpan;

    cellElement.setAttribute('col-index', headerCellData.colIndex.toString());
    cellElement.classList.add(...headerCellData.classList);

    cellElement.style.top = TableDataUtils.toPx(headerCellData.top);

    if (isNumber(headerCellData.left)) {
      cellElement.style.left = TableDataUtils.toPx(headerCellData.left);
    }

    if (isNumber(headerCellData.width)) {
      cellElement.style.width = cellElement.style.maxWidth = cellElement.style.minWidth = TableDataUtils.toPx(headerCellData.width);
    }

    if (headerCellData.onClick) {
      cellElement.onclick = headerCellData.onClick;
    }
    TableDataUtils.setStyle(cellElement, headerCellData.customStyle);
  }

  private static renderSortElement(sortDirection: SortDirection): HTMLElement {
    const iconSort = document.createElement('i');
    switch (sortDirection) {
      case SortDirection.Asc:
        iconSort.classList.add('fas', 'fa-caret-down', 'ml-2');
        break;
      case SortDirection.Desc:
        iconSort.classList.add('fas', 'fa-caret-up', 'ml-2');
        break;
    }
    return iconSort;
  }

  private static bindDataToCell(cell: HTMLElement, cellData: HeaderCellData): void {
    const isCustomRender = !!cellData.cellContent;
    if (isCustomRender) {
      TableHeaderRenderEngine.customRender(cell, cellData);
    } else {
      cell.append(cellData.data);
    }
  }

  private static customRender(cell: HTMLElement, cellData: HeaderCellData) {
    const cellContent = cellData.cellContent;
    if (isString(cellContent)) {
      cell.insertAdjacentHTML('beforeend', cellContent);
    } else if (isArray(cellContent)) {
      cell.append(...cellContent!);
    } else {
      cell.append(cellContent!);
    }
  }

  private static addSortElementIfExist(cell: HTMLElement, cellData: HeaderCellData): void {
    if (cellData.hasSort) {
      const sortElement = TableHeaderRenderEngine.renderSortElement(cellData.sortDirection);
      cell.append(sortElement);
    }
  }

  private static bindTooltipToCell(cellElement: HTMLTableDataCellElement, cellData: HeaderCellData) {
    if (cellData.data) {
      cellElement.setAttribute('data-title', cellData.data);
      TableTooltipUtils.configTooltip(cellElement);
    }
  }
}
