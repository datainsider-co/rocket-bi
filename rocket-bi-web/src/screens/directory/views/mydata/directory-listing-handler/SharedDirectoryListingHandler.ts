/*
 * @author: tvc12 - Thien Vi
 * @created: 8/24/21, 5:31 PM
 */

import { Routers } from '@/shared';
import { MyDataDirectoryListingHandler } from '@/screens/directory/views/mydata/directory-listing-handler/MyDataDirectoryListingHandler';
import { DirectoryId, DirectoryPagingRequest } from '@core/common/domain';
import { DirectoryModule } from '@/screens/directory/store/DirectoryStore';

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
