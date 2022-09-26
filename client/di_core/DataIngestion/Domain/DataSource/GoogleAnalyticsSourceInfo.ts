import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/DataIngestion/Domain/DataSource/DataSourceType';
import { DataSources } from '@core/DataIngestion/Domain/DataSource/DataSources';
import { JdbcSource } from '@core/DataIngestion/Domain/Response/JdbcSource';
import { SourceId } from '@core/domain';
import { GoogleCredentialSource } from '@core/DataIngestion/Domain/Response/GoogleCredentialSource';

export class GoogleAnalyticsSourceInfo implements DataSourceInfo {
  className = DataSources.GoogleAnalyticsSource;
  sourceType = DataSourceType.GoogleAnalytics;
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

  static fromGoogleCredentialSource(ggCredentialSource: GoogleCredentialSource): DataSourceInfo {
    const googleAnalyticsSourceInfo = new GoogleAnalyticsSourceInfo(
      ggCredentialSource.id,
      ggCredentialSource.orgId,
      ggCredentialSource.displayName,
      ggCredentialSource.accessToken,
      ggCredentialSource.refreshToken,
      ggCredentialSource.lastModify
    );
    return googleAnalyticsSourceInfo;
  }

  static default(): DataSourceInfo {
    return new GoogleAnalyticsSourceInfo(-1, '-1', '', '', '', 0);
  }

  static fromObject(obj: any): GoogleAnalyticsSourceInfo {
    return new GoogleAnalyticsSourceInfo(obj.id, obj.orgId, obj.displayName, obj.accessToken, obj.refreshToken, obj.lastModify);
  }

  toDataSource(): DataSource {
    const request = new GoogleCredentialSource(this.id, this.orgId, this.sourceType, this.displayName, this.accessToken, this.refreshToken, this.lastModify);
    return request;
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
