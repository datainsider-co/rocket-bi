<template>
  <div>
    <label class="export-form mb-0">
      <div class="custom-control custom-switch">
        <input
          :id="genToggleId('sync-to-lake-house')"
          :checked="isEnableSyncToLakeHouse"
          @input="handleClickSyncToDataLakeOption($event.target.checked)"
          class="custom-control-input"
          type="checkbox"
        />
        <label class="custom-control-label" :for="genToggleId('sync-to-lake-house')">Sync To Data Lake</label>
      </div>
    </label>
    <div class="input">
      <b-collapse id="data-lake-config" :visible="isEnableSyncToLakeHouse" class="mt-12px">
        <BInputGroupAppend class="input-group-append">
          <BFormInput disabled :value="lakeDirectory" />
          <div class="icon-block">
            <i class="di-icon-lock"></i>
          </div>
        </BInputGroupAppend>
      </b-collapse>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { DataDestination } from '@core/DataIngestion';
import DynamicSuggestionInput from '@/screens/DataIngestion/components/DynamicSuggestionInput.vue';
import { StringUtils } from '@/utils/string.utils';
import { BigQueryJob } from '@core/DataIngestion/Domain/Job/BigQueryJob';

@Component({
  components: {
    DynamicSuggestionInput
  }
})
export default class BigQueryLakeConfig extends Vue {
  @PropSync('bigQuery')
  syncedBigQueryJob!: BigQueryJob;

  private get isEnableSyncToLakeHouse() {
    return this.syncedBigQueryJob.destinations.some(dataDestination => dataDestination === DataDestination.Hadoop);
  }

  private get lakeDirectory(): string {
    if (StringUtils.isNotEmpty(this.syncedBigQueryJob.datasetName) && StringUtils.isNotEmpty(this.syncedBigQueryJob.tableName)) {
      return `/data/db/${this.syncedBigQueryJob.datasetName}/${this.syncedBigQueryJob.tableName}/`;
    } else {
      return `/data/db/`;
    }
  }

  private handleClickSyncToDataLakeOption(checked: boolean) {
    if (checked) {
      if (!this.isEnableSyncToLakeHouse) {
        this.syncedBigQueryJob.destinations.push(DataDestination.Hadoop);
      }
    } else {
      this.syncedBigQueryJob.destinations = this.syncedBigQueryJob.destinations.filter(destination => destination !== DataDestination.Hadoop);
    }
  }
}
</script>
