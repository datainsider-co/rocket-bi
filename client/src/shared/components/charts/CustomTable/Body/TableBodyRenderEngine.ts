/*
 * @author: tvc12 - Thien Vi
 * @created: 5/16/21, 4:31 PM
 */
/* eslint max-len: 0 */

import { isArray, isFunction, isNumber, isObject, isString } from 'lodash';
import { TableDataUtils } from '@chart/CustomTable/TableDataUtils';
import { CustomStyleData, DataBarStyle, IconStyle } from '@chart/CustomTable/TableData';
import { TableTooltipUtils } from '@chart/CustomTable/TableTooltipUtils';
import { MouseEventData } from '@chart/BaseChart';
import { ObjectUtils } from '@core/utils';
import { StringUtils } from '@/utils/string.utils';

export interface CellStyle {
  customStyle?: CustomStyleData;
  paddingLeft?: number;
  classList: string[];
  left?: number;
}

export interface CellExpandable {
  isExpandable: boolean;
  isExpanded: boolean;
  onToggleCollapse?: () => void;
}

export interface BodyCellData extends CellExpandable, CellStyle {
  colSpan?: number;
  columnIndex: number;
  data: string;
  customCellContent?: HTMLElement | HTMLElement[] | string;
  onContextMenu?: (mouseData: MouseEventData<string>) => void;
  onClick?: () => void;
}

export interface BodyRowData {
  rowIndex: number;
  classList: string[];
  cells: BodyCellData[];
}

enum RenderType {
  Custom,
  Default,
  Expandable
}

export class TableBodyRenderEngine {
  private static readonly MINUS_ICON = `
<svg width="16px" height="16px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>Group 13</title>
    <g id="Dashboard" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="UI_dashboard_TABLE_Expand_lv2" transform="translate(-736.000000, -399.000000)">
            <g id="Group-12-Copy" transform="translate(704.000000, 116.000000)">
                <g id="Group-13" transform="translate(32.000000, 283.000000)">
                    <rect id="Rectangle" fill="var(--toggle-icon-background-color, #FFFFFF19)" x="0" y="0" width="16" height="16"></rect>
                    <path d="M11.8104265,8.66350711 C11.9368088,8.66350711 12,8.60031596 12,8.47393365 L12,7.67772512 C12,7.55134281 11.9368088,7.48815166 11.8104265,7.48815166 L4.18957346,7.48815166 C4.06319115,7.48815166 4,7.55134281 4,7.67772512 L4,8.47393365 C4,8.60031596 4.06319115,8.66350711 4.18957346,8.66350711 L11.8104265,8.66350711 Z" id="+" fill-rule="nonzero" fill="var(--icon-color, #FFFFFF66)"></path>
                </g>
            </g>
        </g>
    </g>
</svg>`;
  private static readonly PLUS_ICON = `
<svg width="16px" height="16px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>Group 14</title>
    <g id="Dashboard" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="UI_dashboard_TABLES-Copy-2" transform="translate(-736.000000, -290.000000)">
            <g id="Group-14" transform="translate(704.000000, 116.000000)">
                <g transform="translate(32.000000, 174.000000)">
                    <rect id="Rectangle" fill="var(--toggle-icon-background-color, #FFFFFF19)" x="0" y="0" width="16" height="16"></rect>
                    <path d="M8.39810427,12 C8.52448657,12 8.58767773,11.9368088 8.58767773,11.8104265 L8.58767773,11.8104265 L8.58767773,8.73933649 C8.58767773,8.68878357 8.61295419,8.66350711 8.66350711,8.66350711 L8.66350711,8.66350711 L11.8104265,8.66350711 C11.9368088,8.66350711 12,8.60031596 12,8.47393365 L12,8.47393365 L12,7.67772512 C12,7.55134281 11.9368088,7.48815166 11.8104265,7.48815166 L11.8104265,7.48815166 L8.66350711,7.48815166 C8.61295419,7.48815166 8.58767773,7.4628752 8.58767773,7.41232227 L8.58767773,7.41232227 L8.58767773,4.18957346 C8.58767773,4.06319115 8.52448657,4 8.39810427,4 L8.39810427,4 L7.60189573,4 C7.47551343,4 7.41232227,4.06319115 7.41232227,4.18957346 L7.41232227,4.18957346 L7.41232227,7.41232227 C7.41232227,7.4628752 7.38704581,7.48815166 7.33649289,7.48815166 L7.33649289,7.48815166 L4.18957346,7.48815166 C4.06319115,7.48815166 4,7.55134281 4,7.67772512 L4,7.67772512 L4,8.47393365 C4,8.60031596 4.06319115,8.66350711 4.18957346,8.66350711 L4.18957346,8.66350711 L7.33649289,8.66350711 C7.38704581,8.66350711 7.41232227,8.68878357 7.41232227,8.73933649 L7.41232227,8.73933649 L7.41232227,11.8104265 C7.41232227,11.9368088 7.47551343,12 7.60189573,12 L7.60189573,12 L8.39810427,12 Z" id="+" fill="var(--toggle-icon-color, #FFFFFF66)" fill-rule="nonzero"></path>
                </g>
            </g>
        </g>
    </g>
</svg>`;

