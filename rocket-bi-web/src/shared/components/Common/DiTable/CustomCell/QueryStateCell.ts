import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { QueryState } from '@core/LakeHouse/Domain';

export class QueryStateCell implements CustomCell {
  constructor(private statusKey: string) {}

  static queryStateImg(state: QueryState) {
    const baseUrl = 'assets/icon/data_ingestion/status';
    switch (state) {
      case QueryState.FAILED:
        return require(`@/${baseUrl}/error.svg`);
      case QueryState.WAITING:
        return require(`@/${baseUrl}/queued.svg`);
      case QueryState.SUCCEEDED:
        return require(`@/${baseUrl}/synced.svg`);
      case QueryState.RUNNING:
        return require(`@/${baseUrl}/syncing.svg`);
      case QueryState.CANCELLED:
        return require(`@/${baseUrl}/terminated.svg`);
      default:
        return require(`@/${baseUrl}/unknown.svg`);
    }
  }

  static queryStateText(state: QueryState) {
    switch (state) {
      case QueryState.FAILED:
        return 'Failed';
      case QueryState.WAITING:
        return 'Waiting';
      case QueryState.SUCCEEDED:
        return 'Succeeded';
      case QueryState.RUNNING:
        return 'Running';
      case QueryState.CANCELLED:
        return 'Cancelled';
      default:
        return '--';
    }
  }

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const imgSrc = QueryStateCell.queryStateImg(rowData[this.statusKey]);
    const text = QueryStateCell.queryStateText(rowData[this.statusKey]);
    const elements = [HtmlElementRenderUtils.renderImg(imgSrc), HtmlElementRenderUtils.renderText(text, 'span')];
    const div = document.createElement('div');
    div.append(...elements);
    div.classList.add('custom-status-cell');
    return div;
  }
}
