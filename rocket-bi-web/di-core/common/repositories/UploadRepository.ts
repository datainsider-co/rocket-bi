import { BaseClient } from '@core/common/services/HttpClient';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules/Di';
import { UploadResponse } from '@core/common/domain/response';

export abstract class UploadRepository {
  abstract upload(file: File): Promise<UploadResponse>;
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
}
