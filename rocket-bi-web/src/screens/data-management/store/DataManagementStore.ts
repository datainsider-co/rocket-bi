import { Action, getModule, Module, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import {
  ChartInfo,
  CreateTableRequest,
  DatabaseCreateRequest,
  DatabaseInfo,
  DatabaseSchema,
  DIException,
  QuerySetting,
  RawQuerySetting,
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
import { UpdateDatabaseSchema } from '@core/schema/domain/UpdateDatabaseSchema';
import { UpdateTableSchemaRequest } from '@core/schema/domain/UpdateTableSchema';

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.dataManagementStore })
class DataManagementStore extends VuexModule {
  private static DEFAULT_TABLE_ID = -2;

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
  selectDatabase(dbName: string) {
    DatabaseSchemaModule.selectDatabase(dbName);
  }

  @Action
  createDatabase(displayName: string): Promise<DatabaseInfo> {
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
  searchAndSelectDatabase(dbName: string) {
    DatabaseSchemaModule.loadAllDatabaseInfos().then(() => {
      DatabaseSchemaModule.selectDatabase(dbName);
    });
  }

  @Action
  async updateTableName(payload: { newName: string; dbSchema: DatabaseSchema; table: TableSchema }) {
    const { dbSchema, newName, table } = payload;
    const dbName: string = dbSchema.name;
    const oldTbName: string = table.name;
    const normalizedNewName: string = StringUtils.normalizeTableName(newName);
    const success = await this.schemaService.updateTableName(dbName, oldTbName, normalizedNewName);
    if (success) {
      return this.schemaService.getDatabaseSchema(dbName);
    } else {
      throw new DIException(`Rename table ${oldTbName} failed!`);
    }
  }

  @Action
  async updateDatabaseDisplayName(payload: { newDisplayName: string; dbSchema: DatabaseSchema }) {
    const { dbSchema, newDisplayName } = payload;
    const request = new UpdateDatabaseSchema(dbSchema).withDbName(newDisplayName);
    return this.schemaService.updateDatabase(request);
  }

  @Action
  async updateTableInfo(payload: { table: TableSchema }) {
    const { table } = payload;
    const request: UpdateTableSchemaRequest = {
      tableSchema: table
    };
    return this.schemaService.updateTable(request);
  }
}

export const DataManagementModule: DataManagementStore = getModule(DataManagementStore);
