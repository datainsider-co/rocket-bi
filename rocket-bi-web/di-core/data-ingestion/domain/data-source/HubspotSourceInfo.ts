import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { SourceId } from '@core/common/domain';
import { HubspotSource } from '@core/data-ingestion';

export class HubspotSourceInfo implements DataSourceInfo {
  className = DataSources.Hubspot;
  sourceType = DataSourceType.Hubspot;
  id: SourceId;
  orgId: string;
  displayName: string;
  apiKey: string;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, apiKey: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.lastModify = lastModify;
    this.apiKey = apiKey;
  }

  static default(): HubspotSourceInfo {
    return new HubspotSourceInfo(-1, '-1', '', '', 0);
  }

  static fromObject(obj: any): HubspotSourceInfo {
    return new HubspotSourceInfo(obj.id, obj.orgId ?? '-1', obj.displayName ?? '', obj.apiKey ?? '', obj.lastModify ?? Date.now());
  }

  toDataSource(): DataSource {
    return new HubspotSource(this.id, this.orgId, this.displayName, this.apiKey, this.lastModify);
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
