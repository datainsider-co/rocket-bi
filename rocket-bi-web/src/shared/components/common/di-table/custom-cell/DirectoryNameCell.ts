/*
 * @author: tvc12 - Thien Vi
 * @created: 8/25/21, 11:40 AM
 */

import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { Directory, DirectoryType } from '@core/common/domain';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';

export class DirectoryNameCell implements CustomCell {
  private static readonly DirectoryIcon = require('@/assets/icon/directory.svg');
  private static readonly DashboardIcon = require('@/assets/icon/dashboard.svg');
  private static readonly QueryIcon = require('@/assets/icon/query.svg');

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const directory = (rowData as unknown) as Directory;
    const imgSrc = DirectoryNameCell.getImageSrc(directory.directoryType);

    const elements = [HtmlElementRenderUtils.renderImg(imgSrc), HtmlElementRenderUtils.renderText(directory.name, 'span')];
    if (directory.isStarred) {
      const starIcon = HtmlElementRenderUtils.renderIcon('di-icon-star-fill');
      elements.push(starIcon);
    }
    const div = document.createElement('div');
    div.append(...elements);
    div.classList.add('directory-name-cell');
    return div;
  }
  private static getImageSrc(type: DirectoryType) {
    switch (type) {
      case DirectoryType.Directory:
        return DirectoryNameCell.DirectoryIcon;
      case DirectoryType.Dashboard:
        return DirectoryNameCell.DashboardIcon;
      case DirectoryType.Query:
        return DirectoryNameCell.QueryIcon;
    }
  }
}
