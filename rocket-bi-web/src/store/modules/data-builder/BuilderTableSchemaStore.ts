/*
 * @author: tvc12 - Thien Vi
 * @created: 12/4/20, 6:05 PM
 */

import { DatabaseSchema, DynamicFunctionWidget, TabControl, TableSchema, TableType, TabControlData } from '@core/common/domain/model';
import { SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared/enums/Stores';
import { ListUtils, SchemaUtils } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { Log } from '@core/utils';
import { cloneDeep } from 'lodash';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';

@Module({ store: store, name: Stores.builderStore, dynamic: true, namespaced: true })
class BuilderTableSchemaStore extends VuexModule {
  tableSchemas: SlTreeNodeModel<TableSchema>[] = [];
  dbNameSelected = '';
  databaseSchema: DatabaseSchema | null = null;
  tabControls: SlTreeNodeModel<TabControlData>[] = [];

  get searchTablesAndColumns(): (keyword: string) => SlTreeNodeModel<TableSchema>[] {
    const numberOfTables = 20;
    return (keyword: string) => {
      const tableSchemas = cloneDeep(this.tableSchemas);
      const filteredTableSchemas: SlTreeNodeModel<TableSchema>[] = [];
      tableSchemas.forEach(tableSchema => {
        tableSchema.isExpanded = true;
        if (filteredTableSchemas.length <= numberOfTables) {
          if (StringUtils.isIncludes(keyword, tableSchema.title)) {
            filteredTableSchemas.push(tableSchema);
          } else {
            const columns: SlTreeNodeModel<TableSchema>[] = [];
            if (tableSchema.children) {
              tableSchema.children.forEach(column => {
                if (StringUtils.isIncludes(keyword, column.title)) {
                  columns.push(column);
                }
              });
            }
            if (columns.length > 0) {
              tableSchema.children = columns;
              filteredTableSchemas.push(tableSchema);
            }
          }
        }
      });
      return filteredTableSchemas;
    };
  }

  get searchTabControls(): (keyword: string) => SlTreeNodeModel<TabControlData>[] {
    return (keyword: string) => {
      return this.tabControls.filter(control => StringUtils.isIncludes(keyword, control.title));
    };
  }

  @Mutation
  reset() {
    this.dbNameSelected = '';
    this.tableSchemas = [];
    this.tabControls = [];
    this.databaseSchema = null;
  }

  @Mutation
  collapseAllTable(): void {
    this.tableSchemas.forEach(table => {
      table.isExpanded = false;
    });
  }

  @Mutation
  expandFirstTable(): void {
    const table = ListUtils.getHead(this.tableSchemas);
    if (table) {
      table.isExpanded = true;
    }
  }

  @Mutation
  expandTables(tableNames: string[]): void {
    const tableNamesAsSet = new Set(tableNames);
    this.tableSchemas
      .filter(schema => {
        const tableName = (schema.tag as TableSchema).name;
        return tableNamesAsSet.has(tableName);
      })
      .forEach(schema => (schema.isExpanded = true));
    Log.debug('DatabaseSchemaModule::expandTables::tables', this.tableSchemas);
  }

  @Action
  async selectDatabase(dbName: string): Promise<DatabaseSchema> {
    this.setDbNameSelected(dbName);
    const databaseSchema: DatabaseSchema = await DatabaseSchemaModule.handleGetDatabaseSchema(dbName);
    this.setDatabaseSchema(databaseSchema);
    this.expandFirstTable();
    return databaseSchema;
  }

  @Action
  loadTabControls(tabs: TabControl[]): void {
    this.setTabControls(tabs);
  }

  @Mutation
  setTabControls(tabs: TabControl[]): void {
    this.tabControls = SchemaUtils.buildTabControlNodes(tabs).sort((node, otherNode) => StringUtils.compare(node.title, otherNode.title));
  }

  @Mutation
  setDbNameSelected(dbName: string) {
    this.dbNameSelected = dbName;
  }

  @Mutation
  setDatabaseSchema(databaseSchema: DatabaseSchema) {
    this.tableSchemas = SchemaUtils.toTableSchemaNodes(databaseSchema);
    this.databaseSchema = databaseSchema;
  }

  @Mutation
  setTableSchema(tableSchema: TableSchema) {
    Log.debug('update: table::', tableSchema);
    if (this.databaseSchema && this.databaseSchema.name == tableSchema.dbName) {
      const index = this.databaseSchema.tables.findIndex(table => table.name === tableSchema.name) ?? -1;
      Log.debug('update: table::', index);

      if (index >= 0) {
        const databaseSchema = cloneDeep(this.databaseSchema);
        databaseSchema.tables.splice(index, 1, tableSchema);
        this.tableSchemas = SchemaUtils.toTableSchemaNodes(databaseSchema);
        this.databaseSchema = databaseSchema;
      }
    }
  }

  @Action
  handleSelectDefaultDatabase(): Promise<DatabaseSchema> | Promise<void> {
    if (ListUtils.isNotEmpty(DatabaseSchemaModule.databaseInfos)) {
      const dbName = DatabaseSchemaModule.databaseInfos[0].name;
      return this.selectDatabase(dbName);
    } else {
      return Promise.resolve();
    }
  }

  get getSqlQuery(): (viewName: string) => string | undefined {
    return (viewName: string) => {
      if (this.databaseSchema) {
        const tableSchema: TableSchema | undefined = this.databaseSchema.tables.find(table => table.isTableView() && table.name === viewName);
        return tableSchema?.query;
      } else {
        return void 0;
      }
    };
  }
}

export const _BuilderTableSchemaStore: BuilderTableSchemaStore = getModule(BuilderTableSchemaStore);
