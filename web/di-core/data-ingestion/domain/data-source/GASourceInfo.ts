import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { SourceId } from '@core/common/domain';
import { GASource } from '@core/data-ingestion/domain/response/GASource';

export class GASourceInfo implements DataSourceInfo {
  className = DataSources.GASource;
  sourceType = DataSourceType.GA;
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

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
    return this;
  }

  setRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken;
    return this;
  }

  static fromGASource(source: GASource): DataSourceInfo {
    const googleAnalyticsSourceInfo = new GASourceInfo(source.id, source.orgId, source.displayName, source.refreshToken, source.accessToken, source.lastModify);
    return googleAnalyticsSourceInfo;
  }

  static default(): GASourceInfo {
    return new GASourceInfo(-1, '-1', '', '', '', 0);
  }

  static fromObject(obj: any): GASourceInfo {
    return new GASourceInfo(obj.id, obj.orgId ?? '-1', obj.displayName, obj.refreshToken, obj.accessToken, obj.lastModify);
  }

  toDataSource(): DataSource {
    const request = new GASourceInfo(this.id, this.orgId, this.displayName, this.refreshToken, this.accessToken, this.lastModify);
    return request;
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
