<template>
  <div>
    <label class="mb-0">From database</label>
    <div class="dropdown-loading">
      <DropdownInput
        id="from-database-dropdown"
        ref="fromDatabaseDropdownInput"
        class="mt-2"
        :value="syncedJdbcJob.databaseName"
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
    <template v-if="$v.syncedJdbcJob.databaseName.$error">
      <div class="error-message mt-1">Database name is required.</div>
    </template>
    <div class="d-flex mt-3">
      <DiToggle id="sync-all-table" :value="!isSingleTable" @onSelected="isSingleTable = !isSingleTable"></DiToggle>
      <div class="ml-1">Sync all tables</div>
    </div>
    <template v-if="isSingleTable">
      <label class="mb-0 mt-3">From table</label>
      <div class="dropdown-loading">
        <DropdownInput
          id="from-table-dropdown"
          ref="fromTableDropdownInput"
          class="mt-2"
          :value="syncedJdbcJob.tableName"
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
      <template v-if="$v.syncedJdbcJob.tableName.$error">
        <div class="error-message mt-1">Table name is required.</div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { SelectOption } from '@/shared';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import { Component, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import DynamicSuggestionInput from '@/screens/DataIngestion/components/DynamicSuggestionInput.vue';
import { DataSourceModule } from '@/screens/DataIngestion/store/DataSourceStore';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/popup.utils';
import { required } from 'vuelidate/lib/validators';
import DropdownInput from '@/screens/DataIngestion/DropdownInput.vue';
import { JdbcJob } from '@core/DataIngestion';
import { StringUtils } from '@/utils/string.utils';

@Component({
  components: {
    SingleChoiceItem,
    DynamicSuggestionInput,
    DropdownInput
  },
  validations: {
    syncedJdbcJob: {
      tableName: { required },
      databaseName: { required }
    }
  }
})
export default class MultiJdbcFromDatabaseSuggestion extends Vue {
  private readonly singleTableOption: SelectOption = {
    id: 'single',
    displayName: 'Single Table'
  };
  private readonly allTableOption: SelectOption = {
    id: 'all',
    displayName: 'All Tables'
  };
  @PropSync('jdbcJob')
  syncedJdbcJob!: JdbcJob;
  @PropSync('singleTable')
  isSingleTable!: boolean;

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
      if (this.syncedJdbcJob.databaseName !== dbName) {
        this.fromTableLoading = true;
        this.syncedJdbcJob.databaseName = dbName;
        await DataSourceModule.loadTableNames({ dbName: dbName, id: this.syncedJdbcJob.sourceId });
        this.syncedJdbcJob.tableName = '';
        if (this.isSingleTable) {
          this.fromTableDropdownInput.reset();
        }
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
    this.syncedJdbcJob.tableName = tableName;
    this.$emit('selectTable', tableName);
  }

  isValidDatabaseSuggestion() {
    if (this.isSingleTable) {
      this.$v.$touch();
      if (this.$v.$invalid) {
        return false;
      }
    }
    return true;
  }

  public async handleLoadJdbcFromData() {
    await DataSourceModule.loadDatabaseNames({ id: this.syncedJdbcJob.sourceId });
    this.fromDatabaseLoading = false;
    await DataSourceModule.loadTableNames({ id: this.syncedJdbcJob.sourceId!, dbName: this.syncedJdbcJob.databaseName });
    this.fromTableLoading = false;
  }

  @Watch('syncedJdbcJob.databaseName')
  resetDatabaseName(dbName: string) {
    if (StringUtils.isEmpty(dbName)) {
      this.fromDatabaseDropdownInput.reset();
    }
  }

  @Watch('syncedJdbcJob.databaseName')
  resetTableName(tblName: string) {
    if (StringUtils.isEmpty(tblName)) {
      this.fromTableDropdownInput.reset();
    }
  }
}
</script>
