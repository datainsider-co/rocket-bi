import { ClickhouseSource } from '@core/clickhouse-config/domain/ClickhouseSource';

export class UpdateSystemInfoRequest {
  constructor(public sources: ClickhouseSource[]) {}
}
