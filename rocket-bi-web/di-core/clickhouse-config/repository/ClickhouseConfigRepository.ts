import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { DataSource, RefreshSchemaHistory } from '@core/clickhouse-config';
import { BaseResponse } from '@core/common/domain';

export abstract class ClickhouseConfigRepository {
  abstract testConnection(source: DataSource): Promise<boolean>;
  abstract refreshSchema(): Promise<boolean>;

  abstract checkExistedSource(): Promise<boolean>;
  abstract getSource(): Promise<DataSource>;
  abstract setSource(source: DataSource): Promise<DataSource>;
  abstract getStatus(): Promise<RefreshSchemaHistory>;
}

export class ClickhouseConfigRepositoryImpl extends ClickhouseConfigRepository {
  @InjectValue(DIKeys.SchemaClient)
  private httpClient!: BaseClient;

  refreshSchema(): Promise<boolean> {
    return this.httpClient.post<BaseResponse>(`connection/refresh-schema`).then(res => res.success);
  }

  testConnection(source: DataSource): Promise<boolean> {
    return this.httpClient.post<BaseResponse>(`connection/test`, JSON.stringify({ source: source.toJson() })).then(res => res.success);
  }

  checkExistedSource(): Promise<boolean> {
    return this.httpClient
      .get<{ existed: boolean }>(`connection/exist`)
      .then(res => res.existed)
      .catch(e => false);
  }

  setSource(source: DataSource): Promise<DataSource> {
    return this.httpClient.post<DataSource>(`connection`, JSON.stringify({ source: source.toJson() })).then(res => DataSource.fromObject(source));
  }

  getSource(): Promise<DataSource> {
    return this.httpClient.get<DataSource>(`connection`).then(res => DataSource.fromObject(res));
  }

  getStatus(): Promise<RefreshSchemaHistory> {
    return this.httpClient.get<RefreshSchemaHistory>(`connection/refresh-schema/status`).then(res => RefreshSchemaHistory.fromObject(res));
  }
}
