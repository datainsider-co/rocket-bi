import { CommonPermissionProvider } from '@core/admin/domain/permissions/CommonPermissionProvider';
import { PermissionProvider } from '@core/admin/domain/permissions/PermissionProvider';

export abstract class BasePermsPermissionProvider extends PermissionProvider implements CommonPermissionProvider {
  protected id: string | undefined;
  protected organizationId: string;

  withPermission(id: string) {
    this.id = id;
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

  abstract assign(): string;
}

export class PermsPermissionProviderImpl extends BasePermsPermissionProvider {
  constructor(organizationId: string) {
    super(organizationId);
  }

  all(): string {
    return this.buildPerm(this.organizationId, 'permission', '*', this.id ?? '*');
  }

  view(): string {
    return this.buildPerm(this.organizationId, 'permission', 'view', this.id ?? '*');
  }

  create(): string {
    return this.buildPerm(this.organizationId, 'permission', 'create', this.id ?? '*');
  }

  edit(): string {
    return this.buildPerm(this.organizationId, 'permission', 'edit', this.id ?? '*');
  }

  delete(): string {
    return this.buildPerm(this.organizationId, 'permission', 'delete', this.id ?? '*');
  }

  assign(): string {
    return this.buildPerm(this.organizationId, 'permission', 'assign', this.id ?? '*');
  }
}
