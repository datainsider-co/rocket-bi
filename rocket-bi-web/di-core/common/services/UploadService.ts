import { Inject } from 'typescript-ioc';
import { UploadRepository } from '../repositories';
import { UploadResponse } from '@core/common/domain/response';

export abstract class UploadService {
  abstract upload(file: File): Promise<UploadResponse>;

  abstract async updateFromFile(file: File, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse>;

  abstract async updateFromUrl(url: string, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse>;
}

export class UploadServiceImpl extends UploadService {
  @Inject
  private uploadRepository!: UploadRepository;

  upload(file: File): Promise<UploadResponse> {
    return this.uploadRepository.upload(file);
  }

  async updateFromFile(file: File, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse> {
    return this.uploadRepository.updateFromFile(file, onUploadProgress);
  }

  async updateFromUrl(url: string, onUploadProgress?: (progressEvent: any) => void): Promise<UploadResponse> {
    return this.uploadRepository.updateFromUrl(url, onUploadProgress);
  }
}
