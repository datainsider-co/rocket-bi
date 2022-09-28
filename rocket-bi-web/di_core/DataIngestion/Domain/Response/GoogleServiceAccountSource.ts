import { DataSourceType, DataSources } from '@core/DataIngestion';
import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { SourceId } from '@core/domain';

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
