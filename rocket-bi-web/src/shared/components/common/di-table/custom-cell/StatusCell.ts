import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { JobStatus } from '@core/data-ingestion';
import { get } from 'lodash';

export class StatusCell implements CustomCell {
  constructor(private statusKey: string, private getStatusIcon: (status: string) => any) {}

  static jobStatusImg(status: JobStatus) {
    const baseUrl = 'assets/icon/data_ingestion/status';
    switch (status) {
      case JobStatus.Error:
        return require(`@/${baseUrl}/error.svg`);
      case JobStatus.Initialized:
        return require(`@/${baseUrl}/initialized.svg`);
      case JobStatus.Queued:
        return require(`@/${baseUrl}/queued.svg`);
      case JobStatus.Synced:
        return require(`@/${baseUrl}/synced.svg`);
      case JobStatus.Syncing:
        return require(`@/${baseUrl}/syncing.svg`);

      case JobStatus.Terminated:
      case JobStatus.Killed:
        return require(`@/${baseUrl}/terminated.svg`);
      default:
        return require(`@/${baseUrl}/unknown.svg`);
    }
  }

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const status: JobStatus = get(rowData, this.statusKey, JobStatus.Unknown);
    const imgSrc = this.getStatusIcon(status);
    const elements = [HtmlElementRenderUtils.renderImg(imgSrc), HtmlElementRenderUtils.renderText(status, 'span')];
    const div = document.createElement('div');
    div.append(...elements);
    div.classList.add('custom-status-cell');
    return div;
  }
}
