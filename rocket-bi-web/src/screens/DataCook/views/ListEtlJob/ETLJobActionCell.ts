import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { TableTooltipUtils } from '@chart/CustomTable/TableTooltipUtils';
import { EtlJobInfo } from '@core/DataCook';

export class ETLJobActionCell implements CustomCell {
  constructor(
    public readonly options: {
      onEnable: (event: MouseEvent, jobInfo: EtlJobInfo) => void;
      onDisable: (event: MouseEvent, jobInfo: EtlJobInfo) => void;
      onAction: (event: MouseEvent, jobInfo: EtlJobInfo, targetId: string) => void;
    }
  ) {}

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const job: EtlJobInfo = EtlJobInfo.fromObject(rowData);
    const jobInfo: EtlJobInfo = EtlJobInfo.fromObject(rowData);
    const actionElement = job.canCancel ? this.renderCancelAction(jobInfo, this.options.onDisable) : this.renderForceSyncAction(jobInfo, this.options.onEnable);
    const actionMenu = this.renderActionMenu(jobInfo, this.options.onAction);
    return HtmlElementRenderUtils.renderAction([actionElement, actionMenu], 8, 'action-container');
  }

  private renderCancelAction(query: EtlJobInfo, onClick: (event: MouseEvent, query: EtlJobInfo) => void) {
    const id = `action-${query.id}`;
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

  private renderForceSyncAction(query: EtlJobInfo, onClick: (event: MouseEvent, query: EtlJobInfo) => void) {
    const id = `action-${query.id}`;
    const buttonEdit = HtmlElementRenderUtils.renderHtmlAsElement(
      `
          <button id="${id}" type="button" class="btn btn-primary" style="width: 91px; height: 33px">
            Force Run
          </button>
    `
    );
    buttonEdit.addEventListener('click', e => onClick(e, query));
    buttonEdit.setAttribute('data-title', 'Force Sync');
    TableTooltipUtils.configTooltip(buttonEdit);
    return buttonEdit;
  }

  private renderActionMenu(query: EtlJobInfo, onClick: (event: MouseEvent, query: EtlJobInfo, targetId: string) => void) {
    const id = `action-menu-${query.id}`;
    const menu = HtmlElementRenderUtils.renderIcon('di-icon-three-dot-horizontal btn-icon-border action-more icon-action p-2', (e: MouseEvent) =>
      onClick(e, query, id)
    );
    menu.id = id;
    menu.setAttribute('data-title', 'More');
    return menu;
  }
}
