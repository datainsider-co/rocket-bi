import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { TableTooltipUtils } from '@chart/CustomTable/TableTooltipUtils';
import { DataSourceInfo, Job, JobInfo } from '@core/DataIngestion';

export class JobActionCell implements CustomCell {
  constructor(
    public readonly options: {
      onEnable: (event: MouseEvent, query: JobInfo) => void;
      onDisable: (event: MouseEvent, query: JobInfo) => void;
      onAction: (event: MouseEvent, query: JobInfo, targetId: string) => void;
    }
  ) {}

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const job: Job = Job.fromObject(rowData);
    const source: DataSourceInfo = DataSourceInfo.fromObject(rowData);
    const jobInfo: JobInfo = new JobInfo(job, source);
    const actionElement = job.canCancel ? this.renderCancelAction(jobInfo, this.options.onDisable) : this.renderForceSyncAction(jobInfo, this.options.onEnable);
    const actionMenu = this.renderActionMenu(jobInfo, this.options.onAction);
    return HtmlElementRenderUtils.renderAction([actionElement, actionMenu], 8, 'action-container');
  }

  private renderCancelAction(query: JobInfo, onClick: (event: MouseEvent, query: JobInfo) => void) {
    const id = `action-${query.job.jobId}`;
    const buttonEdit = HtmlElementRenderUtils.renderHtmlAsElement(
      `
         <button id="${id}" type="button" class="btn btn-outline-secondary" style="width: 91px; height: 33px">
            Cancel
          </button>
    `
    );
    buttonEdit.addEventListener('click', e => onClick(e, query));
    buttonEdit.setAttribute('data-title', 'Cancel');
    TableTooltipUtils.configTooltip(buttonEdit);
    return buttonEdit;
  }

  private renderForceSyncAction(query: JobInfo, onClick: (event: MouseEvent, query: JobInfo) => void) {
    const id = `action-${query.job.jobId}`;
    const buttonEdit = HtmlElementRenderUtils.renderHtmlAsElement(
      `
          <button id="${id}" type="button" class="btn btn-primary" style="width: 91px; height: 33px">
            Force Sync
          </button>
    `
    );
    buttonEdit.addEventListener('click', e => onClick(e, query));
    buttonEdit.setAttribute('data-title', 'Force Sync');
    TableTooltipUtils.configTooltip(buttonEdit);
    return buttonEdit;
  }

  private renderActionMenu(query: JobInfo, onClick: (event: MouseEvent, query: JobInfo, targetId: string) => void) {
    const id = `action-menu-${query.job.jobId}`;
    const menu = HtmlElementRenderUtils.renderIcon('di-icon-three-dot-horizontal btn-icon-border action-more icon-action p-2', (e: MouseEvent) =>
      onClick(e, query, id)
    );
    menu.id = id;
    menu.setAttribute('data-title', 'More');
    return menu;
  }
}
