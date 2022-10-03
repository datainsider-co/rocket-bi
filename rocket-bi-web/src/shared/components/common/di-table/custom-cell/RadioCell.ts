import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { FileInfo } from '@core/lake-house';

export class RadioCell implements CustomCell {
  click: (event: MouseEvent, rowData: RowData, checked: boolean) => void;
  check: (rowData: RowData) => boolean;

  constructor(click: (event: MouseEvent, rowData: RowData, checked: boolean) => void, checked: (rowData: RowData) => boolean) {
    this.click = click;
    this.check = checked;
  }

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const fileInfo = FileInfo.fromObject(rowData);
    if (FileInfo.isParentDirectory(fileInfo.name)) {
      return '';
    }
    const radio = document.createElement('input');
    radio.setAttribute('type', 'checkbox');
    radio.checked = this.check(rowData) ?? false;
    radio.addEventListener('click', e => {
      this.click(e, rowData, radio.checked);
    });
    const radioContent: HTMLElement = document.createElement('div');
    const container = document.createElement('div');
    container.appendChild(radio);
    container.appendChild(radioContent);
    HtmlElementRenderUtils.addClass(container, 'radio-cell');
    return container;
  }
}
