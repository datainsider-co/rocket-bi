import { BaseClient } from '@core/services/base.service';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { ChangePermissionRequest } from '@core/admin/domain/request/ChangePermissionRequest';
import { IsPermittedPermissionRequest } from '@core/admin/domain/request/IsPermittedPermissionRequest';
import { PermittedResponse } from '@core/domain/Response/ResouceSharing/PermittedResponse';

export abstract class PermissionAdminRepository {
  abstract getAllPermissions(username: string): Promise<string[]>;

  abstract changePermissions(request: ChangePermissionRequest): Promise<boolean>;

  abstract isPermitted(request: IsPermittedPermissionRequest): Promise<PermittedResponse>;
}

export class PermissionAdminRepositoryImpl implements PermissionAdminRepository {
  private readonly apiPath = '/admin/permissions';

  constructor(@InjectValue(DIKeys.authClient) private httpClient: BaseClient) {}

  getAllPermissions(username: string): Promise<string[]> {
    return this.httpClient.get(`${this.apiPath}/${username}`);
  }

  changePermissions(request: ChangePermissionRequest): Promise<boolean> {
    return this.httpClient.put(`${this.apiPath}/${request.username}/change`, request);
  }

  isPermitted(request: IsPermittedPermissionRequest): Promise<PermittedResponse> {
    return this.httpClient.post(
      `${this.apiPath}/${request.username}/is_permitted`,
      request,
      undefined,
      undefined,
      require('@/workers').DIWorkers.parsePureJson
    );
  }
}

export class MockPermissionAdminRepository implements PermissionAdminRepository {
  getAllPermissions(username: string): Promise<string[]> {
    return Promise.resolve([]);
  }

  isPermitted(request: IsPermittedPermissionRequest): Promise<PermittedResponse> {
    return Promise.resolve({});
  }

  changePermissions(request: ChangePermissionRequest): Promise<boolean> {
    return Promise.resolve(false);
  }
}
