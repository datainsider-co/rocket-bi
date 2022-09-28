/*
 * @author: tvc12 - Thien Vi
 * @created: 11/9/21, 5:59 PM
 */

import {
  DownloadResponse,
  GetInfoResponse,
  GetListFileResponse,
  GetPathResponse,
  ParquetTableResponse,
  ReadFileResponse,
  UploadResponse
} from '../Domain/Response';
import { FileAction } from '@core/LakeHouse/Domain/Request/FileBrowser/FileAction';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';
import { UnsupportedException } from '@core/domain/Exception/UnsupportedException';
import { GetListFileRequest } from '@core/LakeHouse';
import { LakeHouseRequest } from '@core/LakeHouse/Domain/Request/LakeHouseRequest';
import { param } from 'jquery';

export abstract class FileBrowserRepository {
  abstract listFile(request: GetListFileRequest): Promise<GetListFileResponse>;

  abstract getPathInfo(path: string): Promise<GetInfoResponse>;

  abstract getPathFullInfo(path: string): Promise<GetInfoResponse>;

  abstract getTrashPath(): Promise<GetPathResponse>;

  abstract action(action: FileAction, request: LakeHouseRequest): Promise<any>;

  abstract viewFile(path: string, from?: number, size?: number): Promise<ReadFileResponse>;

  abstract viewParquetFile(path: string, from?: number, size?: number): Promise<ParquetTableResponse>;

  abstract upload(path: string, file: File, fileName: string, overwrite?: boolean, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse>;

  abstract download(path: string): Promise<DownloadResponse>;
}

export class FileBrowserRepositoryImpl extends FileBrowserRepository {
  @InjectValue(DIKeys.LakeClient)
  private readonly httpClient!: BaseClient;

  action(action: FileAction, request: LakeHouseRequest): Promise<any> {
    return this.httpClient.post<any>(
      '/file/action',
      JSON.stringify(request),
      { cmd: action },
      {
        'Content-Type': 'application/x-www-form-urlencoded;'
      }
    );
  }

  download(path: string): Promise<DownloadResponse> {
    return this.httpClient
      .get<any>('/file/download', { path: path })
      .then(response => DownloadResponse.fromObject(response));
  }

  getPathFullInfo(path: string): Promise<GetInfoResponse> {
    return this.httpClient
      .get<any>('/file/fullinfo', { path: path })
      .then(response => GetInfoResponse.fromObject(response));
  }

  getPathInfo(path: string): Promise<GetInfoResponse> {
    return this.httpClient
      .get<any>('/file/info', { path: path })
      .then(response => GetInfoResponse.fromObject(response));
  }

  getTrashPath(): Promise<GetPathResponse> {
    return this.httpClient.get<any>('/file/trashpath', {}).then(response => GetPathResponse.fromObject(response));
  }

  listFile(request: GetListFileRequest): Promise<GetListFileResponse> {
    return this.httpClient.get<any>('/file', request, {}).then(response => GetListFileResponse.fromObject(response));
  }

  upload(path: string, file: File, fileName: string, overwrite?: boolean, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('files', file, fileName);
    return this.httpClient.post(
      '/file/upload',
      formData,
      { path: path, overwrite: overwrite },
      {
        'Content-Type': 'multipart/form-data'
      },
      void 0,
      onUploadProgress
    );
  }

  viewFile(path: string, from?: number, size?: number): Promise<ReadFileResponse> {
    return this.httpClient
      .get<any>('/file/view', { path: path, from: from, size: size })
      .then(response => ReadFileResponse.fromObject(response));
  }

  viewParquetFile(path: string, from?: number, size?: number): Promise<ParquetTableResponse> {
    return this.httpClient
      .get<any>('/file/viewparquet', { path: path, from: from, size: size })
      .then(response => ParquetTableResponse.fromObject(response));
  }
}
