import { DataSourceHeaderHandler } from '../DataSourceHeaderHandler';
import { ClickhouseConnector, MySqlConnector } from '@core/connector-config';
import { CustomCell, HeaderData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils';

export class MySQLHeaderHandler extends DataSourceHeaderHandler<MySqlConnector> {
  buildHeader(source: MySqlConnector): HeaderData[] {
    return [
      {
        key: 'host',
        label: 'Host',
        customRenderBodyCell: new CustomCell(rowData => {
          return HtmlElementRenderUtils.renderText(source ? `${source?.host}` : '--', 'span', 'text-truncate');
        }),
        disableSort: true
      },
      {
        key: 'port',
        label: 'Port',
        disableSort: true,
        customRenderBodyCell: new CustomCell(rowData => {
          return HtmlElementRenderUtils.renderText(source ? `${source?.port}` : '--', 'span', 'text-truncate');
        }),
        isGroupBy: true
      },
      {
        key: 'username',
        label: 'Username',
        customRenderBodyCell: new CustomCell(rowData => {
          // eslint-disable-next-line
          // const datasourceImage = require(`@/assets/icon/data_ingestion/datasource/ic_default.svg`);
          // const imgElement = HtmlElementRenderUtils.renderImg(datasourceImage, 'data-source-icon');
          const dataElement = HtmlElementRenderUtils.renderText(source ? `${source?.username}` : '--', 'span', 'username text-truncate');
          return HtmlElementRenderUtils.renderAction([dataElement], 8, 'title-cell');
        }),
        disableSort: true
      }
    ];
  }
  getIcon(): string {
    return 'my_sql_small.png';
  }
}
