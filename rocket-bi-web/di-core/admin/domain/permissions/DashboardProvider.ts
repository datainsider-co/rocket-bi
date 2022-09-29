import { CommonPermissionProvider } from '@core/admin/domain/permissions/CommonPermissionProvider';
import { PermissionProvider } from '@core/admin/domain/permissions/PermissionProvider';

export abstract class BaseDashboardPermissionProvider extends PermissionProvider implements CommonPermissionProvider {
  protected id: number | undefined;

  withDashboardId(id: number) {
    this.id = id;
    return this;
  }

  abstract all(): string;

  abstract view(): string;

  abstract create(): string;

  abstract edit(): string;

  abstract delete(): string;

  abstract copy(): string;

  abstract share(): string;
}

export class DashboardPermissionProviderImpl extends BaseDashboardPermissionProvider {
  all(): string {
    return this.buildPerm('dashboard', '*', this.id?.toString() ?? '*');
  }

  view(): string {
    return this.buildPerm('dashboard', 'view', this.id?.toString() ?? '*');
  }

  create(): string {
    return this.buildPerm('dashboard', 'create', this.id?.toString() ?? '*');
  }

  edit(): string {
    return this.buildPerm('dashboard', 'edit', this.id?.toString() ?? '*');
  }

  delete(): string {
    return this.buildPerm('dashboard', 'delete', this.id?.toString() ?? '*');
  }

  copy(): string {
    return this.buildPerm('dashboard', 'copy', this.id?.toString() ?? '*');
  }

  share(): string {
    return this.buildPerm('dashboard', 'share', this.id?.toString() ?? '*');
  }
}
