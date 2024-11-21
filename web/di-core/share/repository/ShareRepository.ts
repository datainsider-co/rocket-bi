import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { ResourceType } from '@/utils/PermissionUtils';
import { PermissionTokenResponse } from '@core/common/domain/response';
import {
  CheckActionPermittedRequest,
  GetUserSharingInfoRequest,
  RevokeShareAnyoneRequest,
  RevokeShareRequest,
  ShareAnyoneRequest,
  ShareWithUserRequest,
  UpdateShareRequest
} from '@core/common/domain/request/ShareRequest';
import { Log } from '@core/utils';
import { ResourceInfo } from '@core/common/domain/response/resouce-sharing/ResourceInfo';

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
  @InjectValue(DIKeys.BiClient)
  private httpClient!: BaseClient;

  getResourceInfo(request: GetUserSharingInfoRequest): Promise<ResourceInfo> {
    const params = {
      from: request.from,
      size: request.size
    };
    Log.debug('getUserSharingInfo::', request.resourceId);
    return this.httpClient.get(`share/${request.resourceType}/${request.resourceId}`, params).then(resp => ResourceInfo.fromObject(resp));
  }

  revokeSharedPermission(request: RevokeShareRequest): Promise<Map<string, boolean>> {
    return this.httpClient.delete(`share/${request.resourceType}/${request.resourceId}/revoke`, request).then(resp => {
      return new Map(Object.entries(resp as any));
    });
  }

  editSharedPermission(request: UpdateShareRequest): Promise<Map<string, string[]>> {
    return this.httpClient.put(`share/${request.resourceType}/${request.resourceId}/edit`, request).then(resp => {
      return new Map(Object.entries(resp as any));
    });
  }

  create(request: ShareWithUserRequest): Promise<Map<string, boolean>> {
    return this.httpClient.post(`share/${request.resourceType}/${request.resourceId}`, request).then(resp => {
      return new Map(Object.entries(resp as any));
    });
  }

  //create share with anyone
  shareWithAnyone(request: ShareAnyoneRequest): Promise<PermissionTokenResponse> {
    return this.httpClient.post(`share/${request.resourceType}/${request.resourceId}/anyone`, request);
  }

  updateShareAnyone(request: ShareAnyoneRequest): Promise<boolean> {
    return this.httpClient.put(`share/${request.resourceType}/${request.resourceId}/anyone`, request);
  }

  getShareAnyoneInfo(request: { resourceType: ResourceType; resourceId: number }): Promise<PermissionTokenResponse | null> {
    return this.httpClient.get(`share/${request.resourceType}/${request.resourceId}/anyone`);
  }

  revokeShareWithAnyone(request: RevokeShareAnyoneRequest): Promise<boolean> {
    return this.httpClient.delete(`share/${request.resourceType}/${request.resourceId}/anyone/revoke`);
  }

  isPermittedForUser(request: CheckActionPermittedRequest): Promise<Map<string, boolean>> {
    return this.httpClient
      .post(`share/${request.resourceType}/${request.resourceId}/action_permitted`, request, void 0, void 0, require('@/workers').DIWorkers.parsePureJson)
      .then(resp => new Map(Object.entries(resp as any)));
  }
}
