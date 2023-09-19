import { Connector } from './Connector';
import { ConnectorType } from '@core/connector-config';
import { SourceId } from '@core/common/domain';

export class BigqueryConnector extends Connector {
  className: ConnectorType = ConnectorType.Bigquery;
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
    super(id, void 0, createdAt, updatedAt, createdBy, updatedBy);
    this.projectId = projectId;
    this.credentials = credentials;
    this.location = location;
  }

  static fromObject(obj: any): BigqueryConnector {
    return new BigqueryConnector(
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

  static default(): BigqueryConnector {
    return new BigqueryConnector(BigqueryConnector.DEFAULT_ID, -1, -1, '', '', '');
  }
}
