import { DataSource } from './DataSource';
import { DataSourceType } from '@core/clickhouse-config';
import { SourceId } from '@core/common/domain';

export class UnknownSource extends DataSource {
  className: DataSourceType = DataSourceType.Unknown;
  displayName = 'Unknown';
  constructor(id: SourceId, createdAt: number, updatedAt: number, createdBy?: string, updatedBy?: string) {
    super(id, createdAt, updatedAt, createdBy, updatedBy);
  }

  static fromObject(obj: any): UnknownSource {
    return new UnknownSource(
      obj.id,
      obj.createdAt || obj['created_at'],
      obj.updatedAt || obj['updated_at'],
      obj.createdBy || obj['created_by'],
      obj.updatedBy || obj['updated_by']
    );
  }

  toJson(): Record<string, any> {
    return {
      ...super.toJson()
    };
  }

  static default(): UnknownSource {
    return new UnknownSource(UnknownSource.DEFAULT_ID, -1, -1);
  }
}
