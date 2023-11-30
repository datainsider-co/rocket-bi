import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Inject } from 'typescript-ioc';
import { CustomCell, HeaderData } from '@/shared/models';
import { Log } from '@core/utils';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { DIException, ListingRequest, SourceId } from '@core/common/domain';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { DataSourceType, ListingResponse, SortRequest, TokenRequest, TokenResponse } from '@core/data-ingestion';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import { DataSourceResponse } from '@core/data-ingestion/domain/response/DataSourceResponse';
import { DateTimeUtils } from '@/utils';
import { JdbcUrlSourceInfo } from '@core/data-ingestion/domain/data-source/JdbcUrlSourceInfo';
import { CheckBoxHeaderController, CheckBoxHeaderData } from '@/shared/components/common/di-table/custom-cell/CheckBoxHeaderData';

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.DataSourceStore })
class DataSourceStore extends VuexModule {
  dataSources: DataSourceResponse[] = [];
  totalRecord = 0;
  databaseNames: string[] = [];
  tableNames: string[] = [];
  incrementalColumns: string[] = [];

  @Inject
  private dataSourceService!: DataSourceService;

  @Action
  loadDataSources(payload: { from: number; size: number; keyword?: string; sorts?: SortRequest[] }): Promise<DataSourceResponse[]> {
    const { from, size, keyword, sorts } = payload;
    return this.dataSourceService
      .list(new ListingRequest(keyword, from, size, sorts))
      .then(response => {
        Log.debug('LoadDataSource::', response);
        this.setDataSources(response);
        return response.data;
      })
      .catch(ex => {
        const exception = DIException.fromObject(ex);
        Log.error('DataIngestion::loadDataSources::exception::', exception.message);
        throw new DIException(ex.message);
      });
  }

  @Mutation
  setDataSources(response: ListingResponse<DataSourceResponse>) {
    this.dataSources = response.data;
    this.totalRecord = response.total;
  }

  @Action
  testConnection(source: DataSourceInfo): Promise<boolean> {
    return this.dataSourceService.testConnection(source);
  }

  @Action
  createDataSource(request: DataSourceInfo): Promise<DataSourceInfo> {
    return this.dataSourceService.create(request);
  }

  @Action
  editDataSource(dataSource: DataSourceInfo) {
    return this.dataSourceService.update(dataSource.id, dataSource);
  }

  @Action
  deleteDataSource(id: SourceId) {
    return this.dataSourceService.delete(id);
  }

  @Action
  deleteMultiDataSource(indexs: Set<SourceId>) {
    const sourceIds = Array.from(indexs);
    return this.dataSourceService.multiDelete(sourceIds);
  }

  @Action
  loadDatabaseNames(payload: { id: SourceId; projectName?: string; location?: string }): Promise<string[]> {
    return this.dataSourceService
      .listDatabaseName(payload.id, payload.projectName ?? '', payload.location ?? '')
      .then(response => {
        this.setDatabaseNames(response);
        return response;
      })
      .catch(ex => {
        Log.error('DataSourceStore::listDatabaseName::exception::', ex.message);
        this.setDatabaseNames([]);
        return [];
      });
  }

  @Mutation
  setDatabaseNames(databaseNames: string[]) {
    this.databaseNames = databaseNames;
  }

  @Action
  loadTableNames(payload: { id: SourceId; dbName: string; projectName?: string; location?: string }): Promise<string[]> {
    return this.dataSourceService
      .listTableName(payload.id, payload.dbName, payload.projectName ?? '', payload.location ?? '')
      .then(response => {
        this.setTableNames(response);
        return response;
      })
      .catch(ex => {
        Log.error('DataSourceStore::listTableName::exception::', ex.message);
        this.setTableNames([]);
        return [];
      });
  }

  @Mutation
  setTableNames(tableNames: string[]) {
    this.tableNames = tableNames;
  }

  @Action
  loadIncrementalColumns(payload: { id: SourceId; dbName: string; tblName: string; projectName?: string; location?: string }): Promise<string[]> {
    return this.dataSourceService
      .listIncrementColumns(payload.id, payload.dbName, payload.tblName, payload.projectName ?? '', payload.location ?? '')
      .then(response => {
        this.setIncrementalColumns(response);
        return response;
      })
      .catch(ex => {
        Log.error('DataSourceStore::listIncrementalColumn::exception::', ex.message);
        this.setIncrementalColumns([]);
        return [];
      });
  }

  @Mutation
  setIncrementalColumns(incrementalNames: string[]) {
    this.incrementalColumns = incrementalNames;
  }

  @Action
  createGaSource(payload: { displayName: string; authorizationCode: string }): Promise<DataSourceInfo> {
    return this.dataSourceService.createGaSource(payload.displayName, payload.authorizationCode);
  }

  @Action
  getRefreshToken(authorizationCode: string): Promise<string> {
    return this.dataSourceService.getRefreshToken(authorizationCode);
  }

  @Action
  refreshGoogleToken(request: TokenRequest): Promise<TokenResponse> {
    return this.dataSourceService.refreshGoogleToken(request);
  }

  @Action
  getSource(id: number): Promise<DataSourceInfo> {
    return this.dataSourceService.get(id);
  }
}

export const DataSourceModule: DataSourceStore = getModule(DataSourceStore);
