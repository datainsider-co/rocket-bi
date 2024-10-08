<template>
  <div>
    <label class="mb-0">Sync To Data Warehouse</label>
    <div class="input">
      <b-collapse id="data-warehouse-config" :visible="isEnableSyncToDataWarehouse">
        <DestDatabaseSuggestion
          id="di-dest-database-selection"
          ref="destDatabase"
          :databaseName="syncJob.destDatabaseName"
          :tableName="syncJob.destTableName"
          @changeDatabase="handleDestinationDbChanged"
          @changeTable="handleDestinationTableChanged"
        />
        <template v-if="$v.syncJob.destDatabaseName.$error">
          <div class="error-message mt-1">Select destination database name.</div>
        </template>
        <template v-else-if="$v.syncJob.destTableName.$error">
          <div class="error-message mt-1">Select destination table name.</div>
        </template>
      </b-collapse>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Ref, Vue } from 'vue-property-decorator';
import { DataDestination, Job } from '@core/data-ingestion';
import { StringUtils } from '@/utils/StringUtils';
import DestDatabaseSuggestion from '@/screens/data-ingestion/form-builder/render-impl/dest-database-suggestion/DestDatabaseSuggestion.vue';
import { required } from 'vuelidate/lib/validators';

@Component({
  components: { DestDatabaseSuggestion },
  validations: {
    syncJob: {
      destDatabaseName: { required },
      destTableName: { required }
    }
  }
})
export default class JobWareHouseConfig extends Vue {
  @PropSync('job')
  syncJob!: Job;

  @Ref()
  //@ts-ignore
  private readonly destDatabase!: DestDatabaseSuggestion;

  private get isEnableSyncToDataWarehouse() {
    return this.syncJob.destinations.some(dataDestination => dataDestination === DataDestination.Clickhouse);
  }

  private handleClickSyncToDataWareHouseOption(checked: boolean) {
    if (checked) {
      if (!this.isEnableSyncToDataWarehouse) {
        this.syncJob.destinations.push(DataDestination.Clickhouse);
      }
    } else {
      this.syncJob.destinations = this.syncJob.destinations.filter(destination => destination !== DataDestination.Clickhouse);
    }
  }

  private handleDestinationDbChanged(name: string, isCreateNew: boolean) {
    const dbName = isCreateNew ? StringUtils.normalizeDatabaseName(name) : name;
    this.syncJob.destDatabaseName = dbName;
    this.$emit('changeDatabase', dbName, isCreateNew);
  }

  private handleDestinationTableChanged(name: string, isCreateNew: boolean) {
    if (isCreateNew) {
      this.syncJob.destTableName = StringUtils.normalizeTableName(name);
    } else {
      this.syncJob.destTableName = name;
    }
  }

  setDatabaseName(name: string) {
    this.destDatabase.setDatabaseName(name);
  }

  setTableName(name: string) {
    this.destDatabase.setTableName(name);
  }

  isValidWarehouseConfig() {
    this.$v.$touch();
    if (this.$v.$invalid && this.isEnableSyncToDataWarehouse) {
      return false;
    }
    const isEmptyDatabase = StringUtils.isEmpty(this.syncJob.destDatabaseName);
    const isEmptyTable = StringUtils.isEmpty(this.syncJob.destTableName);
    if (this.isEnableSyncToDataWarehouse) {
      return !isEmptyTable && !isEmptyDatabase;
    }
    return true;
  }
}
</script>
