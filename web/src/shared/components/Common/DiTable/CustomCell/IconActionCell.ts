/*
 * @author: tvc12 - Thien Vi
 * @created: 8/23/21, 4:49 PM
 */

import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';

type IconActionData = {
  icon: string;
  click: (row: RowData) => void;
};
export class IconActionCell implements CustomCell {
  constructor(private readonly iconActions: IconActionData[]) {}

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const elements = this.iconActions.map(data =>
      HtmlElementRenderUtils.renderIcon(data.icon, event => {
        event.stopPropagation();
        data.click(rowData);
      })
    );
    const div = document.createElement('div');
    div.append(...elements);
    div.classList.add('icon-action-cell');

    return div;
  }
}
