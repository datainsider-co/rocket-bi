import { Inject } from 'typescript-ioc';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { DataSourceRepository } from '@core/data-ingestion/repository/DataSourceRepository';
import { ListingRequest, SourceId, TableSchema } from '@core/common/domain';
import {
  TokenResponse,
  Job,
  ListingResponse,
  PreviewResponse,
  S3Job,
  S3SourceInfo,
  TokenRequest,
  TiktokAccessTokenResponse,
  DataSource
} from '@core/data-ingestion';
import { DataSourceResponse } from '@core/data-ingestion/domain/response/DataSourceResponse';

export abstract class DataSourceService {
  abstract testConnection(dataSourceInfo: DataSourceInfo): Promise<boolean>;

  abstract create(dataSourceInfo: DataSourceInfo): Promise<DataSourceInfo>;

  abstract createGaSource(displayName: string, authorizationCode: string): Promise<DataSourceInfo>;

  abstract list(request: ListingRequest): Promise<ListingResponse<DataSourceResponse>>;

  abstract get(id: number): Promise<DataSourceInfo>;

  abstract delete(id: SourceId): Promise<boolean>;

  abstract multiDelete(ids: SourceId[]): Promise<boolean>;

  abstract update(id: SourceId, dataSourceInfo: DataSourceInfo): Promise<boolean>;

  abstract listDatabaseName(id: SourceId, projectName: string, location: string): Promise<string[]>;

  abstract listTableName(id: SourceId, dbName: string, projectName: string, location: string): Promise<string[]>;

  abstract listIncrementColumns(id: SourceId, dbName: string, tblName: string, projectName: string, location: string): Promise<string[]>;

  abstract getRefreshToken(authorizationCode: string): Promise<string>;

  abstract getShopifyClientId(): Promise<string>;

  abstract getShopifyAccessToken(shopUrl: string, authorizationCode: string, apiVersion: string): Promise<string>;

  abstract previewSchema(sourceInfo: DataSourceInfo, job: Job): Promise<PreviewResponse>;

  abstract getGoogleAdsCustomerIds(sourceId: SourceId): Promise<string[]>;

  abstract getFacebookExchangeToken(token: string): Promise<TokenResponse>;

  abstract getTiktokAccessToken(authCode: string): Promise<TiktokAccessTokenResponse>;

  abstract listTiktokReport(): Promise<string[]>;

  abstract refreshGoogleToken(request: TokenRequest): Promise<TokenResponse>;
}

export class DataSourceServiceImpl extends DataSourceService {
  constructor(@Inject private dataSourceRepository: DataSourceRepository) {
    super();
  }

  testConnection(dataSourceInfo: DataSourceInfo): Promise<boolean> {
    return this.dataSourceRepository.testConnection(dataSourceInfo).then(response => response.success);
  }

  create(dataSourceInfo: DataSourceInfo): Promise<DataSourceInfo> {
    return this.dataSourceRepository.create(dataSourceInfo);
  }

  createGaSource(displayName: string, authorizationCode: string): Promise<DataSourceInfo> {
    return this.dataSourceRepository.createGaSource(displayName, authorizationCode);
  }

  list(request: ListingRequest): Promise<ListingResponse<DataSourceResponse>> {
    return this.dataSourceRepository.list(request);
  }

  delete(id: SourceId): Promise<boolean> {
    return this.dataSourceRepository.delete(id);
  }

  update(id: SourceId, dataSourceInfo: DataSourceInfo): Promise<boolean> {
    return this.dataSourceRepository.update(id, dataSourceInfo);
  }

  listDatabaseName(id: SourceId, projectName = '', location = ''): Promise<string[]> {
    return this.dataSourceRepository.listDatabaseName(id, projectName, location);
  }

  listTableName(id: SourceId, dbName: string, projectName = '', location = ''): Promise<string[]> {
    return this.dataSourceRepository.listTableName(id, dbName, projectName, location);
  }

  listIncrementColumns(id: SourceId, dbName: string, tblName: string, projectName = '', location = ''): Promise<string[]> {
    return this.dataSourceRepository.listIncrementColumn(id, dbName, tblName, projectName, location);
  }

  getRefreshToken(authorizationCode: string): Promise<string> {
    return this.dataSourceRepository.getRefreshToken(authorizationCode);
  }

  getShopifyClientId(): Promise<string> {
    return this.dataSourceRepository.getShopifyClientId();
  }

  getShopifyAccessToken(shopUrl: string, authorizationCode: string, apiVersion: string): Promise<string> {
    return this.dataSourceRepository.getShopifyAccessToken(shopUrl, authorizationCode, apiVersion);
  }

  previewSchema(sourceInfo: DataSourceInfo, job: Job): Promise<PreviewResponse> {
    return this.dataSourceRepository.previewS3Job(sourceInfo, job);
  }

  getGoogleAdsCustomerIds(sourceId: SourceId): Promise<string[]> {
    return this.dataSourceRepository.getGoogleAdsCustomerIds(sourceId);
  }

  getFacebookExchangeToken(token: string): Promise<TokenResponse> {
    return this.dataSourceRepository.getFacebookExchangeToken(token);
  }

  getTiktokAccessToken(authCode: string): Promise<TiktokAccessTokenResponse> {
    return this.dataSourceRepository.getTiktokAccessToken(authCode);
  }

  listTiktokReport(): Promise<string[]> {
    return this.dataSourceRepository.listTiktokReport();
  }

  multiDelete(ids: SourceId[]): Promise<boolean> {
    return this.dataSourceRepository.multiDelete(ids);
  }

  refreshGoogleToken(request: TokenRequest): Promise<TokenResponse> {
    return this.dataSourceRepository.refreshGoogleToken(request);
  }

  get(id: number): Promise<DataSourceInfo> {
    return this.dataSourceRepository.get(id);
  }
}
