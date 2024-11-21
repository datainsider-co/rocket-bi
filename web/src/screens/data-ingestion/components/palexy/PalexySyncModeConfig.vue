<template>
  <div class="palexy-sync-mode-config job-section">
    <div class="job-section">
      <label>Sync Mode</label>
      <div class="input">
        <BFormRadioGroup plain id="sync-mode-radio-group" v-model="syncJob.syncMode" name="radio-sub-component">
          <BFormRadio :id="genCheckboxId('full-sync')" :value="syncMode.FullSync">Full sync</BFormRadio>
          <BFormRadio :id="genCheckboxId('incremental-sync')" :value="syncMode.IncrementalSync">Incremental sync </BFormRadio>
        </BFormRadioGroup>
      </div>
    </div>
    <div class="job-section">
      <label>From date</label>
      <div class="input">
        <DiDropdown
          v-model="fromDateMode"
          labelProps="label"
          valueProps="id"
          :data="dateItems"
          placeholder="Select Advertiser..."
          boundary="viewport"
          appendAtRoot
          @selected="handleFromDateModeSelected"
        >
        </DiDropdown>

        <template v-if="fromDateMode === PalexyTime.Custom">
          <DiDatePicker class="date-picker" :date="syncJob.dateRange.getFromDate()" placement="bottom" @change="handleFromDateSelected"></DiDatePicker>
        </template>
      </div>
    </div>

    <b-collapse class="job-section" :visible="syncJob.syncMode === syncMode.FullSync">
      <div>
        <label>To date</label>
        <div class="input">
          <DiDropdown
            v-model="toDateMode"
            labelProps="label"
            valueProps="id"
            :data="dateItems"
            placeholder="Select Advertiser..."
            boundary="viewport"
            appendAtRoot
            @selected="handleToDateModeSelected"
          >
          </DiDropdown>
          <template v-if="toDateMode === PalexyTime.Custom">
            <DiDatePicker class="date-picker" :date="syncJob.dateRange.getToDate()" placement="bottom" @change="handleToDateSelected"></DiDatePicker>
          </template>
        </div>
      </div>
    </b-collapse>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import { PalexyDateRange, PalexyJob, PalexyTime, SyncMode } from '@core/data-ingestion';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { DropdownData } from '@/shared/components/common/di-dropdown';

@Component({
  components: { DiDropdown, DynamicSuggestionInput, DiCalendar }
})
export default class PalexySyncModeConfig extends Vue {
  private readonly syncMode = SyncMode;
  private readonly PalexyTime = PalexyTime;
  private fromDateMode: PalexyTime | string = PalexyDateRange.default().fromDate;
  private toDateMode: PalexyTime | string = PalexyDateRange.default().toDate;

  @PropSync('job')
  syncJob!: PalexyJob;

  @Prop()
  isValidate!: boolean;

  @Prop({ required: true })
  singleTable!: boolean;

  mounted() {
    this.$nextTick(() => {
      this.fromDateMode = PalexyDateRange.getPalexyTimeMode(this.syncJob.dateRange.fromDate);
      this.toDateMode = PalexyDateRange.getPalexyTimeMode(this.syncJob.dateRange.toDate);
    });
  }

  public validSyncMode() {
    return true;
  }

  private get dateItems(): DropdownData[] {
    return [
      {
        id: PalexyTime.Custom,
        label: 'Custom'
      },
      {
        id: PalexyTime.Today,
        label: 'Today'
      },
      {
        id: PalexyTime.Yesterday,
        label: 'Yesterday'
      },
      {
        id: PalexyTime.Last7Days,
        label: 'Last 7 Days'
      },
      {
        id: PalexyTime.Last30Days,
        label: 'Last 30 Days'
      },
      {
        id: PalexyTime.Last60Days,
        label: 'Last 60 Days'
      }
    ];
  }

  private getSelectPalexyDate(item: DropdownData) {
    switch (item.id as PalexyTime) {
      case PalexyTime.Today:
      case PalexyTime.Yesterday:
      case PalexyTime.Last7Days:
      case PalexyTime.Last30Days:
      case PalexyTime.Last60Days:
        return item.id;
      case PalexyTime.Custom:
        return PalexyDateRange.getPalexyStringDate(new Date());
    }
  }

  private handleFromDateModeSelected(item: DropdownData) {
    this.fromDateMode = item.id;
    this.syncJob.dateRange.fromDate = this.getSelectPalexyDate(item);
  }

  private handleToDateModeSelected(item: DropdownData) {
    this.toDateMode = item.id;
    this.syncJob.dateRange.toDate = this.getSelectPalexyDate(item);
  }

  private handleFromDateSelected(date: Date) {
    this.syncJob.dateRange.fromDate = PalexyDateRange.getPalexyStringDate(date);
  }

  private handleToDateSelected(date: Date) {
    this.syncJob.dateRange.toDate = PalexyDateRange.getPalexyStringDate(date);
  }

  @Watch('syncJob.syncMode')
  onChangeSyncMode(syncMode: SyncMode) {
    if (syncMode === SyncMode.IncrementalSync) {
      this.toDateMode = PalexyTime.Today;
      this.syncJob.dateRange.toDate = PalexyTime.Today;
    }
  }
}
</script>
<style lang="scss">
.palexy-sync-mode-config {
  .date-picker {
    .input-container {
      margin-top: 8px;
      .input-calendar {
        width: calc(100% - 12px);
      }
    }
  }
}
</style>
