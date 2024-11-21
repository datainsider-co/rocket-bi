import { DataSource, DataSourceInfo, DataSourceType, JdbcSource, DataSources } from '@core/data-ingestion';
import { SourceId } from '@core/common/domain';
import { UnsupportedSource } from '@core/data-ingestion/domain/response/UnsupportedSource';

export class UnsupportedSourceInfo implements DataSourceInfo {
  className = DataSources.UnsupportedSource;
  sourceType = DataSourceType.Unsupported;
  id: SourceId;
  orgId: string;
  displayName: string;
  lastModify: number;

  constructor(id: SourceId, orgId: string, displayName: string, lastModify: number) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.lastModify = lastModify;
  }

  static fromObject(obj: any): UnsupportedSourceInfo {
    return new UnsupportedSourceInfo(
      obj.id ?? DataSourceInfo.DEFAULT_ID,
      obj.orgId ?? DataSourceInfo.DEFAULT_ID.toString(),
      obj.displayName ?? '',
      obj.lastModify ?? 0
    );
  }

  toDataSource(): DataSource {
    return new UnsupportedSource(this.id, this.orgId, this.sourceType, this.displayName, this.lastModify);
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
