import { DataSources } from '@core/data-ingestion';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { SourceId } from '@core/common/domain';

export class HubspotSource implements DataSource {
  readonly className = DataSources.Hubspot;
  id: SourceId;
  orgId: string;
  displayName: string;
  apiKey: string;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, apiKey: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.apiKey = apiKey;
    this.lastModify = lastModify;
  }

  static fromObject(obj: any): HubspotSource {
    return new HubspotSource(obj.id, obj.orgId, obj.displayName, obj.apiKey, obj.lastModify);
  }
}
