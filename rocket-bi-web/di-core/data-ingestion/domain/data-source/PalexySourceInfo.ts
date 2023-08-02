import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DataSourceInfo } from './DataSourceInfo';
import { DataSourceType } from '@core/data-ingestion/domain/data-source/DataSourceType';
import { DataSources } from '@core/data-ingestion/domain/data-source/DataSources';
import { JdbcSource } from '@core/data-ingestion/domain/response/JdbcSource';
import { SourceId } from '@core/common/domain';
import { StringUtils } from '@/utils';
import { NewFieldData } from '@/screens/user-management/components/user-detail/AddNewFieldModal.vue';
import { Log } from '@core/utils';
import { PalexySource } from '@core/data-ingestion/domain/response/PalexySource';

export class PalexySourceInfo implements DataSourceInfo {
  className = DataSources.Palexy;
  sourceType = DataSourceType.Palexy;
  id: SourceId;
  orgId: string;
  displayName: string;
  lastModify: number;
  apiKey: string;

  constructor(id: SourceId, orgId: string, displayName: string, lastModify: number, apiKey: string) {
    this.id = id;
    this.orgId = orgId;
    this.displayName = displayName;
    this.lastModify = lastModify;
    this.apiKey = apiKey;
  }

  static fromSource(obj: PalexySource): DataSourceInfo {
    return new PalexySourceInfo(obj.id, obj.orgId, obj.displayName, obj.lastModify, obj.apiKey);
  }

  static fromObject(obj: any): PalexySourceInfo {
    return new PalexySourceInfo(
      obj.id ?? DataSourceInfo.DEFAULT_ID,
      obj.orgId ?? DataSourceInfo.DEFAULT_ID.toString(),
      obj.displayName ?? '',
      obj.lastModify ?? 0,
      obj.apiKey ?? ''
    );
  }

  toDataSource(): DataSource {
    return new PalexySource(this.id, this.orgId, this.displayName, this.lastModify, this.apiKey);
  }

  getDisplayName(): string {
    return this.displayName;
  }
}
