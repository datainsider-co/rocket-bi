import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { SourceId } from '@core/common/domain';
import { GA4Source } from '@core/data-ingestion/domain/response/GA4Source';

export class GoogleSearchConsoleSourceInfo implements DataSourceInfo {
  className = DataSources.GoogleSearchConsole;
  sourceType = DataSourceType.GoogleSearchConsole;
  id: SourceId;
  orgId: string;
  displayName: string;
  refreshToken: string;
  accessToken: string;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, refreshToken: string, accessToken: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.refreshToken = refreshToken;
    this.accessToken = accessToken;
    this.lastModify = lastModify;
  }

  static fromGA4Source(source: GA4Source): DataSourceInfo {
    const googleAnalyticsSourceInfo = new GoogleSearchConsoleSourceInfo(
      source.id,
      source.orgId,
      source.displayName,
      source.refreshToken,
      source.accessToken,
      source.lastModify
    );
    return googleAnalyticsSourceInfo;
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
    return this;
  }

  setRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken;
    return this;
  }

  static default(): GoogleSearchConsoleSourceInfo {
    return new GoogleSearchConsoleSourceInfo(-1, '-1', '', '', '', 0);
  }

  static fromObject(obj: any): GoogleSearchConsoleSourceInfo {
    return new GoogleSearchConsoleSourceInfo(obj.id, obj.orgId ?? '-1', obj.displayName, obj.refreshToken, obj.accessToken, obj.lastModify);
  }

  toDataSource(): DataSource {
    const request = new GoogleSearchConsoleSourceInfo(this.id, this.orgId, this.displayName, this.refreshToken, this.accessToken, this.lastModify);
    return request;
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
