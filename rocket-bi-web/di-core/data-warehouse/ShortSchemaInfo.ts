import { DatabaseInfo, DatabaseSchema, UserProfile } from '@core/common/domain';
export class ShortSchemaInfo {
  constructor(public database: DatabaseInfo, public owner: UserProfile) {}

  static fromObject(obj: any): ShortSchemaInfo {
    return new ShortSchemaInfo(obj.database, obj.owner);
  }
}

export class FullSchemaInfo {
  constructor(public database: DatabaseSchema, public owner?: UserProfile) {}

  static fromObject(obj: any): FullSchemaInfo {
    const db = DatabaseSchema.fromObject(obj.database);
    const owner = obj.owner ? UserProfile.fromObject(obj.owner) : void 0;
    return new FullSchemaInfo(db, owner);
  }
}
