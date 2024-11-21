import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Connector, ConnectorService, ConnectorType, RefreshSchemaHistory } from '@core/connector-config';
import { Inject } from 'typescript-ioc';
import { DIException } from '@core/common/domain';
import { PermissionAdminService } from '@core/admin/service/PermissionAdminService';
import { IsPermittedPermissionRequest } from '@core/admin/domain/request/IsPermittedPermissionRequest';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';
import { Mutex } from 'async-mutex';

export interface SourceResponse {
  source: Connector;
  status: RefreshSchemaHistory;
}

@Module({ namespaced: true, store: store, dynamic: true, name: Stores.DataSourceConfigStore })
export class ConnectionStore extends VuexModule {
  source: Connector | null = null;
  status: RefreshSchemaHistory = RefreshSchemaHistory.default();
  isExistedSource = false;
  isInitialized = false;
  isInitialLoading = false;
  isPermitted = false;
  mutex = new Mutex();
  SSHPublicKey = '';

  @Inject
  private readonly clickhouseService!: ConnectorService;

  @Inject
  private readonly permissionAdminService!: PermissionAdminService;

  get sourceType(): ConnectorType {
    return this.source?.className ?? ConnectorType.Clickhouse;
  }

  get isSetUpStep(): boolean {
    if (this.isExistedSource && this.status.isFirstRun && this.status.isRunning) {
      return true;
    } else {
      return false;
    }
  }

  get sourceResponse(): SourceResponse | null {
    return this.source ? { source: this.source, status: this.status } : null;
  }

  get isConfigStep() {
    if (!this.isExistedSource || (this.isExistedSource && this.status.isFirstRun && this.status.isError)) {
      return true;
    } else {
      return false;
    }
  }

  get isNavigateToConnectionConfig() {
    return this.isPermitted && (this.isSetUpStep || this.isConfigStep);
  }

  @Action
  async init(): Promise<void> {
    const releaser = await this.mutex.acquire(); //Block when multi request to this method
    try {
      if (AuthenticationModule.isLoggedIn && !this.isInitialized && !this.isInitialLoading) {
        this.setIsInitialLoading(true);
        await this.loadPermission();
        await this.checkSource();
        if (this.isExistedSource) {
          await this.loadSource();
        }
        if (this.isExistedSource && this.isPermitted) {
          await this.loadStatus();
        }
        this.setIsInitialized(true);
      }
    } catch (e) {
      throw DIException.fromObject(e);
    } finally {
      this.setIsInitialLoading(false);
      releaser();
    }
  }

  @Action
  async loadStatus(): Promise<RefreshSchemaHistory> {
    const status = await this.clickhouseService.getStatus();
    this.setStatus(status);
    return status;
  }

  @Action
  async loadSSHPublicKey(): Promise<void> {
    if (!this.SSHPublicKey) {
      let response = await this.clickhouseService.getSSHPublicKey();

      if (response.isExists) {
        this.setSSHPublicKey(response.publicKey!);
      } else {
        await this.clickhouseService.createSSHPublicKey();
        response = await this.clickhouseService.getSSHPublicKey();
        this.setSSHPublicKey(response.publicKey!);
      }
    }
  }

  @Action
  async createSSHPublicKey(): Promise<boolean> {
    return await this.clickhouseService.createSSHPublicKey();
  }

  @Mutation
  setSSHPublicKey(key: string) {
    this.SSHPublicKey = key;
  }

  @Action
  async loadSource(): Promise<Connector> {
    const source = await this.clickhouseService.getSource();
    this.setSource(source);
    if (source.tunnelConfig) {
      this.setSSHPublicKey(source.tunnelConfig.publicKey);
    }
    return source;
  }

  @Action
  async addSource(source: Connector): Promise<Connector> {
    const sourceResponse = await this.clickhouseService.setSource(source);
    await this.loadStatus();
    this.setSource(source);
    return sourceResponse;
  }

  @Action
  async checkSource(): Promise<boolean> {
    const isExistedSource = await this.clickhouseService.checkExistedSource();
    this.setIsExistedSource(isExistedSource);
    return isExistedSource;
  }

  @Action
  async refreshSchema(): Promise<boolean> {
    return await this.clickhouseService.refreshSchema();
  }

  @Action
  async loadPermission(): Promise<boolean> {
    try {
      const permission = 'organization:manage:connection';
      if (AuthenticationModule.isLoggedIn) {
        const request: IsPermittedPermissionRequest = new IsPermittedPermissionRequest(AuthenticationModule.currentUsername, [permission]);
        const response = await this.permissionAdminService.isPermitted(request);
        const isPermitted: boolean = response[permission] ?? false;
        this.setIsPermitted(isPermitted);
        return isPermitted;
      } else {
        this.setIsPermitted(false);
        return false;
      }
    } catch (e) {
      this.setIsPermitted(false);
      return false;
    }
  }

  @Mutation
  setSource(source: Connector) {
    this.source = source;
  }

  @Mutation
  setIsInitialized(value: boolean) {
    this.isInitialized = value;
  }

  @Mutation
  setIsInitialLoading(value: boolean) {
    this.isInitialLoading = value;
  }

  @Mutation
  setIsExistedSource(value: boolean) {
    this.isExistedSource = value;
  }

  @Mutation
  setStatus(status: RefreshSchemaHistory) {
    this.status = status;
  }

  @Mutation
  setIsPermitted(value: boolean) {
    this.isPermitted = value;
  }

  @Mutation
  reset() {
    this.isInitialized = false;
    this.isInitialLoading = false;
    this.source = null;
    this.status = RefreshSchemaHistory.default();
    this.isExistedSource = false;
    this.isPermitted = false;
  }
}

export const ConnectionModule: ConnectionStore = getModule(ConnectionStore);
