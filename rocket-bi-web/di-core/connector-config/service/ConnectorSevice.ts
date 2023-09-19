import { Inject } from 'typescript-ioc';
import { ConnectorRepository, Connector, SSHPublicKeyResponse, RefreshSchemaHistory } from '@core/connector-config';

export abstract class ConnectorService {
  abstract testConnection(source: Connector): Promise<boolean>;
  abstract refreshSchema(): Promise<boolean>;

  abstract checkExistedSource(): Promise<boolean>;
  abstract getSource(): Promise<Connector>;
  abstract setSource(source: Connector): Promise<Connector>;
  abstract getStatus(): Promise<RefreshSchemaHistory>;
  abstract getSSHPublicKey(): Promise<SSHPublicKeyResponse>;
  abstract createSSHPublicKey(): Promise<boolean>;
}

export class ConnectorServiceImpl extends ConnectorService {
  @Inject
  private repository!: ConnectorRepository;

  refreshSchema(): Promise<boolean> {
    return this.repository.refreshSchema();
  }

  testConnection(source: Connector): Promise<boolean> {
    return this.repository.testConnection(source);
  }

  checkExistedSource(): Promise<boolean> {
    return this.repository.checkExistedSource();
  }

  setSource(source: Connector): Promise<Connector> {
    return this.repository.setSource(source);
  }

  getSource(): Promise<Connector> {
    return this.repository.getSource();
  }

  getStatus(): Promise<RefreshSchemaHistory> {
    return this.repository.getStatus();
  }

  getSSHPublicKey(): Promise<SSHPublicKeyResponse> {
    return this.repository.getSSHPublicKey();
  }

  createSSHPublicKey(): Promise<boolean> {
    return this.repository.createSSHPublicKey();
  }
}
