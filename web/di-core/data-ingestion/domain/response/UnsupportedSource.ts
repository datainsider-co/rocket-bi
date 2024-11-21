import { DataSource, DataSourceType, DataSources } from '@core/data-ingestion';
import { SourceId } from '@core/common/domain';

export class UnsupportedSource implements DataSource {
  id: SourceId;
  orgId: string;
  databaseType: DataSourceType;
  displayName: string;
  readonly className = DataSources.UnsupportedSource;
  lastModify: number;

  constructor(id: SourceId, orgId: string, databaseType: DataSourceType, displayName: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.databaseType = databaseType;
    this.lastModify = lastModify;
  }

  static fromObject(obj: any): UnsupportedSource {
    return new UnsupportedSource(obj.id, obj.orgId, obj.databaseType, obj.displayName, obj.lastModify);
  }
}
