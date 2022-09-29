import { SystemInfo } from '../domain';
import { Inject } from 'typescript-ioc';
import { ClickhouseSource } from '@core/clickhouse-config/domain/ClickhouseSource';
import { ClickhouseConfigRepository, TestConnectionResponse } from '@core/clickhouse-config';
import { UpdateSystemInfoRequest } from '@core/clickhouse-config/request';

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
