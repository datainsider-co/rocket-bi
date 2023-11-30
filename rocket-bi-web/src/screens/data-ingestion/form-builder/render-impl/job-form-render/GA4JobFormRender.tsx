import { JobFormRender } from '@/screens/data-ingestion/form-builder/JobFormRender';
import { Job } from '@core/data-ingestion/domain/job/Job';
import { BFormInput } from 'bootstrap-vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { IdGenerator } from '@/utils/IdGenerator';
import { Log } from '@core/utils';
import { Status } from '@/shared';
import { DateTimeUtils, ListUtils } from '@/utils';
import { GoogleUtils } from '@/utils/GoogleUtils';
import { PopupUtils } from '@/utils/PopupUtils';
import DatePickerInput from '@/screens/data-ingestion/form-builder/render-impl/DatePickerInput.vue';
import '../scss/GoogleAnalyticsJobForm.scss';
import TagsInput from '@/shared/components/TagsInput.vue';
import moment from 'moment';
import { property } from 'lodash';
import DestDatabaseSuggestion from '@/screens/data-ingestion/form-builder/render-impl/dest-database-suggestion/DestDatabaseSuggestion.vue';
import SchedulerSettingV2 from '@/screens/data-ingestion/components/job-scheduler-form/SchedulerSettingV2.vue';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { StringUtils } from '@/utils/StringUtils';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import { Inject } from 'typescript-ioc';
import { SchemaService } from '@core/schema/service/SchemaService';
import { EventBus } from '@/event-bus/EventBus';
import { GaDate } from '@core/data-ingestion/domain/job/google-analytic/GaDate';
import { GA4Job } from '@core/data-ingestion/domain/job/ga4/GA4Job';
import { GA4Metric } from '@core/data-ingestion/domain/job/ga4/GA4Mertric';
import { Ga4Dimension } from '@core/data-ingestion/domain/job/ga4/Ga4Dimension';
import { GA4SourceInfo } from '@core/data-ingestion/domain/data-source/GA4SourceInfo';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { DataSourceResponse } from '@core/data-ingestion/domain/response/DataSourceResponse';
import { TokenRequest, TokenResponse } from '@core/data-ingestion';

enum GaDateMode {
  Today = 'Today',
  Yesterday = 'Yesterday',
  Date = 'Date'
}

export class GA4JobFormRender implements JobFormRender {
  protected gaJob: GA4Job;
  protected propertyStatus: Status = Status.Loaded;
  protected dimensionMetricStatus: Status = Status.Loaded;
  protected accountSummaries: gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaAccountSummary[] = [];
  protected selectedAccountSummarize: gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaAccountSummary | null = null;
  protected account = '';
  protected property = '';
  protected gaEndDateMode = GaDateMode.Today;

  protected isCreateDestDb = false;

  protected suggestedMetrics: GA4Metric[] = [];

  protected suggestedDimensions: Ga4Dimension[] = [];

  protected source: GA4SourceInfo | null = null;

  @Inject
  protected schemaService!: SchemaService;

  constructor(gaJob: GA4Job) {
    Log.debug('GA4JobFormRender::constructor::googleCredentialJob::', gaJob);
    this.gaJob = gaJob;
    this.initEndDateMode();
    this.handleLoadSuggestData();
  }

  protected initEndDateMode() {
    switch (this.endDate as GaDate) {
      case GaDate.Today: {
        this.gaEndDateMode = GaDateMode.Today;
        break;
      }
      case GaDate.Yesterday: {
        this.gaEndDateMode = GaDateMode.Yesterday;
        break;
      }
      default:
        this.gaEndDateMode = GaDateMode.Date;
    }
  }

  createJob(): Job {
    Log.debug('createJob::', this.gaJob);
    this.gaJob.dateRanges[0].startDate = DateTimeUtils.formatDate(this.gaJob.dateRanges[0].startDate);
    if (this.gaEndDateMode === GaDateMode.Date) this.gaJob.dateRanges[0].endDate = DateTimeUtils.formatDate(this.gaJob.dateRanges[0].endDate);
    return this.gaJob;
  }

  protected get endDateOptions() {
    return [
      {
        label: 'Today',
        value: GaDateMode.Today
      },
      {
        label: 'Yesterday',
        value: GaDateMode.Yesterday
      },
      {
        label: 'Custom',
        value: GaDateMode.Date
      }
    ];
  }

  protected get isCreateMode() {
    return this.gaJob.jobId === Job.DEFAULT_ID;
  }

