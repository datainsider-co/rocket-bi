import { ListUtils } from '@/utils';

export class PermissionInfo {
  constructor(public name: string, public permission: string) {}
}

export class PermissionGroup {
  constructor(public groupName: string, public permissions: PermissionInfo[], public sudoPermission: PermissionInfo[] = []) {}

  get hasSudoPermission(): boolean {
    return ListUtils.isNotEmpty(this.sudoPermission);
  }

  getAllPermissions(): string[] {
    return [...this.getSudoPermissions(), ...this.getPermissions()];
  }

  getPermissions(): string[] {
    return this.permissions?.map(perm => perm.permission) ?? [];
  }

  getSudoPermissions(): string[] {
    return this.sudoPermission?.map(perm => perm.permission) ?? [];
  }

  /**
   *
   * @param selectedPermissions
   */
  getExcludedPermissions(selectedPermissions: string[]): string[] {
    const allPermissions: string[] = this.getAllPermissions();
    return ListUtils.diff(allPermissions, selectedPermissions);
  }

  getIncludedPermissions(selectedPermissions: string[]): string[] {
    const allPermissions: string[] = this.getAllPermissions();
    return ListUtils.intersection(allPermissions, selectedPermissions);
  }

  isSudoPermission(selectedItems: string[]) {
    return ListUtils.isNotEmpty(ListUtils.intersection(this.getSudoPermissions(), selectedItems));
  }
}

export class SupportPermissionGroups {
  static organization() {
    return new PermissionGroup(
      'Organization',
      [new PermissionInfo('Edit Organization', `organization:edit:*`), new PermissionInfo('Delete Organization', `organization:delete:*`)],
      [new PermissionInfo('All', `organization:*:*`)]
    );
  }

  static user() {
    return new PermissionGroup(
      'User Management',
      [
        new PermissionInfo('View Users', `user:view:*`),
        new PermissionInfo('Add New Users', `user:create:*`),
        new PermissionInfo('Edit Users', `user:edit:*`),
        new PermissionInfo('Suspend Users', `user:suspend:*`),
        new PermissionInfo('Delete Users', `user:delete:*`),
        new PermissionInfo('View User Permissions', `permission:view:*`),
        new PermissionInfo('Assign User Permissions', `permission:assign:*`),
        new PermissionInfo('Manage Login Method', `login_method:manage`),
        new PermissionInfo('View User Activities', `user_activity:view:*`)
      ],
      [new PermissionInfo('All', `user:*:*`)]
    );
  }

  static billing() {
    return new PermissionGroup('Billing Management', [new PermissionInfo('Change Plan', `billing:edit:*`)], [new PermissionInfo('All', `billing:*:*`)]);
  }

  static dataSourceIngestion() {
    return new PermissionGroup(
      'Ingestion DataSource',
      [
        new PermissionInfo('View DataSources', `ingestion_source:view:*`),
        new PermissionInfo('Add DataSources', `ingestion_source:create:*`),
        new PermissionInfo('Edit DataSources', `ingestion_source:edit:*`),
        new PermissionInfo('Delete DataSources', `ingestion_source:delete:*`)
      ],
      [new PermissionInfo('All', `ingestion_source:*:*`)]
    );
  }

  static jobIngestion() {
    return new PermissionGroup(
      'Ingestion Job',
      [
        new PermissionInfo('View Jobs', `ingestion_job:view:*`),
        new PermissionInfo('Add Jobs', `ingestion_job:create:*`),
        new PermissionInfo('Edit Jobs', `ingestion_job:edit:*`),
        new PermissionInfo('Delete Jobs', `ingestion_job:delete:*`),
        new PermissionInfo('Force Sync', `ingestion_job:force_run:*`),
        new PermissionInfo('Kill Jobs', `ingestion_job:kill:*`),
        new PermissionInfo('View Job Histories', `ingestion_history:view:*`)
      ],
      [new PermissionInfo('All', `ingestion_job:*:*`)]
    );
  }

  static dataWarehouse() {
    return new PermissionGroup(
      'Data Warehouse',
      [
        new PermissionInfo('View Databases', `database:view:*`),
        new PermissionInfo('Create Databases', `database:create:*`),
        new PermissionInfo('Rename Databases', `database:edit:*`),
        new PermissionInfo('Delete Databases', `database:delete:*`),
        new PermissionInfo('Share Databases', `database:share:*`),
        new PermissionInfo('Query Analysis', `query_analysis:*:*`),
        new PermissionInfo('Manage Relationship', `relationship:*:*`),
        new PermissionInfo('Manage RLS', 'rls:*:*')
      ],
      [new PermissionInfo('All', `database:*:*`)]
    );
  }

  static insights() {
    return new PermissionGroup('Insights', [new PermissionInfo('Enable', `insight:*:*`)]);
  }

  static dataCook() {
    return new PermissionGroup('DataCook ', [new PermissionInfo('Enable', `etl:*:*`)]);
  }

  static dataLake() {
    return new PermissionGroup('Data Lake', [new PermissionInfo('Enable', `lake:*:*`)]);
  }

  static cdp() {
    return new PermissionGroup('CDP', [new PermissionInfo('Enable', `cdp:*:*`)]);
  }

  static apiKey() {
    return new PermissionGroup('API Key', [new PermissionInfo('Manage API key', `apikey:*:*`)]);
  }
}
