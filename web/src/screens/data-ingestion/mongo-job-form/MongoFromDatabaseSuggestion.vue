<template>
  <div>
    <label class="mb-0">From database</label>
    <div class="dropdown-loading">
      <DropdownInput
        id="from-database-dropdown"
        ref="fromDatabaseDropdownInput"
        class="mt-2"
        :value="syncedMongoJob.databaseName"
        :data="fromDatabaseNames"
        dropdown-placeholder="Select database please..."
        extra-option-label="Or type your database name"
        input-placeholder="Please type your database name here"
        :loading="fromDatabaseLoading"
        label-props="label"
        value-props="type"
        @change="handleDatabaseChange"
        :appendAtRoot="true"
      ></DropdownInput>
    </div>
    <template v-if="$v.syncedMongoJob.databaseName.$error">
      <div class="error-message mt-1">Database name is required.</div>
    </template>
    <label class="mb-0 mt-3">From table</label>
    <div class="dropdown-loading">
      <DropdownInput
        id="from-table-dropdown"
        ref="fromTableDropdownInput"
        class="mt-2"
        :value="syncedMongoJob.tableName"
        :data="fromTableNames"
        :loading="fromTableLoading"
        dropdown-placeholder="Select table please..."
        extra-option-label="Or type your table name"
        input-placeholder="Please type your table name here "
        label-props="label"
        value-props="type"
        :appendAtRoot="true"
        @change="handleTableChange"
      ></DropdownInput>
    </div>
    <template v-if="$v.syncedMongoJob.tableName.$error">
      <div class="error-message mt-1">Table name is required.</div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { required } from 'vuelidate/lib/validators';
import DropdownInput from '@/screens/data-ingestion/DropdownInput.vue';
import { MongoJob } from '@core/data-ingestion/domain/job/MongoJob';
import { StringUtils } from '@/utils/StringUtils';

@Component({
  components: {
    DynamicSuggestionInput,
    DropdownInput
  },
  validations: {
    syncedMongoJob: {
      tableName: { required },
      databaseName: { required }
    }
  }
})
export default class MongoFromDatabaseSuggestion extends Vue {
  @PropSync('mongoJob')
  syncedMongoJob!: MongoJob;

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
      Log.debug('handleDatabaseChange::', dbName);
      if (this.syncedMongoJob.databaseName !== dbName) {
        this.fromTableLoading = true;
        this.syncedMongoJob.databaseName = dbName;
        await DataSourceModule.loadTableNames({ dbName: dbName, id: this.syncedMongoJob.sourceId });
        this.syncedMongoJob.tableName = '';
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
    this.syncedMongoJob.tableName = tableName;
    this.$emit('selectTable', tableName);
  }

  isValidDatabaseSuggestion() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  public async handleLoadMongoFromData() {
    await DataSourceModule.loadDatabaseNames({ id: this.syncedMongoJob.sourceId });
    this.fromDatabaseLoading = false;
    await DataSourceModule.loadTableNames({ id: this.syncedMongoJob.sourceId!, dbName: this.syncedMongoJob.databaseName });
    this.fromTableLoading = false;
  }

  @Watch('syncedMongoJob.databaseName')
  resetDatabaseName(dbName: string) {
    if (StringUtils.isEmpty(dbName)) {
      this.fromDatabaseDropdownInput.reset();
    }
  }

  @Watch('syncedMongoJob.tableName')
  resetTableName(tblName: string) {
    if (StringUtils.isEmpty(tblName)) {
      this.fromTableDropdownInput.reset();
    }
  }
}
</script>
