import { AxiosInstance } from 'axios';
import { DIApiException, DIException } from '@core/common/domain/exception';
import { JsonUtils, Log } from '@core/utils';

abstract class BaseClient {
  abstract get<T>(path: string, params?: any, headers?: any, data?: any): Promise<T>;

  abstract post<T>(
    path: string,
    body?: any,
    params?: any,
    headers?: any,
    converter?: (data: string) => any,
    onUploadProgress?: (progressEvent: any) => void,
    customConfig?: {
      responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
    }
  ): Promise<T>;

  abstract put<T>(path: string, body?: any, params?: any, headers?: any): Promise<T>;

  abstract delete<T>(path: string, body?: any, params?: any, headers?: any): Promise<T>;
}

abstract class AxiosHttpClient extends BaseClient {
  protected readonly client: AxiosInstance;

  protected constructor(client: AxiosInstance) {
    super();
    this.client = client;
  }

  protected abstract parseResponse(response: string): Promise<any>;

  protected abstract transformRequestData(data: any): Promise<any>;
  protected handleError(path: string, ex: any): any {
    if (ex.toJSON) {
      Log.debug('request error', 'path::', path, ex.toJSON());
    }
    if (ex instanceof DIException) {
      throw ex;
    }
    if (ex.response?.data) {
      const apiException = JsonUtils.fromObject<any>(ex.response.data);
      throw DIApiException.fromObject(apiException);
    } else {
      throw new DIException(ex.message, ex.statusCode, ex.reason);
    }
  }

  async delete<T>(path: string, body?: any, params?: any, headers?: any): Promise<T> {
    const requestData = body ? await this.transformRequestData(body) : void 0;
    return this.client
      .delete<string>(path, {
        data: requestData,
        params: params,
        headers: headers,
        responseType: 'text'
      })
      .then(data => this.parseResponse(data.data))
      .catch(ex => this.handleError(path, ex));
  }

  async get<T>(path: string, params?: any, headers?: any, data?: any): Promise<T> {
    const requestData = data ? await this.transformRequestData(data) : void 0;

    return this.client
      .get<string>(path, {
        params: params,
        headers: headers,
        data: requestData,
        responseType: 'text'
      })
      .then(data => this.parseResponse(data.data))
      .catch(ex => this.handleError(path, ex));
  }

  async post<T>(
    path: string,
    body?: any,
    params?: any,
    headers?: any,
    converter?: (data: string) => Promise<any>,
    onUploadProgress?: (progressEvent: any) => void,
    customConfig?: {
      responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
    }
  ): Promise<T> {
    const requestData = body ? await this.transformRequestData(body) : void 0;
    Log.debug(`request path:: ${path}`);

    return this.client
      .post<string>(path, requestData, {
        params: params,
        headers: headers,
        onUploadProgress: onUploadProgress,
        responseType: customConfig?.responseType || 'text'
      })
      .then(response => (converter ? converter(response.data) : this.parseResponse(response.data)))
      .catch(ex => this.handleError(path, ex));
  }

  async put<T>(path: string, body?: any, params?: any, headers?: any): Promise<T> {
    const requestData = body ? await this.transformRequestData(body) : void 0;

    return this.client
      .put<string>(path, requestData, {
        params: params,
        headers: headers,
        responseType: 'text'
      })
      .then(data => this.parseResponse(data.data))
      .catch(ex => this.handleError(path, ex));
  }
}

class HttpClient extends AxiosHttpClient {
  constructor(client: AxiosInstance) {
    super(client);
  }

  protected parseResponse<T>(response: string): Promise<T> {
    Log.debug('parse ResponseType', typeof response);
    return require('@/workers').DIWorkers.parseObject(response);
  }

  /**
   * transform data request to json.
   * if data is FormData, return data
   *
   * if data is string, return data
   *
   * if data is object, return JSON.stringify(data)
   */
  protected async transformRequestData(data: any): Promise<any> {
    if (data instanceof FormData) {
      return data;
    } else if (typeof data === 'string') {
      return data;
    } else {
      return JsonUtils.toJson(data, true);
    }
  }
}

class HttpClientWithoutWorker extends AxiosHttpClient {
  constructor(client: AxiosInstance) {
    super(client);
  }

  protected parseResponse<T>(response: string): Promise<T> {
    return JsonUtils.fromObject(response);
  }

  protected async transformRequestData(data: any): Promise<any> {
    if (data instanceof FormData) {
      return data;
    } else if (typeof data === 'string') {
      return data;
    } else {
      return JsonUtils.toJson(data);
    }
  }
}

export { HttpClient, BaseClient, HttpClientWithoutWorker };
