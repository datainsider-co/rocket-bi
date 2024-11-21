/*
 * @author: tvc12 - Thien Vi
 * @created: 10/29/21, 3:00 PM
 */

import { ResourceInfo, RevokeShareRequest, ShareWithUserRequest, UpdateShareRequest } from '@core/common/domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';

export abstract class DataCookShareRepository {
  abstract getResourceInfo(id: string): Promise<ResourceInfo>;

  abstract share(request: ShareWithUserRequest): Promise<Map<string, boolean>>;

  abstract update(request: UpdateShareRequest): Promise<Map<string, boolean>>;

  abstract revoke(request: RevokeShareRequest): Promise<Map<string, boolean>>;
}

export class DataCookShareRepositoryImpl extends DataCookShareRepository {
  @InjectValue(DIKeys.DataCookClient)
  private readonly httpClient!: BaseClient;

  getResourceInfo(id: string): Promise<ResourceInfo> {
    return this.httpClient.get(`/data_cook/${id}/share/list`).then((resp: any) => ResourceInfo.fromObject(resp));
  }

  revoke(request: RevokeShareRequest): Promise<Map<string, boolean>> {
    return this.httpClient.delete(`/data_cook/${request.resourceId}/share/revoke`, request).then((resp: any) => new Map(Object.entries(resp)));
  }

  share(request: ShareWithUserRequest): Promise<Map<string, boolean>> {
    return this.httpClient.post(`/data_cook/${request.resourceId}/share`, request).then((resp: any) => new Map(Object.entries(resp)));
  }

  update(request: UpdateShareRequest): Promise<Map<string, boolean>> {
    return this.httpClient.put(`/data_cook/${request.resourceId}/share/update`, request).then((resp: any) => new Map(Object.entries(resp)));
  }
}