  static renderIconAndDataAsHTML(iconStyle: IconStyle | undefined, data: any) {
    const textHtml = TableBodyRenderEngine.renderDataAsHtml(data);
    if (isObject(iconStyle)) {
      const layoutClass = StringUtils.toKebabCase(`icon-layout-${iconStyle.layout}`);
      const alignClass = StringUtils.toKebabCase(`icon-align-${iconStyle.align}`);
      return `
            <div class="icon-bar ${layoutClass} ${alignClass}">
              ${textHtml}
              ${iconStyle.iconHTML}
            </div>
          `;
    } else {
      return `${textHtml}`;
    }
  }

  renderCell(cellData: BodyCellData): HTMLElement {
    const cellElement: HTMLTableDataCellElement = document.createElement('td');
    this.bindConfigToCell(cellElement, cellData);
    this.bindDataToCell(cellElement, cellData);
    this.bindDataBarToCell(cellElement, cellData);
    this.bindTooltipToCell(cellElement, cellData);
    this.bindEventToCell(cellElement, cellData);
    return cellElement;
  }

  bindConfigToRow(rowElement: HTMLElement, bodyRowData: BodyRowData): void {
    rowElement.classList.add(...bodyRowData.classList);
    rowElement.setAttribute('row-index', bodyRowData.rowIndex.toString());
  }

  renderRow(bodyRowData: BodyRowData): HTMLElement {
    const rowElement: HTMLElement = document.createElement('tr');
    this.bindConfigToRow(rowElement, bodyRowData);
    const cellElements: HTMLElement[] = bodyRowData.cells.map(cellData => this.renderCell(cellData));
    rowElement.append(...cellElements);
    return rowElement;
  }

  renderBody(listBodyRowData: BodyRowData[]): HTMLElement {
    const tbody: HTMLElement = document.createElement('tbody');
    const rowElements: HTMLElement[] = listBodyRowData.map(row => this.renderRow(row));
    tbody.append(...rowElements);
    return tbody;
  }

  private renderCollapseIcon(cellData: BodyCellData): HTMLElement {
    const iconEl = document.createElement('div');
    iconEl.classList.add('cursor-pointer', 'unselectable', 'sort-icon', 'collapse-icon');
    if (cellData.isExpanded) {
      iconEl.innerHTML = TableBodyRenderEngine.MINUS_ICON;
    } else {
      iconEl.innerHTML = TableBodyRenderEngine.PLUS_ICON;
    }
    if (cellData.onToggleCollapse) {
      iconEl.addEventListener('click', cellData.onToggleCollapse);
    }
    return iconEl;
  }

