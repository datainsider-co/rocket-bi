import { LinkHandler } from '@/shared/components/Common/DiShareModal/LinkHandler/LinkHandler';
import { PermissionTokenResponse } from '@core/domain';
import { UrlUtils } from '@core/utils';
import { ResourceType } from '@/utils/permission_utils';

export class ShareDirectoryLinkHandler implements LinkHandler {
  resourceType: ResourceType = ResourceType.directory;
  public readonly id: string;
  public readonly name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  createLink(permissionTokenResponse: PermissionTokenResponse): string {
    return UrlUtils.createLinkShare(this.resourceType, this.id, permissionTokenResponse.tokenId, this.name);
  }
}