  protected get displayName() {
    return this.gaJob.displayName;
  }

  protected set displayName(value: string) {
    this.gaJob.displayName = value;
  }

  protected get destDatabase() {
    return this.gaJob.destDatabaseName;
  }

  protected set destDatabase(value: string) {
    this.gaJob.destDatabaseName = value;
  }

  protected get destTable() {
    return this.gaJob.destTableName;
  }

  protected set destTable(value: string) {
    this.gaJob.destTableName = value;
  }

  protected get isLoadedProperty() {
    return this.propertyStatus === Status.Loaded;
  }
  protected get isPropertyLoading() {
    return this.propertyStatus === Status.Loading;
  }

  protected get isDimensionMetricLoading() {
    return this.dimensionMetricStatus === Status.Loading;
  }

  protected async handleLoadSuggestData() {
    try {
      this.showPropertyLoading();
      this.showDimensionMetricLoading();
      const response: DataSourceResponse | undefined = DataSourceModule.dataSources.find(source => source.dataSource.id === this.gaJob.sourceId);
      if (response) {
        const gaSource = response.dataSource as GA4SourceInfo;
        const tokenResponse: TokenResponse = await DataSourceModule.refreshGoogleToken(new TokenRequest(gaSource.accessToken, gaSource.refreshToken));
        await GoogleUtils.loadGA4Client(tokenResponse.accessToken);
        await this.loadAccountSummarizes();
      }
      await this.loadAllMetricsAndDimensions(this.property);
      this.hidePropertyLoading();
      this.showDimensionMetricLoading();
    } catch (e) {
      this.propertyStatus = Status.Error;
      this.account = 'No data';
      Log.error('GA4JobFormRender::loadSuggestData::error::', e.message);
      PopupUtils.showError(e.message);
    } finally {
      this.hideDimensionMetricLoading();
    }
  }

  protected async loadAccountSummarizes() {
    const accountSummarizeResponse = await GoogleUtils.getGA4AccountSummarizes();
    Log.debug('GA4JobFormRender::loadAccountSummarizes::accountSummarizes::', accountSummarizeResponse.result.accountSummaries);
    if (accountSummarizeResponse?.result?.accountSummaries) {
      this.accountSummaries = accountSummarizeResponse.result.accountSummaries;
      if (ListUtils.isNotEmpty(this.accountSummaries)) {
        this.updateAccountSummarize(this.accountSummaries[0]!);
      }
    }
  }

  protected updateAccountSummarize(accountSummary: gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaAccountSummary) {
    this.selectedAccountSummarize = accountSummary;
    if (ListUtils.isNotEmpty(accountSummary.propertySummaries)) {
      Log.debug('GA4JobFormRender::updateAccountSummarize::updatePropertySummarize');
      this.updatePropertySummarize(accountSummary.propertySummaries![0]!);
    }
  }

  protected updatePropertySummarize(propertySummary: gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaPropertySummary) {
    this.updateProperty(propertySummary!.property!);
    Log.debug('GA4JobFormRender::updatePropertySummarize::property::', this.property);
  }

  protected getPropertyId(property: string): string {
    return property.split('/')[1]!;
  }

  protected async loadAllMetricsAndDimensions(property: string) {
    this.showDimensionMetricLoading();
    const dimensionsAndMetrics: gapi.client.Response<gapi.client.analyticsdata.Metadata> = await GoogleUtils.getDimensionsAndMetrics(property);
    if (dimensionsAndMetrics?.result) {
      const result = dimensionsAndMetrics.result;
      this.updateSuggestedDimensions(result?.dimensions ?? []);
      this.updateSuggestedMetrics(result?.metrics ?? []);
    }
    this.hideDimensionMetricLoading();
  }

  protected updateSuggestedDimensions(dimensionMetadata: gapi.client.analyticsdata.DimensionMetadata[]) {
    const dimensionNames: Set<string> = new Set(this.dimensions.map(item => item.name));
    this.suggestedDimensions = dimensionMetadata.filter(item => !dimensionNames.has(item.apiName!)).map(dimension => new Ga4Dimension(dimension.apiName!));
  }

  protected updateSuggestedMetrics(metricMetadata: gapi.client.analyticsdata.MetricMetadata[]) {
    const metricNames: Set<string> = new Set(this.metrics.map(item => item.name));
    this.suggestedMetrics = metricMetadata
      .filter(item => !metricNames.has(item.apiName!))
      .map(metric => new GA4Metric(metric.apiName!, this.getMetricType(metric.type!)));
  }

