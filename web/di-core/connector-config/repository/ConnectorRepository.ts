import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { Connector, SSHPublicKeyResponse, RefreshSchemaHistory } from '@core/connector-config';
import { BaseResponse } from '@core/common/domain';

export abstract class ConnectorRepository {
  abstract testConnection(source: Connector): Promise<boolean>;
  abstract refreshSchema(): Promise<boolean>;

  abstract checkExistedSource(): Promise<boolean>;
  abstract getSource(): Promise<Connector>;
  abstract setSource(source: Connector): Promise<Connector>;
  abstract getStatus(): Promise<RefreshSchemaHistory>;

  abstract getSSHPublicKey(): Promise<SSHPublicKeyResponse>;
  abstract createSSHPublicKey(): Promise<boolean>;
}

export class ConnectorRepositoryImpl extends ConnectorRepository {
  @InjectValue(DIKeys.SchemaClient)
  private httpClient!: BaseClient;

  refreshSchema(): Promise<boolean> {
    return this.httpClient.post<BaseResponse>(`connection/refresh-schema`).then(res => res.success);
  }

  testConnection(source: Connector): Promise<boolean> {
    return this.httpClient.post<BaseResponse>(`connection/test`, JSON.stringify({ source: source.toJson() })).then(res => res.success);
  }

  checkExistedSource(): Promise<boolean> {
    return this.httpClient
      .get<{ existed: boolean }>(`connection/exist`)
      .then(res => res.existed)
      .catch(e => false);
  }

  setSource(source: Connector): Promise<Connector> {
    return this.httpClient.post<Connector>(`connection`, JSON.stringify({ source: source.toJson() })).then(res => Connector.fromObject(source));
  }

  getSource(): Promise<Connector> {
    return this.httpClient.get<Connector>(`connection`).then(res => Connector.fromObject(res));
  }

  getStatus(): Promise<RefreshSchemaHistory> {
    return this.httpClient.get<RefreshSchemaHistory>(`connection/refresh-schema/status`).then(res => RefreshSchemaHistory.fromObject(res));
  }

  getSSHPublicKey(): Promise<SSHPublicKeyResponse> {
    return this.httpClient.get(`/connection/ssh/public-key`);
  }

  createSSHPublicKey(): Promise<boolean> {
    return this.httpClient.post(`/connection/ssh/generate-key`);
  }
}
