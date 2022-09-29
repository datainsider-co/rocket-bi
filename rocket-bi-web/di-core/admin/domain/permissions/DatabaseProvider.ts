import { CommonPermissionProvider } from '@core/admin/domain/permissions/CommonPermissionProvider';
import { PermissionProvider } from '@core/admin/domain/permissions/PermissionProvider';

export abstract class BaseDataPermissionProvider extends PermissionProvider implements CommonPermissionProvider {
  protected dbName: string | undefined;
  protected organizationId: string;

  withDbName(name: string) {
    this.dbName = name;
    return this;
  }

  protected constructor(organizationId: string) {
    super();
    this.organizationId = organizationId;
  }

  abstract all(): string;

  abstract view(): string;

  abstract create(): string;

  abstract edit(): string;

  abstract delete(): string;
}

export class DatabasePermissionProviderImpl extends BaseDataPermissionProvider {
  constructor(organizationId: string) {
    super(organizationId);
  }

  all(): string {
    return this.buildPerm(this.organizationId, 'database', '*', this.dbName?.toString() ?? '*');
  }

  view(): string {
    return this.buildPerm(this.organizationId, 'database', 'view', this.dbName?.toString() ?? '*');
  }

  create(): string {
    return this.buildPerm(this.organizationId, 'database', 'create', this.dbName?.toString() ?? '*');
  }

  edit(): string {
    return this.buildPerm(this.organizationId, 'database', 'edit', this.dbName?.toString() ?? '*');
  }

  delete(): string {
    return this.buildPerm(this.organizationId, 'database', 'delete', this.dbName?.toString() ?? '*');
  }
}
