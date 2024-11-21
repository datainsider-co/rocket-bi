/*
 * @author: tvc12 - Thien Vi
 * @created: 8/24/21, 2:58 PM
 */

import { Breadcrumbs } from '@/shared/models';
import { DirectoryModule } from '@/screens/directory/store/DirectoryStore';
import { Directory, DirectoryId, DirectoryPagingRequest } from '@core/common/domain';
import { Routers, Status } from '@/shared';

export abstract class DirectoryListingHandler {
  abstract getRootName(): Routers;

  abstract get headerIcon(): string;

  abstract get title(): string;

  abstract get isSupportedClickRow(): boolean;

  get errorMsg() {
    return DirectoryModule.errorMessage;
  }

  get directories(): Directory[] {
    return DirectoryModule.directories;
  }

  get status(): Status {
    return DirectoryModule.status;
  }

  get breadcrumbs(): Breadcrumbs[] {
    return DirectoryModule.getBreadcrumbs;
  }

  abstract loadDirectoryListing(directoryId: DirectoryId, paginationRequest: DirectoryPagingRequest, force?: boolean): Promise<void>;
}
