<template>
  <div class="job-section">
    <label>Sync Mode</label>
    <div class="input">
      <BFormRadioGroup plain id="sync-mode-radio-group" v-model="syncedJob.syncMode" name="radio-sub-component">
        <BFormRadio :id="genCheckboxId('full-sync')" :value="SyncMode.FullSync">Full sync</BFormRadio>
        <BFormRadio v-if="isShowIncrementalSync" :id="genCheckboxId('incremental-sync')" :value="SyncMode.IncrementalSync">Incremental sync</BFormRadio>
      </BFormRadioGroup>
      <div class="mar-t-12 job-section">
        <!--        Start Date-->
        <label>Start Date</label>
        <div class="input">
          <DiDatePicker :date.sync="startDate" placement="bottom"></DiDatePicker>
        </div>
        <div class="text-danger mt-1">{{ endDateError }}</div>
      </div>
      <b-collapse :visible="syncedJob.syncMode === SyncMode.FullSync" class="job-section">
        <label>End Date</label>
        <div class="input">
          <DiDropdown
            id="ga-end-date"
            v-model="endDateMode"
            labelProps="name"
            valueProps="id"
            :data="dateOptions"
            :class="{ 'is-invalid': endDateError }"
            placeholder="Select end date..."
            boundary="viewport"
            appendAtRoot
          />
        </div>

        <div class="mt-2" v-if="endDateMode === 'custom'">
          <DiDatePicker :date.sync="endDate" placement="bottom"></DiDatePicker>
        </div>
      </b-collapse>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import { GoogleAnalyticJob, Job, SyncMode } from '@core/data-ingestion';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import { DateTimeUtils, DateUtils, ListUtils } from '@/utils';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import { GoogleAnalyticTables } from '@/screens/data-ingestion/components/google-analytics/GoogleAnalyticTables';
import { GoogleAnalytic4Tables } from '@/screens/data-ingestion/components/google-analytics-4/GoogleAnalytic4Tables';

enum GADateMode {
  Today = 'today',
  Yesterday = 'yesterday',
  Custom = 'custom'
}

@Component({
  components: { DynamicSuggestionInput, DiDatePicker }
})
export default class GoogleAnalytic4SyncModeConfig extends Vue {
  protected readonly SyncMode = SyncMode;

  protected startDateMode: GADateMode = GADateMode.Custom;
  protected startDate: Date = GoogleAnalyticJob.defaultStartDate();
  protected endDateMode: GADateMode = GADateMode.Today;
  protected endDate: Date = new Date();

  protected startDateError = '';
  protected endDateError = '';

  protected readonly dateOptions = [
    {
      id: GADateMode.Custom,
      name: 'Custom'
    },
    {
      id: GADateMode.Today,
      name: 'Today'
    },
    {
      id: GADateMode.Yesterday,
      name: 'Yesterday'
    }
  ];

  @PropSync('job')
  syncedJob!: GoogleAnalyticJob;

  @Prop({ required: false, default: true })
  singleTable!: boolean;

  @Prop()
  isValidate!: boolean;

  @Watch('startDate')
  onStartDateChange(date: Date) {
    if (ListUtils.isNotEmpty(this.syncedJob.dateRanges)) {
      this.syncedJob.dateRanges[0].startDate = this.toDateAsString(this.startDateMode, date);
    }
  }

  @Watch('endDateMode')
  onEndDateModeChange(dateMode: GADateMode) {
    if (ListUtils.isNotEmpty(this.syncedJob.dateRanges)) {
      this.syncedJob.dateRanges[0].endDate = this.toDateAsString(dateMode, this.endDate);
    }
  }

  @Watch('startDateMode')
  onStartDateModeChange(dateMode: GADateMode) {
    if (ListUtils.isNotEmpty(this.syncedJob.dateRanges)) {
      this.syncedJob.dateRanges[0].startDate = this.toDateAsString(dateMode, this.startDate);
    }
  }

  @Watch('endDate')
  onEndDateChange(date: Date) {
    if (ListUtils.isNotEmpty(this.syncedJob.dateRanges)) {
      this.syncedJob.dateRanges[0].endDate = this.toDateAsString(this.endDateMode, date);
    }
  }

  @Watch('syncedJob.syncMode')
  onChangeSyncMode(syncMode: SyncMode) {
    switch (syncMode) {
      case SyncMode.IncrementalSync:
        this.endDateMode = GADateMode.Yesterday;
        break;
    }
  }

  @Watch('singleTable')
  onSingleTableChange(isSingleTable: boolean) {
    if (isSingleTable) {
      this.syncedJob.syncMode = SyncMode.FullSync;
    }
  }

  protected get isShowIncrementalSync() {
    const selectedTable = GoogleAnalytic4Tables.find(tbl => tbl.id === this.syncedJob.tableName);
    return (selectedTable?.canIncrementalSync ?? false) || !this.singleTable;
  }

  mounted() {
    Log.debug('GoogleAnalyticSyncModeConfig::mounted');
    if (this.syncedJob.jobId !== Job.DEFAULT_ID) {
      const dateRange = this.syncedJob.dateRanges[0];
      if (dateRange) {
        this.startDate = new Date(dateRange.startDate);
        this.endDateMode = this.getDateMode(dateRange.endDate as GADateMode);
        if (this.endDateMode === GADateMode.Custom) {
          this.endDate = new Date(dateRange.endDate);
        }
      }
    }
  }

  getDateMode(dateMode: GADateMode): GADateMode {
    switch (dateMode) {
      case GADateMode.Yesterday:
        return GADateMode.Yesterday;
      case GADateMode.Today:
        return GADateMode.Today;
      default:
        return GADateMode.Custom;
    }
  }

  toDateAsString(dateMode: GADateMode, date: Date): string {
    switch (dateMode) {
      case GADateMode.Yesterday:
      case GADateMode.Today:
        return dateMode as string;
      case GADateMode.Custom:
        return DateTimeUtils.formatDate(date);
      default:
        throw new DIException(`Unsupported job type ${dateMode}`);
    }
  }

  public validSyncMode() {
    if (DateUtils.laterThan(new Date('2015-1-1'), this.parseDate(this.startDateMode, this.startDate))) {
      this.startDateError = 'The start date can not before 01/01/2015.';
      throw new DIException('');
    }
    if (this.startDateMode === this.endDateMode) {
      if (DateUtils.laterThan(this.parseDate(this.startDateMode, this.startDate), this.parseDate(this.endDateMode, this.endDate))) {
        this.startDateError = 'The end date can not before the start date.';
        throw new DIException('');
      }
    }
    return true;
  }

  protected parseDate(dateMode: GADateMode, date: Date) {
    switch (dateMode) {
      case GADateMode.Custom:
        return date;
      case GADateMode.Today:
        return new Date();
      case GADateMode.Yesterday:
        return DateUtils.yesterday();
    }
  }
}
</script>
