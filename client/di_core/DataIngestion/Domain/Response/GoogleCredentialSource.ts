import { DataSourceType, DataSources } from '@core/DataIngestion';
import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { SourceId } from '@core/domain';

export class GoogleCredentialSource implements DataSource {
  id: SourceId;
  orgId: string;
  databaseType: DataSourceType;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  readonly className = DataSources.GoogleSheetSource;
  lastModify: number;

  constructor(id: SourceId, orgId: string, databaseType: DataSourceType, displayName: string, accessToken: string, refreshToken: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.databaseType = databaseType;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.lastModify = lastModify;
  }

  get isStreamingSource(): boolean {
    return false;
  }
}
