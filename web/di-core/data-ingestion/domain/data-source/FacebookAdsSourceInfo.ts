import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { SourceId } from '@core/common/domain';
import { FacebookAdsSource } from '@core/data-ingestion';

export class FacebookAdsSourceInfo implements DataSourceInfo {
  className = DataSources.FacebookAds;
  sourceType = DataSourceType.Facebook;
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

  static default(): FacebookAdsSourceInfo {
    return new FacebookAdsSourceInfo(-1, '-1', '', '', 0);
  }

  static fromObject(obj: any): FacebookAdsSourceInfo {
    return new FacebookAdsSourceInfo(obj.id, obj.orgId, obj.displayName, obj.accessToken, obj.lastModify);
  }

  toDataSource(): DataSource {
    return new FacebookAdsSource(this.id, this.orgId, this.displayName, this.accessToken, this.lastModify);
  }

  getDisplayName(): string {
    return this.displayName;
  }

  withAccessToken(accessToken: string): FacebookAdsSourceInfo {
    this.accessToken = accessToken;
    return this;
  }
}
