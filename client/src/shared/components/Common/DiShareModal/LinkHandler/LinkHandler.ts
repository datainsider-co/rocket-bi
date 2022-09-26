import { PermissionTokenResponse } from '@core/domain';
import { ResourceType } from '@/utils/permission_utils';

export abstract class LinkHandler {
  abstract id: string;
  abstract resourceType: ResourceType;
  abstract createLink(permissionTokenResponse: PermissionTokenResponse): string;
}
