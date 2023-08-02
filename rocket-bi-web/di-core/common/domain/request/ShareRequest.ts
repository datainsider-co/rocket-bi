import { ResourceType } from '@/utils/PermissionUtils';

export interface UpdateShareRequest {
  resourceType: string;
  resourceId: string;
  shareIdActions: Map<string, string[]>;
}

export interface RevokeShareRequest {
  resourceType: string;
  resourceId: string;
  usernames: string[];
}

export interface ShareWithUserRequest {
  resourceType: string;
  resourceId: string;
  userActions: Map<string, string[]>;
}

export class GetUserSharingInfoRequest {
  constructor(public resourceType: string, public resourceId: string, public from: number, public size: number) {}

  static fromObject(obj: any) {
    return new GetUserSharingInfoRequest(obj.resourceType, obj.resourceId, obj.from, obj.size);
  }
}

export interface ShareAnyoneRequest {
  resourceType: string;
  resourceId: string;
  actions: string[];
}

export interface CheckActionPermittedRequest {
  resourceType: string;
  resourceId: string;
  actions: string[];
}

export interface CheckTokenActionPermittedRequest {
  tokenId: string;
  resourceType: string;
  resourceId: string;
  actions: string[];
}

export interface RevokeShareAnyoneRequest {
  resourceType: ResourceType;
  resourceId: string;
}
