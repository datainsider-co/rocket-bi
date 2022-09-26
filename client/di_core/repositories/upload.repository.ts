import { BaseClient } from '@core/services/base.service';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules/di';
import { UploadResponse } from '@core/domain/Response';

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
