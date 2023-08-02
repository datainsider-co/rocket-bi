import { ClickhouseSource, DataSourceType, BigquerySource, MySQLSource, UnknownSource, VerticaSource } from '@core/clickhouse-config';
import { Log } from '@core/utils';
import { ClassNotFound, SourceId } from '@core/common/domain';

export abstract class DataSource {
  static readonly DEFAULT_ID = -2;

  abstract className: DataSourceType;
  abstract displayName: string;
  id: SourceId;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  updatedBy?: string;

  protected constructor(id: SourceId, createdAt: number, updatedAt: number, createdBy?: string, updatedBy?: string) {
    this.id = id;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromObject(obj: any | DataSource): DataSource {
    switch (obj.className) {
      case DataSourceType.Clickhouse:
        return ClickhouseSource.fromObject(obj);
      case DataSourceType.Bigquery:
        return BigquerySource.fromObject(obj);
      case DataSourceType.MySQL:
        return MySQLSource.fromObject(obj);
      case DataSourceType.Vertica:
        return VerticaSource.fromObject(obj);
      default:
        Log.error('DataSource::fromObject::', obj);
        return UnknownSource.fromObject(obj);
      // throw new ClassNotFound(`Data source ${obj.className} is not supported!`);
    }
  }

  static default(type: DataSourceType): DataSource {
    switch (type) {
      case DataSourceType.Clickhouse:
        return ClickhouseSource.default();
      case DataSourceType.Bigquery:
        return BigquerySource.default();
      case DataSourceType.MySQL:
        return MySQLSource.default();
      case DataSourceType.Vertica:
        return VerticaSource.default();
      default:
        return UnknownSource.default();
    }
  }

  toJson(): Record<string, any> {
    return {
      class_name: this.className,
      id: this.id,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      created_by: this.createdBy,
      updated_by: this.updatedBy
    };
  }

  get isCreating(): boolean {
    return this.id === DataSource.DEFAULT_ID;
  }
}
