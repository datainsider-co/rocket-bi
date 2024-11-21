import SchemaService from '../../services/SchemaService';
import UploadDocumentService from '../../services/UploadDocumentService';
import UploadDocumentStageMixin from '../../mixins/UploadDocumentStage';
import { Database } from '../../entities/DocumentSchema';
import { Log } from '@core/utils';
import { StringUtils } from '@/utils/StringUtils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

export default {
  name: 'DescribeDatabase',
  mixins: [UploadDocumentStageMixin],
  data() {
    return {
      database: {
        loading: false,
        items: [],
        selected: null,
        model: null,
        mapDetail: {},
        createNew: false,
        createNewModel: '',
        error: ''
      },
      table: {
        items: [],
        selected: null,
        model: null,
        createNew: false,
        createNewModel: '',
        error: ''
      }
    };
  },
  computed: {
    databasePlaceholder() {
      if (this.database.createNew) return 'Create new database';
      return 'Select database...';
    },
    tablePlaceholder() {
      if (this.table.createNew) return 'Create new table';
      return 'Select table...';
    },
    tables() {
      Log.debug(this.database.model);
      if (this.database.model) {
        Log.debug(this.database.mapDetail[this.database.model.name]);
      }
      if (!this.database.model || !this.database.mapDetail[this.database.model.name]) return [];
      Log.debug(this.database.mapDetail[this.database.model.name]);
      return this.database.mapDetail[this.database.model.name].tables;
    }
  },
  mounted() {
    this.getListDatabase();
  },
  methods: {
    selectNewDatabaseOption(callback) {
      this.database.createNew = true;
      this.database.error = '';
      this.database.selected = null;
      this.database.model = null;
      this.table.items = [];
      this.table.model = null;
      this.table.createNew = true;
      this.table.error = '';
      callback ? callback() : null;
      this.$nextTick(() => {
        this.$refs.newDatabase.focus();
      });
    },
    selectNewTableOption(callback) {
      this.table.createNew = true;
      this.table.error = '';
      this.table.selected = null;
      this.table.model = null;
      callback ? callback() : null;
      this.$nextTick(() => {
        this.$refs.newTable.focus();
      });
    },
    async selectDatabase(db) {
      if (this.database.model === db && !this.database.createNew) return;
      this.database.model = db;
      this.database.createNew = false;
      this.table.model = null;
      if (db && db.name) {
        await this.getDatabaseDetail(db.name);
        this.table.items = this.database.mapDetail[db.name].tables;
      } else {
        this.table.items = [];
      }
      this.database.error = '';
      TrackingUtils.track(TrackEvents.SelectDatabase, { database_name: db.name });
    },
    selectTable(table) {
      if (this.table.model === table && !this.table.createNew) return;
      this.table.model = table;
      this.table.createNew = false;
      this.table.error = '';
      TrackingUtils.track(TrackEvents.SelectTable, { table_name: table.name });
    },
    async getListDatabase() {
      this.database.loading = true;
      const resp = await SchemaService.getListDatabase();
      this.database.items = resp.data.sort((a, b) => a.display_name.localeCompare(b.display_name));
      this.database.loading = false;
    },
    async getDatabaseDetail(databaseName) {
      this.table.se = [];
      this.table.items = [];
      if (!this.database.mapDetail[databaseName]) {
        const resp = await SchemaService.getDatabaseDetail(databaseName);
        this.database.mapDetail[databaseName] = resp.data;
        this.database.mapDetail[databaseName].tablePositions = this.database.mapDetail[databaseName].tables.sort((a, b) => a.name.localeCompare(b.name));
      }
    },
    makeNameFromDisplayName(displayName = '') {
      return displayName.toLowerCase().replace(/[^(\d\w_)]/g, '_');
    },
    async getTargetDatabase() {
      if (this.database.createNew && this.database.createNewModel.length <= 0) {
        this.database.error = 'Please input database name.';
        this.$refs.newDatabase.focus();
        return null;
      }

      const databaseName = this.makeNameFromDisplayName(this.database.createNewModel);
      if (StringUtils.isNumberFirst(databaseName)) {
        this.database.error = "Database name can't start with a digit";
        this.$refs.newDatabase.focus();
        return null;
      }

      if (this.database.createNew) {
        this.database.loading = true;
        this.loading = true;
        const newDB = new Database({
          name: this.makeNameFromDisplayName(this.database.createNewModel),
          display_name: this.database.createNewModel
        });
        const resp = await SchemaService.createDatabase(newDB.serialize);
        this.database.loading = false;
        this.loading = false;
        if (resp.error) {
          this.database.error = `Create database fail. ${resp.message}`;
          this.$refs.newDatabase.focus();
          return null;
        }

        this.database.error = '';
        this.database.items.push(resp.data);
        this.database.selected = resp.data.name;
        this.selectDatabase(resp.data);
        return { name: resp.data.name };
      }

      if (this.database.model) {
        this.database.error = '';
        return this.database.model;
      }

      this.database.error = 'Please select database.';
      return null;
    },
    getTargetTable() {
      if (this.table.createNew && this.table.createNewModel.length <= 0) {
        this.table.error = 'Please input table name.';
        this.$refs.newTable.focus();
        return null;
      }

      const tableName = this.makeNameFromDisplayName(this.table.createNewModel);
      if (StringUtils.isNumberFirst(tableName)) {
        this.table.error = "Table name can't start with a digit";
        this.$refs.newTable.focus();
        return null;
      }

      if (this.table.createNew) {
        this.table.error = '';
        const tableName = this.makeNameFromDisplayName(this.table.createNewModel);
        const isDuplicated = this.table.items.find(table => table.name === tableName);
        if (isDuplicated) {
          this.table.error = 'Already exists table name. Please choose another!';
          this.$refs.newTable.focus();
          return null;
        }

        return {
          display_name: this.table.createNewModel,
          name: tableName
        };
      }

      if (this.table.model && !this.isMatchingSchema(this.table.model)) {
        this.table.error = 'Your selected table has not matched with your file. <br>Please choose the corrected table or create a new table!';
        return null;
      }

      if (this.table.model) {
        this.table.error = '';
        return this.table.model;
      }

      this.table.error = 'Please select table.';
      return null;
    },
    resetDatabaseError() {
      this.database.error = '';
    },
    resetTableError() {
      this.table.error = '';
    },
    isMatchingSchema(tableInfo) {
      if (!tableInfo) return false;
      const tableColumns = tableInfo.columns.map(column => ({ name: column.name, class_name: column.class_name }));
      const schemaColumns = this.value.schema.columns.map(column => ({ name: column.name, class_name: column.class_name }));
      return JSON.stringify(tableColumns) === JSON.stringify(schemaColumns);
    },
    async register() {
      const database = await this.getTargetDatabase();
      const table = this.getTargetTable();
      if (!database || !table) {
        return;
      }
      this.loading = true;
      this.value.schema.db_name = database.name;
      this.value.schema.name = table.name;
      this.value.schema.display_name = table.display_name;
      const resp = await UploadDocumentService.register({
        file_name: this.value.files[0].name,
        batch_size: this.value.chunkContainer.total,
        schema: this.value.schema.serialize,
        csv_setting: this.value.setting.serialize
      });
      if (resp.error) {
        this.error = `Register document fail. ${resp.message}`;
      } else {
        this.error = '';
        this.value.registerInfo = resp.data;
        this.value.next();
      }
      this.loading = false;
      TrackingUtils.track(TrackEvents.CSVSubmitSync, {});
    }
  },
  watch: {
    // 'database.selected'(value, oldValue) {
    //   Log.debug('database.selected', value, oldValue);
    //   this.selectDatabase(this.database.items.find(item => item.name === value));
    // }
  }
};
