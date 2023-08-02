import { BaseClient } from '@core/common/services/HttpClient';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules/Di';
import { UploadResponse } from '@core/common/domain/response';

export abstract class UploadRepository {
  abstract upload(file: File): Promise<UploadResponse>;

  abstract async updateFromFile(file: File, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse>;
  abstract async updateFromUrl(url: string, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse>;
}

export class HttpUploadRepository extends UploadRepository {
  @InjectValue(DIKeys.CaasClient)
  private httpClient!: BaseClient;
  private apiPath = '/upload';

  upload(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpClient.post<UploadResponse>(this.apiPath, formData, undefined, {
      'Content-Type': 'multipart/form-data'
    });
  }

  async updateFromFile(file: File, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpClient.post(
      '/media/upload',
      formData,
      void 0,
      {
        'Content-Type': 'multipart/form-data'
      },
      void 0,
      onUploadProgress
    );
  }

  async updateFromUrl(url: string, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', url);
    return this.httpClient.post(
      '/upload_from_url',
      formData,
      void 0,
      {
        'Content-Type': 'multipart/form-data',
        'Access-Control-Allow-Origin': '*'
      },
      void 0,
      onUploadProgress
    );
  }
}
