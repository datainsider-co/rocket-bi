<template>
  <div class="tiktok-source-config">
    <div class="job-section">
      <label>Select Advertiser</label>
      <div class="input">
        <DiDropdown
          v-model="syncedJob.advertiserId"
          labelProps="name"
          valueProps="id"
          :data="advertiserIds"
          :class="{ 'is-invalid': advertiserIdError }"
          placeholder="Select Advertiser..."
          boundary="viewport"
          appendAtRoot
          :disabled="isAdvertiserLoading"
          @selected="resetAdvertiserIdError"
          @change="selectAdvertiseId"
        >
          <template #icon-dropdown>
            <div v-if="isAdvertiserLoading" class="loading">
              <i class="fa fa-spinner fa-spin"></i>
            </div>
          </template>
        </DiDropdown>
      </div>
      <div class="text-danger mt-1">{{ advertiserIdError }}</div>
    </div>
    <div v-if="!hideSyncAllTableOption" class="d-flex job-section">
      <DiToggle id="tiktok-sync-all-table" :value="!isSingleTable" @onSelected="isSingleTable = !isSingleTable" label="Sync all tables"></DiToggle>
    </div>
    <div v-if="isSingleTable" class="job-section">
      <label>Select End Point</label>
      <div class="input">
        <DiDropdown
          :v-model="syncedJob.tikTokEndPoint"
          :value="syncedJob.tikTokEndPoint"
          labelProps="name"
          valueProps="id"
          :data="endPoints"
          appendAtRoot
          :class="{ 'is-invalid': endPointError }"
          placeholder="Select End Point..."
          boundary="viewport"
          :disabled="isEndPointLoading"
          @selected="resetEndPointError"
          @change="selectEndPoint"
        >
          <template #icon-dropdown>
            <div v-if="isEndPointLoading" class="loading">
              <i class="fa fa-spinner fa-spin"></i>
            </div>
          </template>
        </DiDropdown>
      </div>

      <div class="text-danger mt-1">{{ endPointError }}</div>
    </div>
    <b-collapse v-if="visibleReport || !isSingleTable" :visible="visibleReport || !isSingleTable" class="job-section">
      <div v-if="isSingleTable" class="job-section">
        <label>Select Report</label>
        <div class="input">
          <DiDropdown
            v-model="syncedJob.tikTokReport.reportType"
            labelProps="name"
            valueProps="id"
            :data="reports"
            appendAtRoot
            :class="{ 'is-invalid': reportError }"
            placeholder="Select Report..."
            boundary="viewport"
            :disabled="isReportLoading"
            @change="handleSelectReportType"
            @selected="resetReportError"
          >
            <template #icon-dropdown>
              <div v-if="isReportLoading" class="loading">
                <i class="fa fa-spinner fa-spin"></i>
              </div>
            </template>
          </DiDropdown>
        </div>
        <div class="text-danger mt-1">{{ reportError }}</div>
      </div>
      <div class="job-section">
        <label>Date Range</label>
        <div class="input">
          <DiCalendar
            hideTimePresetOptions
            @onCalendarSelected="onChangeDateRange"
            class="ml-auto date-range-dropdown mt-1 pr-0"
            id="tiktok-report-time-range"
            :isShowResetFilterButton="false"
            :mainDateFilterMode="dateMode"
            :modeOptions="dateRangeOptions"
            :getDateRangeByMode="getDateRangeByMode"
            :defaultDateRange="syncedJob.tikTokReport.timeRange"
            dateFormatPattern="MMM D, YYYY"
          />
        </div>
      </div>
    </b-collapse>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import { FacebookAdsJob, FormMode, Job, TiktokAdsJob, TikTokReport } from '@core/data-ingestion';
import { Inject } from 'typescript-ioc';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { Log } from '@core/utils';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { DateRange, DateTimeConstants, SelectOption } from '@/shared';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import { DateTimeFormatter, DateUtils, ListUtils, PopupUtils, StringUtils, TimeoutUtils } from '@/utils';
import { DIException, MainDateMode, SourceId } from '@core/common/domain';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { CalendarData } from '@/shared/models';
import { required } from 'vuelidate/lib/validators';

@Component({
  components: { DiToggle, DiCalendar }
})
export default class TiktokSourceConfig extends Vue {
  private readonly defaultTiktokDBName = 'tiktok_ads';
  private readonly dateMode = MainDateMode.custom;
  private readonly dateRangeOptions = DateTimeConstants.ListDateRangeModeOptions;

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  private isAdvertiserLoading = false;
  private advertiserIdError = '';
  private advertiserIds: { id: string; name: string }[] = [];

  private isEndPointLoading = false;
  private endPointError = '';

  private endPoints: { id: string; name: string }[] = [];

  private isReportLoading = false;
  private reportError = '';
  private reports: { id: string; name: string }[] = [];

  @Inject
  private readonly sourcesService!: DataSourceService;
  @PropSync('job')
  syncedJob!: TiktokAdsJob;

  @PropSync('singleTable')
  isSingleTable!: boolean;

  @Prop({ required: false, default: false, type: Boolean })
  hideSyncAllTableOption!: boolean;

  @Watch('isSingleTable')
  handleSyncWithAllTables(isSingle: boolean) {
    if (!isSingle) {
      this.selectDatabase(this.defaultTiktokDBName);
    }
  }

