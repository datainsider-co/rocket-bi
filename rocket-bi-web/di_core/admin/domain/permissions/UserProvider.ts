import { CommonPermissionProvider } from '@core/admin/domain/permissions/CommonPermissionProvider';
import { PermissionProvider } from '@core/admin/domain/permissions/PermissionProvider';

export abstract class BaseUserPermissionProvider extends PermissionProvider implements CommonPermissionProvider {
  protected id: string | undefined;
  protected organizationId: string;
  withUserId(id: string) {
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

  abstract activate(): string;

  abstract deactivate(): string;
}

export class UserPermissionProviderImpl extends BaseUserPermissionProvider {
  constructor(organizationId: string) {
    super(organizationId);
  }

  all(): string {
    return this.buildPerm(this.organizationId, 'user', '*', this.id ?? '*');
  }

  view(): string {
    return this.buildPerm(this.organizationId, 'user', 'view', this.id ?? '*');
  }

  create(): string {
    return this.buildPerm(this.organizationId, 'user', 'create', this.id ?? '*');
  }

  edit(): string {
    return this.buildPerm(this.organizationId, 'user', 'edit', this.id ?? '*');
  }

  delete(): string {
    return this.buildPerm(this.organizationId, 'user', 'delete', this.id ?? '*');
  }

  activate(): string {
    return this.buildPerm(this.organizationId, 'user', 'activate', this.id ?? '*');
  }

  deactivate(): string {
    return this.buildPerm(this.organizationId, 'user', 'deactivate', this.id ?? '*');
  }
}
