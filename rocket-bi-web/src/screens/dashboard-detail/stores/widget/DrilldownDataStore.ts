/*
 * @author: tvc12 - Thien Vi
 * @created: 3/30/21, 1:40 PM
 */

import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { GroupedField, Stores } from '@/shared';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { AbstractTableResponse } from '@core/common/domain/response/query/AbstractTableResponse';
import {
  DatabaseSchema,
  DrilldownData,
  Equal,
  Field,
  FieldRelatedFunction,
  InlineSqlView,
  TableQueryChartSetting,
  TableSchema,
  WidgetId
} from '@core/common/domain/model';
import { QueryService } from '@core/common/services';
import { Inject } from 'typescript-ioc';
import { CompareRequest, FilterRequest, QueryRequest } from '@core/common/domain/request';
import { DIException } from '@core/common/domain/exception';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { SchemaUtils } from '@/utils';
import { GroupFieldBuilder } from '@core/schema/service/GroupFieldBuilder';
import { DateFieldFilter, TextFieldFilter } from '@core/schema/service/FieldFilter';
import { Drilldownable } from '@core/common/domain/model/query/features/Drilldownable';
import { ConditionUtils, Log } from '@core/utils';
import { StringUtils } from '@/utils/StringUtils';
import { SchemaService } from '@core/schema/service/SchemaService';
import { DashboardModule } from '@/screens/dashboard-detail/stores';

@Module({ store: store, name: Stores.drilldownStore, dynamic: true })
class DrilldownDataStore extends VuexModule {
  // path current drilldown
  private idAndDrilldownPaths: Map<WidgetId, DrilldownData[]> = new Map<WidgetId, DrilldownData[]>();

  // map id and stack query setting, query setting related with path.
  // index of path same index of setting
  private idAndQuerySettings: Map<WidgetId, QuerySetting[]> = new Map<WidgetId, QuerySetting[]>();

  private databaseAsMap: Map<string, DatabaseSchema> = new Map<string, DatabaseSchema>();

  @Inject
  private queryService!: QueryService;

  @Inject
  private schemaService!: SchemaService;

  get drilldownPaths(): (id: WidgetId) => DrilldownData[] {
    return (id: WidgetId) => {
      return this.idAndDrilldownPaths.get(id) ?? [];
    };
  }

  get getQuerySetting(): (id: WidgetId, index: number) => QuerySetting | undefined {
    return (id: WidgetId, index: number) => {
      const queries = this.idAndQuerySettings.get(id) ?? [];
      return queries[index] ?? void 0;
    };
  }

  get hasDrilldown(): (id: WidgetId) => boolean {
    return id => {
      const queries = this.idAndQuerySettings.get(id) ?? [];
      return queries.length > 0;
    };
  }

  get getQuerySettings(): (id: WidgetId) => QuerySetting[] {
    return id => {
      return this.idAndQuerySettings.get(id) ?? [];
    };
  }

  @Mutation
  reset() {
    this.idAndDrilldownPaths = new Map<WidgetId, DrilldownData[]>();
    this.idAndQuerySettings = new Map<WidgetId, QuerySetting[]>();
    this.databaseAsMap = new Map<string, DatabaseSchema>();
  }

  @Action
  loadDrilldownValues(payload: {
    query: QuerySetting;
    filterRequests?: FilterRequest[];
    compareRequest?: CompareRequest;
    from?: number;
    size?: number;
  }): Promise<AbstractTableResponse> {
    if (Drilldownable.isDrilldownable(payload.query)) {
      const { query, filterRequests, compareRequest, from, size } = payload;
      const tableSetting: TableQueryChartSetting = new TableQueryChartSetting(
        [query.getColumnWillDrilldown()],
        query.filters,
        query.sorts,
        {},
        [],
        query.sqlViews
      );
      const queryRequest: QueryRequest = new QueryRequest(tableSetting, filterRequests, compareRequest, from ?? -1, size ?? -1);
      queryRequest.dashboardId = DashboardModule.id;
      return this.queryService.query(queryRequest).then(data => data as AbstractTableResponse);
    } else {
      return Promise.reject(new DIException(`Unsupported ${payload.query.className}`));
    }
  }

  @Action
  async loadGroupedFieldsWillDrilldown(query: QuerySetting): Promise<GroupedField[]> {
    if (Drilldownable.isDrilldownable(query)) {
      const fieldDetailInfos: FieldDetailInfo[] = await this.loadFieldDetails({
        field: query.getColumnWillDrilldown().function.field,
        sqlViews: query.sqlViews
      });
      const drilledFields: Field[] = await this.getDrilledFields(query);
      const fieldsWillDrilldown: FieldDetailInfo[] = await this.removeDrilledFields({
        drilledFields: drilledFields,
        allFields: fieldDetailInfos
      });
      return new GroupFieldBuilder(fieldsWillDrilldown)
        .addFilter(new TextFieldFilter())
        .addFilter(new DateFieldFilter())
        .build();
    } else {
      return Promise.reject(new DIException(`Unsupported ${query.className}`));
    }
  }

