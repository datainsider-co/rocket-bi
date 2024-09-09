import { CustomCell, IndexedHeaderData, RowData } from '@/shared/models';
import { OauthConfig } from '@core/common/domain';
import { HtmlElementRenderUtils } from '@/utils';
import { TableTooltipUtils } from '@chart/custom-table/TableTooltipUtils';

export class SSOActionCell implements CustomCell {
  private readonly onToggleActive: (event: MouseEvent, config: OauthConfig) => void;
  private readonly onDelete: (event: MouseEvent, config: OauthConfig) => void;

  constructor(options: { onToggleActive: (event: MouseEvent, config: OauthConfig) => void; onDelete: (event: MouseEvent, config: OauthConfig) => void }) {
    this.onToggleActive = options.onToggleActive;
    this.onDelete = options.onDelete;
  }

  customRender(rowData: RowData, rowIndex: number, header: IndexedHeaderData, columnIndex: number): HTMLElement | HTMLElement[] | string {
    const ssoConfig = OauthConfig.fromObject(rowData);
    const toggleActive = ssoConfig.isActive
      ? this.renderInActiveAction(ssoConfig, this.onToggleActive)
      : this.renderActiveAction(ssoConfig, this.onToggleActive);
    const deleteBtn = this.renderDeleteAction(ssoConfig, this.onDelete);
    return HtmlElementRenderUtils.renderAction([toggleActive, deleteBtn], 8, 'action-container');
  }

  private renderInActiveAction(config: OauthConfig, onClick: (event: MouseEvent, config: OauthConfig) => void) {
    const id = `action-${config.oauthType}`;
    const buttonEdit = HtmlElementRenderUtils.renderHtmlAsElement(
      `
         <button id="${id}" type="button" class="btn btn-outline-secondary" style="width: 91px; height: 33px">
            Inactive
          </button>
    `
    );
    buttonEdit.addEventListener('click', e => onClick(e, config));
    buttonEdit.setAttribute('data-title', 'Inactive');
    TableTooltipUtils.configTooltip(buttonEdit);
    return buttonEdit;
  }

  private renderActiveAction(config: OauthConfig, onClick: (event: MouseEvent, config: OauthConfig) => void) {
    const id = `action-${config.oauthType}`;
    const buttonEdit = HtmlElementRenderUtils.renderHtmlAsElement(
      `
          <button id="${id}" type="button" class="btn btn-primary" style="width: 91px; height: 33px">
            Active
          </button>
    `
    );
    buttonEdit.addEventListener('click', e => onClick(e, config));
    buttonEdit.setAttribute('data-title', 'Active');
    TableTooltipUtils.configTooltip(buttonEdit);
    return buttonEdit;
  }

  private renderDeleteAction(config: OauthConfig, onClick: (event: MouseEvent, config: OauthConfig) => void) {
    const id = `action-menu-${config.oauthType}`;
    const menu = HtmlElementRenderUtils.renderIcon('di-icon-delete btn-icon-border action-more icon-action p-2', (e: MouseEvent) => onClick(e, config));
    menu.id = id;
    menu.setAttribute('data-title', 'Delete');
    return menu;
  }
}
