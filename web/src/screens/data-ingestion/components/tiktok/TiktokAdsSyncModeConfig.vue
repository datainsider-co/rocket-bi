<template>
  <div class="job-section">
    <label>Sync Mode</label>
    <div class="input">
      <BFormRadioGroup plain id="sync-mode-radio-group" v-model="syncJob.syncMode" name="radio-sub-component">
        <BFormRadio :id="genCheckboxId('full-sync')" :value="syncMode.FullSync">Full sync</BFormRadio>
        <BFormRadio v-if="syncJob.isTiktokReport || !singleTable" :id="genCheckboxId('incremental-sync')" :value="syncMode.IncrementalSync"
          >Incremental sync
        </BFormRadio>
      </BFormRadioGroup>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import { SyncMode, TiktokAdsJob } from '@core/data-ingestion';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';

@Component({
  components: { DiDropdown, DynamicSuggestionInput, DiCalendar }
})
export default class TiktokAdsSyncModeConfig extends Vue {
  private readonly syncMode = SyncMode;

  @PropSync('job')
  syncJob!: TiktokAdsJob;

  @Prop()
  isValidate!: boolean;

  @Prop({ required: true })
  singleTable!: boolean;

  public validSyncMode() {
    return true;
  }

  @Watch('syncJob.isTiktokReport')
  onIsTiktokReportChanged(isTiktokReport: boolean) {
    if (!isTiktokReport) {
      this.syncJob.syncMode = SyncMode.FullSync;
    }
  }
}
</script>
<style lang="scss" scoped>
.color-di-primary {
  color: #597fff !important;
}

.di-calendar-input-container {
  ::v-deep {
    span {
      width: 100% !important;
    }
  }

  .date-range-picker {
    display: flex;
    flex-direction: row;
    height: 34px;
    justify-content: space-between;
    background: var(--input-background-color) !important;
    padding: 8px 12px;
    align-items: center;
  }
}
</style>
