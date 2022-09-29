/*
 * @author: tvc12 - Thien Vi
 * @created: 5/25/21, 4:57 PM
 */

import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { DIException } from '@core/common/domain/exception';
import { Inject } from 'typescript-ioc';
import { SchemaService } from '@core/schema/service/SchemaService';
import { DatabaseInfo, DatabaseSchema } from '@core/common/domain/model';
import { GroupedField, Stores } from '@/shared';
import { SchemaUtils } from '@/utils/SchemaUtils';

export interface MainDateFilterState {
  databasesResponse: DatabaseInfo[];
  databaseSchemasResponse: DatabaseSchema;
  listDateColumDatabase: GroupedField[];
  dateColumnDatabase: GroupedField;
}

@Module({ dynamic: true, namespaced: true, store: store, name: Stores.mainDateFilterStore })
export class MainDateFilterStore extends VuexModule {
  databasesResponse: MainDateFilterState['databasesResponse'] = [];
  databaseSchemasResponse: MainDateFilterState['databaseSchemasResponse'] | null = null;
  listDateColumDatabase: MainDateFilterState['listDateColumDatabase'] = [];
  dateColumnDatabase: MainDateFilterState['dateColumnDatabase'] | null = null;

  @Inject
  SchemaService!: SchemaService;

  @Action
  async getDatabaseSchemas(dbName: string): Promise<void> {
    return await this.SchemaService.getDatabaseSchema(dbName)
      .then(resp => {
        this.saveDatabaseSchemaResponese({ data: resp });
        // const listDateColumDatabase: GroupedField[] = [
        //   {
        //     groupTitle: 'xxxx',
        //     children: [...SchemaUtils.buildDateFieldsFromTableSchemas(resp.tables)]
        //   }
        // ];
        // this.saveListDateColumnDatabase({ data: listDateColumDatabase });
      })
      .catch(err => {
        DIException.fromObject(err);
      });
  }

  @Action
  async getDatabases(): Promise<void> {
    return await this.SchemaService.getDatabases()
      .then(resp => {
        this.saveDatabaseResponse({ data: resp });
      })
      .catch(err => {
        DIException.fromObject(err);
      });
  }

  @Action
  async getAllDateColumnDatabases(): Promise<void> {
    this.getDatabases().then(() => {
      this.databasesResponse.map(db => {
        this.getDatabaseSchemas(db.name).then(() => {
          const listDateColumDatabaseItem: GroupedField = {
            groupTitle: db.displayName,
            children: [...SchemaUtils.buildDateFieldsFromTableSchemas(this.databaseSchemasResponse?.tables || [])]
          };
          this.addNewDateColumnDatabase({ data: listDateColumDatabaseItem });
        });
      });
    });
  }

  @Mutation
  saveDatabaseResponse(payload: { data: DatabaseInfo[] }) {
    this.databasesResponse = payload.data;
    // Log.debug("main_date_filter::getDatabase:databaseResponse ", this.databasesResponse)
  }

  @Mutation
  saveDatabaseSchemaResponese(payload: { data: DatabaseSchema | null }) {
    this.databaseSchemasResponse = payload.data;
    // Log.debug("main_date_filter::getDatabaseSchema::databaseSchemaResponse ", this.databaseSchemasResponse)
  }

  @Mutation
  saveDateColumnDatabase(payload: { data: GroupedField }) {
    this.dateColumnDatabase = payload.data;
  }

  @Mutation
  saveListDateColumnDatabase(payload: { data: GroupedField[] }) {
    this.listDateColumDatabase = payload.data;
    // Log.debug("mainDateFilterStore::saveListDateColumnDatabase::listDateColumDatabase: ", this.listDateColumDatabase)
  }

  @Mutation
  addNewDateColumnDatabase(payload: { data: GroupedField }) {
    this.listDateColumDatabase.push(payload.data);
  }
}

export const MainDateFilterModule: MainDateFilterStore = getModule(MainDateFilterStore);
