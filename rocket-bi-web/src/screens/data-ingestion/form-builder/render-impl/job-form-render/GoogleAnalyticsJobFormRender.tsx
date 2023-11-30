import { JobFormRender } from '@/screens/data-ingestion/form-builder/JobFormRender';
import { Job } from '@core/data-ingestion/domain/job/Job';
import { BFormInput } from 'bootstrap-vue';
import { GoogleAnalyticJob } from '@core/data-ingestion/domain/job/google-analytic/GoogleAnalyticJob';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { IdGenerator } from '@/utils/IdGenerator';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { Log } from '@core/utils';
import { Status } from '@/shared';
import { DateTimeUtils, ListUtils } from '@/utils';
import { GoogleUtils } from '@/utils/GoogleUtils';
import { PopupUtils } from '@/utils/PopupUtils';
import DatePickerInput from '@/screens/data-ingestion/form-builder/render-impl/DatePickerInput.vue';
import '../scss/GoogleAnalyticsJobForm.scss';
import TagsInput from '@/shared/components/TagsInput.vue';
import { MetricInfo } from '@core/data-ingestion/domain/job/MetricInfo';
import { DimensionInfo } from '@core/data-ingestion/domain/job/DimensionInfo';
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
import { DataSourceResponse } from '@core/data-ingestion/domain/response/DataSourceResponse';
import { GASourceInfo } from '@core/data-ingestion/domain/data-source/GASourceInfo';
import { TokenRequest, TokenResponse } from '@core/data-ingestion';

enum GaDateMode {
  Today = 'Today',
  Yesterday = 'Yesterday',
  Date = 'Date'
}

export class GoogleAnalyticsJobFormRender implements JobFormRender {
  private gaJob: GoogleAnalyticJob;
  private suggestedProperties: DropdownData[] = [];
  private suggestedViews: DropdownData[] = [];
  private propertyStatus: Status = Status.Loaded;
  private viewStatus: Status = Status.Loading;
  private accountName = '';
  private property = '';
  private gaEndDateMode = GaDateMode.Today;

  private isCreateDestDb = false;

  private allMetrics = require(`@/screens/data-ingestion/constants/metrics.json`);

  private allDimensions = require(`@/screens/data-ingestion/constants/dimensions.json`);

  private gaCubes: Record<string, Record<string, number>> = require(`@/screens/data-ingestion/constants/ga-cubes.json`);

  @Inject
  private schemaService!: SchemaService;

  constructor(gaJob: GoogleAnalyticJob) {
    Log.debug('GoogleAnalyticsJobFormRender::constructor::googleCredentialJob::', gaJob);
    this.gaJob = gaJob;
    this.initEndDateMode();
    this.loadSuggestData();
  }

