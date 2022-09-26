export class DatabaseInfo {
  name!: string;
  organizationId!: number;
  displayName!: string;
  createdTime?: number;
  updatedTime?: number;

  constructor(name: string, organizationId: number, displayName: string, createdTime?: number, updatedTime?: number) {
    this.name = name;
    this.organizationId = organizationId;
    this.displayName = displayName;
    this.createdTime = createdTime;
    this.updatedTime = updatedTime;
  }

  static fromObject(obj: DatabaseInfo): DatabaseInfo {
    return new DatabaseInfo(obj.name, obj.organizationId, obj.displayName, obj.createdTime, obj.updatedTime);
  }
}
