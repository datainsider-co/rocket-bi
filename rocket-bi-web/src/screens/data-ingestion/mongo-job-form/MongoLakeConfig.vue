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
import { DataDestination } from '@core/data-ingestion';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import { StringUtils } from '@/utils/StringUtils';
import { MongoJob } from '@core/data-ingestion/domain/job/MongoJob';

@Component({
  components: {
    DynamicSuggestionInput
  }
})
export default class MongoLakeConfig extends Vue {
  @PropSync('mongoJob')
  syncedMongoJob!: MongoJob;

  private get isEnableSyncToLakeHouse() {
    return this.syncedMongoJob.destinations.some(dataDestination => dataDestination === DataDestination.Hadoop);
  }

  private get lakeDirectory(): string {
    if (StringUtils.isNotEmpty(this.syncedMongoJob.databaseName) && StringUtils.isNotEmpty(this.syncedMongoJob.tableName)) {
      return `/data/db/${this.syncedMongoJob.databaseName}/${this.syncedMongoJob.tableName}/`;
    } else {
      return `/data/db/`;
    }
  }

  private handleClickSyncToDataLakeOption(checked: boolean) {
    if (checked) {
      if (!this.isEnableSyncToLakeHouse) {
        this.syncedMongoJob.destinations.push(DataDestination.Hadoop);
      }
    } else {
      this.syncedMongoJob.destinations = this.syncedMongoJob.destinations.filter(destination => destination !== DataDestination.Hadoop);
    }
  }
}
</script>
