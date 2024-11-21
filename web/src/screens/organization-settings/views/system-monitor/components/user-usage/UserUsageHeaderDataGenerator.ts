import { CustomCell, HeaderData } from '@/shared/models';
import { DateTimeUtils, HtmlElementRenderUtils, StringUtils } from '@/utils';
import { UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import { ActivityResourceType } from '@core/organization';

export class UserUsageHeaderDataGenerator {
  generate(): HeaderData[] {
    return [
      {
        key: 'username',
        label: 'User',
        customRenderBodyCell: new UserAvatarCell('owner.avatar', ['username', 'owner.lastName', 'owner.email', 'owner.username']),
        width: 100
      },
      {
        key: 'action',
        label: 'Action',
        width: 250,
        disableSort: true,
        customRenderBodyCell: new CustomCell(rowData => {
          const icon = HtmlElementRenderUtils.renderIcon(this.getResourceTypeIcon(ActivityResourceType.Dashboard));
          const element = HtmlElementRenderUtils.renderText(StringUtils.capitalizeFirstLetter(rowData.message), 'span', 'source-name text-truncate');
          return HtmlElementRenderUtils.renderAction([icon, element], 8, 'source-name-container');
        })
      },
      {
        key: 'timestamp',
        label: 'Execute at',
        customRenderBodyCell: new CustomCell(rowData => {
          const lastModify = rowData.timestamp;
          const data = lastModify !== 0 ? DateTimeUtils.formatAsMMMDDYYYHHmmss(lastModify) : '--';
          return HtmlElementRenderUtils.renderText(data, 'span', 'text-truncate');
        }),
        width: 100
      }
    ];
  }

  private getResourceTypeIcon(resourceType: ActivityResourceType): string {
    switch (resourceType) {
      case ActivityResourceType.Directory:
        return 'di-icon-my-data';
      case ActivityResourceType.Source:
        return 'di-icon-datasource';
      case ActivityResourceType.Etl:
        return 'di-icon-etl';
      case ActivityResourceType.Job:
        return 'di-icon-job';
      case ActivityResourceType.Table:
        return 'di-icon-table';
      case ActivityResourceType.Database:
        return 'di-icon-database';
      case ActivityResourceType.Dashboard:
        return 'di-icon-dashboard';
      case ActivityResourceType.Widget:
        return 'di-icon-widget';
      default:
        return 'di-icon-unknown';
    }
  }
}
