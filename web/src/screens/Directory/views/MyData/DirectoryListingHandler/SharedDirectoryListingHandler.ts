/*
 * @author: tvc12 - Thien Vi
 * @created: 8/24/21, 5:31 PM
 */

import { Routers } from '@/shared';
import { MyDataDirectoryListingHandler } from '@/screens/Directory/views/MyData/DirectoryListingHandler/MyDataDirectoryListingHandler';
import { DirectoryId, DirectoryPagingRequest } from '@core/domain';
import { DirectoryModule } from '@/screens/Directory/store/DirectoryStore';

export class SharedDirectoryListingHandler extends MyDataDirectoryListingHandler {
  get isSupportedClickRow(): boolean {
    return true;
  }

  get title(): string {
    return 'Share with me';
  }

  get headerIcon(): string {
    return 'di-icon-share-with-me';
  }

  getRootName(): Routers {
    return Routers.SharedWithMe;
  }

  async loadDirectories(directoryId: DirectoryId, paginationRequest: DirectoryPagingRequest): Promise<void> {
    const directories = await this.directoryService.listSharedWithMe(directoryId, paginationRequest);
    DirectoryModule.setDirectories(directories);
  }
}
