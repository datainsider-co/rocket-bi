/*
 * @author: tvc12 - Thien Vi
 * @created: 8/24/21, 5:31 PM
 */

import { Routers } from '@/shared';
import { MyDataDirectoryListingHandler } from '@/screens/directory/views/mydata/directory-listing-handler/MyDataDirectoryListingHandler';
import { DirectoryId, DirectoryPagingRequest, Sort, SortDirection } from '@core/common/domain';
import { DirectoryModule } from '@/screens/directory/store/DirectoryStore';
import { DefaultDirectoryId } from '@/screens/directory/views/mydata/DefaultDirectoryId';
import { ListUtils } from '@/utils';

export class TrashDirectoryListingHandler extends MyDataDirectoryListingHandler {
  get isSupportedClickRow(): boolean {
    return false;
  }

  get title(): string {
    return 'Trash';
  }

  get headerIcon(): string {
    return 'di-icon-delete';
  }

  getRootName(): Routers {
    return Routers.Trash;
  }

  async loadDirectories(directoryId: DirectoryId, paginationRequest: DirectoryPagingRequest): Promise<void> {
    switch (directoryId) {
      case DefaultDirectoryId.Trash: {
        this.addDefaultSort(paginationRequest);
        const directories = await this.directoryService.listTrash(paginationRequest);
        DirectoryModule.setDirectories(directories);
        break;
      }
      default: {
        await super.loadDirectories(directoryId, paginationRequest);
        break;
      }
    }
  }

  private addDefaultSort(paginationRequest: DirectoryPagingRequest) {
    paginationRequest.sorts.unshift(
      new Sort({
        field: 'updated_date',
        order: SortDirection.Desc
      })
    );
  }
}
