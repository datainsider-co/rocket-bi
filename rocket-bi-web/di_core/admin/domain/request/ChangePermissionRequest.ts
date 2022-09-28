export class ChangePermissionRequest {
  username!: string;
  includePermissions?: string[];
  excludePermissions?: string[];

  constructor(username: string, includePermissions?: string[], excludePermissions?: string[]) {
    this.username = username;
    this.includePermissions = includePermissions;
    this.excludePermissions = excludePermissions;
  }
}
