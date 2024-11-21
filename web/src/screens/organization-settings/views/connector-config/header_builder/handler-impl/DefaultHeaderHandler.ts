import { DataSourceHeaderHandler } from '../DataSourceHeaderHandler';
import { ClickhouseConnector, MySqlConnector, UnknownConnnector } from '@core/connector-config';
import { CustomCell, HeaderData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils';

export class DefaultHeaderHandler extends DataSourceHeaderHandler<UnknownConnnector> {
  buildHeader(source: UnknownConnnector): HeaderData[] {
    return [
      {
        key: 'displayName',
        label: 'Name',
        customRenderBodyCell: new CustomCell(rowData => {
          return HtmlElementRenderUtils.renderText(source ? `${source?.displayName}` : '--', 'span', 'text-truncate');
        }),
        disableSort: true
      }
    ];
  }
  getIcon(): string {
    return 'my_sql_small.png';
  }
}
