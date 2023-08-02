import { DataSourceHeaderHandler } from '../DataSourceHeaderHandler';
import { ClickhouseSource, MySQLSource, UnknownSource } from '@core/clickhouse-config';
import { CustomCell, HeaderData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils';

export class DefaultHeaderHandler extends DataSourceHeaderHandler<UnknownSource> {
  buildHeader(source: UnknownSource): HeaderData[] {
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
