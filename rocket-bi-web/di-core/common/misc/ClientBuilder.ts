import { BaseClient, HttpClient, HttpClientWithoutWorker } from '@core/common/services/HttpClient';
import Axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { DIApiException, DIException } from '@core/common/domain/exception';
import { ApiExceptions } from '@/shared';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { DataManager } from '@core/common/services';
import { StringUtils } from '@/utils/StringUtils';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';
import { isObject } from 'lodash';
import { Log } from '@core/utils';

export abstract class AbstractClientBuilder {
  abstract build(): BaseClient;

  protected createClient(baseUrl?: string, timeout?: number) {
    return Axios.create({
      baseURL: baseUrl,
      timeout: timeout || 30000,
      headers: {
        'Content-Type': 'application/json'
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
      const exception = await this.parseException(error);
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

  protected async parseException(error: AxiosError): Promise<DIException | undefined> {
    if (error.response && error.response.data instanceof Blob) {
      Log.error('ClientBuilder::responseError::isBlob::');
      const exception = JSON.parse(await error.response.data.text());
      return DIApiException.fromObject(exception);
    } else if (error.response && isObject(error.response.data)) {
      Log.error('ClientBuilder::responseError::error::', error.response?.data);
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
    const session = DataManager.getSession();
    if (session && StringUtils.isNotEmpty(session)) {
      request.headers['Authorization'] = session;
    }
    return request;
  }

  protected injectTokenAndSession(request: AxiosRequestConfig): AxiosRequestConfig {
    const session = DataManager.getSession();
    const token = DataManager.getToken();
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
