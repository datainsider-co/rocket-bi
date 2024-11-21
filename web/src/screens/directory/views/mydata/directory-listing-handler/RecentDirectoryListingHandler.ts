/*
 * @author: tvc12 - Thien Vi
 * @created: 8/24/21, 5:31 PM
 */

import { Routers } from '@/shared';
import { MyDataDirectoryListingHandler } from '@/screens/directory/views/mydata/directory-listing-handler/MyDataDirectoryListingHandler';
import { DirectoryId, DirectoryPagingRequest } from '@core/common/domain';
import { DirectoryModule } from '@/screens/directory/store/DirectoryStore';
import { DefaultDirectoryId } from '@/screens/directory/views/mydata/DefaultDirectoryId';

export class RecentDirectoryListingHandler extends MyDataDirectoryListingHandler {
  get isSupportedClickRow(): boolean {
    return true;
  }

  get title(): string {
    return 'Recent';
  }

  get headerIcon(): string {
    return 'di-icon-recent';
  }

  getRootName(): Routers {
    return Routers.Recent;
  }

  async loadDirectories(directoryId: DirectoryId, paginationRequest: DirectoryPagingRequest): Promise<void> {
    switch (directoryId) {
      case DefaultDirectoryId.Recent: {
        const directories = await this.directoryService.listRecent(paginationRequest);
        DirectoryModule.setDirectories(directories);
        break;
      }
      default:
        await super.loadDirectories(directoryId, paginationRequest);
        break;
    }
  }
}
