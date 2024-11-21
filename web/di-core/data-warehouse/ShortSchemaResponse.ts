import { ShortDatabaseInfo, DatabaseInfo, UserProfile } from '@core/common/domain';
export class ShortSchemaResponse {
  constructor(public database: ShortDatabaseInfo, public owner?: UserProfile) {}

  static fromObject(obj: any): ShortSchemaResponse {
    const db = ShortDatabaseInfo.fromObject(obj.database);
    const owner = obj.owner ? UserProfile.fromObject(obj.owner) : void 0;
    return new ShortSchemaResponse(db, owner);
  }
}

export class FullSchemaResponse {
  constructor(public database: DatabaseInfo, public owner?: UserProfile) {}

  static fromObject(obj: any): FullSchemaResponse {
    const db = DatabaseInfo.fromObject(obj.database);
    const owner = obj.owner ? UserProfile.fromObject(obj.owner) : void 0;
    return new FullSchemaResponse(db, owner);
  }
}