  protected getMetricType(metricMetadataType: string): string {
    switch (metricMetadataType) {
      case 'TYPE_INTEGER':
        return 'int64';
      default:
        return 'float';
    }
  }

  protected async handleLoadCompatibleDimensionsAndMetrics(property: string, dimensions: Ga4Dimension[], metrics: GA4Metric[]) {
    try {
      this.showDimensionMetricLoading();
      const response = await GoogleUtils.compatibleDimensionsAndMetrics(property, dimensions, metrics);
      if (response.result) {
        this.updateSuggestedMetrics(this.getCompatibleMetrics(response.result?.metricCompatibilities ?? []));
        this.updateSuggestedDimensions(this.getCompatibleDimensions(response.result?.dimensionCompatibilities ?? []));
      }
    } catch (e) {
      this.updateSuggestedMetrics([]);
      this.updateSuggestedDimensions([]);
      Log.error('GA4JobFormRender::handleLoadCompatibleDimensionsAndMetrics::response::', e);
    } finally {
      this.hideDimensionMetricLoading();
    }
  }

  protected getCompatibleMetrics(metricCompatibilities: gapi.client.analyticsdata.MetricCompatibility[]): gapi.client.analyticsdata.MetricMetadata[] {
    return metricCompatibilities.filter(metric => metric.compatibility === 'COMPATIBLE').map(data => data.metricMetadata!);
  }

  protected getCompatibleDimensions(
    dimensionCompatibilities: gapi.client.analyticsdata.DimensionCompatibility[]
  ): gapi.client.analyticsdata.DimensionMetadata[] {
    return dimensionCompatibilities.filter(dimension => dimension.compatibility === 'COMPATIBLE').map(dimension => dimension.dimensionMetadata!);
  }

  protected showPropertyLoading() {
    this.propertyStatus = Status.Loading;
  }

  protected showDimensionMetricLoading() {
    this.dimensionMetricStatus = Status.Loading;
  }

  protected hidePropertyLoading() {
    this.propertyStatus = Status.Loaded;
  }

  protected hideDimensionMetricLoading() {
    this.dimensionMetricStatus = Status.Loaded;
  }

  protected validResponse(response: any) {
    if (response && response.result && !response.result.error) {
      return true;
    } else {
      return false;
    }
  }

  protected async handleSelectAccountSummarize(item: gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaAccountSummary) {
    this.updateAccountSummarize(item);
  }

  protected async handlePropertySelected(item: gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaPropertySummary) {
    try {
      this.updateProperty(item.property!);
    } catch (e) {
      Log.error('GA4JobFormRender::handlePropertySelected::error::', e.message);
      PopupUtils.showError(e.message);
    }
  }

  protected updateProperty(property: string) {
    this.property = property!;
    this.propertyId = this.getPropertyId(this.property);
    this.loadAllMetricsAndDimensions(property);
  }

  protected handleSelectEndDateOptions(dateMode: GaDateMode) {
    this.gaEndDateMode = dateMode;
    switch (dateMode) {
      case GaDateMode.Date: {
        this.endDate = new Date();
        break;
      }
      case GaDateMode.Today: {
        this.endDate = GaDate.Today;
        break;
      }
      case GaDateMode.Yesterday: {
        this.endDate = GaDate.Today;
        break;
      }
    }
  }

  @Track(TrackEvents.SelectGAView, {
    view_name: (_: GA4JobFormRender, args: any) => args[0].name
  })
  protected handleGrantSelected(item: DropdownData) {
    Log.debug('grant slected::', item);
    this.gaJob.propertyId = item.id;
  }

  protected get syncIntervalInMn(): number {
    return this.gaJob.syncIntervalInMn;
  }

  protected set syncIntervalInMn(value: number) {
    this.gaJob.syncIntervalInMn = value;
  }

  protected get startDate(): GaDate | Date | string {
    return this.gaJob.dateRanges[0].startDate;
  }

  protected set startDate(value: GaDate | Date | string) {
    Log.debug('startDAteChange::', value);
    this.gaJob.dateRanges[0].startDate = value;
  }

  protected get endDate(): GaDate | Date | string {
    return this.gaJob.dateRanges[0].endDate;
  }

  protected set endDate(value: GaDate | Date | string) {
    this.gaJob.dateRanges[0].endDate = value;
  }

  protected get propertyId(): string {
    return this.gaJob.propertyId;
  }

  protected set propertyId(value: string) {
    this.gaJob.propertyId = value;
  }

  protected get metrics(): GA4Metric[] {
    return this.gaJob.metrics;
  }

