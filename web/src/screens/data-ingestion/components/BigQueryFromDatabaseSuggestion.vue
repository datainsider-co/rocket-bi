<template>
  <div>
    <label class="mb-2">From database</label>
    <div class="dropdown-loading">
      <DropdownInput
        id="from-database-dropdown"
        ref="fromDatabaseDropdownInput"
        :loading="fromDatabaseLoading"
        :value="syncedBigQueryJob.datasetName"
        :data="fromDatabaseNames"
        dropdown-placeholder="Select database please..."
        extra-option-label="Or type your database name"
        input-placeholder="Please type your database name here"
        label-props="label"
        value-props="type"
        @change="handleDatabaseChange"
        :appendAtRoot="true"
      ></DropdownInput>
      <template v-if="$v.syncedBigQueryJob.datasetName.$error">
        <div class="error-message mt-1">Database name is required.</div>
      </template>
    </div>
    <label class="mb-0 mt-3">From table</label>
    <div class="dropdown-loading">
      <DropdownInput
        id="from-table-dropdown"
        ref="fromTableDropdownInput"
        class="mt-2"
        :value="syncedBigQueryJob.tableName"
        :data="fromTableNames"
        :loading="fromTableLoading"
        dropdown-placeholder="Select table please..."
        extra-option-label="Or type your table name"
        input-placeholder="Please type your table name here"
        label-props="label"
        value-props="type"
        :appendAtRoot="true"
        @change="handleTableChange"
      ></DropdownInput>
      <template v-if="$v.syncedBigQueryJob.tableName.$error">
        <div class="error-message mt-1">Table name is required.</div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import { BigQueryJob } from '@core/data-ingestion/domain/job/BigQueryJob';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { required } from 'vuelidate/lib/validators';
import DropdownInput from '@/screens/data-ingestion/DropdownInput.vue';
import { DataSourceInfo, JdbcJob, Job } from '@core/data-ingestion';
import { StringUtils } from '@/utils/StringUtils';

@Component({
  components: {
    DynamicSuggestionInput,
    DropdownInput
  },
  validations: {
    syncedBigQueryJob: {
      tableName: { required },
      datasetName: { required }
    }
  }
})
export default class BigQueryFromDatabaseSuggestion extends Vue {
  @PropSync('bigQueryJob')
  syncedBigQueryJob!: BigQueryJob;

  @PropSync('databaseLoading')
  private fromDatabaseLoading!: boolean;
  @PropSync('tableLoading')
  private fromTableLoading!: boolean;

  @Ref()
  private readonly fromTableDropdownInput!: DropdownInput;

  @Ref()
  private readonly fromDatabaseDropdownInput!: DropdownInput;

  private get fromDatabaseNames(): any[] {
    const databaseNames = [...DataSourceModule.databaseNames];

    const fromDatabaseNames: any[] = databaseNames.map(dbName => {
      return {
        label: dbName,
        type: dbName
      };
    });
    return fromDatabaseNames;
  }

  private get fromTableNames(): any[] {
    const tableNames = [...DataSourceModule.tableNames];

    const fromTableNames: any[] = tableNames.map(dbName => {
      return {
        label: dbName,
        type: dbName
      };
    });
    return fromTableNames;
  }

  private async handleDatabaseChange(dbName: string) {
    try {
      if (this.syncedBigQueryJob.datasetName !== dbName) {
        this.fromTableLoading = true;
        this.syncedBigQueryJob.datasetName = dbName;
        await DataSourceModule.loadTableNames({
          dbName: dbName,
          id: this.syncedBigQueryJob.sourceId,
          projectName: this.syncedBigQueryJob.projectName,
          location: this.syncedBigQueryJob.location
        });
        this.syncedBigQueryJob.tableName = '';
        this.fromTableDropdownInput.reset();
        this.$emit('selectDatabase', dbName);
      }
    } catch (e) {
      // eslint-disable-next-line no-undef
      PopupUtils.showError(e.message);
      Log.error('JobCreationModal::handleSelectDatabase::error::', e.message);
    } finally {
      this.fromTableLoading = false;
    }
  }

  private handleTableChange(tableName: string) {
    this.syncedBigQueryJob.tableName = tableName;
    this.$emit('selectTable', tableName);
  }

  public isValidDatabaseSuggestion() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  public async handleLoadBigQueryFromData() {
    await DataSourceModule.loadDatabaseNames({
      id: this.syncedBigQueryJob.sourceId!,
      projectName: this.syncedBigQueryJob.projectName,
      location: this.syncedBigQueryJob.location
    });
    this.fromDatabaseLoading = false;
    await DataSourceModule.loadTableNames({
      id: this.syncedBigQueryJob.sourceId,
      dbName: this.syncedBigQueryJob.datasetName,
      projectName: this.syncedBigQueryJob.projectName,
      location: this.syncedBigQueryJob.location
    });
    this.fromTableLoading = false;
  }

  @Watch('syncedBigQueryJob.databaseName')
  resetDatabaseName(dbName: string) {
    if (StringUtils.isEmpty(dbName)) {
      this.fromDatabaseDropdownInput.reset();
    }
  }

  @Watch('syncedBigQueryJob.tableName')
  resetTableName(tblName: string) {
    if (StringUtils.isEmpty(tblName)) {
      this.fromTableDropdownInput.reset();
    }
  }
}
</script>
