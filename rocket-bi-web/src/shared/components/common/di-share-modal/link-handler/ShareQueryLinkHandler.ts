import { PermissionTokenResponse } from '@core/common/domain';
import { LinkHandler } from '@/shared/components/common/di-share-modal/link-handler/LinkHandler';
import { UrlUtils } from '@core/utils';
import { ResourceType } from '@/utils/PermissionUtils';

export class ShareQueryLinkHandler implements LinkHandler {
  resourceType: ResourceType = ResourceType.query;
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
