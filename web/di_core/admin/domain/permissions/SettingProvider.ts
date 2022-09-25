import { CommonPermissionProvider } from '@core/admin/domain/permissions/CommonPermissionProvider';
import { PermissionProvider } from '@core/admin/domain/permissions/PermissionProvider';

export abstract class BaseSettingPermissionProvider extends PermissionProvider implements CommonPermissionProvider {
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
}

export class SettingPermissionProviderImpl extends BaseSettingPermissionProvider {
  constructor(organizationId: string) {
    super(organizationId);
  }

  all(): string {
    return this.buildPerm(this.organizationId, 'setting', '*', this.id?.toString() ?? '*');
  }

  view(): string {
    return this.buildPerm(this.organizationId, 'setting', 'view', this.id?.toString() ?? '*');
  }

  create(): string {
    return this.buildPerm(this.organizationId, 'setting', 'create', this.id?.toString() ?? '*');
  }

  edit(): string {
    return this.buildPerm(this.organizationId, 'setting', 'edit', this.id?.toString() ?? '*');
  }

  delete(): string {
    return this.buildPerm(this.organizationId, 'setting', 'delete', this.id?.toString() ?? '*');
  }
}
