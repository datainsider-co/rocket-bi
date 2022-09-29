<template>
  <div>
    <label class="export-form mb-0">
      <div class="custom-control custom-switch">
        <input
          :id="genToggleId('sync-to-lake-house')"
          :checked="isEnableSyncToLakeHouse"
          class="custom-control-input"
          type="checkbox"
          @input="handleClickSyncToDataLakeOption(!isEnableSyncToLakeHouse)"
        />
        <label class="custom-control-label" :for="genToggleId('sync-to-lake-house')">Sync To Data Lake</label>
      </div>
    </label>
    <div class="input">
      <b-collapse id="data-lake-config" :visible="isEnableSyncToLakeHouse" class="mt-12px">
        <BInputGroupAppend class="input-group-append">
          <BFormInput :value="syncJob.lakeDirectory" disabled />
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
import { DataDestination, Job } from '@core/data-ingestion';

@Component({ components: {} })
export default class JobLakeConfig extends Vue {
  @PropSync('job')
  syncJob!: Job;

  private get isEnableSyncToLakeHouse() {
    return this.syncJob.destinations.some(dataDestination => dataDestination === DataDestination.Hadoop);
  }

  private handleClickSyncToDataLakeOption(checked: boolean) {
    if (checked) {
      if (!this.isEnableSyncToLakeHouse) {
        this.syncJob.destinations.push(DataDestination.Hadoop);
      }
    } else {
      this.syncJob.destinations = this.syncJob.destinations.filter(destination => destination !== DataDestination.Hadoop);
    }
  }
}
</script>

<style lang="scss" scoped></style>
