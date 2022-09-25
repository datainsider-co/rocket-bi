import { SystemInfo } from '../Domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';
import { ClickhouseSource } from '@core/ClickhouseConfig/Domain/ClickhouseSource/ClickhouseSource';
import { TestConnectionResponse } from '@core/ClickhouseConfig';
import { BaseResponse } from '@core/DataIngestion/Domain/Response/BaseResponse';
import { UpdateSystemInfoRequest } from '@core/ClickhouseConfig/Request';

export abstract class ClickhouseConfigRepository {
  abstract getSystemInfo(): Promise<SystemInfo>;
  abstract updateSystemInfo(request: UpdateSystemInfoRequest): Promise<SystemInfo>;
  abstract testConnection(sourceConfig: ClickhouseSource): Promise<TestConnectionResponse>;
  abstract refreshSchema(): Promise<boolean>;
}

export class ClickhouseConfigRepositoryImpl extends ClickhouseConfigRepository {
  @InjectValue(DIKeys.authClient)
  private httpClient!: BaseClient;

  refreshSchema(): Promise<boolean> {
    return this.httpClient.post<BaseResponse>(`databases/system/refresh-schema`).then(res => res.success);
  }

  getSystemInfo(): Promise<SystemInfo> {
    return this.httpClient.get<SystemInfo>(`databases/system/info`).then(res => SystemInfo.fromObject(res));
  }

  testConnection(sourceConfig: ClickhouseSource): Promise<TestConnectionResponse> {
    return this.httpClient
      .post<TestConnectionResponse>(`databases/system/test-connection`, { sourceConfig: sourceConfig })
      .then(res => TestConnectionResponse.fromObject(res));
  }

  updateSystemInfo(request: UpdateSystemInfoRequest): Promise<SystemInfo> {
    return this.httpClient.put<SystemInfo>(`databases/system/info`, request).then(res => SystemInfo.fromObject(res));
  }
}
