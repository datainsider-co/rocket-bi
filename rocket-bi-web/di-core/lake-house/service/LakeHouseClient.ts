/*
 * @author: tvc12 - Thien Vi
 * @created: 11/10/21, 3:24 PM
 */

import { AxiosInstance } from 'axios';
import { HttpClient } from '@core/common/services';
import { LakeHouseResponse } from '../domain/response/LakeHouseResponse';
import { JsonUtils, Log } from '@core/utils';
import { DIApiException, DIException } from '@core/common/domain';

export class LakeHouseClient extends HttpClient {
  constructor(client: AxiosInstance) {
    super(client);
  }

  get<T>(path: string, params?: any, headers?: any, data?: any): Promise<T> {
    return super.get<T>(path, params, headers, data).then(response => this.validResponse<T>(response));
  }

  post<T>(
    path: string,
    body?: any,
    params?: any,
    headers?: any,
    converter?: (data: string) => any,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> {
    return super.post<T>(path, body, params, headers, converter, onUploadProgress).then(response => this.validResponse<T>(response));
  }

  put<T>(path: string, body?: any, params?: any, headers?: any): Promise<T> {
    return super.post<T>(path, body, params, headers).then(response => this.validResponse<T>(response));
  }

  delete<T>(path: string, body?: any, params?: any, headers?: any): Promise<T> {
    return super.post<T>(path, body, params, headers).then(response => this.validResponse<T>(response));
  }

  protected parseResponse<T>(response: string, converter?: (data: string) => Promise<any>): Promise<T> {
    if (converter) {
      return converter(response);
    } else {
      return require('@/workers').DIWorkers.parsePureJson(response);
    }
  }

  protected parseJson<T>(data: string): Promise<T> {
    return require('@/workers').DIWorkers.parsePureJson(data);
  }

  protected async handleError(path: string, ex: any): Promise<any> {
    Log.debug('LakeHouseClient::error::', 'path::', path, 'ex::', ex);
    if (ex) {
      if (DIException.isDiException(ex)) {
        throw ex;
      } else if (ex.response && ex.response.data) {
        const response = await this.parseJson(ex.response.data);
        Log.debug('response::', response);
        throw DIException.fromObject(response);
      } else {
        throw DIException.fromObject(ex);
      }
    } else {
      throw new DIException('Unknown exception');
    }
  }

  protected async validResponse<T>(response: T): Promise<T> {
    LakeHouseResponse.ensureValidResponse(response as any);
    return response;
  }
}
