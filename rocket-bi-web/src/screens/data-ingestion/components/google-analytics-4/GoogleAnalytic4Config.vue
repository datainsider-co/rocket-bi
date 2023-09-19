<template>
  <div class="google-analytics-config">
    <!--    From Table-->
    <div class="job-section">
      <label>Google Analytics account</label>
      <div class="input">
        <DiDropdown
          :data="accountSummaries"
          id="account-summarize"
          valueProps="account"
          label-props="displayName"
          placeholder="Select Google Analytics account..."
          boundary="viewport"
          :class="{ 'is-invalid': accountIdError }"
          @selected="handleSelectAccountSummarize"
          @change="resetAccountIdError"
          v-model="syncedJob.accountId"
          appendAtRoot
        >
          <template #icon-dropdown>
            <div v-if="isPropertyLoading" class="loading">
              <i class="fa fa-spinner fa-spin"></i>
            </div>
          </template>
        </DiDropdown>
      </div>
      <div class="text-danger mt-1">{{ accountIdError }}</div>
    </div>
    <div class="job-section">
      <label>Property</label>
      <div class="input">
        <DiDropdown
          :data="propertySummaries"
          id="ga-4-property"
          valueProps="property"
          label-props="displayName"
          v-model="property"
          :class="{ 'is-invalid': propertyError }"
          placeholder="Select Property..."
          boundary="viewport"
          appendAtRoot
          @change="resetPropertyError"
        >
          <template #icon-dropdown>
            <div v-if="isPropertyLoading" class="loading">
              <i class="fa fa-spinner fa-spin"></i>
            </div>
          </template>
        </DiDropdown>
      </div>
      <div class="text-danger mt-1">{{ propertyError }}</div>
    </div>
    <div v-if="!hideSyncAllTableOption" class="d-flex job-section">
      <DiToggle id="ga-sync-all-table" :value="!isSingleTable" @onSelected="isSingleTable = !isSingleTable" label="Sync all tables"></DiToggle>
    </div>
    <b-collapse :visible="isSingleTable" class="job-section">
      <label>Google Analytics Table</label>
      <div class="input">
        <DiDropdown
          id="ga-table"
          v-model="syncedJob.tableName"
          labelProps="name"
          valueProps="id"
          :data="gaTables"
          :class="{ 'is-invalid': tableError }"
          placeholder="Select Google Analytics Table..."
          boundary="viewport"
          appendAtRoot
          @selected="handleSelectGATable"
          @change="resetTableError"
        />
      </div>
      <div class="text-danger mt-1">{{ tableError }}</div>
    </b-collapse>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import {
  DataSourceInfo,
  DimensionInfo,
  FormMode,
  Ga4Dimension,
  GA4Job,
  GA4Metric,
  GoogleAnalyticJob,
  Job,
  MetricInfo,
  TokenRequest,
  TokenResponse
} from '@core/data-ingestion';
import { Inject } from 'typescript-ioc';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { Log } from '@core/utils';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { Status } from '@/shared';
import DiToggle from '@/shared/components/common/DiToggle.vue';
import { GoogleUtils, ListUtils, PopupUtils, StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { GoogleAnalyticTables } from '@/screens/data-ingestion/components/google-analytics/GoogleAnalyticTables';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { DataSourceResponse } from '@core/data-ingestion/domain/response/DataSourceResponse';
import { GASourceInfo } from '@core/data-ingestion/domain/data-source/GASourceInfo';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { GoogleAnalytic4Tables } from './GoogleAnalytic4Tables';
import { GA4SourceInfo } from '@core/data-ingestion/domain/data-source/GA4SourceInfo';

interface PropertyItem {
  id: string;
  name: string;
  accountId: string;
}

@Component({
  components: { DiInputComponent, DiToggle, DiCalendar }
})
export default class GoogleAnalytic4Config extends Vue {
  private propertyStatus: Status = Status.Loaded;
  private readonly gaTables = GoogleAnalytic4Tables;

  private accountSummaries: gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaAccountSummary[] = [];
  private property = '';

  private tableError = '';
  private accountIdError = '';
  private propertyError = '';

  @Inject
  private readonly sourcesService!: DataSourceService;
  @PropSync('job')
  syncedJob!: GA4Job;

  @PropSync('singleTable')
  isSingleTable!: boolean;

  @Prop({ required: false, default: false, type: Boolean })
  hideSyncAllTableOption!: boolean;

  private get propertySummaries(): gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaPropertySummary[] {
    const selectedAccountSummarize = this.accountSummaries.find(accountSummarize => accountSummarize.account === this.syncedJob.accountId);
    return selectedAccountSummarize ? selectedAccountSummarize?.propertySummaries ?? [] : [];
  }

  beforeDestroy() {
    DataSourceModule.setTableNames([]);
  }

  async mounted() {
    Log.debug('GoogleAnalyticConfig::mounted');
  }

  private get sources(): DataSourceResponse[] {
    return DataSourceModule.dataSources;
  }

  @Watch('sources')
  async onDataSourceLoaded() {
    if (this.syncedJob.jobId !== Job.DEFAULT_ID) {
      this.property = `properties/${this.syncedJob.propertyId}`;
      await this.loadData();
    }
  }

  @Watch('property')
  onPropertyChanged(property: string) {
    Log.debug('GoogleAnalytic4Config::onPropertyChanged::', property);
    this.syncedJob.propertyId = this.getPropertyId(property);
  }

  private async loadAccountSummarizes() {
    const accountSummarizeResponse = await GoogleUtils.getGA4AccountSummarizes();
    Log.debug('GA4JobFormRender::loadAccountSummarizes::accountSummarizes::', accountSummarizeResponse.result.accountSummaries);
    if (accountSummarizeResponse?.result?.accountSummaries) {
      this.accountSummaries = accountSummarizeResponse.result.accountSummaries;
      if (StringUtils.isEmpty(this.syncedJob.accountId)) {
        const firstAccountSummarize = ListUtils.getHead(this.accountSummaries);
        this.syncedJob.accountId = firstAccountSummarize?.account ?? '';
        if (firstAccountSummarize && StringUtils.isEmpty(this.property)) {
          this.property = ListUtils.getHead(firstAccountSummarize?.propertySummaries ?? [])?.property ?? '';
        }
      }
    }
  }

  private async handleSelectAccountSummarize(item: gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaAccountSummary) {
    if (StringUtils.isEmpty(this.syncedJob.propertyId)) {
      this.syncedJob.propertyId = ListUtils.getHead(this.propertySummaries)?.property ?? '';
    }
  }

  private getPropertyId(property: string): string {
    return property.split('/')[1]!;
  }

  private handleSelectGATable(table: { id: string; name: string; metrics: GA4Metric[]; dimensions: Ga4Dimension[] }) {
    this.syncedJob.metrics = table.metrics;
    this.syncedJob.dimensions = table.dimensions;

    this.selectDatabase();
    this.selectTable(table.id);
  }

  private selectDatabase() {
    const selectedAccountSummarize = this.accountSummaries.find(accountSummarize => accountSummarize.account === this.syncedJob.accountId);
    const foundProperty = this.propertySummaries.find(prop => prop.property === this.property);
    if (StringUtils.isEmpty(this.syncedJob.destDatabaseName) && foundProperty) {
      const accountName = selectedAccountSummarize ? StringUtils.toSnakeCase(selectedAccountSummarize?.displayName ?? 'ga_4') : 'ga_4';
      const propertyName = foundProperty ? StringUtils.toSnakeCase(foundProperty?.displayName ?? '') : '';
      let dbName = `${accountName}`;
      if (propertyName) {
        dbName = dbName + `_${propertyName}`;
      }
      Log.debug('GoogleAnalytic4Config::selectDatabase::', dbName);
      this.$emit('selectDatabase', dbName);
    }
  }

  private selectTable(tblName: string) {
    if (StringUtils.isEmpty(this.syncedJob.destTableName) && this.isSingleTable) {
      this.$emit('selectTable', tblName);
    }
  }

  @Watch('isSingleTable')
  handleSyncWithAllTables(isSingle: boolean) {
    if (!isSingle) {
      this.selectDatabase();
    }
  }

  async loadData(): Promise<void> {
    try {
      Log.debug('GoogleAnalyticConfig::loadData::', DataSourceModule.dataSources);
      this.showPropertyLoading();
      const sourceResponse: DataSourceResponse | undefined = DataSourceModule.dataSources.find(source => source.dataSource.id === this.syncedJob.sourceId);
      if (sourceResponse) {
        const gaSource = sourceResponse.dataSource as GASourceInfo;
        const tokenResponse: TokenResponse = await this.sourcesService.refreshGoogleToken(new TokenRequest(gaSource.accessToken, gaSource.refreshToken));
        await GoogleUtils.loadGA4Client(window.appConfig.GOOGLE_API_KEY, tokenResponse.accessToken);
        await this.loadAccountSummarizes();
      }
      this.hidePropertyLoading();
    } catch (e) {
      this.propertyStatus = Status.Error;
      Log.error('GoogleAnalyticsJobFormRender::loadSuggestData::error::', e.message);
      PopupUtils.showError(e.message);
    }
  }

  private get isPropertyLoading() {
    return this.propertyStatus === Status.Loading;
  }

  private showPropertyLoading() {
    this.propertyStatus = Status.Loading;
  }

  private hidePropertyLoading() {
    this.propertyStatus = Status.Loaded;
  }

  isValidSource() {
    this.isSingleTable ? this.validSingleTableForm() : this.validMultiTableForm();
    return true;
  }

  validMultiTableForm() {
    if (StringUtils.isEmpty(this.syncedJob.accountId)) {
      this.accountIdError = 'Please select Google Analytics account.';
      throw new DIException('');
    }

    if (StringUtils.isEmpty(this.syncedJob.propertyId)) {
      this.propertyError = 'Please select Google Analytics property.';
      throw new DIException('');
    }
  }

  validSingleTableForm() {
    if (StringUtils.isEmpty(this.syncedJob.accountId)) {
      this.accountIdError = 'Please select Google Analytics account.';
      throw new DIException('');
    }

    if (StringUtils.isEmpty(this.syncedJob.propertyId)) {
      this.propertyError = 'Please select Google Analytics property.';
      throw new DIException('');
    }
    if (StringUtils.isEmpty(this.syncedJob.tableName)) {
      this.tableError = 'Please select Google Analytics dataset.';
      throw new DIException('');
    }
  }
  private resetTableError() {
    this.tableError = '';
  }
  private resetAccountIdError() {
    this.accountIdError = '';
  }
  private resetPropertyError() {
    this.propertyError = '';
  }
}
</script>

<style lang="scss">
.google-analytics-config {
  .di-input-component--input {
    height: 34px !important;
    > div {
      margin-right: 4.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      i {
        font-size: 14px !important;
      }
    }
  }

  .di-date-picker {
    input {
      height: 34px;
    }
  }
}
</style>
