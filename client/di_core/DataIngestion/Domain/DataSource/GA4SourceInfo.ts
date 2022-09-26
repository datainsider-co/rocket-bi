import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/DataIngestion/Domain/DataSource/DataSourceType';
import { DataSources } from '@core/DataIngestion/Domain/DataSource/DataSources';
import { SourceId } from '@core/domain';
import { GA4Source } from '@core/DataIngestion/Domain/Response/GA4Source';

export class GA4SourceInfo implements DataSourceInfo {
  className = DataSources.GA4Source;
  sourceType = DataSourceType.GA4;
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
    const googleAnalyticsSourceInfo = new GA4SourceInfo(
      source.id,
      source.orgId,
      source.displayName,
      source.refreshToken,
      source.accessToken,
      source.lastModify
    );
    return googleAnalyticsSourceInfo;
  }

  static default(): DataSourceInfo {
    return new GA4SourceInfo(-1, '-1', '', '', '', 0);
  }

  static fromObject(obj: any): GA4SourceInfo {
    return new GA4SourceInfo(obj.id, obj.orgId ?? '-1', obj.displayName, obj.refreshToken, obj.accessToken, obj.lastModify);
  }

  toDataSource(): DataSource {
    const request = new GA4SourceInfo(this.id, this.orgId, this.displayName, this.refreshToken, this.accessToken, this.lastModify);
    return request;
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
