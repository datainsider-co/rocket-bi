<template>
  <div>
    <label class="export-form mb-0">
      <div class="custom-control custom-switch">
        <input
          :id="genToggleId('sync-to-data-warehouse')"
          :checked="isEnableSyncToDataWarehouse"
          class="custom-control-input"
          type="checkbox"
          @input="handleClickSyncToDataWareHouseOption(!isEnableSyncToDataWarehouse)"
        />
        <label class="custom-control-label" :for="genToggleId('sync-to-data-warehouse')">Sync To Data Warehouse</label>
      </div>
    </label>
    <div class="input">
      <b-collapse id="data-warehouse-config" :visible="isEnableSyncToDataWarehouse">
        <DestOnlyDatabaseSuggestion
          id="di-dest-database-selection"
          ref="destDatabase"
          :databaseName="syncJob.destDatabaseName"
          @changeDatabase="handleDestinationDbChanged"
        />
        <template v-if="isValidate && isInValidSyncToDataWareHouse">
          <div v-if="isInvalidDestinationDatabase" class="error-message mt-1">Select destination database name.</div>
          <div v-else class="error-message mt-1">Select destination table name.</div>
        </template>
      </b-collapse>
    </div>
  </div>
</template>

<script lang="ts">
import DestDatabaseSuggestion from '@/screens/DataIngestion/FormBuilder/RenderImpl/DestDatabaseSuggestion/DestDatabaseSuggestion.vue';
import { Component, Prop, PropSync, Ref, Vue } from 'vue-property-decorator';
import { DataDestination, Job } from '@core/DataIngestion';
import { StringUtils } from '@/utils/string.utils';
import DestOnlyDatabaseSuggestion from '@/screens/DataIngestion/FormBuilder/RenderImpl/DestDatabaseSuggestion/DestOnlyDatabaseSuggestion.vue';
import { Log } from '@core/utils';

@Component({ components: { DestOnlyDatabaseSuggestion } })
export default class MultiJobWareHouseConfig extends Vue {
  @PropSync('job')
  syncJob!: Job;

  @Prop()
  isValidate?: boolean;

  @PropSync('singleTable')
  isSingleTable!: boolean;

  @Prop()
  isInValidSyncToDataWareHouse?: boolean;

  @Prop()
  isInvalidDestinationDatabase?: boolean;
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
}
</script>

<style lang="scss" scoped></style>
