import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/DataIngestion/Domain/DataSource/DataSourceType';
import { DataSources } from '@core/DataIngestion/Domain/DataSource/DataSources';
import { SourceId } from '@core/domain';
import { GoogleCredentialSource } from '@core/DataIngestion/Domain/Response/GoogleCredentialSource';

export class GoogleSheetSourceInfo implements DataSourceInfo {
  className = DataSources.GoogleSheetSource;
  sourceType = DataSourceType.MSSql;
  id: SourceId;
  orgId: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, accessToken: string, refreshToken: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.lastModify = lastModify;
  }

  static fromDataSource(ggCredentialSource: GoogleCredentialSource): DataSourceInfo {
    return new GoogleSheetSourceInfo(
      ggCredentialSource.id,
      ggCredentialSource.orgId,
      ggCredentialSource.displayName,
      ggCredentialSource.accessToken,
      ggCredentialSource.refreshToken,
      ggCredentialSource.lastModify
    );
  }

  static fromObject(obj: any): GoogleSheetSourceInfo {
    return new GoogleSheetSourceInfo(obj.id, obj.orgId, obj.displayName, obj.accessToken, obj.refreshToken, obj.lastModify);
  }

  static default(): GoogleSheetSourceInfo {
    return new GoogleSheetSourceInfo(DataSourceInfo.DEFAULT_ID, DataSourceInfo.DEFAULT_ID.toString(), '', '', '', 0);
  }

  toDataSource(): DataSource {
    const request = new GoogleCredentialSource(this.id, this.orgId, this.sourceType, this.displayName, this.accessToken, this.refreshToken, this.lastModify);
    return request;
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
