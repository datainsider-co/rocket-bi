import { Log } from '@core/utils';
import UploadGoogleSheetStageMixin from '@/screens/data-ingestion/components/di-upload-google-sheet/mixins/UploadGoogleSheetStageMixin';
import { JobStatus } from '@core/data-ingestion';
import DiUploadGoogleSheetActions from '@/screens/data-ingestion/components/di-upload-google-sheet/actions';
import { JobModule } from '../../../../store/JobStore';
import { required } from 'vuelidate/lib/validators';
import { Routers } from '../../../../../../shared';
import SchemaService from '../../../di-upload-document/services/SchemaService';
import { Database } from '../../../di-upload-document/entities/DocumentSchema';
import { GoogleSheetJob } from '../../../../../../../di-core/data-ingestion/domain/job/GoogleSheetJob';
import SchedulerSettingV2 from '../../../job-scheduler-form/SchedulerSettingV2.vue';
import { DataDestination } from '../../../../../../../di-core/data-ingestion';
import { SchedulerOnce } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerOnce';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';

export default {
  name: 'GoogleSheetForm',
  mixins: [UploadGoogleSheetStageMixin],
  components: { JobSchedulerForm: SchedulerSettingV2 },
  data() {
    return {
      displayName: '',
      syncInterval: 60,
      scheduleTime: new SchedulerOnce(Date.now()),
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
  validations: {
    displayName: {
      required
    },
    syncInterval: {
      required
    }
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
    onChangeTimeScheduler(scheduleTime) {
      this.scheduleTime = scheduleTime;
    },
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
      TrackingUtils.track(TrackEvents.SelectTable, { database_name: table.name });
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

      if (this.table.createNew) {
        this.table.error = '';
        const tableName = this.makeNameFromDisplayName(this.table.createNewModel);
        const isDuplicated = this.table.items.find(table => table.name === tableName);
        if (isDuplicated) {
          this.table.error = 'Already exists table name. Please choose another!';
          this.$refs.newTable.focus();
          return null;
        }
        this.table.error = '';
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
    async submit() {
      try {
        const database = await this.getTargetDatabase();
        const table = this.getTargetTable();
        if (this.validForm() && database && table) {
          this.value.schema.dbName = database.name;
          this.value.schema.name = table.name;
          this.value.schema.display_name = table.display_name;
          const job = new GoogleSheetJob(
            -1,
            '-1',
            this.displayName,
            database.name,
            table.name,
            [DataDestination.Clickhouse],
            0,
            this.syncInterval,
            TimeScheduler.toSchedulerV2(this.scheduleTime),
            0,
            JobStatus.Initialized,
            JobStatus.Initialized,

            this.value.spreadsheetId,
            this.value.sheetId,
            this.value.schema,
            this.value.setting.include_header,
            this.value.accessToken,
            this.value.refreshToken
          );
          const jobInfo = await JobModule.create(job);
          DiUploadGoogleSheetActions.hideUploadGoogleSheet();
          await this.$router.push({ name: Routers.Job });
          TrackingUtils.track(TrackEvents.CreateGoogleSheetJob, {
            job_name: job.displayName,
            job_type: job.jobType,
            job_id: job.jobId
          });
        }
      } catch (e) {
        Log.error('DiUploadGoogleSheet::submit::error::', e.message);
        this.error = e.message;
      }
    },
    validForm() {
      this.$v.$touch();
      if (this.$v.$invalid) {
        return false;
      }
      return true;
    },
    resetDisplayNameError() {
      if (this.$v.displayName.$error) {
        this.$v.displayName.$reset();
      }
    },
    resetDestDatabaseError() {
      if (this.$v.destDatabase.$error) {
        this.$v.destDatabase.$reset();
      }
    },
    resetDestTableError() {
      if (this.$v.destTable.$error) {
        this.$v.destTable.$reset();
      }
    },
    resetSyncIntervalError() {
      if (this.$v.syncInterval.$error) {
        this.$v.syncInterval.$reset();
      }
    }
  }
};