  @Action
  async loadFieldDetails(payload: { field: Field; sqlViews: InlineSqlView[] }): Promise<FieldDetailInfo[]> {
    const field: Field = Field.fromObject(payload.field);
    let dbSchema: DatabaseSchema;
    if (StringUtils.isNotEmpty(field.dbName)) {
      dbSchema = await this.getDatabaseSchema(field.dbName);
    } else {
      dbSchema = await this.getAdhocDatabaseSchema(payload.sqlViews);
    }

    const table: TableSchema | undefined = dbSchema.tables.find(table => table.name === field.tblName);
    if (table) {
      return SchemaUtils.buildFieldsFromTableSchemas([table]);
    } else {
      return [];
    }
  }

  @Action
  private async getAdhocDatabaseSchema(sqlViews: InlineSqlView[]): Promise<DatabaseSchema> {
    const listTables: TableSchema[] = await Promise.all(sqlViews.map(sqlView => this.schemaService.detectTableSchema(sqlView.query.query)));
    return new DatabaseSchema('', -1, 'Ahoc table', listTables);
  }

  @Action
  async getDatabaseSchema(dbName: string): Promise<DatabaseSchema> {
    Log.debug('getDatabaseSchema::', dbName);
    if (this.databaseAsMap.has(dbName)) {
      return this.databaseAsMap.get(dbName)!;
    } else {
      const dbSchema: DatabaseSchema = await DatabaseSchemaModule.handleGetDatabaseSchema(dbName);
      this.databaseAsMap.set(dbName, dbSchema);
      return dbSchema;
    }
  }

  @Action
  async drilldown(payload: { toField: FieldRelatedFunction; id: WidgetId; value: string }): Promise<void> {
    const { toField, id, value } = payload;
  }

  @Mutation
  updatePaths(payload: { paths: DrilldownData[]; id: number }) {
    this.idAndDrilldownPaths.set(payload.id, payload.paths);
  }

  @Mutation
  sliceQueries(payload: { id: number; from: number; to: number }) {
    const { id, from, to } = payload;
    const queries: QuerySetting[] = this.idAndQuerySettings.get(id) ?? [];
    const newQueries: QuerySetting[] = queries.slice(from, to);
    this.idAndQuerySettings.set(id, newQueries);
  }

  @Action
  saveDrilldownData(payload: { query: QuerySetting; id: number; newPath: DrilldownData }) {
    this.addPath(payload);
    this.addQuery(payload);
  }

  @Mutation
  addQuery(payload: { query: QuerySetting; id: number }) {
    const { id, query } = payload;
    const querySettings: QuerySetting[] = this.idAndQuerySettings.get(id) ?? [];
    querySettings.push(query);
    this.idAndQuerySettings.set(id, querySettings);
  }

  @Mutation
  addPath(payload: { id: number; newPath: DrilldownData }) {
    const { id, newPath } = payload;
    const paths: DrilldownData[] = this.idAndDrilldownPaths.get(id) ?? [];
    paths.push(newPath);
    this.idAndDrilldownPaths.set(id, paths);
  }

  @Action
  resetDrilldown(widgetId: WidgetId) {
    this.idAndDrilldownPaths.set(widgetId, []);
    this.idAndQuerySettings.set(widgetId, []);
  }

  @Action
  private async getDrilledFields(query: QuerySetting & Drilldownable): Promise<Field[]> {
    const drilledFields: Field[] = ConditionUtils.getAllFieldRelatedConditions(query.filters)
      .filter(filter => filter instanceof Equal)
      .map(filter => Field.fromObject(filter.field));
    drilledFields.push(Field.fromObject(query.getColumnWillDrilldown().function.field));
    return drilledFields;
  }

  @Action
  private async removeDrilledFields(payload: { allFields: FieldDetailInfo[]; drilledFields: Field[] }): Promise<FieldDetailInfo[]> {
    const { drilledFields, allFields } = payload;

    const fieldsNotDrilled: FieldDetailInfo[] = allFields.filter((fieldDetailInfo: FieldDetailInfo) => {
      return !drilledFields.some(fieldDrilled => fieldDrilled.equals(fieldDetailInfo.field));
    });

    return fieldsNotDrilled;
  }
}

export const DrilldownDataStoreModule: DrilldownDataStore = getModule(DrilldownDataStore);
