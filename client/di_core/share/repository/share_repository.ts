import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';
import { ResourceType } from '@/utils/permission_utils';
import { PermissionTokenResponse } from '@core/domain/Response';
import {
  CheckActionPermittedRequest,
  GetUserSharingInfoRequest,
  RevokeShareAnyoneRequest,
  RevokeShareRequest,
  ShareAnyoneRequest,
  ShareWithUserRequest,
  UpdateShareRequest
} from '@core/domain/Request/ShareRequest';
import { Log } from '@core/utils';
import { ResourceInfo } from '@core/domain/Response/ResouceSharing/ResourceInfo';

export abstract class ShareRepository {
  abstract create(request: ShareWithUserRequest): Promise<Map<string, boolean>>;
  abstract editSharedPermission(request: UpdateShareRequest): Promise<Map<string, string[]>>;
  abstract getResourceInfo(request: GetUserSharingInfoRequest): Promise<ResourceInfo>;
  abstract revokeSharedPermission(request: RevokeShareRequest): Promise<Map<string, boolean>>;

  abstract shareWithAnyone(request: ShareAnyoneRequest): Promise<PermissionTokenResponse>;
  abstract updateShareAnyone(request: ShareAnyoneRequest): Promise<boolean>;
  abstract getShareAnyoneInfo(request: { resourceType: ResourceType; resourceId: number }): Promise<PermissionTokenResponse | null>;
  abstract revokeShareWithAnyone(request: RevokeShareAnyoneRequest): Promise<boolean>;

  abstract isPermittedForUser(request: CheckActionPermittedRequest): Promise<Map<string, boolean>>;
}

export class ShareRepositoryImpl implements ShareRepository {
  private readonly apiPath = 'share';
  constructor(@InjectValue(DIKeys.authClient) private httpClient: BaseClient) {}

  getResourceInfo(request: GetUserSharingInfoRequest): Promise<ResourceInfo> {
    const params = {
      from: request.from,
      size: request.size
    };
    Log.debug('getUserSharingInfo::', request.resourceId);
    return this.httpClient.get(`${this.apiPath}/${request.resourceType}/${request.resourceId}`, params).then(resp => ResourceInfo.fromObject(resp));
  }

  revokeSharedPermission(request: RevokeShareRequest): Promise<Map<string, boolean>> {
    return this.httpClient.delete(`${this.apiPath}/${request.resourceType}/${request.resourceId}/revoke`, request).then(resp => {
      return new Map(Object.entries(resp as any));
    });
  }

  editSharedPermission(request: UpdateShareRequest): Promise<Map<string, string[]>> {
    return this.httpClient.put(`${this.apiPath}/${request.resourceType}/${request.resourceId}/edit`, request).then(resp => {
      return new Map(Object.entries(resp as any));
    });
  }

  create(request: ShareWithUserRequest): Promise<Map<string, boolean>> {
    return this.httpClient.post(`${this.apiPath}/${request.resourceType}/${request.resourceId}`, request).then(resp => {
      return new Map(Object.entries(resp as any));
    });
  }

  //create share with anyone
  shareWithAnyone(request: ShareAnyoneRequest): Promise<PermissionTokenResponse> {
    return this.httpClient.post(`${this.apiPath}/${request.resourceType}/${request.resourceId}/anyone`, request);
  }

  updateShareAnyone(request: ShareAnyoneRequest): Promise<boolean> {
    return this.httpClient.put(`${this.apiPath}/${request.resourceType}/${request.resourceId}/anyone`, request);
  }

  getShareAnyoneInfo(request: { resourceType: ResourceType; resourceId: number }): Promise<PermissionTokenResponse | null> {
    return this.httpClient.get(`${this.apiPath}/${request.resourceType}/${request.resourceId}/anyone`);
  }

  revokeShareWithAnyone(request: RevokeShareAnyoneRequest): Promise<boolean> {
    return this.httpClient.delete(`${this.apiPath}/${request.resourceType}/${request.resourceId}/anyone/revoke`);
  }

  isPermittedForUser(request: CheckActionPermittedRequest): Promise<Map<string, boolean>> {
    return this.httpClient
      .post(
        `${this.apiPath}/${request.resourceType}/${request.resourceId}/action_permitted`,
        request,
        void 0,
        void 0,
        require('@/workers').DIWorkers.parsePureJson
      )
      .then(resp => new Map(Object.entries(resp as any)));
  }
}
