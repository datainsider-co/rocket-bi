import { DataSourceHeaderHandler } from '../DataSourceHeaderHandler';
import { ClickhouseSource } from '@core/clickhouse-config';
import { CustomCell, HeaderData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils';

export class ClickhouseHeaderHandler extends DataSourceHeaderHandler<ClickhouseSource> {
  buildHeader(source: ClickhouseSource): HeaderData[] {
    return [
      {
        key: 'host',
        label: 'Host',
        customRenderBodyCell: new CustomCell(rowData => {
          const source = rowData?.source ? ClickhouseSource.fromObject(rowData.source) : null;
          return HtmlElementRenderUtils.renderText(source ? `${source?.host}` : '--', 'span', 'text-truncate');
        }),
        disableSort: true
      },
      {
        key: 'username',
        label: 'Username',
        customRenderBodyCell: new CustomCell(rowData => {
          const source = rowData?.source ? ClickhouseSource.fromObject(rowData.source) : null;
          // eslint-disable-next-line
          // const datasourceImage = require(`@/assets/icon/data_ingestion/datasource/ic_default.svg`);
          // const imgElement = HtmlElementRenderUtils.renderImg(datasourceImage, 'data-source-icon');
          const dataElement = HtmlElementRenderUtils.renderText(source ? `${source?.username}` : '--', 'span', 'username text-truncate');
          return HtmlElementRenderUtils.renderAction([dataElement], 8, 'title-cell');
        }),
        disableSort: true
      },
      {
        key: 'httpPort',
        label: 'HTTP Port',
        disableSort: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const source = rowData?.source ? ClickhouseSource.fromObject(rowData.source) : null;
          return HtmlElementRenderUtils.renderText(source ? `${source?.httpPort}` : '--', 'span', 'text-truncate');
        }),
        isGroupBy: true,
        width: 100
      },
      {
        key: 'tcpPort',
        label: 'TCP Port',
        customRenderBodyCell: new CustomCell(rowData => {
          const source = rowData?.source ? ClickhouseSource.fromObject(rowData.source) : null;
          return HtmlElementRenderUtils.renderText(source ? `${source?.tcpPort}` : '--', 'span', 'text-truncate');
        }),
        disableSort: true,
        isGroupBy: true,
        width: 100
      }
    ];
  }
  getIcon(): string {
    return 'clickhouse_small.svg';
  }
}