  private initEndDateMode() {
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

  private get endDateOptions() {
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

  private get isCreateMode() {
    return this.gaJob.jobId === Job.DEFAULT_ID;
  }

  private get displayName() {
    return this.gaJob.displayName;
  }

  private set displayName(value: string) {
    this.gaJob.displayName = value;
  }

  private get destDatabase() {
    return this.gaJob.destDatabaseName;
  }

  private set destDatabase(value: string) {
    this.gaJob.destDatabaseName = value;
  }

  private get destTable() {
    return this.gaJob.destTableName;
  }

  private set destTable(value: string) {
    this.gaJob.destTableName = value;
  }

  private get isLoadedProperty() {
    return this.propertyStatus === Status.Loaded;
  }

  private get isLoadedView() {
    return this.viewStatus === Status.Loaded;
  }

  private async loadSuggestData() {
    try {
      this.showPropertyLoading();
      this.showViewLoading();
      const response: DataSourceResponse | undefined = DataSourceModule.dataSources.find(source => source.dataSource.id === this.gaJob.sourceId);
      if (response) {
        const gaSource = response.dataSource as GASourceInfo;
        const tokenResponse: TokenResponse = await DataSourceModule.refreshGoogleToken(new TokenRequest(gaSource.accessToken, gaSource.refreshToken));
        await GoogleUtils.loadGoogleAnalyticClient(tokenResponse.accessToken);
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

  private suggestedDimensions(currentDimensions: DimensionInfo[], relatedColNames: Set<string>): DimensionInfo[] {
    const result: DimensionInfo[] = [];
    this.allDimensions.forEach((di: DimensionInfo) => {
      if (this.isValidDimension(di, currentDimensions, relatedColNames)) {
        result.push(di);
      }
    });
    return result;
  }

  private isValidDimension(dimension: DimensionInfo, currentDimensions: DimensionInfo[], relatedColNames: Set<string>) {
    if (relatedColNames.has(dimension.name)) {
      const foundDimension = currentDimensions.find(dim => dimension.name === dim.name);
      return foundDimension ? false : true;
    } else {
      return false;
    }
  }

  private suggestedMetrics(currentMetrics: MetricInfo[], relatedColNames: Set<string>): MetricInfo[] {
    const result: MetricInfo[] = [];
    this.allMetrics.forEach((metric: MetricInfo) => {
      if (this.isValidMetric(metric, currentMetrics, relatedColNames)) {
        result.push(metric);
      }
    });
    return result;
  }

  private isValidMetric(metric: MetricInfo, currentMetric: MetricInfo[], relatedColNames: Set<string>) {
    if (relatedColNames.has(metric.expression)) {
      const foundMetric = currentMetric.find(mt => metric.expression === mt.expression);
      return foundMetric ? false : true;
    } else {
      return false;
    }
  }

  private getValidRelatedColumns(
    gaCubes: Record<string, Record<string, number>>,
    currentDimensions: DimensionInfo[],
    currentMetrics: MetricInfo[]
  ): Set<string> {
    let result = new Set<string>();
    const metricColNames = currentMetrics.map(metric => metric.expression);
    const dimensionColNames = currentDimensions.map(di => di.name);
    for (const cubeKey in gaCubes) {
      const isValidCube = !metricColNames.concat(dimensionColNames).some(colName => !gaCubes[cubeKey][colName]);
      if (isValidCube) {
        result = new Set<string>([...result, ...Object.keys(gaCubes[cubeKey])]);
      }
    }
    Log.debug(`GoogleAnalyticsJobFormRender::getValidRelatedColumns::result::`, result);
    return result;
  }

  private async loadRefreshToken() {
    if (this.isCreateMode) {
      // const refreshToken = await DataSourceModule.getRefreshToken(this.gaJob.authorizationCode);
      // this.gaJob.refreshToken = refreshToken;
    }
  }

  private async processProperty(propertyResponse: any) {
    if (this.validResponse(propertyResponse)) {
      this.accountName = propertyResponse.result.username;
      const suggestedProperties = propertyResponse.result.items;
      const firstProperty = suggestedProperties[0];
      this.property = firstProperty.id;
      this.hideViewLoading();
      this.setSuggestedProperties(suggestedProperties);

      const accountId = firstProperty.accountId;
      const webPropertyId = this.property;
      await this.loadSuggestedViews(accountId, webPropertyId);
      this.hidePropertyLoading();
    } else {
      this.propertyStatus = Status.Error;
      this.viewStatus = Status.Error;
      this.accountName = 'No data';
    }
  }

  private showPropertyLoading() {
    this.propertyStatus = Status.Loading;
  }

  private showViewLoading() {
    this.viewStatus = Status.Loading;
  }

  private hideViewLoading() {
    this.propertyStatus = Status.Loaded;
  }

  private hidePropertyLoading() {
    this.viewStatus = Status.Loaded;
  }

  private validResponse(response: any) {
    if (response && response.result && !response.result.error && ListUtils.isNotEmpty(response.result.items)) {
      return true;
    } else {
      return false;
    }
  }

  private setSuggestedProperties(data: DropdownData[]) {
    this.suggestedProperties = data;
  }

  private setSuggestedViews(data: DropdownData[]) {
    this.suggestedViews = data;
  }

  private async loadSuggestedViews(accountId: string, webPropertyId: string) {
    const viewResponse: gapi.client.Response<gapi.client.analytics.Profiles> = await GoogleUtils.getGoogleAnalyticViewProperty(accountId, webPropertyId);
    Log.debug('viewsData::', viewResponse);
    if (this.validResponse(viewResponse)) {
      //@ts-ignore
      this.viewId = viewResponse?.result?.items[0].id;
      this.setSuggestedViews(viewResponse.result.items as DropdownData[]);
      Log.debug('viewsData::', this.suggestedViews);
    }
  }

  private async handlePropertySelected(item: DropdownData) {
    try {
      this.showViewLoading();
      this.property = item.id;
      const accountId = item.accountId;
      const webPropertyId = this.property;
      await this.loadSuggestedViews(accountId, webPropertyId);
      this.hidePropertyLoading();
    } catch (e) {
      this.viewStatus = Status.Error;
      Log.error('GoogleAnalyticsJobFormRender::handlePropertySelected::error::', e.message);
      PopupUtils.showError(e.message);
    } finally {
      TrackingUtils.track(TrackEvents.SelectGAProperty, { property_name: item.name });
    }
  }

  private handleSelectEndDateOptions(dateMode: GaDateMode) {
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

  private get viewId(): string | undefined {
    return this.gaJob.viewId;
  }

  private set viewId(value: string | undefined) {
    this.gaJob.viewId = value;
  }

  @Track(TrackEvents.SelectGAView, {
    view_name: (_: GoogleAnalyticsJobFormRender, args: any) => args[0].name
  })
  private handleGrantSelected(item: DropdownData) {
    Log.debug('grant slected::', item);
    this.gaJob.viewId = item.id;
  }

  private get syncIntervalInMn(): number {
    return this.gaJob.syncIntervalInMn;
  }

  private set syncIntervalInMn(value: number) {
    this.gaJob.syncIntervalInMn = value;
  }

  private get startDate(): GaDate | Date | string {
    return this.gaJob.dateRanges[0].startDate;
  }

  private set startDate(value: GaDate | Date | string) {
    Log.debug('startDAteChange::', value);
    this.gaJob.dateRanges[0].startDate = value;
  }

  private get endDate(): GaDate | Date | string {
    return this.gaJob.dateRanges[0].endDate;
  }

  private set endDate(value: GaDate | Date | string) {
    this.gaJob.dateRanges[0].endDate = value;
  }

  private get metrics(): MetricInfo[] {
    return this.gaJob.metrics;
  }

  private set metrics(value: MetricInfo[]) {
    this.gaJob.metrics = value;
  }

  private get dimensions(): DimensionInfo[] {
    return this.gaJob.dimensions;
  }

  private set dimensions(value: DimensionInfo[]) {
    this.gaJob.dimensions = value;
  }

  private get sorts(): string[] {
    return this.gaJob.sorts;
  }

  private set sorts(value: string[]) {
    this.gaJob.sorts = value;
  }
  private sortTags(): { name: string }[] {
    return this.gaJob.sorts.map(sort => {
      return { name: sort };
    });
  }

  toDimensionsData(data: DropdownData): DimensionInfo {
    return {
      name: data?.name ?? data.text
    };
  }

  toMetricsData(data: DropdownData): MetricInfo {
    const expression: string = data?.expression ?? data?.text ?? '';
    const alias: string = data?.alias ?? data?.text?.replaceAll(':', '_') ?? '';
    return {
      expression: expression.trim(),
      alias: alias.trim(),
      dataType: data?.dataType ?? 'float'
    };
  }

  private get suggestSorts(): DimensionInfo[] {
    const metricsConvertToDimensions: DimensionInfo[] = this.metrics.map(data => {
      return { name: data.expression, histogramBuckets: [] };
    });
    return this.dimensions.concat(metricsConvertToDimensions);
  }

  private get timeScheduler(): TimeScheduler {
    Log.debug('getSchedulerTime::', this.gaJob.scheduleTime);
    return this.gaJob.scheduleTime;
  }

  private set timeScheduler(value: TimeScheduler) {
    this.gaJob.scheduleTime = value;
  }

  get accountNameClass() {
    return {
      'text-danger': this.propertyStatus === Status.Error
    };
  }

  private handleDestinationDbChanged(name: string, isCreateNew: boolean) {
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
                  {!this.isLoadedProperty && (
                    <div class="fake-item">{this.propertyStatus === Status.Loading && <span class="fa fa-spin fa-spinner text-right" />}</div>
                  )}
                  <BFormInput
                    style={{ 'pointer-events': 'none' }}
                    class={this.accountNameClass}
                    placeholder="Input account name"
                    autocomplete="off"
                    v-model={this.accountName}
                  />
                </div>
              </div>
              <div class="analytics-job-row-item">
                <div class="title">Property:</div>
                <div class="input">
                  {!this.isLoadedProperty && (
                    <div class="fake-item">
                      {this.propertyStatus === Status.Loading && <span class="fa fa-spin fa-spinner text-right" />}
                      {this.propertyStatus === Status.Error && <div class="text-danger">No data</div>}
                    </div>
                  )}
                  <DiDropdown
                    data={this.suggestedProperties}
                    id={IdGenerator.generateDropdownId('property')}
                    valueProps="id"
                    label-props="name"
                    onSelected={(item: DropdownData) => this.handlePropertySelected(item)}
                    value={this.property}
                  />
                </div>
              </div>
              <div class="analytics-job-row-item">
                <div class="title">View:</div>
                <div class="input">
                  {!this.isLoadedView && (
                    <div class="fake-item">
                      {this.propertyStatus === Status.Loading && <span class="fa fa-spin fa-spinner text-right" />}
                      {this.propertyStatus === Status.Error && <div class="text-danger">No data</div>}
                    </div>
                  )}
                  <DiDropdown
                    data={this.suggestedViews}
                    id={IdGenerator.generateDropdownId('view')}
                    valueProps="id"
                    label-props="name"
                    onSelected={(item: DropdownData) => this.handleGrantSelected(item)}
                    value={this.viewId}
                  />
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
                    labelProp="expression"
                    suggestTags={this.suggestedMetrics(this.metrics, this.getValidRelatedColumns(this.gaCubes, this.dimensions, this.metrics))}
                    onTagsChanged={(newTags: DropdownData[]) => {
                      const newMetrics: MetricInfo[] = newTags.map(data => this.toMetricsData(data));
                      this.gaJob.metrics = newMetrics;
                      Log.debug('newMetrics', this.gaJob.metrics);
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
                    suggestTags={this.suggestedDimensions(this.dimensions, this.getValidRelatedColumns(this.gaCubes, this.dimensions, this.metrics))}
                    allowEitTags={true}
                    onTagsChanged={(newTags: DropdownData[]) => {
                      const newDimensions: DimensionInfo[] = newTags.map(data => this.toDimensionsData(data));
                      this.gaJob.dimensions = newDimensions;
                      Log.debug('newDimentions', newTags);
                      TrackingUtils.track(TrackEvents.GADimensionChange, { dimensions: newTags.map(data => data.name).join(',') });
                    }}
                  />
                </div>
              </div>
              <div class="analytics-job-row-item">
                <div class="title">Sorts:</div>
                <div class="input">
                  <TagsInput
                    id="sort"
                    defaultTags={this.sortTags()}
                    suggestTags={this.suggestSorts}
                    labelProp="name"
                    addOnlyFromAutocomplete={true}
                    allowEitTags={true}
                    onTagsChanged={(newTags: DropdownData[]) => {
                      const newSorts: string[] = newTags.map(data => data?.name);
                      this.gaJob.sorts = [...newSorts];
                      Log.debug('newSorts:', this.gaJob.sorts);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