  private bindConfigToCell(cellElement: HTMLTableDataCellElement, cellData: BodyCellData): void {
    cellElement.setAttribute('col-index', cellData.columnIndex.toString());
    cellElement.classList.add(...cellData.classList);
    if (isNumber(cellData.paddingLeft)) {
      cellElement.style.paddingLeft = TableDataUtils.toPx(cellData.paddingLeft);
    }
    if (isNumber(cellData.colSpan)) {
      cellElement.colSpan = cellData.colSpan;
    }
    if (isNumber(cellData.left)) {
      cellElement.style.left = TableDataUtils.toPx(cellData.left);
    }
    TableDataUtils.setStyle(cellElement, cellData.customStyle);
  }

  private bindDataToCell(cellElement: HTMLTableDataCellElement, cellData: BodyCellData): void {
    const renderType = this.getRenderType(cellData);
    switch (renderType) {
      case RenderType.Custom:
        {
          if (isString(cellData.customCellContent)) {
            cellElement.insertAdjacentHTML('beforeend', cellData.customCellContent);
          } else if (isArray(cellData.customCellContent)) {
            cellElement.append(...cellData.customCellContent!);
          } else {
            cellElement.append(cellData.customCellContent!);
          }
        }
        break;
      case RenderType.Expandable:
        this.renderExpandIcon(cellElement, cellData);
        this.renderData(cellElement, cellData);
        break;
      default:
        this.renderData(cellElement, cellData);
        break;
    }
  }

  private renderData(cellElement: HTMLTableDataCellElement, cellData: BodyCellData) {
    const element = TableBodyRenderEngine.renderIconAndDataAsHTML(cellData.customStyle?.icon, cellData.data);
    cellElement.insertAdjacentHTML('beforeend', element);
  }

  private renderExpandIcon(cellElement: HTMLTableDataCellElement, cellData: BodyCellData) {
    const iconElement = this.renderCollapseIcon(cellData);
    cellElement.append(iconElement);
  }

  private getRenderType(cellData: BodyCellData): RenderType {
    if (cellData.customCellContent) {
      return RenderType.Custom;
    }
    if (cellData.isExpandable) {
      return RenderType.Expandable;
    }

    return RenderType.Default;
  }

  private bindTooltipToCell(cellElement: HTMLTableDataCellElement, cellData: BodyCellData) {
    if (cellData.data) {
      cellElement.setAttribute('data-title', cellData.data);
      TableTooltipUtils.configTooltip(cellElement);
    }
  }

  private bindEventToCell(cellElement: HTMLTableDataCellElement, cellData: BodyCellData) {
    cellElement.addEventListener('contextmenu', event => this.handleShowContextMenu(event, cellData));
    if (isFunction(cellData.onClick)) {
      cellElement.addEventListener('click', cellData.onClick);
    }
  }

  private handleShowContextMenu(event: MouseEvent, cellData: BodyCellData): void {
    if (isFunction(cellData.onContextMenu)) {
      event.preventDefault();
      const mouseEventDataAString = new MouseEventData<string>(event, cellData.data, cellData);
      cellData.onContextMenu(mouseEventDataAString);
    }
  }

  private bindDataBarToCell(cellElement: HTMLTableDataCellElement, cellData: BodyCellData) {
    const dataBar = cellData.customStyle?.dataBar as DataBarStyle;
    if (isObject(dataBar)) {
      cellElement.classList.add('data-bar');
      cellElement.insertAdjacentHTML(
        'afterbegin',
        `
<div class="data-bar-panel">
    <div class="data-bar-positive" style="${ObjectUtils.toCssAsString(dataBar.positiveStyle)}"></div>
    <div class="data-bar-negative" style="${ObjectUtils.toCssAsString(dataBar.negativeStyle)}"></div>
</div>
      `
      );
    }
  }

  private static renderDataAsHtml(data: any) {
    const textNode = document.createTextNode(data);
    const spanElement = document.createElement('span');
    spanElement.append(textNode);
    return spanElement.outerHTML;
  }
}
