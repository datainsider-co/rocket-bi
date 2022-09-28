import { BaseClient } from '@core/services/base.service';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '../modules/di';

export abstract class PermissionRepository {
  abstract getUserPermissions(): Promise<string[]>;
}

export class HttpPermissionRepository implements PermissionRepository {
  @InjectValue(DIKeys.CaasClient)
  private httpClient!: BaseClient;

  getUserPermissions(): Promise<string[]> {
    return this.httpClient.get(`/user/permissions/me`);
  }
}

export class MockPermissionRepository implements PermissionRepository {
  getUserPermissions(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
}
