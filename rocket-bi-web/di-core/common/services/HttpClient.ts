import { AxiosInstance, AxiosResponse } from 'axios';
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
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T>;

  abstract put<T>(path: string, body?: any, params?: any, headers?: any): Promise<T>;

  abstract delete<T>(path: string, body?: any, params?: any, headers?: any): Promise<T>;
}

class HttpClient extends BaseClient {
  protected readonly client: AxiosInstance;

  constructor(client: AxiosInstance) {
    super();
    this.client = client;
  }

  protected parseResponse<T>(response: string, converter?: (data: string) => Promise<any>): Promise<T> {
    if (converter) {
      return converter(response);
    } else {
      return require('@/workers').DIWorkers.parseObject(response);
    }
  }

  protected parseJson<T>(data: string): Promise<T> {
    // TODO: workaround for bypass testcase
    // @ts-ignore
    return require('@/workers').DIWorkers.parseObject(data);
  }

  protected getData(response: AxiosResponse<string>): string {
    return response.data;
  }

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

  delete<T>(path: string, body?: any, params?: any, headers?: any): Promise<T> {
    return this.client
      .delete<string>(path, {
        data: body,
        params: params,
        headers: headers
      })
      .then(this.getData)
      .then<T>(this.parseJson)
      .catch(ex => this.handleError(path, ex));
  }

  get<T>(path: string, params?: any, headers?: any, data?: any): Promise<T> {
    return this.client
      .get<string>(path, {
        params: params,
        headers: headers,
        data: data
      })
      .then(this.getData)
      .then<T>(this.parseJson)
      .catch(ex => this.handleError(path, ex));
  }

  post<T>(
    path: string,
    body?: any,
    params?: any,
    headers?: any,
    converter?: (data: string) => Promise<any>,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> {
    return this.client
      .post<string>(path, body, {
        params: params,
        headers: headers,
        onUploadProgress: onUploadProgress
      })
      .then(this.getData)
      .then<T>(response => this.parseResponse(response, converter))
      .catch(ex => this.handleError(path, ex));
  }

  put<T>(path: string, body?: any, params?: any, headers?: any): Promise<T> {
    return this.client
      .put<string>(path, body, {
        params: params,
        headers: headers
      })
      .then(this.getData)
      .then<T>(this.parseJson)
      .catch(ex => this.handleError(path, ex));
  }
}

class HttpClientWithoutWorker extends BaseClient {
  private readonly client: AxiosInstance;

  constructor(client: AxiosInstance) {
    super();
    this.client = client;
  }

  private static parseResponse<T>(response: string, converter?: (data: string) => Promise<any>): Promise<T> {
    if (converter) {
      return converter(response);
    } else {
      return JsonUtils.fromObject(response);
    }
  }

  private static parseJson<T>(data: string): Promise<T> {
    return JsonUtils.fromObject(data);
  }

  private static getData(response: AxiosResponse<string>): string {
    return response.data;
  }

  private static handleError(path: string, ex: any): any {
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

  delete<T>(path: string, body?: any, params?: any, headers?: any): Promise<T> {
    return this.client
      .delete<string>(path, {
        data: body,
        params: params,
        headers: headers
      })
      .then(HttpClientWithoutWorker.getData)
      .then<T>(HttpClientWithoutWorker.parseJson)
      .catch(ex => HttpClientWithoutWorker.handleError(path, ex));
  }

  get<T>(path: string, params?: any, headers?: any, data?: any): Promise<T> {
    return this.client
      .get<string>(path, {
        params: params,
        headers: headers,
        data: data
      })
      .then(HttpClientWithoutWorker.getData)
      .then<T>(HttpClientWithoutWorker.parseJson)
      .catch(ex => HttpClientWithoutWorker.handleError(path, ex));
  }

  post<T>(path: string, body?: any, params?: any, headers?: any, converter?: (data: string) => Promise<any>): Promise<T> {
    return this.client
      .post<string>(path, body, {
        params: params,
        headers: headers
      })
      .then(HttpClientWithoutWorker.getData)
      .then<T>(response => HttpClientWithoutWorker.parseResponse(response, converter))
      .catch(ex => HttpClientWithoutWorker.handleError(path, ex));
  }

  put<T>(path: string, body?: any, params?: any, headers?: any): Promise<T> {
    return this.client
      .put<string>(path, body, {
        params: params,
        headers: headers
      })
      .then(HttpClientWithoutWorker.getData)
      .then<T>(HttpClientWithoutWorker.parseJson)
      .catch(ex => HttpClientWithoutWorker.handleError(path, ex));
  }
}

export { HttpClient, BaseClient, HttpClientWithoutWorker };
