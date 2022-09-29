import { ClickhouseSource } from '@core/clickhouse-config/domain/ClickhouseSource';
import { RefreshBy } from '@core/clickhouse-config/enum/RefreshBy';
import { RefreshStatus } from '@core/clickhouse-config/enum/RefreshStatus';
import { SystemStatus } from '@core/clickhouse-config';
import { EtlJobStatus } from '@core/data-cook';

export class SystemInfo {
  constructor(
    public status: SystemStatus,
    public sources: ClickhouseSource[],
    public currentRefreshStatus: RefreshStatus,
    public createdTime: number,
    public updatedTime: number,
    public lastRefreshStatus?: RefreshStatus,
    public lastRefreshTime?: number,
    public lastRefreshBy?: RefreshBy
  ) {}

  static fromObject(obj: SystemInfo) {
    return new SystemInfo(
      obj.status,
      obj.sources,
      obj.currentRefreshStatus,
      obj.createdTime,
      obj.updatedTime,
      obj?.lastRefreshStatus,
      obj?.lastRefreshTime,
      obj?.lastRefreshBy
    );
  }

  static getIconFromRefreshStatus(status: RefreshStatus) {
    const baseUrl = 'assets/icon/data_ingestion/status';
    switch (status) {
      case RefreshStatus.Error:
        return require(`@/${baseUrl}/error.svg`);
      case RefreshStatus.Init:
        return require(`@/${baseUrl}/initialized.svg`);
      case RefreshStatus.Success:
        return require(`@/${baseUrl}/synced.svg`);
      case RefreshStatus.Running:
        return require(`@/${baseUrl}/syncing.svg`);
      default:
        return require(`@/${baseUrl}/unknown.svg`);
    }
  }

  static default() {
    return new SystemInfo(SystemStatus.Healthy, [], RefreshStatus.Init, Date.now(), Date.now());
  }
}
