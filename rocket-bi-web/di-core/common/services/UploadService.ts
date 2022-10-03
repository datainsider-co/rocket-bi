import { Inject } from 'typescript-ioc';
import { UploadRepository } from '../repositories';
import { UploadResponse } from '@core/common/domain/response';

export abstract class UploadService {
  abstract upload(file: File): Promise<UploadResponse>;
}

export class UploadServiceImpl extends UploadService {
  @Inject
  private uploadRepository!: UploadRepository;

  upload(file: File): Promise<UploadResponse> {
    return this.uploadRepository.upload(file);
  }
}
