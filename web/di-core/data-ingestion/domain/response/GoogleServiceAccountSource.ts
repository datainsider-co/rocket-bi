import { DataSourceType, DataSources } from '@core/data-ingestion';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { SourceId } from '@core/common/domain';

export class GoogleServiceAccountSource implements DataSource {
  id: SourceId;
  orgId: string;
  displayName: string;
  credential: string;
  readonly className = DataSources.GoogleServiceAccountSource;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, credential: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.credential = credential;
    this.lastModify = lastModify;
  }

  static fromObject(obj: any): GoogleServiceAccountSource {
    return new GoogleServiceAccountSource(obj.id, obj.orgId, obj.displayName, obj.credential, obj.lastModify);
  }
}
