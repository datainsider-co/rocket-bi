import { CommonPermissionProvider } from '@core/admin/domain/permissions/CommonPermissionProvider';
import { PermissionProvider } from '@core/admin/domain/permissions/PermissionProvider';

export abstract class BaseWidgetPermissionProvider extends PermissionProvider implements CommonPermissionProvider {
  protected id: number | undefined;

  withWidgetId(id: number) {
    this.id = id;
    return this;
  }

  abstract all(): string;

  abstract view(): string;

  abstract create(): string;

  abstract edit(): string;

  abstract delete(): string;
}

export class WidgetPermissionProviderImpl extends BaseWidgetPermissionProvider {
  all(): string {
    return this.buildPerm('widget', '*', this.id?.toString() ?? '*');
  }

  view(): string {
    return this.buildPerm('widget', 'view', this.id?.toString() ?? '*');
  }

  create(): string {
    return this.buildPerm('widget', 'create', this.id?.toString() ?? '*');
  }

  edit(): string {
    return this.buildPerm('widget', 'edit', this.id?.toString() ?? '*');
  }

  delete(): string {
    return this.buildPerm('widget', 'delete', this.id?.toString() ?? '*');
  }
}
