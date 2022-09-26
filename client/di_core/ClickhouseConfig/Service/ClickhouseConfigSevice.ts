import { SystemInfo } from '../Domain';
import { Inject } from 'typescript-ioc';
import { ClickhouseSource } from '@core/ClickhouseConfig/Domain/ClickhouseSource/ClickhouseSource';
import { ClickhouseConfigRepository, TestConnectionResponse } from '@core/ClickhouseConfig';
import { UpdateSystemInfoRequest } from '@core/ClickhouseConfig/Request';

export abstract class ClickhouseConfigService {
  abstract getSystemInfo(): Promise<SystemInfo>;
  abstract updateSystemInfo(request: UpdateSystemInfoRequest): Promise<SystemInfo>;
  abstract testConnection(sourceConfig: ClickhouseSource): Promise<TestConnectionResponse>;
  abstract refreshSchema(): Promise<boolean>;
}

export class ClickhouseConfigServiceImpl extends ClickhouseConfigService {
  @Inject
  private repository!: ClickhouseConfigRepository;

  refreshSchema(): Promise<boolean> {
    return this.repository.refreshSchema();
  }

  getSystemInfo(): Promise<SystemInfo> {
    return this.repository.getSystemInfo();
  }

  testConnection(sourceConfig: ClickhouseSource): Promise<TestConnectionResponse> {
    return this.repository.testConnection(sourceConfig);
  }

  updateSystemInfo(request: UpdateSystemInfoRequest): Promise<SystemInfo> {
    return this.repository.updateSystemInfo(request);
  }
}
