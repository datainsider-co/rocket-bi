import { PermissionTokenResponse } from '@core/common/domain';
import { ResourceType } from '@/utils/PermissionUtils';

export abstract class LinkHandler {
  abstract id: string;
  abstract resourceType: ResourceType;
  abstract createLink(permissionTokenResponse: PermissionTokenResponse): string;
}
