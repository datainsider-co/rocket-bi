<template>
  <div>
    <label class="mb-0">Sync To Data Warehouse</label>
    <div class="input">
      <b-collapse id="data-warehouse-config" :visible="isEnableSyncToDataWarehouse">
        <DestOnlyDatabaseSuggestion
          id="di-dest-database-selection"
          ref="destDatabase"
          :databaseName="syncJob.destDatabaseName"
          @changeDatabase="handleDestinationDbChanged"
        />
        <template v-if="$v.syncJob.destDatabaseName.$error">
          <div class="error-message mt-1">Select destination database name.</div>
        </template>
      </b-collapse>
    </div>
  </div>
</template>

<script lang="ts">
import DestDatabaseSuggestion from '@/screens/data-ingestion/form-builder/render-impl/dest-database-suggestion/DestDatabaseSuggestion.vue';
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator';
import { DataDestination, Job } from '@core/data-ingestion';
import { StringUtils } from '@/utils/StringUtils';
import DestOnlyDatabaseSuggestion from '@/screens/data-ingestion/form-builder/render-impl/dest-database-suggestion/DestOnlyDatabaseSuggestion.vue';
import { Log } from '@core/utils';
import { required } from 'vuelidate/lib/validators';

@Component({
  components: { DestOnlyDatabaseSuggestion },
  validations: {
    syncJob: {
      destDatabaseName: { required }
    }
  }
})
export default class MultiJobWareHouseConfig extends Vue {
  @PropSync('job')
  syncJob!: Job;

  @Prop()
  isValidate?: boolean;

  @PropSync('singleTable')
  isSingleTable!: boolean;

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
    Log.debug('MultiJobWareHouseConfig::setDatabaseName::', name);
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
    if (this.isEnableSyncToDataWarehouse) {
      const isEmptyDatabase = StringUtils.isEmpty(this.syncJob.destDatabaseName);
      const isEmptyTable = StringUtils.isEmpty(this.syncJob.destTableName);
      if (this.isSingleTable) {
        return !isEmptyDatabase && !isEmptyTable;
      } else {
        return !isEmptyDatabase;
      }
    }
    return true;
  }
}
</script>

<style lang="scss" scoped></style>
