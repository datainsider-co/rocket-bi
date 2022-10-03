/*
 * @author: tvc12 - Thien Vi
 * @created: 8/25/21, 11:40 AM
 */

import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { get } from 'lodash';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';

export class UserAvatarCell implements CustomCell {
  // private static readonly DashboardIcon = require('@/assets/icon/default-avatar.svg');

  constructor(readonly avatarKey: string, readonly nameKeys: string[], readonly isTextBold = false, readonly showUnknown = true, readonly disable = false) {}

  customRender(rowData: RowData, rowIndex?: number, header?: IndexedHeaderData, columnIndex?: number): HTMLElement | HTMLElement[] | string {
    const name: string = this.getNameOfUser(rowData, this.nameKeys);
    if (!this.showUnknown && name === 'Unknown') {
      return '';
    }
    const avatarUrl: string | null = get(rowData, this.avatarKey, null);
    const elements = [
      HtmlElementRenderUtils.renderAvatar(name, avatarUrl, 'owner-avt', this.disable),
      HtmlElementRenderUtils.renderText(name, 'span', 'owner-name', this.disable)
    ];
    const div = document.createElement('div');
    div.append(...elements);
    div.classList.add('directory-owner-cell');
    if (this.isTextBold) {
      div.classList.add('text-bold');
    }
    div.setAttribute('data-title', name);
    TableTooltipUtils.configTooltip(div);
    return div;
  }

  private getNameOfUser(rowData: RowData, nameKeys: string[]): string {
    const key = nameKeys.find(key => !!get(rowData, key)) || '';
    return get(rowData, key, 'Unknown');
  }
}
