<template>
  <div>
    <BCollapse :visible="isInsightTable || !singleTable">
      <label>Sync Mode</label>
      <div class="input">
        <BFormRadioGroup plain id="sync-mode-radio-group" v-model="syncJob.syncMode" name="radio-sub-component">
          <BFormRadio :id="genCheckboxId('full-sync')" :value="syncMode.FullSync">Full sync</BFormRadio>
          <BFormRadio :id="genCheckboxId('incremental-sync')" :value="syncMode.IncrementalSync">Incremental sync </BFormRadio>
        </BFormRadioGroup>
      </div>
      <label class="mt-2">Sync Time</label>
      <div class="input">
        <DiDropdown
          :value="syncJob.datePreset"
          labelProps="displayName"
          valueProps="id"
          :placeholder="syncTimePlaceHolder"
          :data="SYNC_TIME_OPTION"
          hidePlaceholderOnMenu
          boundary="scrollParent"
          @change="selectDatePreset"
        >
          <template slot="before-menu" slot-scope="{ hideDropdown }">
            <li class="active color-di-primary font-weight-normal" @click.prevent="selectCustomDateRange(hideDropdown)">
              Select Custom Sync Time...
            </li>
          </template>
        </DiDropdown>
        <DiCalendar
          v-if="syncJob.timeRange"
          @onCalendarSelected="v => onCalendarSelected(v)"
          class="date-range btn-ghost mt-2 p-0"
          :id="`di-calendar`"
          :isShowResetFilterButton="false"
          :mainDateFilterMode="DateMode"
          :modeOptions="[]"
          :getDateRangeByMode="getDateRangeByMode"
          :defaultDateRange="defaultDateRange"
          dateFormatPattern="MMM D, YYYY"
          :isShowIconDate="false"
        >
          <template #content>
            <div class="date-range-picker">
              <div>{{ dateRange }}</div>
              <i class=" di-icon-calendar"></i>
            </div>
          </template>
        </DiCalendar>
      </div>
    </BCollapse>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import { FacebookAdsJob, FacebookDatePresetAsOptions, FacebookDatePresetMode, SyncMode } from '@core/data-ingestion';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { DateRange, DateTimeConstants, DateTypes, SelectOption } from '@/shared';
import { MainDateMode } from '@core/common/domain';
import { CalendarData } from '@/shared/models';
import { DateUtils } from '@/utils';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';

@Component({
  components: { DiDropdown, DynamicSuggestionInput, DiCalendar }
})
export default class FacebookAdsSyncModeConfig extends Vue {
  private readonly syncMode = SyncMode;
  private readonly DateMode: MainDateMode = MainDateMode.custom;
  private readonly DateRangeOptions = DateTimeConstants.ListDateRangeModeOptions;

  @PropSync('job')
  syncJob!: FacebookAdsJob;

  @Prop({ required: false, default: true })
  singleTable!: boolean;

  @Prop()
  isValidate!: boolean;

  private readonly SYNC_TIME_OPTION: SelectOption[] = FacebookDatePresetAsOptions;

  public validSyncMode() {
    return true;
  }

  private selectDatePreset(mode: FacebookDatePresetMode) {
    this.syncJob.withDatePreset(mode);
  }

  private onCalendarSelected(data: CalendarData) {
    this.syncJob.withDateRange(data.chosenDateRange!);
  }

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  private get defaultDateRange(): DateRange {
    return DateUtils.getCurrentDate(DateTypes.week)!;
  }

  private selectCustomDateRange(callback: Function) {
    this.syncJob.withDateRange(this.defaultDateRange);
    callback();
  }

  private get dateRange(): string {
    if (this.syncJob.timeRange) {
      return `${this.syncJob.timeRange.since} - ${this.syncJob.timeRange.until}`;
    }
    return 'All Time';
  }

  private get syncTimePlaceHolder() {
    if (this.syncJob.timeRange) {
      return 'Select Custom Sync Time...';
    }
    return '';
  }
  private get isInsightTable(): boolean {
    return FacebookAdsJob.isInsightTable(this.syncJob.tableName);
  }

  @Watch('syncJob.tableName')
  onTableNameChanged(tableName: string) {
    if (!FacebookAdsJob.isInsightTable(tableName)) {
      this.syncJob.withSyncMode(SyncMode.FullSync);
    } else {
      this.syncJob.withSyncMode(SyncMode.FullSync).withDatePreset(FacebookDatePresetMode.last7days);
    }
  }

  @Watch('singleTable')
  onSingleTableChanged() {
    if (!this.singleTable) {
      this.syncJob.withSyncMode(SyncMode.FullSync).withDatePreset(FacebookDatePresetMode.last7days);
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
