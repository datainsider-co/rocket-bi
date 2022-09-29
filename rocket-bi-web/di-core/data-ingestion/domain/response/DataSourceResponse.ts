import { DataSource, DataSourceInfo } from '@core/data-ingestion';
import { UserProfile } from '@core/common/domain';

export class DataSourceResponse {
  dataSource: DataSourceInfo;
  creator: UserProfile;

  constructor(dataSourceInfo: DataSourceInfo, creator: UserProfile) {
    this.dataSource = dataSourceInfo;
    this.creator = creator;
  }

  static fromObject(obj: any): DataSourceResponse {
    const dataSourceInfo = DataSourceInfo.fromObject(obj.dataSource);
    const creator = UserProfile.fromObject(obj.creator);
    return new DataSourceResponse(dataSourceInfo, creator);
  }
}
