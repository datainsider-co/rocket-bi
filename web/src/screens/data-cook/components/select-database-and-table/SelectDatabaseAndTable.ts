import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { DatabaseCreateRequest, DatabaseInfo, TableSchema } from '@core/common/domain';
import { StringUtils } from '@/utils/StringUtils';
import { SchemaService } from '@core/schema/service/SchemaService';
import { Inject as InjectService } from 'typescript-ioc';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import { Log } from '@core/utils';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';

type TModel = {
  database: {
    loading: boolean;
    selected: string | null;
    model: DatabaseInfo | null;
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
      model: null as DatabaseInfo | null,
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
    try {
      this.loading = true;
      await DatabaseSchemaModule.loadShortDatabaseInfos(false);
      const databaseInfo: DatabaseInfo | undefined = await this.findDatabase(this.databaseName);
      if (databaseInfo) {
        this.selectDatabase(databaseInfo);
        const tableSchema = this.tableName ? databaseInfo.findTable(this.tableName) : void 0;
        if (tableSchema) {
          this.selectTable(tableSchema);
        } else {
          this.model.table.createNew = true;
          this.model.table.createNewModel = this.tableName;
        }
      }
    } finally {
      this.loading = false;
    }
  }

  private async findDatabase(dbName: string): Promise<DatabaseInfo | undefined> {
    try {
      if (dbName) {
        return DatabaseSchemaModule.loadDatabaseInfo({ dbName });
      } else {
        return void 0;
      }
    } catch (ex) {
      Log.debug('findDatabase', ex);
      return void 0;
    }
  }

  async getData(): Promise<TableSchema | null> {
    await this.getTargetDatabase();
    return await this.getTargetTable();
  }

  private get databaseSchemas(): DatabaseInfo[] {
    return DatabaseSchemaModule.databaseInfos ?? [];
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

  private async handleOnDatabaseSelected(database: DatabaseInfo) {
    try {
      this.loading = false;
      const newDatabaseInfo: DatabaseInfo | undefined = await this.findDatabase(database.name);
      if (newDatabaseInfo) {
        this.selectDatabase(newDatabaseInfo);
      } else {
        this.model.database.createNew = true;
        this.model.database.createNewModel = database.name;
      }
    } catch (ex) {
      Log.debug('handleOnDatabaseSelected', ex);
    } finally {
      this.loading = false;
    }
  }

  @Track(TrackEvents.SelectDatabase, { database_name: (_: SelectDatabaseAndTable, args: any) => args[0].name })
  selectDatabase(database: DatabaseInfo) {
    if (this.model.database.model === database && !this.model.database.createNew) return;
    this.model.database.selected = database.name;
    this.model.database.model = database;
    this.model.database.createNew = false;
    if (this.model.table.model) {
      this.model.table.createNew = false;
    }
    this.model.table.model = null;
    this.model.database.error = '';
  }

  private async getTargetTable(): Promise<TableSchema | null> {
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

      const table: TableSchema = TableSchema.empty();
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

  private async getTargetDatabase(): Promise<DatabaseInfo | null> {
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
      const newDatabase = await DatabaseSchemaModule.reload(resp.name);
      this.selectDatabase(newDatabase);
      return newDatabase;
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
