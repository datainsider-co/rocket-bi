import { CommonPermissionProvider } from '@core/admin/domain/permissions/CommonPermissionProvider';
import { PermissionProvider } from '@core/admin/domain/permissions/PermissionProvider';

export abstract class BaseDirectoryPermissionProvider extends PermissionProvider implements CommonPermissionProvider {
  protected id: number | undefined;
  protected organizationId: string;
  withDirectoryId(id: number) {
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

  abstract copy(): string;
}

export class DirectoryPermissionProviderImpl extends BaseDirectoryPermissionProvider {
  constructor(organizationId: string) {
    super(organizationId);
  }

  all(): string {
    return this.buildPerm(this.organizationId, 'directory', '*', this.id?.toString() ?? '*');
  }

  view(): string {
    return this.buildPerm(this.organizationId, 'directory', 'view', this.id?.toString() ?? '*');
  }

  create(): string {
    return this.buildPerm(this.organizationId, 'directory', 'create', this.id?.toString() ?? '*');
  }

  edit(): string {
    return this.buildPerm(this.organizationId, 'directory', 'edit', this.id?.toString() ?? '*');
  }

  delete(): string {
    return this.buildPerm(this.organizationId, 'directory', 'delete', this.id?.toString() ?? '*');
  }

  copy(): string {
    return this.buildPerm(this.organizationId, 'directory', 'copy', this.id?.toString() ?? '*');
  }
}
