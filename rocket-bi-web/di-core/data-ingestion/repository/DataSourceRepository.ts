import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { DataSource } from '@core/data-ingestion/domain/response/DataSource';
import { DIException, ListingRequest, SourceId } from '@core/common/domain';
import {
  DataSourceType,
  Job,
  ListingResponse,
  PreviewResponse,
  S3Job,
  S3SourceInfo,
  TiktokAccessTokenResponse,
  TokenRequest,
  TokenResponse
} from '@core/data-ingestion';
import { BaseResponse } from '@core/data-ingestion/domain/response/BaseResponse';
import { Log } from '@core/utils';
import { GoogleToken } from '@core/data-ingestion/domain/response/GoogleToken';
import { UnsupportedSourceInfo } from '@core/data-ingestion/domain/data-source/UnsupportedSourceInfo';
import { DataSourceResponse } from '@core/data-ingestion/domain/response/DataSourceResponse';

const headerScheduler = {
  'Content-Type': 'application/json',
  'access-token': 'job$cheduler@datainsider.co'
};

export abstract class DataSourceRepository {
  abstract testConnection(dataSourceInfo: DataSourceInfo): Promise<BaseResponse>;

  abstract create(dataSourceInfo: DataSourceInfo): Promise<DataSourceInfo>;

  abstract createGaSource(displayName: string, authorizationCode: string): Promise<DataSourceInfo>;

  abstract list(request: ListingRequest): Promise<ListingResponse<DataSourceResponse>>;

  abstract delete(id: SourceId): Promise<boolean>;

  abstract multiDelete(ids: SourceId[]): Promise<boolean>;

  abstract update(id: SourceId, dataSourceInfo: DataSourceInfo): Promise<boolean>;

  abstract listDatabaseName(id: SourceId, projectName: string, location: string): Promise<string[]>;

  abstract listTableName(id: SourceId, dbName: string, projectName: string, location: string): Promise<string[]>;

  abstract listIncrementColumn(id: SourceId, dbName: string, tblName: string, projectName: string, location: string): Promise<string[]>;

  abstract getRefreshToken(authorizationCode: string): Promise<string>;

  abstract getShopifyClientId(): Promise<string>;

  abstract getShopifyAccessToken(shopUrl: string, authorizationCode: string, apiVersion: string): Promise<string>;

  abstract previewS3Job(sourceInfo: DataSourceInfo, job: Job): Promise<PreviewResponse>;

  abstract getGoogleAdsCustomerIds(sourceId: SourceId): Promise<string[]>;

  abstract getFacebookExchangeToken(token: string): Promise<TokenResponse>;

  abstract getTiktokAccessToken(authCode: string): Promise<TiktokAccessTokenResponse>;

  abstract listTiktokReport(): Promise<string[]>;

  abstract refreshGoogleToken(request: TokenRequest): Promise<TokenResponse>;

  abstract get(id: number): Promise<DataSourceInfo>;
}

export class DataSourceRepositoryImpl extends DataSourceRepository {
  @InjectValue(DIKeys.SchedulerClient)
  private readonly httpClient!: BaseClient;

  testConnection(dataSourceInfo: DataSourceInfo): Promise<BaseResponse> {
    return this.httpClient.post(`source/test`, dataSourceInfo.toDataSource(), void 0, headerScheduler);
  }

  create(dataSourceInfo: DataSourceInfo): Promise<DataSourceInfo> {
    return this.httpClient
      .post<DataSource>(`/source/create`, { dataSource: dataSourceInfo.toDataSource() }, void 0, headerScheduler)
      .then(response => DataSourceInfo.fromDataSource(response));
  }

  createGaSource(displayName: string, authorizationCode: string): Promise<DataSourceInfo> {
    return this.httpClient
      .post<DataSource>(
        `source/ga/create`,
        {
          displayName: displayName,
          authorizationCode: authorizationCode
        },
        {},
        headerScheduler
      )
      .then(response => DataSourceInfo.fromDataSource(response));
  }

  list(request: ListingRequest): Promise<ListingResponse<DataSourceResponse>> {
    return this.httpClient
      .post<any>(`/source/list`, request, void 0, headerScheduler)
      .then(response => new ListingResponse<DataSourceResponse>(this.parseToDataSourceResponses(response.data), response.total))
      .catch(e => {
        Log.error('DataSourceRepository::list::exception::', e.message);
        throw new DIException(e.message);
      });
  }

  delete(id: SourceId): Promise<boolean> {
    return this.httpClient.delete(`/source/${id}`, void 0, void 0, headerScheduler);
  }

  update(id: SourceId, dataSourceInfo: DataSourceInfo): Promise<boolean> {
    return this.httpClient.put(`/source/${id}`, { dataSource: dataSourceInfo.toDataSource() }, void 0, headerScheduler);
  }

  private parseToDataSourceResponses(dataSources: any[]): DataSourceResponse[] {
    const data = dataSources.map((dataSourceResponse: any) => {
      const dataSourceInfo = DataSourceInfo.fromDataSource(DataSource.fromObject(dataSourceResponse.dataSource));
      return DataSourceResponse.fromObject({ ...dataSourceResponse, dataSource: dataSourceInfo });
    });
    // Log.debug('parseDataSourceInfos::', data);
    return data;
  }

  listDatabaseName(id: number, projectName = '', location = ''): Promise<string[]> {
    return this.httpClient.post(`source/${id}/database`, {
      extraData: JSON.stringify({
        projectName: projectName,
        location: location
      })
    });
  }

  listTableName(id: number, dbName: string, projectName = '', location = ''): Promise<string[]> {
    return this.httpClient.post(`source/table`, {
      sourceId: id,
      databaseName: dbName,
      extraData: JSON.stringify({ projectName: projectName, location: location })
    });
  }

