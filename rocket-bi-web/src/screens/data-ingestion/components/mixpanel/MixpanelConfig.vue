<template>
  <div class="mixpanel-config">
    <div class="job-section"></div>
    <div v-if="!hideSyncAllTableOption" class="d-flex job-section">
      <DiToggle id="ga-sync-all-table" :value="!isSingleTable" @onSelected="isSingleTable = !isSingleTable" label="Sync all tables"></DiToggle>
    </div>
    <b-collapse :visible="isSingleTable" class="job-section">
      <label>Table type</label>
      <div class="input">
        <DiDropdown
          :data="tableTypes"
          id="google-search-console-url"
          valueProps="id"
          label-props="displayName"
          v-model="syncedJob.tableName"
          placeholder="Select table type..."
          boundary="viewport"
          appendAtRoot
        >
        </DiDropdown>
      </div>
    </b-collapse>
  </div>
</template>

<script lang="ts">
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { SelectOption } from '@/shared';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { MixpanelJob, MixpanelTableName } from '@core/data-ingestion';
import { Log } from '@core/utils';
import { Inject } from 'typescript-ioc';
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';

@Component({
  components: { DiToggle }
})
export default class MixpanelConfig extends Vue {
  @Inject
  private readonly sourcesService!: DataSourceService;
  @PropSync('job')
  syncedJob!: MixpanelJob;

  @PropSync('singleTable')
  isSingleTable!: boolean;

  @Prop({ required: false, default: false, type: Boolean })
  hideSyncAllTableOption!: boolean;

  private get tableTypes(): SelectOption[] {
    return Object.values(MixpanelTableName).map(tableName => {
      return {
        id: tableName,
        displayName: tableName
      };
    });
  }

  beforeDestroy() {
    DataSourceModule.setTableNames([]);
  }

  async mounted() {
    Log.debug('HubspotConfig::mounted');
  }

  isValidSource() {
    return true;
  }
}
</script>

<style lang="scss">
.mixpanel-config {
}
</style>
