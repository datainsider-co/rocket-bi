import { Inject } from 'typescript-ioc';
import { UploadRepository } from '../repositories';
import { ImageInfo, ShutterImageResponse, UploadResponse } from '@core/common/domain/response';
import { ImageRepository } from '@core/common/repositories/ImageRepository';

export abstract class ImageService {
  abstract search(keyword: string): Promise<ImageInfo[]>;
  abstract getImageFile(url: string): Promise<Blob>;
}

export class ImageServiceImpl extends ImageService {
  @Inject
  private imageRepository!: ImageRepository;

  search(keyword: string): Promise<ImageInfo[]> {
    return this.imageRepository.search(keyword);
  }

  getImageFile(url: string): Promise<Blob> {
    return this.imageRepository.getImageFile(url);
  }
}
