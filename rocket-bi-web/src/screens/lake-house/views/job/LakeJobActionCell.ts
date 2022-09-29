import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';
import { LakeJobResponse } from '@core/lake-house/domain/lake-job/LakeJobResponse';

export class LakeJobActionCell implements CustomCell {
  constructor(
    public readonly options: {
      onEnable: (event: MouseEvent, query: LakeJobResponse) => void;
      onDisable: (event: MouseEvent, query: LakeJobResponse) => void;
      onAction: (event: MouseEvent, query: LakeJobResponse, targetId: string) => void;
    }
  ) {}

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const lakeJobResponse = LakeJobResponse.fromObject(rowData);
    const actionElement = lakeJobResponse.job.canCancel
      ? this.renderDisableAction((rowData as any) as LakeJobResponse, this.options.onDisable)
      : this.renderEnableAction((rowData as any) as LakeJobResponse, this.options.onEnable);
    const actionMenu = this.renderActionMenu((rowData as any) as LakeJobResponse, this.options.onAction);
    return HtmlElementRenderUtils.renderAction([actionElement, actionMenu], 8, 'action-container');
  }

  private renderDisableAction(query: LakeJobResponse, onClick: (event: MouseEvent, query: LakeJobResponse) => void) {
    const id = `action-${query.job.jobId}`;
    const buttonEdit = HtmlElementRenderUtils.renderHtmlAsElement(
      `
         <button id="${id}" type="button" class="btn btn-outline-secondary" style="width: 86.47px; height: 33px">
            Cancel
          </button>
    `
    );
    buttonEdit.addEventListener('click', e => onClick(e, query));
    buttonEdit.setAttribute('data-title', 'Cancel');
    TableTooltipUtils.configTooltip(buttonEdit);
    return buttonEdit;
  }

  private renderEnableAction(query: LakeJobResponse, onClick: (event: MouseEvent, query: LakeJobResponse) => void) {
    const id = `action-${query.job.jobId}`;
    const buttonEdit = HtmlElementRenderUtils.renderHtmlAsElement(
      `
          <button id="${id}" type="button" class="btn btn-primary" style="width: 86.47px; height: 33px">
            Force Run
          </button>
    `
    );
    buttonEdit.addEventListener('click', e => onClick(e, query));
    buttonEdit.setAttribute('data-title', 'Force Run');
    TableTooltipUtils.configTooltip(buttonEdit);
    return buttonEdit;
  }

  private renderActionMenu(query: LakeJobResponse, onClick: (event: MouseEvent, query: LakeJobResponse, targetId: string) => void) {
    const id = `action-menu-${query.job.jobId}`;
    const menu = HtmlElementRenderUtils.renderIcon('di-icon-three-dot-horizontal btn-icon-border action-more icon-action p-2', (e: MouseEvent) =>
      onClick(e, query, id)
    );
    menu.id = id;
    menu.setAttribute('data-title', 'More');
    return menu;
  }
}
