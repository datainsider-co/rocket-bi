import { DataSources } from '@core/data-ingestion';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { SourceId } from '@core/common/domain';

export class FacebookAdsSource implements DataSource {
  readonly className = DataSources.FacebookAds;
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

  static fromObject(obj: any): FacebookAdsSource {
    return new FacebookAdsSource(obj.id, obj.orgId, obj.displayName, obj.accessToken, obj.lastModify);
  }
}
