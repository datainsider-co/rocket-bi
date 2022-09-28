/*
 * @author: tvc12 - Thien Vi
 * @created: 8/25/21, 11:40 AM
 */

import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { get } from 'lodash';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { StringUtils } from '@/utils/string.utils';

export class SizeDataCell implements CustomCell {
  // private static readonly DashboardIcon = require('@/assets/icon/default-avatar.svg');

  constructor(readonly sizeKey: string) {}

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const bytes = get(rowData, this.sizeKey);
    return HtmlElementRenderUtils.renderText(StringUtils.formatByteToDisplay(bytes));
  }
}
