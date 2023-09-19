import { Connector } from './Connector';
import { ConnectorType } from '@core/connector-config';
import { SourceId } from '@core/common/domain';

export class UnknownConnnector extends Connector {
  className: ConnectorType = ConnectorType.Unknown;
  displayName = 'Unknown';
  constructor(id: SourceId, createdAt: number, updatedAt: number, createdBy?: string, updatedBy?: string) {
    super(id, void 0, createdAt, updatedAt, createdBy, updatedBy);
  }

  static fromObject(obj: any): UnknownConnnector {
    return new UnknownConnnector(
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

  static default(): UnknownConnnector {
    return new UnknownConnnector(UnknownConnnector.DEFAULT_ID, -1, -1);
  }
}
