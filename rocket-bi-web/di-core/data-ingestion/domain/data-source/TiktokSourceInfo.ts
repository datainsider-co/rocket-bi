import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { SourceId } from '@core/common/domain';
import { FacebookAdsSource, TiktokSource } from '@core/data-ingestion';

export class TiktokSourceInfo implements DataSourceInfo {
  className = DataSources.TiktokAds;
  sourceType = DataSourceType.Tiktok;
  id: SourceId;
  orgId: string;
  displayName: string;
  accessToken: string;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, accessToken: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.accessToken = accessToken;
    this.lastModify = lastModify;
  }

  static default(): TiktokSourceInfo {
    return new TiktokSourceInfo(-1, '-1', '', '', 0);
  }

  static fromObject(obj: any): TiktokSourceInfo {
    return new TiktokSourceInfo(obj.id, obj.orgId, obj.displayName, obj.accessToken, obj.lastModify);
  }

  toDataSource(): DataSource {
    return new TiktokSource(this.id, this.orgId, this.displayName, this.accessToken, this.lastModify);
  }

  getDisplayName(): string {
    return this.displayName;
  }

  withAccessToken(accessToken: string): TiktokSourceInfo {
    this.accessToken = accessToken;
    return this;
  }
}