  listIncrementColumn(id: SourceId, dbName: string, tblName: string, projectName = '', location = ''): Promise<string[]> {
    const extraData = { projectName: projectName, location: location };
    return this.httpClient.post(`source/column`, {
      sourceId: id,
      databaseName: dbName,
      tableName: tblName,
      extraData: JSON.stringify(extraData)
    });
  }

  getRefreshToken(authorizationCode: string): Promise<string> {
    return this.httpClient
      .post<GoogleToken>(`source/google/token`, { authorizationCode: authorizationCode })
      .then(resp => resp.refreshToken);
  }

  getShopifyClientId(): Promise<string> {
    return this.httpClient.get<any>('source/shopify/client_id').then((resp: any) => resp.clientId);
  }

  getShopifyAccessToken(shopUrl: string, authorizationCode: string, apiVersion: string): Promise<string> {
    return this.httpClient
      .post<any>('source/shopify/access_token', {
        shopUrl: shopUrl,
        authorizationCode: authorizationCode,
        apiVersion: apiVersion
      })
      .then((resp: any) => resp.accessToken);
  }

  previewS3Job(sourceInfo: S3SourceInfo, job: S3Job): Promise<PreviewResponse> {
    return this.httpClient
      .post<any>('job/preview', {
        dataSource: sourceInfo,
        job: job
      })
      .then((resp: any) => PreviewResponse.fromObject(resp));
  }

  getGoogleAdsCustomerIds(sourceId: SourceId): Promise<string[]> {
    return this.httpClient.get(`/source/google_ads/customer_id/${sourceId}`);
  }

  getFacebookExchangeToken(token: string): Promise<TokenResponse> {
    return this.httpClient.get(`source/fb_ads/${token}/exchange_token`).then(res => TokenResponse.fromObject(res));
  }

  refreshGoogleToken(request: TokenRequest): Promise<TokenResponse> {
    return this.httpClient.post<TokenResponse>(`source/google/access_token/refresh`, request).then(res => TokenResponse.fromObject(res));
  }

  getTiktokAccessToken(authCode: string): Promise<TiktokAccessTokenResponse> {
    return this.httpClient.post(`source/tiktok_ads/exchange_token`, { authCode: authCode });
  }

  listTiktokReport(): Promise<string[]> {
    return this.httpClient.get(`source/tiktok_ads/report/table`);
  }

  multiDelete(ids: SourceId[]): Promise<boolean> {
    return this.httpClient.delete(`/source/multi_delete`, { ids: ids }, void 0, headerScheduler);
  }

  get(id: number): Promise<DataSourceInfo> {
    return this.httpClient.get<DataSource>(`/source/${id}`, void 0, headerScheduler).then(res => DataSourceInfo.fromDataSource(res));
  }
}

export class DataSourceRepositoryMock extends DataSourceRepository {
  getShopifyClientId(): Promise<string> {
    return Promise.resolve('');
  }

  create(dataSourceInfo: DataSourceInfo): Promise<DataSourceInfo> {
    return Promise.resolve(new UnsupportedSourceInfo(1, '-1', 'Unsupported source', 0));
  }

  createGaSource(displayName: string, authorizationCode: string): Promise<DataSourceInfo> {
    return Promise.resolve(new UnsupportedSourceInfo(1, '-1', 'Unsupported source', 0));
  }

  delete(id: SourceId): Promise<boolean> {
    return Promise.resolve(false);
  }

  getRefreshToken(authorizationCode: string): Promise<string> {
    return Promise.resolve('');
  }

  list(request: ListingRequest): Promise<ListingResponse<DataSourceResponse>> {
    return Promise.resolve(
      new ListingResponse<DataSourceResponse>(
        [
          DataSourceResponse.fromObject({
            dataSource: { className: 'xxx', displayName: 'Unsuportted source' },
            creator: {
              username: 'tne'
            }
          })
        ],
        0
      )
    );
  }

  listDatabaseName(id: SourceId, projectName: string, location: string): Promise<string[]> {
    return Promise.resolve([]);
  }

  listIncrementColumn(id: SourceId, dbName: string, tblName: string, projectName: string, location: string): Promise<string[]> {
    return Promise.resolve([]);
  }

  listTableName(id: SourceId, dbName: string, projectName: string, location: string): Promise<string[]> {
    return Promise.resolve([]);
  }

  testConnection(dataSourceInfo: DataSourceInfo): Promise<BaseResponse> {
    return Promise.resolve({ success: false });
  }

  update(id: SourceId, dataSourceInfo: DataSourceInfo): Promise<boolean> {
    return Promise.resolve(false);
  }

  getShopifyAccessToken(shopUrl: string, authorizationCode: string, apiVersion: string): Promise<string> {
    return Promise.resolve('');
  }

  previewS3Job(sourceInfo: DataSourceInfo, job: Job): Promise<PreviewResponse> {
    throw new DIException('Not supported');
  }

  getGoogleAdsCustomerIds(sourceId: SourceId): Promise<string[]> {
    throw new DIException('Not supported');
  }

  getFacebookExchangeToken(token: string): Promise<TokenResponse> {
    throw new DIException('Not supported');
  }
  getTiktokAccessToken(authCode: string): Promise<TiktokAccessTokenResponse> {
    throw new DIException('Not supported');
  }

  listTiktokReport(): Promise<string[]> {
    throw new DIException('Not supported');
  }

  refreshGoogleToken(request: TokenRequest): Promise<TokenResponse> {
    throw new DIException('Not supported');
  }

  multiDelete(ids: SourceId[]): Promise<boolean> {
    return Promise.resolve(false);
  }

  get(id: number): Promise<DataSourceInfo> {
    return Promise.resolve(DataSourceInfo.createDefault(DataSourceType.GA));
  }
}
