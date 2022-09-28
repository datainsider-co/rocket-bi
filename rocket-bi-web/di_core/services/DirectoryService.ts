import { Inject } from 'typescript-ioc';

import { DirectoryRepository } from '../repositories';
import { DirectoryId } from '@core/domain/Model/DefinedType';
import { Directory } from '@core/domain/Model/Directory/Directory';
import { CreateDirectoryRequest, DirectoryPagingRequest, ListDirectoryRequest } from '@core/domain/Request';
import { ListParentsResponse, PageResult } from '@core/domain/Response';

export abstract class DirectoryService {
  abstract get(id: DirectoryId): Promise<Directory>;

  abstract create(request: CreateDirectoryRequest): Promise<Directory>;

  abstract list(id: DirectoryId, sort: DirectoryPagingRequest): Promise<Directory[]>;

  abstract listSharedWithMe(id: DirectoryId, sort: DirectoryPagingRequest): Promise<Directory[]>;

  abstract quickList(request: ListDirectoryRequest): Promise<PageResult<Directory>>;

  abstract rename(id: DirectoryId, toName: string): Promise<boolean>;

  abstract delete(id: DirectoryId): Promise<boolean>;

  abstract move(id: DirectoryId, toParentId: DirectoryId): Promise<boolean>;

  abstract softDelete(id: DirectoryId): Promise<boolean>;

  abstract hardDelete(id: DirectoryId): Promise<boolean>;

  abstract restore(id: DirectoryId): Promise<boolean>;

  abstract getParents(id: DirectoryId): Promise<ListParentsResponse>;

  abstract getRootDir(): Promise<Directory>;

  abstract listStar(sort: DirectoryPagingRequest): Promise<Directory[]>;

  abstract listTrash(sort: DirectoryPagingRequest): Promise<Directory[]>;

  abstract listRecent(sort: DirectoryPagingRequest): Promise<Directory[]>;

  abstract star(directoryId: DirectoryId): Promise<void>;

  abstract removeStar(directoryId: DirectoryId): Promise<void>;
}

export class DirectoryServiceImpl extends DirectoryService {
  constructor(@Inject private directoryRepository: DirectoryRepository) {
    super();
  }

  get(id: DirectoryId): Promise<Directory> {
    return this.directoryRepository.get(id);
  }

  create(request: CreateDirectoryRequest): Promise<Directory> {
    return this.directoryRepository.create(request);
  }

  list(id: DirectoryId, sort: DirectoryPagingRequest): Promise<Directory[]> {
    return this.directoryRepository.list(id, sort);
  }

  listSharedWithMe(id: DirectoryId, sort: DirectoryPagingRequest): Promise<Directory[]> {
    return this.directoryRepository.listSharedWithMe(id, sort);
  }

  quickList(request: ListDirectoryRequest): Promise<PageResult<Directory>> {
    return this.directoryRepository.quickList(request);
  }

  rename(id: DirectoryId, toName: string): Promise<boolean> {
    return this.directoryRepository.rename(id, toName);
  }

  delete(id: DirectoryId): Promise<boolean> {
    return this.directoryRepository.delete(id);
  }

  move(id: DirectoryId, toParentId: DirectoryId): Promise<boolean> {
    return this.directoryRepository.move(id, toParentId);
  }

  softDelete(id: DirectoryId): Promise<boolean> {
    return this.directoryRepository.softDelete(id);
  }

  hardDelete(id: DirectoryId): Promise<boolean> {
    return this.directoryRepository.hardRemove(id);
  }

  restore(id: DirectoryId): Promise<boolean> {
    return this.directoryRepository.restore(id);
  }

  getParents(id: DirectoryId): Promise<ListParentsResponse> {
    return this.directoryRepository.getParents(id);
  }

  getRootDir(): Promise<Directory> {
    return this.directoryRepository.getRootDir();
  }

  listRecent(sort: DirectoryPagingRequest): Promise<Directory[]> {
    return this.directoryRepository.listRecent(sort);
  }

  listStar(sort: DirectoryPagingRequest): Promise<Directory[]> {
    return this.directoryRepository.listStar(sort);
  }

  listTrash(sort: DirectoryPagingRequest): Promise<Directory[]> {
    return this.directoryRepository.listTrash(sort);
  }

  star(directoryId: DirectoryId): Promise<void> {
    return this.directoryRepository.star(directoryId);
  }

  removeStar(directoryId: DirectoryId): Promise<void> {
    return this.directoryRepository.removeStar(directoryId);
  }
}
