import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Inject } from 'typescript-ioc';
import { CustomCell, HeaderData } from '@/shared/models';
import { Log } from '@core/utils';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { DIException, SourceId } from '@core/common/domain';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { DataSourceType, ListingResponse, SortRequest } from '@core/data-ingestion';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { UserAvatarCell } from '@/shared/components/common/di-table/custom-cell';
import { DataSourceResponse } from '@core/data-ingestion/domain/response/DataSourceResponse';
import { DateTimeFormatter } from '@/utils';
import { ListingRequest } from '@core/lake-house/domain/request/listing-request/ListingRequest';
import { JdbcUrlSourceInfo } from '@core/data-ingestion/domain/data-source/JdbcUrlSourceInfo';

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.dataSourceStore })
class DataSourceStore extends VuexModule {
  dataSources: DataSourceResponse[] = [];
  totalRecord = 0;
  databaseNames: string[] = [];
  tableNames: string[] = [];
  incrementalColumns: string[] = [];
  defaultDatasourceIcon = require('@/assets/icon/data_ingestion/datasource/ic_default.svg');

  @Inject
  private dataSourceService!: DataSourceService;

  get dataSourceHeaders(): HeaderData[] {
    return [
      {
        key: 'name',
        label: 'Name',
        customRenderBodyCell: new CustomCell(rowData => {
          const dataSourceResponse = DataSourceResponse.fromObject(rowData);
          const data = dataSourceResponse.dataSource.getDisplayName();
          // eslint-disable-next-line
          const datasourceImage = require(`@/assets/icon/data_ingestion/datasource/${DataSourceInfo.dataSourceIcon(rowData.dataSource.sourceType)}`);

          const imgElement = HtmlElementRenderUtils.renderImg(datasourceImage, 'data-source-icon', this.defaultDatasourceIcon);
          const dataElement = HtmlElementRenderUtils.renderText(data, 'span', 'source-name text-truncate');
          return HtmlElementRenderUtils.renderAction([imgElement, dataElement], 8, 'source-name-container');
        })
      },
      {
        key: 'creatorId',
        label: 'Owner',
        customRenderBodyCell: new UserAvatarCell('creator.avatar', ['creator.fullName', 'creator.lastName', 'creator.email', 'creator.username']),
        width: 200
      },
      {
        key: 'dataSourceType',
        label: 'Type',
        customRenderBodyCell: new CustomCell(rowData => {
          const sourceType = DataSourceResponse.fromObject(rowData).dataSource.sourceType;
          return HtmlElementRenderUtils.renderText(sourceType, 'span', 'text-truncate');
        }),
        width: 180
      },
      {
        key: 'lastModified',
        label: 'Last Modified',
        customRenderBodyCell: new CustomCell(rowData => {
          const lastModify = DataSourceResponse.fromObject(rowData).dataSource.lastModify;
          const data = lastModify !== 0 ? DateTimeFormatter.formatAsMMMDDYYYHHmmss(lastModify) : '--';
          return HtmlElementRenderUtils.renderText(data, 'span', 'text-truncate');
        }),
        width: 180
      },
      {
        key: 'action',
        label: 'Action',
        width: 120,
        disableSort: true
      }
    ];
  }

  @Action
  loadDataSources(payload: { from: number; size: number; keyword?: string; sorts?: SortRequest[] }): Promise<DataSourceResponse[]> {
    const { from, size, keyword, sorts } = payload;
    return this.dataSourceService
      .list(new ListingRequest(keyword, from, size, sorts))
      .then(response => {
        // Log.debug('LoadDataSource::', response);
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
  testDataSourceConnection(request: DataSourceInfo): Promise<boolean> {
    return this.dataSourceService.testConnection(request);
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
}

export const DataSourceModule: DataSourceStore = getModule(DataSourceStore);