  beforeDestroy() {
    DataSourceModule.setTableNames([]);
  }

  private get visibleReport(): boolean {
    return this.syncedJob.isTiktokReport;
  }

  private onChangeDateRange(calendarData: CalendarData) {
    if (calendarData.chosenDateRange) {
      this.syncedJob.tikTokReport?.setDateRange(calendarData.chosenDateRange);
    }
  }

  async loadData(): Promise<void> {
    try {
      await this.loadAdvertiserIds(this.syncedJob.sourceId);
      await this.loadEndPoints(this.syncedJob.sourceId, this.syncedJob.advertiserId);
      if (this.syncedJob.isTiktokReport) {
        await this.loadReports();
      }
    } catch (ex) {
      Log.error(ex);
      this.advertiserIds = [];
      PopupUtils.showError(ex.message);
    } finally {
      this.isAdvertiserLoading = false;
    }
  }

  private async selectEndPoint(endPoint: string) {
    Log.debug('TiktokSourceConfig::selectEndPoint::endPoint::', endPoint, this.syncedJob.isTiktokReport);
    this.syncedJob.tikTokEndPoint = endPoint;
    if (this.syncedJob.isTiktokReport) {
      this.syncedJob.tikTokReport = TikTokReport.default();
      await this.loadReports();
    } else {
      this.syncedJob.tikTokReport = null;
      //select db name & table name
      this.selectDatabase(this.defaultTiktokDBName);
      const tableName = endPoint.split('/')[0];
      this.selectTable(StringUtils.toSnakeCase(tableName));
    }
  }

  private selectDatabase(dbName: string) {
    if (StringUtils.isEmpty(this.syncedJob.destDatabaseName)) {
      this.$emit('selectDatabase', dbName);
    }
  }

  private selectTable(tableName: string) {
    if (StringUtils.isEmpty(this.syncedJob.destTableName) && this.isSingleTable) {
      this.$emit('selectTable', tableName);
    }
  }

  private async loadReports() {
    try {
      if (ListUtils.isEmpty(this.reports)) {
        this.isReportLoading = true;
        this.reports = (await this.sourcesService.listTiktokReport()).map(report => {
          return {
            name: report,
            id: report
          };
        });
        this.isReportLoading = false;
      }
    } catch (e) {
      PopupUtils.showError(e.message);
    }
  }

  private async loadAdvertiserIds(id: SourceId) {
    this.isAdvertiserLoading = true;
    this.advertiserIds = (await this.sourcesService.listDatabaseName(id, '', '')).map(dbJsonAsString => {
      const json = JSON.parse(dbJsonAsString);
      return {
        id: json.advertiser_id,
        name: json.advertise_name
      };
    });
    this.isAdvertiserLoading = false;
  }

  private async loadEndPoints(sourceId: SourceId, advertiseId: string) {
    this.isEndPointLoading = true;
    const tables = await this.sourcesService.listTableName(sourceId, advertiseId, '', '');
    this.endPoints = tables.map(table => {
      return {
        id: table,
        name: table
      };
    });
    this.isEndPointLoading = false;
    DataSourceModule.setTableNames(tables);
  }

  isValidSource() {
    this.isSingleTable ? this.validSingleTableForm() : this.validMultiTableForm();
    return true;
  }

  validMultiTableForm() {
    if (StringUtils.isEmpty(this.syncedJob.advertiserId)) {
      this.advertiserIdError = 'Advertiser is required!';
      throw new DIException('');
    }
  }

  validSingleTableForm() {
    if (StringUtils.isEmpty(this.syncedJob.advertiserId)) {
      this.advertiserIdError = 'Advertiser is required!';
      throw new DIException('');
    }
    if (StringUtils.isEmpty(this.syncedJob.tikTokEndPoint)) {
      this.endPointError = 'End point is required!';
      throw new DIException('');
    }
    if (this.syncedJob.isTiktokReport) {
      if (StringUtils.isEmpty(this.syncedJob.tikTokReport?.reportType)) {
        this.reportError = 'Report is required!';
        throw new DIException('');
      }
    }
  }

  private async selectAdvertiseId(id: string) {
    try {
      this.syncedJob.advertiserId = id;
      this.advertiserIdError = '';
      // await this.loadEndPoints(this.syncedJob.sourceId, this.syncedJob.advertiserId);
      // if (ListUtils.hasOnlyOneItem(this.endPointError)) {
      //   this.selectEndPoint(this.endPoints![0].id);
      // }
    } catch (ex) {
      Log.error(ex);
      this.endPoints = [];
    } finally {
      this.isAdvertiserLoading = false;
    }
  }

  private resetAdvertiserIdError() {
    this.advertiserIdError = '';
  }

  private resetEndPointError() {
    this.endPointError = '';
  }

  private resetReportError() {
    this.reportError = '';
  }

  private handleSelectReportType(reportType: string) {
    this.resetReportError();
    this.selectDatabase(this.defaultTiktokDBName);
    this.selectTable(`report_${StringUtils.toSnakeCase(reportType)}`);
  }
}
</script>

<style lang="scss" scoped>
.color-di-primary {
  color: #597fff !important;
}
</style>
