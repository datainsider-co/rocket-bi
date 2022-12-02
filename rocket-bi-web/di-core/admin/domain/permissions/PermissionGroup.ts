export class PermissionInfo {
  name!: string;
  permission!: string;

  constructor(name: string, permission: string) {
    this.name = name;
    this.permission = permission;
  }
}

export class PermissionGroup {
  groupName!: string;
  allPermission!: PermissionInfo;
  permissions!: PermissionInfo[];

  constructor(groupName: string, allPermission: PermissionInfo, permissions: PermissionInfo[]) {
    this.groupName = groupName;
    this.allPermission = allPermission;
    this.permissions = permissions;
  }

  getAllPermissions() {
    const permissions = this.getPermissions();
    return permissions.concat(this.allPermission.permission);
  }

  getPermissions() {
    return this.permissions?.map(pi => pi.permission) ?? [];
  }

  /**
   *
   * @param selectedPermissions
   */
  getExcludedPermissions(selectedPermissions: string[]): string[] {
    if (selectedPermissions.includes(this.allPermission.permission)) {
      return this.getPermissions();
    } else {
      return [this.allPermission.permission, ...this.getPermissions().filter(permission => !selectedPermissions.includes(permission))];
    }
  }

  getIncludedPermissions(selectedPermissions: string[]): string[] {
    if (selectedPermissions.includes(this.allPermission.permission)) {
      return this.permissions.map(per => per.permission);
    } else {
      return this.getPermissions().filter(permission => selectedPermissions.includes(permission));
    }
  }
}

export class SupportPermissionGroups {
  static organization() {
    return new PermissionGroup('Organization', new PermissionInfo('All', `organization:*:*`), [
      new PermissionInfo('Edit Organization', `organization:edit:*`),
      new PermissionInfo('Delete Organization', `organization:delete:*`)
    ]);
  }

  static user() {
    return new PermissionGroup('User Management', new PermissionInfo('All', `user:*:*`), [
      new PermissionInfo('View Users', `user:view:*`),
      new PermissionInfo('Add New Users', `user:create:*`),
      new PermissionInfo('Edit Users', `user:edit:*`),
      new PermissionInfo('Suspend Users', `user:suspend:*`),
      new PermissionInfo('Delete Users', `user:delete:*`),
      new PermissionInfo('View User Permissions', `permission:view:*`),
      new PermissionInfo('Assign User Permissions', `permission:assign:*`),
      new PermissionInfo('Manage Login Method', `login_method:manage`),
      new PermissionInfo('View User Activities', `user_activity:view:*`)
    ]);
  }

  static billing() {
    return new PermissionGroup('Billing Management', new PermissionInfo('All', `billing:*:*`), [new PermissionInfo('Change Plan', `billing:edit:*`)]);
  }

  static dataSourceIngestion() {
    return new PermissionGroup('Ingestion DataSource', new PermissionInfo('All', `ingestion_source:*:*`), [
      new PermissionInfo('View DataSources', `ingestion_source:view:*`),
      new PermissionInfo('Add DataSources', `ingestion_source:create:*`),
      new PermissionInfo('Edit DataSources', `ingestion_source:edit:*`),
      new PermissionInfo('Delete DataSources', `ingestion_source:delete:*`)
    ]);
  }

  static jobIngestion() {
    return new PermissionGroup('Ingestion Job', new PermissionInfo('All', `ingestion_job:*:*`), [
      new PermissionInfo('View Jobs', `ingestion_job:view:*`),
      new PermissionInfo('Add Jobs', `ingestion_job:create:*`),
      new PermissionInfo('Edit Jobs', `ingestion_job:edit:*`),
      new PermissionInfo('Delete Jobs', `ingestion_job:delete:*`),
      new PermissionInfo('Force Sync', `ingestion_job:force_run:*`),
      new PermissionInfo('Kill Jobs', `ingestion_job:kill:*`),
      new PermissionInfo('View Job Histories', `ingestion_history:view:*`)
    ]);
  }

  static dataWarehouse() {
    return new PermissionGroup('Data Warehouse', new PermissionInfo('All', `database:*:*`), [
      new PermissionInfo('View Databases', `database:view:*`),
      new PermissionInfo('Create Databases', `database:create:*`),
      new PermissionInfo('Rename Databases', `database:edit:*`),
      new PermissionInfo('Delete Databases', `database:delete:*`),
      new PermissionInfo('Share Databases', `database:share:*`),
      new PermissionInfo('Query Analysis', `query_analysis:*:*`),
      new PermissionInfo('Manage Relationship', `relationship:*:*`),
      new PermissionInfo('Manage RLS', 'rls:*:*')
    ]);
  }

  static insights() {
    return new PermissionGroup('Insights', new PermissionInfo('', `insights:*:*`), [new PermissionInfo('Enable', `insight:*:*`)]);
  }

  static dataCook() {
    return new PermissionGroup('DataCook ', new PermissionInfo('', `etl:*:*`), [new PermissionInfo('Enable', `etl:*:*`)]);
  }

  static dataLake() {
    return new PermissionGroup('Data Lake', new PermissionInfo('', `lake:*:*`), [new PermissionInfo('Enable', `lake:*:*`)]);
  }

  static CDP() {
    return new PermissionGroup('CDP', new PermissionInfo('', `cdp:*:*`), [new PermissionInfo('Enable', `cdp:*:*`)]);
  }

  static APIKey() {
    return new PermissionGroup('API Key', new PermissionInfo('', `apikey:*:*`), [new PermissionInfo('Manage API key', `apikey:*:*`)]);
  }
}
