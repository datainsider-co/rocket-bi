import { BaseClient, HttpClient, HttpClientWithoutWorker } from '@core/services/base.service';
import Axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { JsonUtils, Log, ObjectUtils } from '@core/utils';
import { DIApiException, DIException } from '@core/domain/Exception';
import { ListUtils } from '@/utils';
import { ApiExceptions } from '@/shared';
import { AuthenticationModule } from '@/store/modules/authentication.store';
import { DI } from '@core/modules';
import { DataManager } from '@core/services';
import { StringUtils } from '@/utils/string.utils';
import { DatabaseSchemaModule } from '@/store/modules/data_builder/DatabaseSchemaStore';
import { LakeHouseClient } from '@core/LakeHouse/Service/LakeHouseClient';
import { LakeHouseCode } from '@core/LakeHouse/Domain/Response/LakeHouseResponse';
import { _BuilderTableSchemaStore } from '@/store/modules/data_builder/BuilderTableSchemaStore';
import { isObject } from 'lodash';

export abstract class AbstractClientBuilder {
  abstract build(): BaseClient;

  protected createClient(baseUrl?: string, timeout?: number) {
    return Axios.create({
      baseURL: baseUrl,
      timeout: timeout || 30000,
      headers: {
        'Content-Type': 'application/json'
      },
      transformRequest: request => {
        if (request instanceof FormData) {
          return request;
        } else {
          return JsonUtils.toJson(request, true);
        }
      },
      withCredentials: false
    });
  }
}

export abstract class ClientBuilder extends AbstractClientBuilder {
  protected baseUrl?: string;
  protected timeout?: number;
  private DEFAULT_EXCEPTION = new DIException('Unknown exception');

  withBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
    return this;
  }

  withTimeout(durationInMillis: number) {
    this.timeout = durationInMillis || 30000;
    return this;
  }

  protected async responseError(error: AxiosError): Promise<DIException> {
    if (error) {
      const exception = this.parseException(error);
      if (exception && exception.reason == ApiExceptions.notAuthenticated) {
        await this.handleLogout();
      }
      return Promise.reject(exception ?? this.DEFAULT_EXCEPTION);
    } else {
      return Promise.reject(this.DEFAULT_EXCEPTION);
    }
  }

  protected async handleLogout() {
    DatabaseSchemaModule.reset();
    _BuilderTableSchemaStore.reset();
    await AuthenticationModule.logout();
  }

  protected parseException(error: AxiosError): DIException | undefined {
    if (error.response && isObject(error.response.data)) {
      try {
        return DIApiException.fromObject(error.response.data);
      } catch (ex) {
        return void 0;
      }
    } else if (error.isAxiosError) {
      return new DIException(error.message);
    } else {
      return void 0;
    }
  }

  protected injectSessionId(request: AxiosRequestConfig): AxiosRequestConfig {
    const dataManager = DI.get(DataManager);
    const session = dataManager.getSession();
    if (session && StringUtils.isNotEmpty(session)) {
      request.headers['Authorization'] = session;
    }
    return request;
  }

  protected injectTokenAndSession(request: AxiosRequestConfig): AxiosRequestConfig {
    const dataManager = DI.get(DataManager);
    const session = dataManager.getSession();
    const token = dataManager.getToken();
    if (token) {
      request.headers['Token-Id'] = token;
    }
    if (session && StringUtils.isNotEmpty(session)) {
      request.headers['Authorization'] = session;
    }
    return request;
  }
}

export class DefaultClientBuilder extends ClientBuilder {
  build(): BaseClient {
    return new HttpClient(this.createClient(this.baseUrl, this.timeout));
  }
}

export class AuthAndTokenClientBuilder extends ClientBuilder {
  build(): BaseClient {
    const client = this.createClient(this.baseUrl, this.timeout);

    client.interceptors.request.use(
      request => this.injectTokenAndSession(request),
      error => {
        return Promise.reject(error);
      }
    );
    client.interceptors.response.use(
      response => response,
      error => this.responseError(error)
    );
    return new HttpClient(client);
  }
}

export class AuthClientBuilder extends ClientBuilder {
  build(): BaseClient {
    const client = this.createClient(this.baseUrl, this.timeout);

    client.interceptors.request.use(
      request => this.injectSessionId(request),
      error => {
        return Promise.reject(error);
      }
    );
    client.interceptors.response.use(
      response => response,
      error => this.responseError(error)
    );
    return new HttpClient(client);
  }
}

class LakeHouseClientBuilder extends ClientBuilder {
  build(): BaseClient {
    const client: AxiosInstance = this.createClient(this.baseUrl, this.timeout);
    client.interceptors.request.use(
      config => this.configLakeHouseRequest(config),
      error => Promise.reject(error)
    );
    // client.interceptors.response.use(response => response, this.handleResponseError);
    return new LakeHouseClient(client);
  }

  private static getException(error: any): DIException {
    if (error.response && error.response.data) {
      const response = JSON.parse(error.response.data);
      return DIException.fromObject(response);
    } else {
      return DIException.fromObject(error);
    }
  }

  protected async handleResponseError(error: any): Promise<DIException> {
    const exception: DIException = LakeHouseClientBuilder.getException(error);
    if (exception.statusCode == -LakeHouseCode.WrongAuth) {
      await this.handleLogout();
    }
    return Promise.reject(exception);
  }

  protected configLakeHouseRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    return {
      ...this.injectSessionId(config),
      transformRequest: data => data,
      withCredentials: true
    };
  }
}

export class DefaultClientWithoutWorkerBuilder extends ClientBuilder {
  build(): BaseClient {
    return new HttpClientWithoutWorker(this.createClient(this.baseUrl, this.timeout));
  }
}

export class AuthAndTokenClientWithoutWorkerBuilder extends ClientBuilder {
  build(): BaseClient {
    const client = this.createClient(this.baseUrl, this.timeout);

    client.interceptors.request.use(
      request => this.injectTokenAndSession(request),
      error => {
        return Promise.reject(error);
      }
    );
    client.interceptors.response.use(
      response => response,
      error => this.responseError(error)
    );
    return new HttpClientWithoutWorker(client);
  }
}

export class AuthClientWithoutWorkerBuilder extends ClientBuilder {
  build(): BaseClient {
    const client = this.createClient(this.baseUrl, this.timeout);

    client.interceptors.request.use(
      request => this.injectSessionId(request),
      error => {
        return Promise.reject(error);
      }
    );
    client.interceptors.response.use(
      response => response,
      error => this.responseError(error)
    );
    return new HttpClientWithoutWorker(client);
  }
}

export class ClientBuilders {
  static defaultBuilder() {
    return new DefaultClientBuilder();
  }

  static authBuilder() {
    return new AuthClientBuilder();
  }

  static authAndTokenBuilder() {
    return new AuthAndTokenClientBuilder();
  }

  static lakeHouseBuilder() {
    return new LakeHouseClientBuilder();
  }
}

export class ClientWithoutWorkerBuilders {
  static defaultBuilder() {
    return new DefaultClientWithoutWorkerBuilder();
  }

  static authBuilder() {
    return new AuthAndTokenClientWithoutWorkerBuilder();
  }

  static authAndTokenBuilder() {
    return new AuthClientWithoutWorkerBuilder();
  }
}
