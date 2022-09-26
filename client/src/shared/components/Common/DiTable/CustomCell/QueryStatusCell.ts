import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { PeriodicQueryStatus } from '@core/LakeHouse/Domain';

export class QueryStatusCell implements CustomCell {
  constructor(private statusKey: string) {}

  static queryStateImg(state: PeriodicQueryStatus) {
    const baseUrl = 'assets/icon/data_ingestion/status';
    switch (state) {
      case PeriodicQueryStatus.ENABLED:
      case PeriodicQueryStatus.RUNNING:
        return require(`@/${baseUrl}/synced.svg`);
      case PeriodicQueryStatus.DISABLED:
        return require(`@/${baseUrl}/terminated.svg`);
      default:
        return require(`@/${baseUrl}/unknown.svg`);
    }
  }

  static queryStateText(state: PeriodicQueryStatus) {
    switch (state) {
      case PeriodicQueryStatus.RUNNING:
        return 'Running';
      case PeriodicQueryStatus.ENABLED:
        return 'Running';
      case PeriodicQueryStatus.DISABLED:
        return 'Disable';
      default:
        return '--';
    }
  }

  static statusCell(id: string, status: PeriodicQueryStatus) {
    const imgSrc = QueryStatusCell.queryStateImg(status);
    const text = QueryStatusCell.queryStateText(status);
    const elements = [HtmlElementRenderUtils.renderImg(imgSrc), HtmlElementRenderUtils.renderText(text, 'span')];
    const div = document.createElement('div');
    div.append(...elements);
    div.classList.add('custom-status-cell');
    div.id = `status-${id}`;
    return div;
  }

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    return QueryStatusCell.statusCell(rowData.id, rowData[this.statusKey]);
  }
}