  protected set metrics(value: GA4Metric[]) {
    this.gaJob.metrics = value;
  }

  protected get dimensions(): Ga4Dimension[] {
    return this.gaJob.dimensions;
  }

  protected set dimensions(value: Ga4Dimension[]) {
    this.gaJob.dimensions = value;
  }

  // protected sortTags(): { name: string }[] {
  //   return this.gaJob.sorts.map(sort => {
  //     return { name: sort };
  //   });
  // }

  toDimensionsData(data: DropdownData): Ga4Dimension {
    return new Ga4Dimension(data?.name ?? '');
  }

  toMetricsData(data: DropdownData): GA4Metric {
    const name: string = data?.name ?? '';
    const dataType = data?.dataType ?? '';
    return new GA4Metric(name, dataType);
  }

  protected get suggestSorts(): Ga4Dimension[] {
    const metricsConvertToDimensions: Ga4Dimension[] = this.metrics.map(data => {
      return new Ga4Dimension(data.name);
    });
    return this.dimensions.concat(metricsConvertToDimensions);
  }

  protected get timeScheduler(): TimeScheduler {
    Log.debug('getSchedulerTime::', this.gaJob.scheduleTime);
    return this.gaJob.scheduleTime;
  }

  protected set timeScheduler(value: TimeScheduler) {
    this.gaJob.scheduleTime = value;
  }

  get accountNameClass() {
    return {
      'text-danger': this.propertyStatus === Status.Error
    };
  }

  protected handleDestinationDbChanged(name: string, isCreateNew: boolean) {
    const dbName = isCreateNew ? StringUtils.normalizeDatabaseName(name) : name;
    this.destDatabase = dbName;
    this.isCreateDestDb = isCreateNew;
    EventBus.destDatabaseNameChange(dbName, isCreateNew);
  }

