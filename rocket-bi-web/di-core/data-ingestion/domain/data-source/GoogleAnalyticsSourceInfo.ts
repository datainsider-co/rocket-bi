import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { JdbcSource } from '@core/data-ingestion/domain/response/JdbcSource';
import { SourceId } from '@core/common/domain';
import { GoogleCredentialSource } from '@core/data-ingestion/domain/response/GoogleCredentialSource';

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
