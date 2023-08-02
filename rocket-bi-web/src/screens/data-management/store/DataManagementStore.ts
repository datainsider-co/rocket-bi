import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Routers, Stores } from '@/shared';
import {
  ChartInfo,
  CreateTableRequest,
  DatabaseCreateRequest,
  DatabaseInfo,
  DIException,
  ListingResponse,
  QuerySetting,
  RawQuerySetting,
  ShortDatabaseInfo,
  TableChartOption,
  TableCreationFromQueryRequest,
  TableQueryChartSetting,
  TableSchema,
  TableType,
  WidgetCommonData
} from '@core/common/domain';
import { Log } from '@core/utils';
import { Inject } from 'typescript-ioc';
import { SchemaService } from '@core/schema/service/SchemaService';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { DashboardControllerModule, QuerySettingModule } from '@/screens/dashboard-detail/stores';
import { StringUtils } from '@/utils/StringUtils';
import { SchemaUtils } from '@/utils';
import { Pagination } from '@/shared/models';
import { ShortSchemaResponse } from '@core/data-warehouse/ShortSchemaResponse';
import { Vue } from 'vue-property-decorator';

interface DatabaseListingResponseMap {
  // Routers.AllDatabase | Routers.TrashDatabase is the key
  [key: string]: ListingResponse<ShortSchemaResponse>;
}

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.DataManagementStore })
class DataManagementStore extends VuexModule {
  private static DEFAULT_TABLE_ID = -2;

  //database listing data warehouse
  private databaseResponseMap: DatabaseListingResponseMap = {};

  get databaseListingResponse(): ListingResponse<ShortSchemaResponse> | null {
    return this.databaseResponseMap[Routers.AllDatabase] || null;
  }

  get trashDatabaseListingResponse(): ListingResponse<ShortSchemaResponse> | null {
    return this.databaseResponseMap[Routers.TrashDatabase] || null;
  }

  @Inject
  private readonly schemaService!: SchemaService;

  get tableChartInfo(): ChartInfo {
    const querySetting: QuerySetting = new TableQueryChartSetting(
      [],
      [],
      [],
      new TableChartOption({
        background: '#00000000'
      }),
      []
    );
    const commonSetting: WidgetCommonData = { id: DataManagementStore.DEFAULT_TABLE_ID, name: '', description: '' };
    return new ChartInfo(commonSetting, querySetting);
  }

  get databaseInfos(): DatabaseInfo[] {
    return DatabaseSchemaModule.databaseInfos || [];
  }

  @Action
  async handleQueryTableData(payload: { query: string; pagination?: Pagination }): Promise<void> {
    try {
      QuerySettingModule.setQuerySetting({ id: DataManagementStore.DEFAULT_TABLE_ID, query: new RawQuerySetting(payload.query) });
      await DashboardControllerModule.renderChart({ id: DataManagementStore.DEFAULT_TABLE_ID, forceFetch: true, pagination: payload.pagination });
    } catch (e) {
      Log.error('DataManagementStore::handleQueryTableData::error::', e.message);
    }
  }

  @Action
  async handleLoadTableData(tableSchema: TableSchema): Promise<void> {
    try {
      const query: QuerySetting = SchemaUtils.buildQuery(tableSchema);
      QuerySettingModule.setQuerySetting({ id: DataManagementStore.DEFAULT_TABLE_ID, query: query });
      await DashboardControllerModule.renderChart({ id: DataManagementStore.DEFAULT_TABLE_ID, forceFetch: true });
    } catch (e) {
      Log.error('DataManagementStore::handleQueryTableData::error::', e.message);
    }
  }

  @Action
  createTableFromQuery(payload: {
    dbName: string;
    tblDisplayName: string;
    tblName: string;
    query: string;
    isOverride: boolean;
    tableType: TableType;
  }): Promise<TableSchema> {
    const { dbName, tblDisplayName, tblName, query, isOverride, tableType } = payload;
    const request: TableCreationFromQueryRequest = new TableCreationFromQueryRequest(dbName, tblDisplayName, tblName, query, isOverride, tableType);
    return this.schemaService.createTableFromQuery(request);
  }

  @Action
  createDatabase(displayName: string): Promise<ShortDatabaseInfo> {
    // const dbName = IdGenerator.generateName(displayName);
    const dbName = StringUtils.toSnakeCase(displayName);
    const request: DatabaseCreateRequest = new DatabaseCreateRequest(dbName, displayName);
    return this.schemaService.createDatabase(request);
  }

  @Action
  createTable(table: TableSchema): Promise<TableSchema> {
    const request = CreateTableRequest.withTable(table);
    return this.schemaService.createTable(request);
  }

  @Action
  async loadDatabaseListing(payload: { from: number; size: number }): Promise<ListingResponse<ShortSchemaResponse>> {
    try {
      const response: ListingResponse<ShortSchemaResponse> = await this.schemaService.getListDatabase(payload.from, payload.size);
      this.saveDatabaseListingResponse({
        listingResponse: response,
        type: Routers.AllDatabase
      });
      return response;
    } catch (ex) {
      return Promise.reject(ex.message);
    }
  }

  @Action
  async loadListTrashDatabase(payload: { from: number; size: number }): Promise<ListingResponse<ShortSchemaResponse>> {
    try {
      const response: ListingResponse<ShortSchemaResponse> = await this.schemaService.getListTrashDatabase(payload.from, payload.size);
      this.saveDatabaseListingResponse({
        listingResponse: response,
        type: Routers.AllDatabase
      });
      return response;
    } catch (ex) {
      return Promise.reject(ex.message);
    }
  }

  @Mutation
  private saveDatabaseListingResponse(payload: {
    listingResponse: ListingResponse<ShortSchemaResponse>;
    type: Routers.AllDatabase | Routers.TrashDatabase;
  }): void {
    const response: ListingResponse<ShortSchemaResponse> = payload.listingResponse;
    response.data.sort((schemaA, schemaB) => StringUtils.compare(schemaA.database.displayName, schemaB.database.displayName));
    Vue.set(this.databaseResponseMap, payload.type, response);
  }

  @Mutation
  reset() {
    this.databaseResponseMap = {};
  }
}

export const DataManagementModule: DataManagementStore = getModule(DataManagementStore);
