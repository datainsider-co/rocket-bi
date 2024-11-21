import { DatabaseInfo } from './DatabaseInfo';
import { ListUtils } from '@/utils';

export class ShortDatabaseInfo extends DatabaseInfo {
  constructor(name: string, organizationId: number, displayName: string, createdTime?: number, updatedTime?: number) {
    super(name, organizationId, displayName, [], createdTime, updatedTime);
  }

  static fromObject(obj: ShortDatabaseInfo): ShortDatabaseInfo {
    return new ShortDatabaseInfo(obj.name, obj.organizationId, obj.displayName, obj.createdTime, obj.updatedTime);
  }

  static isShortDatabaseInfo(dbInfo: DatabaseInfo): dbInfo is ShortDatabaseInfo {
    return ListUtils.isEmpty(dbInfo.tables);
  }
}
