import { DataSourceInfo } from '@core/DataIngestion/Domain/DataSource/DataSourceInfo';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';
import { DataSource } from '@core/DataIngestion/Domain/Response/DataSource';
import { DIException, SourceId, TableSchema } from '@core/domain';
import { Job, ListingResponse, PreviewResponse, S3Job, S3SourceInfo } from '@core/DataIngestion';
import { BaseResponse } from '@core/DataIngestion/Domain/Response/BaseResponse';
import { Log } from '@core/utils';
import { GoogleToken } from '@core/DataIngestion/Domain/Response/GoogleToken';
import { UnsupportedSourceInfo } from '@core/DataIngestion/Domain/DataSource/UnsupportedSourceInfo';
import { DataSourceResponse } from '@core/DataIngestion/Domain/Response/DataSourceResponse';
import { ListingRequest } from '@core/LakeHouse/Domain/Request/ListingRequest/ListingRequest';

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

  abstract update(id: SourceId, dataSourceInfo: DataSourceInfo): Promise<boolean>;

  abstract listDatabaseName(id: SourceId, projectName: string, location: string): Promise<string[]>;

  abstract listTableName(id: SourceId, dbName: string, projectName: string, location: string): Promise<string[]>;

  abstract listIncrementColumn(id: SourceId, dbName: string, tblName: string, projectName: string, location: string): Promise<string[]>;

  abstract getRefreshToken(authorizationCode: string): Promise<string>;

  abstract getShopifyClientId(): Promise<string>;

  abstract getShopifyAccessToken(shopUrl: string, authorizationCode: string, apiVersion: string): Promise<string>;

  abstract previewS3Job(sourceInfo: DataSourceInfo, job: Job): Promise<PreviewResponse>;
}

export class DataSourceRepositoryImpl extends DataSourceRepository {
  @InjectValue(DIKeys.SchedulerClient)
  private readonly httpClient!: BaseClient;

  testConnection(dataSourceInfo: DataSourceInfo): Promise<BaseResponse> {
    return this.httpClient.post(`worker/source/test`, dataSourceInfo.toDataSource(), void 0, headerScheduler);
  }

  create(dataSourceInfo: DataSourceInfo): Promise<DataSourceInfo> {
    return this.httpClient
      .post<DataSource>(`/scheduler/source/create`, { dataSource: dataSourceInfo.toDataSource() }, void 0, headerScheduler)
      .then(response => DataSourceInfo.fromDataSource(response));
  }

  createGaSource(displayName: string, authorizationCode: string): Promise<DataSourceInfo> {
    return this.httpClient
      .post<DataSource>(
        `scheduler/source/ga/create`,
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
      .post<any>(`/scheduler/source/list`, request, void 0, headerScheduler)
      .then(response => new ListingResponse<DataSourceResponse>(this.parseToDataSourceResponses(response.data), response.total))
      .catch(e => {
        Log.error('DataSourceRepository::list::exception::', e.message);
        throw new DIException(e.message);
      });
  }

  delete(id: SourceId): Promise<boolean> {
    return this.httpClient.delete(`/scheduler/source/${id}`, void 0, void 0, headerScheduler);
  }

  update(id: SourceId, dataSourceInfo: DataSourceInfo): Promise<boolean> {
    return this.httpClient.put(`/scheduler/source/${id}`, { dataSource: dataSourceInfo.toDataSource() }, void 0, headerScheduler);
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
    return this.httpClient.post(`worker/source/${id}/database`, {
      extraData: JSON.stringify({
        projectName: projectName,
        location: location
      })
    });
  }

  listTableName(id: number, dbName: string, projectName = '', location = ''): Promise<string[]> {
    return this.httpClient.post(`worker/source/table`, {
      sourceId: id,
      databaseName: dbName,
      extraData: JSON.stringify({ projectName: projectName, location: location })
    });
  }

  listIncrementColumn(id: SourceId, dbName: string, tblName: string, projectName = '', location = ''): Promise<string[]> {
    const extraData = { projectName: projectName, location: location };
    return this.httpClient.post(`worker/source/column`, {
      sourceId: id,
      databaseName: dbName,
      tableName: tblName,
      extraData: JSON.stringify(extraData)
    });
  }

  getRefreshToken(authorizationCode: string): Promise<string> {
    return this.httpClient
      .post<GoogleToken>(`worker/source/google/token`, { authorizationCode: authorizationCode })
      .then(resp => resp.refreshToken);
  }

  getShopifyClientId(): Promise<string> {
    return this.httpClient.get<any>('worker/source/shopify/client_id').then((resp: any) => resp.clientId);
  }

  getShopifyAccessToken(shopUrl: string, authorizationCode: string, apiVersion: string): Promise<string> {
    return this.httpClient
      .post<any>('worker/source/shopify/access_token', {
        shopUrl: shopUrl,
        authorizationCode: authorizationCode,
        apiVersion: apiVersion
      })
      .then((resp: any) => resp.accessToken);
  }

  previewS3Job(sourceInfo: S3SourceInfo, job: S3Job): Promise<PreviewResponse> {
    return this.httpClient
      .post<any>('worker/job/preview', {
        dataSource: sourceInfo,
        job: job
      })
      .then((resp: any) => PreviewResponse.fromObject(resp));
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
}
