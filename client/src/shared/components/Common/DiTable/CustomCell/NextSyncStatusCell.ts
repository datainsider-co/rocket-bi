import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { JobStatus } from '@core/DataIngestion';
import { SchedulerName } from '@/shared/enums/SchedulerName';
import moment from 'moment';
import { get } from 'lodash';
import { StatusCell } from '@/shared/components/Common/DiTable/CustomCell/StatusCell';

export class NextSyncStatusCell implements CustomCell {
  constructor(private statusKey: string, private schedulerNameKey: string, private nextRuntimeKey: string) {}

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const status = rowData[this.statusKey];
    const schedulerName = get(rowData, this.schedulerNameKey, '');
    const nextRuntime = get(rowData, this.nextRuntimeKey, 0);
    if ((status === JobStatus.Error || status === JobStatus.Synced) && schedulerName !== SchedulerName.Once) {
      const syncTime = moment(nextRuntime);
      const currentTime = moment(Date.now());
      const unitsOfTime = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
      let result = HtmlElementRenderUtils.buildTextColor('', 'var(--text-color)');
      for (let iterator = 0; iterator < unitsOfTime.length; iterator++) {
        const unitOfTime = unitsOfTime[iterator];
        // @ts-ignored
        const diff = syncTime.diff(currentTime, unitOfTime);
        if (diff !== 0) {
          result = HtmlElementRenderUtils.buildTextColor(`next sync in ${diff} ${unitOfTime}`, 'var(--text-color)');
          break;
        }
      }
      return result;
    } else {
      const imgSrc = StatusCell.jobStatusImg(rowData[this.statusKey]);
      const elements = [HtmlElementRenderUtils.renderImg(imgSrc), HtmlElementRenderUtils.renderText(rowData[this.statusKey], 'span')];
      const div = document.createElement('div');
      div.append(...elements);
      div.classList.add('custom-status-cell');
      return div;
    }
  }
}
