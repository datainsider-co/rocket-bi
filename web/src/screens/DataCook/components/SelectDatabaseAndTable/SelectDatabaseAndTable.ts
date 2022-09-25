import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { DatabaseSchemaModule } from '@/store/modules/data_builder/DatabaseSchemaStore';
import { CreateTableRequest, DatabaseCreateRequest, DatabaseSchema, TableSchema } from '@core/domain';
import { StringUtils } from '@/utils/string.utils';
import { SchemaService } from '@core/schema/service/SchemaService';
import { Inject as InjectService } from 'typescript-ioc';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import { Log } from '@core/utils';
import DiDropdown from '@/shared/components/Common/DiDropdown/DiDropdown.vue';
import { cloneDeep } from 'lodash';

type TModel = {
  database: {
    loading: boolean;
    selected: string | null;
    model: DatabaseSchema | null;
    createNew: boolean;
    createNewModel: string;
    error: string;
  };
  table: {
    selected: string | null;
    model: TableSchema | null;
    createNew: boolean;
    createNewModel: string;
    error: string;
  };
};

@Component({
  components: {
    DiDropdown
  }
})
export default class SelectDatabaseAndTable extends Vue {
  private loading = false;
  private error = '';

  model: TModel = {
    database: {
      loading: false,
      selected: null,
      model: null as DatabaseSchema | null,
      createNew: false,
      createNewModel: '',
      error: ''
    },
    table: {
      selected: null,
      model: null as TableSchema | null,
      createNew: false,
      createNewModel: '',
      error: ''
    }
  };

  @Prop({ type: String, default: '' })
  private readonly databaseName!: string;

  @Prop({ type: Boolean })
  private readonly disabled!: string;

  @Prop({ type: String, default: '' })
  private readonly tableName!: string;

  @Prop({ type: Boolean, default: false })
  private readonly disableCreateTable!: boolean;

  @InjectService
  private readonly schemaService!: SchemaService;

  @Ref('newTable')
  private readonly newTableEl!: HTMLInputElement;

  @Ref('newDatabase')
  private readonly newDatabaseEl!: HTMLInputElement;

  async mounted() {
    await this.loadData();
  }

  async loadData() {
    Log.debug('SelectDatabaseAndTable::mounted::this.databaseName', this.databaseName, this.tableName);
    if (DatabaseSchemaModule.databaseInfos.length <= 0) {
      this.loading = true;
      await DatabaseSchemaModule.loadAllDatabaseInfos();
    }
    if (DatabaseSchemaModule.databaseSchemas.length < DatabaseSchemaModule.databaseInfos.length) {
      this.loading = true;
      await DatabaseSchemaModule.loadAllDatabaseSchemas();
    }
    this.loading = false;
    const foundDb = this.databaseName ? DatabaseSchemaModule.databaseSchemas.find(db => db.name === this.databaseName) : undefined;
    if (foundDb) {
      this.selectDatabase(foundDb);
      const foundTbl = this.tableName ? foundDb.tables.find(tbl => tbl.name === this.tableName) : undefined;
      if (foundTbl) {
        this.selectTable(foundTbl);
      } else {
        this.model.table.createNew = true;
        this.model.table.createNewModel = this.tableName;
      }
    }
  }

  async getData(tableSchema: TableSchema): Promise<TableSchema | null> {
    await this.getTargetDatabase();
    return await this.getTargetTable(tableSchema);
  }

  async getDatabaseAndTable(): Promise<{ database: DatabaseSchema | null; table: TableSchema | null }> {
    const db = await this.getTargetDatabase();
    let table = null;
    if (!this.model.table.createNewModel) {
      // @ts-ignore
      table = await this.getTargetTable(null);
    }
    return {
      database: db,
      table: table
    };
  }

  private get databaseSchemas(): DatabaseSchema[] {
    return DatabaseSchemaModule.databaseSchemas ?? [];
  }

  private get tableSchemas(): TableSchema[] {
    if (this.model.database.model) {
      return this.model.database.model.tables;
    }
    return [];
  }

  private get databasePlaceholder() {
    if (this.loading) return 'Loading database...';
    if (this.model.database.createNew) return 'Create new database';
    return 'Select database...';
  }

  private get tablePlaceholder() {
    if (this.loading) return 'Loading table...';
    else if (this.model.table.createNew) return 'Create new table';
    return 'Select table...';
  }

  @Track(TrackEvents.SelectDatabase, { database_name: (_: SelectDatabaseAndTable, args: any) => args[0].name })
  selectDatabase(database: DatabaseSchema) {
    if (this.model.database.model === database && !this.model.database.createNew) return;
    this.model.database.selected = database.name;
    this.model.database.model = database;
    this.model.database.createNew = false;
    if (this.model.table.model) {
      this.model.table.createNew = false;
    }
    this.model.table.model = null;
    // if (database && database.name) {
    //   await this.getDatabaseDetail(db.name);
    //   this.table.items = this.database.mapDetail[db.name].tables;
    // } else {
    //   this.table.items = [];
    // }
    this.model.database.error = '';
  }

