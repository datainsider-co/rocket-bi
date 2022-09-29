/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:59 PM
 */

import {
  CheckNameResponse,
  DownloadResponse,
  GetInfoResponse,
  GetListFileResponse,
  GetPathResponse,
  ParquetTableResponse,
  ReadFileResponse,
  UploadResponse
} from '../domain/response';
import { CheckNameRequest, FileAction, GetListFileRequest, MultiCopyRequest } from '../domain/request';
import { Inject } from 'typescript-ioc';
import { FileBrowserRepository } from '../repository/FileBrowserRepository';
import { LakeHouseRequest } from '@core/lake-house/domain/request/LakeHouseRequest';
import { CreateDirectoryRequest } from '@core/lake-house/domain/request/CreateDirectoryRequest';

export abstract class FileBrowserService {
  abstract listFile(request: GetListFileRequest): Promise<GetListFileResponse>;

  abstract getPathInfo(path: string): Promise<GetInfoResponse>;

  abstract getPathFullInfo(path: string): Promise<GetInfoResponse>;

  abstract getTrashPath(): Promise<GetPathResponse>;

  abstract action(action: FileAction, request: LakeHouseRequest): Promise<any>;

  abstract checkExist(request: CheckNameRequest): Promise<CheckNameResponse>;

  abstract multiMove(request: MultiCopyRequest): Promise<any>;

  abstract multiCopy(request: MultiCopyRequest): Promise<any>;

  abstract newFolder(request: CreateDirectoryRequest): Promise<GetInfoResponse>;

  abstract viewFile(path: string, from?: number, size?: number): Promise<ReadFileResponse>;

  abstract viewParquetFile(path: string, from?: number, size?: number): Promise<ParquetTableResponse>;

  abstract upload(path: string, file: File, fileName: string, overwrite?: boolean, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse>;

  abstract download(path: string): Promise<DownloadResponse>;
}

export class FileBrowserServiceImpl extends FileBrowserService {
  constructor(@Inject private repository: FileBrowserRepository) {
    super();
  }

  action(action: FileAction, request: LakeHouseRequest): Promise<any> {
    return this.repository.action(action, request);
  }

  checkExist(request: CheckNameRequest): Promise<CheckNameResponse> {
    return this.repository.action(FileAction.CheckExistName, request);
  }

  multiCopy(request: MultiCopyRequest): Promise<any> {
    return this.repository.action(FileAction.MultiCopy, request);
  }

  multiMove(request: MultiCopyRequest): Promise<any> {
    return this.repository.action(FileAction.MultiMove, request);
  }

  newFolder(request: CreateDirectoryRequest): Promise<GetInfoResponse> {
    return this.repository.action(FileAction.NewFolder, request);
  }

  download(path: string): Promise<DownloadResponse> {
    return this.repository.download(path);
  }

  getPathFullInfo(path: string): Promise<GetInfoResponse> {
    return this.repository.getPathFullInfo(path);
  }

  getPathInfo(path: string): Promise<GetInfoResponse> {
    return this.repository.getPathInfo(path);
  }

  getTrashPath(): Promise<GetPathResponse> {
    return this.repository.getTrashPath();
  }

  listFile(request: GetListFileRequest): Promise<GetListFileResponse> {
    return this.repository.listFile(request);
  }

  upload(path: string, file: File, fileName: string, overwrite?: boolean, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse> {
    return this.repository.upload(path, file, fileName, overwrite, onUploadProgress);
  }

  viewFile(path: string, from?: number, size?: number): Promise<ReadFileResponse> {
    return this.repository.viewFile(path, from, size);
  }

  viewParquetFile(path: string, from?: number, size?: number): Promise<ParquetTableResponse> {
    return this.repository.viewParquetFile(path, from, size);
  }
}
