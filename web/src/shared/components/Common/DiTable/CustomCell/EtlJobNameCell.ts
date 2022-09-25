import { CustomCell, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { EtlJobInfo } from '@core/DataCook';

export class EtlJobNameCell implements CustomCell {
  customRender(rowData: RowData): HTMLElement | HTMLElement[] | string {
    const etlJob = (rowData as unknown) as EtlJobInfo;
    const elements = [
      HtmlElementRenderUtils.renderIcon('di-icon-etl mr-2 h3 mb-0'),
      HtmlElementRenderUtils.renderText(etlJob.displayName, 'span', 'font-weight-semi-bold')
    ];
    const div = document.createElement('div');
    div.append(...elements);
    div.classList.add('d-flex', 'align-items-center');
    return div;
  }
}
