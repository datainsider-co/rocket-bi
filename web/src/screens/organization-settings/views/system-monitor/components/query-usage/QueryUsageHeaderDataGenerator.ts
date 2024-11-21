import { CustomCell, HeaderData } from '@/shared/models';
import { DateTimeUtils, HtmlElementRenderUtils } from '@/utils';
import { UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';

export class QueryUsageHeaderDataGenerator {
  generate(): HeaderData[] {
    return [
      {
        key: 'query',
        label: 'Query',
        width: 300,
        disableSort: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const element = HtmlElementRenderUtils.renderText(rowData.query, 'span', 'source-name text-truncate');
          return HtmlElementRenderUtils.renderAction([element], 4, 'source-name-container');
        })
      },
      {
        key: 'creator_id',
        label: 'User',
        customRenderBodyCell: new UserAvatarCell('owner.avatar', ['owner.fullName', 'owner.lastName', 'owner.email', 'owner.username']),
        width: 100
      },
      {
        key: 'cost',
        label: 'Execution Time (ms)',
        width: 50
      },
      {
        key: 'create_at',
        label: 'Execute at',
        customRenderBodyCell: new CustomCell(rowData => {
          const lastModify = rowData.createdAt;
          const data = lastModify !== 0 ? DateTimeUtils.formatAsMMMDDYYYHHmmss(lastModify) : '--';
          return HtmlElementRenderUtils.renderText(data, 'span', 'text-truncate');
        }),
        width: 100
      }
    ];
  }
}
