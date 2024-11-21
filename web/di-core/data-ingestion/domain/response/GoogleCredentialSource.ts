import { DataSourceType, DataSources } from '@core/data-ingestion';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { SourceId } from '@core/common/domain';

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
