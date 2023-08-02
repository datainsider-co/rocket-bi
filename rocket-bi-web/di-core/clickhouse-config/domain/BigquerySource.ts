import { DataSource } from './DataSource';
import { DataSourceType } from '@core/clickhouse-config';
import { SourceId } from '@core/common/domain';

export class BigquerySource extends DataSource {
  className: DataSourceType = DataSourceType.Bigquery;
  displayName = 'Bigquery';
  projectId: string;
  credentials: string;
  location?: string;

  constructor(
    id: SourceId,
    createdAt: number,
    updatedAt: number,
    projectId: string,
    credentials: string,
    location?: string,
    createdBy?: string,
    updatedBy?: string
  ) {
    super(id, createdAt, updatedAt, createdBy, updatedBy);
    this.projectId = projectId;
    this.credentials = credentials;
    this.location = location;
  }

  static fromObject(obj: any): BigquerySource {
    return new BigquerySource(
      obj.id,
      obj.createdAt || obj['created_at'],
      obj.updatedAt || obj['updated_at'],
      obj.projectId || obj['project_id'],
      obj.credentials,
      obj.location,
      obj.createdBy || obj['created_by'],
      obj.updatedBy || obj['updated_by']
    );
  }

  toJson(): Record<string, any> {
    return {
      ...super.toJson(),
      project_id: this.projectId,
      credentials: this.credentials,
      location: this.location
    };
  }

  static default(): BigquerySource {
    return new BigquerySource(BigquerySource.DEFAULT_ID, -1, -1, '', '', '');
  }
}
