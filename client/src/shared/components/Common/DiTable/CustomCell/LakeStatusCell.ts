import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { JobStatus } from '@core/DataIngestion';
import { get } from 'lodash';
import { LakeJobStatus } from '@core/LakeHouse/Domain/LakeJob/LakeJobStatus';
import { LakeJob } from '@core/LakeHouse/Domain/LakeJob/LakeJob';

export class LakeStatusCell implements CustomCell {
  constructor(private statusKey: string) {}

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const status: LakeJobStatus = get(rowData, this.statusKey, JobStatus.Unknown);
    const imgSrc = LakeJob.getIconFromStatus(status);
    const elements = [HtmlElementRenderUtils.renderImg(imgSrc), HtmlElementRenderUtils.renderText(status, 'span')];
    const div = document.createElement('div');
    div.append(...elements);
    div.classList.add('custom-status-cell');
    return div;
  }
}
