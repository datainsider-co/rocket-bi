/*
 * @author: tvc12 - Thien Vi
 * @created: 10/29/21, 3:00 PM
 */

import { ResourceInfo, RevokeShareRequest, ShareWithUserRequest, UpdateShareRequest } from '@core/domain';
import { Inject } from 'typescript-ioc';
import { DataCookShareRepository } from '../Repository';

export abstract class DataCookShareService {
  abstract getResourceInfo(id: string): Promise<ResourceInfo>;

  abstract share(request: ShareWithUserRequest): Promise<Map<string, boolean>>;

  abstract update(request: UpdateShareRequest): Promise<Map<string, boolean>>;

  abstract revoke(request: RevokeShareRequest): Promise<Map<string, boolean>>;
}

export class DataCookShareServiceImpl extends DataCookShareService {
  @Inject
  private readonly shareRepository!: DataCookShareRepository;

  getResourceInfo(id: string): Promise<ResourceInfo> {
    return this.shareRepository.getResourceInfo(id);
  }

  revoke(request: RevokeShareRequest): Promise<Map<string, boolean>> {
    return this.shareRepository.revoke(request);
  }

  share(request: ShareWithUserRequest): Promise<Map<string, boolean>> {
    return this.shareRepository.share(request);
  }

  update(request: UpdateShareRequest): Promise<Map<string, boolean>> {
    return this.shareRepository.update(request);
  }
}
