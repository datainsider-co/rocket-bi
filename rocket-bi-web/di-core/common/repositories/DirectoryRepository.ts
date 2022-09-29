import { InjectValue } from 'typescript-ioc';

import { DirectoryId } from '@core/common/domain/model/DefinedType';
import { Directory } from '@core/common/domain/model/directory/Directory';
import { DIKeys } from '@core/common/modules/Di';
import { DirectoryPagingRequest, CreateDirectoryRequest, ListDirectoryRequest } from '@core/common/domain/request';
import { ListParentsResponse, PageResult } from '@core/common/domain/response';
import { BaseClient } from '@core/common/services/HttpClient';

export abstract class DirectoryRepository {
  abstract get(id: DirectoryId): Promise<Directory>;

  abstract create(request: CreateDirectoryRequest): Promise<Directory>;

  abstract list(id: DirectoryId, sort: DirectoryPagingRequest): Promise<Directory[]>;

  abstract listSharedWithMe(id: DirectoryId, sort: DirectoryPagingRequest): Promise<Directory[]>;

  abstract quickList(request: ListDirectoryRequest): Promise<PageResult<Directory>>;

  abstract rename(id: DirectoryId, toName: string): Promise<boolean>;

  abstract delete(id: DirectoryId): Promise<boolean>;

  abstract move(id: DirectoryId, toParentId: DirectoryId): Promise<boolean>;

  abstract softDelete(id: DirectoryId): Promise<boolean>;

  abstract hardRemove(id: DirectoryId): Promise<boolean>;

  abstract restore(id: DirectoryId): Promise<boolean>;

  abstract getParents(id: DirectoryId): Promise<ListParentsResponse>;

  abstract getRootDir(): Promise<Directory>;

  abstract listStar(sort: DirectoryPagingRequest): Promise<Directory[]>;

  abstract listTrash(sort: DirectoryPagingRequest): Promise<Directory[]>;

  abstract listRecent(sort: DirectoryPagingRequest): Promise<Directory[]>;

  abstract star(directoryId: DirectoryId): Promise<void>;

  abstract removeStar(directoryId: DirectoryId): Promise<void>;
}

export class HttpDirectoryRepository extends DirectoryRepository {
  @InjectValue(DIKeys.BiClient)
  private httpClient!: BaseClient;

  get(id: DirectoryId): Promise<Directory> {
    return this.httpClient.get<Directory>(`/directories/${id}`);
  }

  create(request: CreateDirectoryRequest): Promise<Directory> {
    return this.httpClient.post<Directory>(`/directories/create`, request);
  }

  list(id: DirectoryId, sort: DirectoryPagingRequest): Promise<Directory[]> {
    return this.httpClient.post<Directory[]>(`/directories/${id}/list`, sort);
  }

  listSharedWithMe(id: DirectoryId, sort: DirectoryPagingRequest): Promise<Directory[]> {
    return this.httpClient.post<Directory[]>(`/directories/${id}/list/shared`, sort);
  }

  quickList(request: ListDirectoryRequest): Promise<PageResult<Directory>> {
    return this.httpClient.post<PageResult<Directory>>(`/directories/quick_list`, request);
  }

  rename(id: DirectoryId, toName: string): Promise<boolean> {
    return this.httpClient
      .put(`/directories/${id}/rename`, {
        toName: toName
      })
      .then(_ => true);
  }

  delete(id: DirectoryId): Promise<boolean> {
    return this.httpClient.delete(`/directories/${id}`).then(_ => true);
  }

  move(id: DirectoryId, toParentId: DirectoryId): Promise<boolean> {
    return this.httpClient
      .put(`/directories/${id}/move`, {
        toParentId: toParentId
      })
      .then(_ => true);
  }

  softDelete(id: DirectoryId): Promise<boolean> {
    return this.httpClient.put(`/directories/${id}/remove`).then(_ => true);
  }

  hardRemove(id: DirectoryId): Promise<boolean> {
    return this.httpClient.delete(`/directories/trash/${id}/delete`).then(_ => true);
  }

  restore(id: DirectoryId): Promise<boolean> {
    return this.httpClient.put(`/directories/${id}/restore`).then(_ => true);
  }

  getParents(id: DirectoryId): Promise<ListParentsResponse> {
    return this.httpClient.get<ListParentsResponse>(`/directories/${id}/parents`);
  }

  getRootDir(): Promise<Directory> {
    return this.httpClient.get<Directory>(`/directories/root`);
  }

  listRecent(sort: DirectoryPagingRequest): Promise<Directory[]> {
    return this.httpClient.post<Directory[]>(`/directories/recent`, sort);
  }

  listStar(sort: DirectoryPagingRequest): Promise<Directory[]> {
    return this.httpClient.post<Directory[]>(`/directories/star`, sort);
  }

  listTrash(sort: DirectoryPagingRequest): Promise<Directory[]> {
    return this.httpClient.post<Directory[]>(`/directories/trash`, sort);
  }

  star(directoryId: DirectoryId): Promise<void> {
    return this.httpClient.post<void>(`/directories/${directoryId}/star`, void 0, void 0, void 0, data => data);
  }

  removeStar(directoryId: DirectoryId): Promise<void> {
    return this.httpClient.post<void>(`/directories/${directoryId}/unstar`, void 0, void 0, void 0, data => data);
  }
}
