import { DataSourceHeaderHandler } from '../DataSourceHeaderHandler';
import { BigquerySource, ClickhouseSource } from '@core/clickhouse-config';
import { CustomCell, HeaderData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils';

export class BigqueryHeaderHandler extends DataSourceHeaderHandler<BigquerySource> {
  private readonly locations = require('@/screens/organization-settings/views/datasource-config/source-config-impl/locations.json');

  buildHeader(source: BigquerySource): HeaderData[] {
    return [
      // {
      //   key: 'credentials',
      //   label: 'Service Account',
      //   customRenderBodyCell: new CustomCell(rowData => {
      //     const source = rowData?.source ? BigquerySource.fromObject(rowData.source) : null;
      //     // eslint-disable-next-line
      //     // const datasourceImage = require(`@/assets/icon/data_ingestion/datasource/ic_default.svg`);
      //     // const imgElement = HtmlElementRenderUtils.renderImg(datasourceImage, 'data-source-icon');
      //     const dataElement = HtmlElementRenderUtils.renderText(source ? `${source?.credentials}` : '--', 'span', 'username text-truncate');
      //     return HtmlElementRenderUtils.renderAction([dataElement], 8, 'title-cell');
      //   }),
      //   disableSort: true
      // },
      {
        key: 'projectId',
        label: 'Project ID',
        customRenderBodyCell: new CustomCell(rowData => {
          const source = rowData?.source ? BigquerySource.fromObject(rowData.source) : null;
          return HtmlElementRenderUtils.renderText(source ? `${source?.projectId}` : '--', 'span', 'text-truncate');
        }),
        disableSort: true
      },
      {
        key: 'location',
        label: 'Location',
        disableSort: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const source = rowData?.source ? BigquerySource.fromObject(rowData.source) : null;
          const displayName = (this.locations as any[]).find(location => location.type === source?.location)?.label ?? '--';
          return HtmlElementRenderUtils.renderText(displayName, 'span', 'text-truncate');
        }),
        isGroupBy: true,
        width: 100
      }
    ];
  }

  getIcon(): string {
    return 'bigquery_small.svg';
  }
}
