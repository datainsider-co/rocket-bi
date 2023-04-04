<template>
  <div class="google-analytics-config">
    <!--    From Table-->
    <div class="job-section">
      <label>Google Analytics account</label>
      <div class="input">
        <DiInputComponent :id="genInputId('ga-count-name')" placeholder="Account name" autocomplete="off" :disabled="true" v-model="accountName" type="text">
          <template #suffix>
            <div v-if="isPropertyLoading">
              <i style="font-size: 16px" class="fa fa-spinner fa-spin"></i>
            </div>
          </template>
        </DiInputComponent>
      </div>
    </div>
    <div class="job-section">
      <label>Property</label>
      <div class="input">
        <DiDropdown
          :data="suggestedProperties"
          id="ga-property"
          valueProps="id"
          label-props="name"
          v-model="syncedJob.propertyId"
          :class="{ 'is-invalid': propertyError }"
          placeholder="Select Property..."
          boundary="viewport"
          @selected="handlePropertySelected"
          @change="resetPropertyError"
          appendAtRoot
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
    <div class="job-section">
      <label>View</label>
      <div class="input">
        <DiDropdown
          :data="suggestedViews"
          id="ga-view-id"
          valueProps="id"
          label-props="name"
          v-model="syncedJob.viewId"
          :class="{ 'is-invalid': viewIdError }"
          placeholder="Select View Id..."
          boundary="viewport"
          appendAtRoot
          @selected="resetViewIdError"
        >
          <template #icon-dropdown>
            <div v-if="isViewIdLoading" class="loading">
              <i class="fa fa-spinner fa-spin"></i>
            </div>
          </template>
        </DiDropdown>
      </div>
      <div class="text-danger mt-1">{{ viewIdError }}</div>
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
import { DataSourceInfo, DimensionInfo, FormMode, GoogleAnalyticJob, Job, MetricInfo, TokenRequest, TokenResponse } from '@core/data-ingestion';
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

interface PropertyItem {
  id: string;
  name: string;
  accountId: string;
}

@Component({
  components: { DiInputComponent, DiToggle, DiCalendar }
})
export default class GoogleAnalyticConfig extends Vue {
  private googleConfig = require('@/screens/data-ingestion/constants/google-config.json');
  private suggestedProperties: PropertyItem[] = [];
  private suggestedViews: DropdownData[] = [];
  private propertyStatus: Status = Status.Loaded;
  private viewStatus: Status = Status.Loading;
  private accountName = '';
  // private property = '';
  private readonly gaTables = GoogleAnalyticTables;

  private tableError = '';
  private viewIdError = '';
  private propertyError = '';

  @Inject
  private readonly sourcesService!: DataSourceService;
  @PropSync('job')
  syncedJob!: GoogleAnalyticJob;

  @PropSync('singleTable')
  isSingleTable!: boolean;

