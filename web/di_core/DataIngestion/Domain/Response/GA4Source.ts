import { DataSources } from '@core/DataIngestion';
import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { SourceId } from '@core/domain';

export class GA4Source implements DataSource {
  readonly className = DataSources.GA4Source;
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

  static fromObject(obj: any): GA4Source {
    return new GA4Source(obj.id, obj.orgId, obj.displayName, obj.refreshToken, obj.accessToken, obj.lastModify);
  }
}
