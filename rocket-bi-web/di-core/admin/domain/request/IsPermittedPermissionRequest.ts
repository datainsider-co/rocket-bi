export class IsPermittedPermissionRequest {
  username!: string;
  permissions!: string[];

  constructor(username: string, permissions: string[]) {
    this.username = username;
    this.permissions = permissions;
  }
}
