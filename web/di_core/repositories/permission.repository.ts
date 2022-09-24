import { BaseClient, HttpClient } from '@core/services/base.service';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '../modules/di';
import { PermittedResponse } from '@core/domain/Response/ResouceSharing/PermittedResponse';

export abstract class PermissionRepository {
  abstract getUserPermissions(): Promise<string[]>;
}

export class HttpPermissionRepository implements PermissionRepository {
  private apiPath = '/user/permissions';

  constructor(@InjectValue(DIKeys.authClient) private httpClient: BaseClient) {}

  getUserPermissions(): Promise<string[]> {
    return this.httpClient.get(`${this.apiPath}/me`);
  }
}

export class MockPermissionRepository implements PermissionRepository {
  getUserPermissions(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
}