  private async getTargetTable(tableSchema: TableSchema): Promise<TableSchema | null> {
    if (!this.model.database.model) {
      this.model.table.error = 'Please select database first.';
      return null;
    }

    if (this.model.table.createNew && this.model.table.createNewModel.length <= 0) {
      this.model.table.error = 'Please input table name.';
      this.newTableEl.focus();
      return null;
    }

    const tableName = this.makeNameFromDisplayName(this.model.table.createNewModel);
    if (StringUtils.isNumberFirst(tableName)) {
      this.model.table.error = "Table name can't start with a digit";
      this.newTableEl.focus();
      return null;
    }

    if (this.model.database.model && this.model.table.createNew) {
      this.model.table.error = '';
      const tableName = this.makeNameFromDisplayName(this.model.table.createNewModel);
      const isDuplicated = this.tableSchemas.find(table => table.name === tableName);
      if (isDuplicated) {
        this.model.table.error = 'Already exists table name. Please choose another!';
        this.newTableEl.focus();
        return null;
      }

      // const req = new CreateTableRequest(this.model.database.model.name, tableName, tableSchema.columns, tableSchema.primaryKeys, tableSchema.orderBys);
      // const resp = await this.schemaService.createTable(req).catch(e => {
      //   this.model.table.error = 'Create table fail. ${e.message}';
      //   return null;
      // });
      //
      // if (resp) {
      //   const updatedDB = await DatabaseSchemaModule.selectDatabase(resp.dbName);
      //   this.selectDatabase(updatedDB);
      //   this.selectTable(resp);
      // }
      //
      // return resp;
      const table: TableSchema = cloneDeep(tableSchema);
      table.dbName = this.model.database.model.name;
      table.name = tableName;
      return table;
    }

    if (this.model.table.model) {
      this.model.table.error = '';
      return this.model.table.model;
    }

    this.model.table.error = 'Please select table.';
    return null;
  }

  private selectNewDatabaseOption(callback?: Function) {
    this.model.database.createNew = true;
    this.model.database.error = '';
    this.model.database.selected = null;
    this.model.database.model = null;
    this.model.table.model = null;
    this.model.table.createNew = true;
    this.model.table.error = '';
    callback ? callback() : null;
    this.$nextTick(() => {
      if (this.newDatabaseEl) {
        this.newDatabaseEl.focus();
      }
    });
  }

  private resetDatabaseError() {
    this.model.database.error = '';
  }

  @Track(TrackEvents.SelectTable, {
    database_name: (_: SelectDatabaseAndTable, args: any) => args[0].dbName,
    table_name: (_: SelectDatabaseAndTable, args: any) => args[0].name
  })
  selectTable(table: TableSchema) {
    if (this.model.table.model === table && !this.model.table.createNew) return;
    this.model.table.model = table;
    this.model.table.selected = table.name;
    this.model.table.createNew = false;
    this.model.table.error = '';
  }

  private selectNewTableOption(callback?: Function) {
    this.model.table.createNew = true;
    this.model.table.error = '';
    this.model.table.selected = null;
    this.model.table.model = null;
    callback ? callback() : null;
    this.$nextTick(() => {
      if (this.newTableEl) {
        this.newTableEl.focus();
      }
    });
  }

  private resetTableError() {
    this.model.table.error = '';
  }

  private makeNameFromDisplayName(displayName = '') {
    return displayName.toLowerCase().replace(/[^(\d\w_)]/g, '_');
  }

  private async getTargetDatabase(): Promise<DatabaseSchema | null> {
    if (this.model.database.createNew && this.model.database.createNewModel.length <= 0) {
      this.model.database.error = 'Please input database name.';
      this.newDatabaseEl.focus();
      return null;
    }

    const databaseName = this.makeNameFromDisplayName(this.model.database.createNewModel);
    if (StringUtils.isNumberFirst(databaseName)) {
      this.model.database.error = "Database name can't start with a digit";
      this.newDatabaseEl.focus();
      return null;
    }

    if (this.model.database.createNew) {
      this.model.database.loading = true;
      const request = new DatabaseCreateRequest(this.makeNameFromDisplayName(this.model.database.createNewModel), this.model.database.createNewModel);
      const resp = await this.schemaService.createDatabase(request).catch(e => {
        this.model.database.error = `Create database fail. ${e.message}`;
        return null;
      });
      if (!resp) return null;

      this.model.database.error = '';
      const newDB = await DatabaseSchemaModule.selectDatabase(resp.name);
      this.selectDatabase(newDB);
      return newDB;
    }

    if (this.model.database.model) {
      this.model.database.error = '';
      return this.model.database.model;
    }

    this.model.database.error = 'Please select database.';
    return null;
  }

  @Watch('model', { deep: true })
  handleModelChange() {
    this.$emit('change', this.model);
  }
}
