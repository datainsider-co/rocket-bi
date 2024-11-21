import { ImageInfo, ShutterImageResponse, UploadResponse } from '@core/common/domain';
import axios from 'axios';
import { Log } from '@core/utils';

export abstract class ImageRepository {
  abstract search(keyword: string): Promise<ImageInfo[]>;
  abstract getImageFile(url: string): Promise<Blob>;
}

export class ImageRepositoryImpl extends ImageRepository {
  search(keyword: string): Promise<ImageInfo[]> {
    const headers = { Authorization: `Bearer ${window.appConfig.SHUTTER_ACCESS_TOKEN}` };
    Log.debug('ImageRepositoryImpl::search::keyword::', keyword);
    return axios
      .get<ShutterImageResponse>(`https://api.shutterstock.com/v2/images/search?query=${keyword}`, { headers: headers })
      .then(result => ShutterImageResponse.toImageInfos(result.data));
  }

  getImageFile(url: string): Promise<Blob> {
    return fetch(url).then(res => res.blob()); // Gets the response and returns it as a blob
  }
}
