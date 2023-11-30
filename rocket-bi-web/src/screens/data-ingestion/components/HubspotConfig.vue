<template>
  <div class="hubspot-config">
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
          v-model="syncedJob.subType"
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
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import { HubspotJob, HubspotObjectType } from '@core/data-ingestion';
import { Inject } from 'typescript-ioc';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { Log } from '@core/utils';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { SelectOption } from '@/shared';
import DiToggle from '@/shared/components/common/DiToggle.vue';

@Component({
  components: { DiToggle }
})
export default class HubspotConfig extends Vue {
  @Inject
  private readonly sourcesService!: DataSourceService;
  @PropSync('job')
  syncedJob!: HubspotJob;

  @PropSync('singleTable')
  isSingleTable!: boolean;

  @Prop({ required: false, default: false, type: Boolean })
  hideSyncAllTableOption!: boolean;

  private get tableTypes(): SelectOption[] {
    return [
      {
        id: HubspotObjectType.Contact,
        displayName: 'Contact'
      },
      {
        id: HubspotObjectType.Company,
        displayName: 'Company'
      },
      {
        id: HubspotObjectType.Deal,
        displayName: 'Deal'
      },
      {
        id: HubspotObjectType.Engagement,
        displayName: 'Engagement'
      }
    ];
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

  // private setWarehouseDestDatabase(name: string) {
  //   if (!this.syncedJob.destDatabaseName) {
  //     Log.debug("HubspotConfig::setWarehouseDestDatabase::name::", name)
  //     this.$emit('selectDatabase', name);
  //   }
  // }
  //
  // private setWarehouseDestTable(name: string) {
  //   if (!this.syncedJob.destTableName && this.isSingleTable) {
  //     this.$emit('selectTable', name);
  //   }
  // }
  //
  // @Watch('syncedJob.subType')
  // onSiteUrlChanged(subType: string) {
  //   this.setWarehouseDestDatabase('hubspot');
  //   this.setWarehouseDestTable(this.syncedJob.subType);
  // }
  //
  // @Watch('isSingleTable')
  // onIsSingleTableChanged(isSingleTable: boolean) {
  //   this.setWarehouseDestTable(this.syncedJob.subType);
  // }
}
</script>

<style lang="scss">
.hubspot-config {
}
</style>