  @Prop({ required: false, default: false, type: Boolean })
  hideSyncAllTableOption!: boolean;

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
      await this.loadData();
    }
  }

  private handleSelectGATable(table: { id: string; name: string; metrics: MetricInfo[]; dimensions: DimensionInfo[] }) {
    this.syncedJob.metrics = table.metrics;
    this.syncedJob.dimensions = table.dimensions;
    this.selectDatabase();
    this.selectTable(table.id);
  }

  private selectDatabase() {
    const foundProperty = this.suggestedProperties.find(prop => prop.id === this.syncedJob.propertyId);
    const foundView = this.suggestedViews.find(view => view.id === this.syncedJob.viewId);
    if (StringUtils.isEmpty(this.syncedJob.destDatabaseName)) {
      const propertyName = foundProperty ? StringUtils.toSnakeCase(foundProperty.name) : '';
      const viewName = foundView ? StringUtils.toSnakeCase(foundView.name) : '';
      let dbName = `${propertyName}`;
      if (viewName) {
        dbName = dbName + `_${viewName}`;
      }
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
      this.showViewLoading();
      const sourceResponse: DataSourceResponse | undefined = DataSourceModule.dataSources.find(source => source.dataSource.id === this.syncedJob.sourceId);
      if (sourceResponse) {
        const gaSource = sourceResponse.dataSource as GASourceInfo;
        const tokenResponse: TokenResponse = await this.sourcesService.getGoogleToken(new TokenRequest(gaSource.accessToken, gaSource.refreshToken));
        await GoogleUtils.loadGoogleAnalyticClient(this.googleConfig.apiKey, tokenResponse.accessToken);
        const propertyResponse = await GoogleUtils.getGoogleAnalyticProperty('~all');
        Log.debug('response::', propertyResponse);
        await this.processProperty(propertyResponse);
      }
    } catch (e) {
      this.propertyStatus = Status.Error;
      this.viewStatus = Status.Error;
      this.accountName = 'No data';
      Log.error('GoogleAnalyticsJobFormRender::loadSuggestData::error::', e.message);
      PopupUtils.showError(e.message);
    }
  }

  private async processProperty(propertyResponse: any) {
    if (this.validResponse(propertyResponse)) {
      this.accountName = propertyResponse.result.username;
      this.suggestedProperties = propertyResponse.result.items;
      const firstProperty: PropertyItem | undefined = ListUtils.getHead(this.suggestedProperties);
      this.syncedJob.propertyId = firstProperty?.id ?? '';
      const listViews = await this.loadSuggestedViews(firstProperty?.accountId ?? '', this.syncedJob.propertyId);
      this.setSuggestedViews(listViews);
      if (StringUtils.isEmpty(this.syncedJob.viewId)) {
        this.syncedJob.viewId = ListUtils.getHead(listViews)?.id ?? '';
      }
      this.hideViewLoading();
      this.hidePropertyLoading();
    } else {
      this.propertyStatus = Status.Error;
      this.viewStatus = Status.Error;
      this.accountName = 'No data';
      PopupUtils.showError('Your account is not connected to Google Analytics');
    }
  }

  private async handlePropertySelected(item: DropdownData) {
    try {
      this.showViewLoading();
      this.syncedJob.propertyId = item.id;
      const accountId = item.accountId;
      const webPropertyId = this.syncedJob.propertyId;
      const listViews = await this.loadSuggestedViews(accountId, webPropertyId);
      this.setSuggestedViews(listViews);
      this.syncedJob.viewId = ListUtils.getHead(listViews)?.id ?? '';
      this.hideViewLoading();
    } catch (e) {
      this.viewStatus = Status.Error;
      Log.error('GoogleAnalyticsJobFormRender::handlePropertySelected::error::', e.message);
      PopupUtils.showError(e.message);
    } finally {
      TrackingUtils.track(TrackEvents.SelectGAProperty, { property_name: item.name });
    }
  }

  private async loadSuggestedViews(accountId: string, webPropertyId: string): Promise<DropdownData[]> {
    const viewResponse: gapi.client.Response<gapi.client.analytics.Profiles> = await GoogleUtils.getGoogleAnalyticViewProperty(accountId, webPropertyId);
    Log.debug('viewsData::', viewResponse);
    if (this.validResponse(viewResponse)) {
      return viewResponse.result.items as DropdownData[];
    } else {
      PopupUtils.showError('Can not load google analytics views.');
      return [];
    }
  }

  private setSuggestedViews(data: DropdownData[]) {
    this.suggestedViews = data;
  }

  private validResponse(response: any) {
    if (response && response.result && !response.result.error && ListUtils.isNotEmpty(response.result.items)) {
      return true;
    } else {
      return false;
    }
  }

  private get isViewIdLoading() {
    return this.viewStatus === Status.Loading;
  }

  private get isPropertyLoading() {
    return this.propertyStatus === Status.Loading;
  }

  private showPropertyLoading() {
    this.propertyStatus = Status.Loading;
  }

  private showViewLoading() {
    this.viewStatus = Status.Loading;
  }

  private hidePropertyLoading() {
    this.propertyStatus = Status.Loaded;
  }

  private hideViewLoading() {
    this.viewStatus = Status.Loaded;
  }

  isValidSource() {
    this.isSingleTable ? this.validSingleTableForm() : this.validMultiTableForm();
    return true;
  }

  validMultiTableForm() {
    if (StringUtils.isEmpty(this.syncedJob.viewId)) {
      this.viewIdError = 'Please select Google Analytics view id.';
      throw new DIException('');
    }

    if (StringUtils.isEmpty(this.syncedJob.propertyId)) {
      this.propertyError = 'Please select Google Analytics property.';
      throw new DIException('');
    }
  }

  validSingleTableForm() {
    if (StringUtils.isEmpty(this.syncedJob.viewId)) {
      this.viewIdError = 'Please select Google Analytics view id.';
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

  private get isCreateNew() {
    return Job.getJobFormConfigMode(this.syncedJob) === FormMode.Create;
  }

  private resetPropertyError() {
    this.propertyError = '';
  }

  private resetViewIdError() {
    this.viewIdError = '';
  }

  private resetTableError() {
    this.tableError = '';
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
