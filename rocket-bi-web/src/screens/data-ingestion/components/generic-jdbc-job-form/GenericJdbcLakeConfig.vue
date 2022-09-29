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
import { DataDestination, JdbcJob } from '@core/data-ingestion';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import { StringUtils } from '@/utils/StringUtils';
import { GenericJdbcJob } from '@core/data-ingestion/domain/job/GenericJdbcJob';

@Component({
  components: {
    DynamicSuggestionInput
  }
})
export default class GenericJdbcLakeConfig extends Vue {
  @PropSync('genericJdbc')
  syncedGenericJdbcJob!: GenericJdbcJob;

  private get isEnableSyncToLakeHouse() {
    return this.syncedGenericJdbcJob.destinations.some(dataDestination => dataDestination === DataDestination.Hadoop);
  }

  private get lakeDirectory(): string {
    if (StringUtils.isNotEmpty(this.syncedGenericJdbcJob.databaseName) && StringUtils.isNotEmpty(this.syncedGenericJdbcJob.tableName)) {
      return `/data/db/${this.syncedGenericJdbcJob.databaseName}/${this.syncedGenericJdbcJob.tableName}/`;
    } else {
      return `/data/db/`;
    }
  }

  private handleClickSyncToDataLakeOption(checked: boolean) {
    if (checked) {
      if (!this.isEnableSyncToLakeHouse) {
        this.syncedGenericJdbcJob.destinations.push(DataDestination.Hadoop);
      }
    } else {
      this.syncedGenericJdbcJob.destinations = this.syncedGenericJdbcJob.destinations.filter(destination => destination !== DataDestination.Hadoop);
    }
  }
}
</script>