  render(h: any): any {
    return (
      <div class="analytics-job-form-container">
        <div class="job-section">
          <div class="analytics-job-row-item">
            <div class="title">Job name:</div>
            <div class="input">
              <BFormInput id="input-job-name" placeholder="Input display name" aucomplete="off" v-model={this.displayName} />
            </div>
          </div>
          <DestDatabaseSuggestion
            id="di-dest-database-selection"
            databaseLabel="Dest Database"
            tableLabel="Dest Table"
            databaseName={this.destDatabase}
            tableName={this.destTable}
            labelWidth={120}
            onChangeDatabase={(newName: string, isCreateNew: boolean) => {
              this.handleDestinationDbChanged(newName, isCreateNew);
            }}
            onChangeTable={(newName: string) => {
              this.destTable = StringUtils.toSnakeCase(newName);
            }}
          />
          {!this.timeScheduler ?? (
            <div class="analytics-job-row-item">
              <div class="title">Sync interval:</div>
              <div class="input">
                <BFormInput placeholder="Input destination table" aucomplete="off" v-model={this.syncIntervalInMn} />
              </div>
            </div>
          )}
          {this.timeScheduler && (
            <SchedulerSettingV2
              class="mt-2"
              schedulerTime={this.timeScheduler}
              onChange={(schedulerTime: TimeScheduler) => {
                Log.debug('ChangeScheduler::', schedulerTime);
                this.timeScheduler = schedulerTime;
              }}
            />
          )}
        </div>

        {this.isCreateMode && (
          <div>
            <div class="job-section">
              <div class="section-title">Select a view</div>
              <div class="analytics-job-row-item">
                <div class="title">Account:</div>
                <div class="input">
                  <DiDropdown
                    data={this.accountSummaries}
                    id={IdGenerator.generateDropdownId('account-summarize')}
                    valueProps="name"
                    label-props="displayName"
                    onSelected={(item: gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaAccountSummary) => this.handleSelectAccountSummarize(item)}
                    value={this.selectedAccountSummarize?.name}>
                    <template slot="icon-dropdown">
                      {this.isPropertyLoading ? (
                        <i alt="dropdown" class="fa fa-spin fa-spinner text-muted"></i>
                      ) : (
                        <i alt="dropdown" class="di-icon-arrow-down text-muted"></i>
                      )}
                    </template>
                  </DiDropdown>
                </div>
              </div>
              <div class="analytics-job-row-item">
                <div class="title">Property:</div>
                <div class="input">
                  <DiDropdown
                    data={this.selectedAccountSummarize ? this.selectedAccountSummarize.propertySummaries : []}
                    id={IdGenerator.generateDropdownId('property')}
                    valueProps="property"
                    label-props="displayName"
                    onSelected={(item: gapi.client.analyticsadmin.GoogleAnalyticsAdminV1betaPropertySummary) => this.handlePropertySelected(item)}
                    value={this.property}>
                    <template slot="icon-dropdown">
                      {this.isPropertyLoading ? (
                        <i alt="dropdown" class="fa fa-spin fa-spinner text-muted"></i>
                      ) : (
                        <i alt="dropdown" class="di-icon-arrow-down text-muted"></i>
                      )}
                    </template>
                  </DiDropdown>
                </div>
              </div>
            </div>
            <div class="job-section">
              <div class="section-title">Set the query parameters</div>
              <div class="analytics-job-row-item">
                <div class="title">Start-date:</div>
                <div class="input">
                  <DatePickerInput
                    value={moment(this.startDate).toDate()}
                    onChange={(date: Date) => {
                      this.startDate = date;
                      TrackingUtils.track(TrackEvents.SelectStartDate, { start_date: (date as Date).getTime() });
                    }}
                  />
                </div>
              </div>
              <div class="analytics-job-row-item">
                <div class="title">End-date:</div>
                <div class="input">
                  <DiDropdown
                    data={this.endDateOptions}
                    id={IdGenerator.generateDropdownId('ga-end-date')}
                    valueProps="value"
                    label-props="label"
                    onChange={(dateMode: GaDateMode) => this.handleSelectEndDateOptions(dateMode)}
                    value={this.gaEndDateMode}
                  />
                  {this.gaEndDateMode === GaDateMode.Date && (
                    <div class="pt-2">
                      <DatePickerInput
                        value={moment(this.endDate).toDate()}
                        onChange={(date: Date) => {
                          this.endDate = date;
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div class="analytics-job-row-item">
                <div class="title">Metrics:</div>
                <div class="input">
                  <TagsInput
                    id="metric"
                    defaultTags={this.metrics}
                    labelProp="name"
                    addOnlyFromAutocomplete={true}
                    suggestTags={this.suggestedMetrics}
                    isLoading={this.isDimensionMetricLoading}
                    onTagsChanged={(newTags: DropdownData[]) => {
                      this.metrics = newTags.map(data => this.toMetricsData(data));
                      this.handleLoadCompatibleDimensionsAndMetrics(this.property, this.dimensions, this.metrics);
                      Log.debug('newMetrics', newTags);
                      TrackingUtils.track(TrackEvents.GAMetricsChange, { metrics: newTags.map(data => data.expression).join(',') });
                    }}
                  />
                </div>
              </div>
              <div class="analytics-job-row-item">
                <div class="title">Dimensions:</div>
                <div class="input">
                  <TagsInput
                    id="dimension"
                    defaultTags={this.dimensions}
                    labelProp="name"
                    suggestTags={this.suggestedDimensions}
                    allowEitTags={true}
                    isLoading={this.isDimensionMetricLoading}
                    addOnlyFromAutocomplete={true}
                    onTagsChanged={(newTags: DropdownData[]) => {
                      this.dimensions = newTags.map(data => this.toDimensionsData(data));
                      Log.debug('newDimentions', newTags);
                      this.handleLoadCompatibleDimensionsAndMetrics(this.property, this.dimensions, this.metrics);
                      TrackingUtils.track(TrackEvents.GADimensionChange, { dimensions: newTags.map(data => data.name).join(',') });
                    }}
                  />
                </div>
              </div>
              {/*<div class="analytics-job-row-item">*/}
              {/*  <div class="title">Sorts:</div>*/}
              {/*  <div class="input">*/}
              {/*    <TagsInput*/}
              {/*      id="sort"*/}
              {/*      defaultTags={this.sortTags()}*/}
              {/*      suggestTags={this.suggestSorts}*/}
              {/*      labelProp="name"*/}
              {/*      addOnlyFromAutocomplete={true}*/}
              {/*      allowEitTags={true}*/}
              {/*      isLoading={this.isDimensionMetricLoading}*/}
              {/*      onTagsChanged={(newTags: DropdownData[]) => {*/}
              {/*        const newSorts: string[] = newTags.map(data => data?.name);*/}
              {/*        this.gaJob.sorts = [...newSorts];*/}
              {/*        Log.debug('newSorts:', this.gaJob.sorts);*/}
              {/*      }}*/}
              {/*    />*/}
              {/*  </div>*/}
              {/*</div>*/}
            </div>
          </div>
        )}
      </div>
    );
  }
}
