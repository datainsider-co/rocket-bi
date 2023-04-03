<template>
  <EtlModal
    ref="modal"
    :actionName="actionName"
    :borderCancel="true"
    :loading="isLoading"
    :width="468"
    backdrop="static"
    class="job-creation-modal"
    @hidden="handleHidden"
    @submit="handleSubmitJob"
  >
    <template #header>
      <div class="mr-auto">
        <h4 class="title">{{ modalTitle }}</h4>
        <h6 class="sub-title">Config information for Job</h6>
      </div>
    </template>
    <div v-if="isShowModal" class="job-creation-modal-body">
      <vuescroll :ops="scrollOption">
        <div class="scroll-body">
          <div class="job-section">
            <label>Job name</label>
            <div class="input">
              <BFormInput v-model="jdbcJob.displayName" autocomplete="off" autofocus placeholder="Input job name"></BFormInput>
              <template v-if="$v.jdbcJob.sourceId.$error">
                <div class="error-message mt-1">Job name is required.</div>
              </template>
            </div>
          </div>
          <div class="job-section">
            <div class="input">
              <DataSourceConfig :job.sync="jdbcJob" @selected="handleSelectDataSource" />
              <BigQueryExtraForm
                v-if="isBigQueryJob"
                :big-query-job.sync="jdbcJob"
                :database-loading.sync="fromDatabaseLoading"
                :table-loading.sync="fromTableLoading"
                class="form-custom"
              />
              <template v-if="isJdbcJob">
                <JdbcFromDatabaseSuggestion
                  ref="jdbcFromDatabaseSuggestion"
                  :database-loading.sync="fromDatabaseLoading"
                  :jdbc-job.sync="jdbcJob"
                  :table-loading.sync="fromTableLoading"
                  class="mt-3 form-custom"
                  @selectDatabase="fromDatabaseChanged"
                  @selectTable="fromTableChanged"
                ></JdbcFromDatabaseSuggestion>
              </template>
              <template v-if="isGenericJdbcJob">
                <GenericJdbcFromDatabaseSuggestion
                  ref="genericJdbcFromDatabaseSuggestion"
                  :database-loading.sync="fromDatabaseLoading"
                  :generic-jdbc-job.sync="jdbcJob"
                  :table-loading.sync="fromTableLoading"
                  class="mt-3 form-custom"
                  @selectDatabase="fromDatabaseChanged"
                  @selectTable="fromTableChanged"
                ></GenericJdbcFromDatabaseSuggestion>
              </template>
              <template v-if="isMongoJob">
                <MongoFromDatabaseSuggestion
                  ref="mongoFromDatabaseSuggestion"
                  :database-loading.sync="fromDatabaseLoading"
                  :mongo-job.sync="jdbcJob"
                  :table-loading.sync="fromTableLoading"
                  class="mt-3 form-custom"
                  @selectDatabase="fromDatabaseChanged"
                  @selectTable="fromTableChanged"
                />
              </template>
              <template v-if="isBigQueryJob">
                <BigQueryFromDatabaseSuggestion
                  ref="bigQueryFromDatabaseSuggestion"
                  :big-query-job.sync="jdbcJob"
                  :database-loading.sync="fromDatabaseLoading"
                  :table-loading.sync="fromTableLoading"
                  class="mt-3 form-custom"
                  @selectDatabase="fromDatabaseChanged"
                  @selectTable="fromTableChanged"
                ></BigQueryFromDatabaseSuggestion>
              </template>
              <template v-if="isShopifyJob">
                <ShopifyFromDatabaseSuggestion
                  ref="shopifyFromDatabaseSuggestion"
                  :shopify-job.sync="jdbcJob"
                  :table-loading.sync="fromTableLoading"
                  class="mt-3 form-custom"
                  @selectTable="fromTableChanged"
                ></ShopifyFromDatabaseSuggestion>
              </template>
              <template v-if="isTiktokAdsJob">
                <TiktokSourceConfig
                  ref="tiktokSourceConfig"
                  :single-table="true"
                  :job.sync="jdbcJob"
                  hide-sync-all-table-option
                  @selectDatabase="fromDatabaseChanged"
                  @selectTable="fromTableChanged"
                />
              </template>
              <template v-if="isS3Job">
                <S3DataSourceConfig ref="s3FromSuggestion" :job.sync="jdbcJob" />
              </template>
            </div>
          </div>
          <div v-if="isGoogleAnalyticJob" class="job-section export-form">
            <GoogleAnalyticConfig ref="googleAnalyticConfig" :job.sync="jdbcJob" :single-table="true" :hide-sync-all-table-option="true"></GoogleAnalyticConfig>
          </div>
          <div v-if="isGoogleAnalytic4Job" class="job-section export-form">
            <GoogleAnalytic4Config
              ref="googleAnalytic4Config"
              :job.sync="jdbcJob"
              :single-table="true"
              :hide-sync-all-table-option="true"
            ></GoogleAnalytic4Config>
          </div>
          <div v-if="isMongoJob" class="job-section export-form">
            <MongoDepthConfig :mongo-job.sync="jdbcJob"></MongoDepthConfig>
          </div>
          <JobWareHouseConfig class="job-section export-form" ref="jobWareHouseConfig" :job.sync="jdbcJob" @changeDatabase="handleDestinationDbChanged" />
          <JobLakeConfig v-if="jdbcJob.isShowLakeConfig" :job.sync="jdbcJob" class="job-section export-form" />
          <div class="job-section">
            <JobSyncConfig ref="jobSyncModeConfig" :is-validate="isValidate" :job.sync="jdbcJob"></JobSyncConfig>
            <SchedulerSettingV2
              id="setting-job-scheduler"
              :scheduler-time="jdbcJob.scheduleTime"
              @change="
                newScheduler => {
                  jdbcJob.scheduleTime = newScheduler;
                }
              "
            />
          </div>
        </div>
      </vuescroll>
      <div v-if="isError" class="error-message text-left mb-1">{{ errorMessage }}</div>
    </div>
  </EtlModal>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import {
  DataDestination,
  DataSourceInfo,
  DataSources,
  DataSourceType,
  FormMode,
  GA4Job,
  GoogleAnalyticJob,
  JdbcJob,
  Job,
  JobType,
  SyncMode,
  TiktokSourceInfo
} from '@core/data-ingestion';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { DatabaseCreateRequest, DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import DestDatabaseSuggestion from '@/screens/data-ingestion/form-builder/render-impl/dest-database-suggestion/DestDatabaseSuggestion.vue';
import LakeHouseConfig from '@/screens/lake-house/views/job/output-form/LakeHouseConfig.vue';
import WareHouseConfig from '@/screens/lake-house/views/job/output-form/WareHouseConfig.vue';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import SchedulerSettingV2 from '@/screens/data-ingestion/components/job-scheduler-form/SchedulerSettingV2.vue';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import { JobModule } from '@/screens/data-ingestion/store/JobStore';
import { minValue, required } from 'vuelidate/lib/validators';
import { ApiExceptions, Status, VerticalScrollConfigs } from '@/shared';
import { PopupUtils } from '@/utils/PopupUtils';
import { Inject } from 'typescript-ioc';
import { SchemaService } from '@core/schema/service/SchemaService';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import JdbcDatabaseSuggestion from '@/screens/data-ingestion/components/JdbcFromDatabaseSuggestion.vue';
import JdbcFromDatabaseSuggestion from '@/screens/data-ingestion/components/JdbcFromDatabaseSuggestion.vue';
import BigQueryFromDatabaseSuggestion from '@/screens/data-ingestion/components/BigQueryFromDatabaseSuggestion.vue';
import { BigQueryJob } from '@core/data-ingestion/domain/job/BigQueryJob';
import BigQueryExtraForm from '@/screens/data-ingestion/BigQueryExtraForm.vue';
import { BigQuerySourceInfoV2 } from '@core/data-ingestion/domain/data-source/BigQuerySourceInfoV2';
import MongoFromDatabaseSuggestion from '@/screens/data-ingestion/mongo-job-form/MongoFromDatabaseSuggestion.vue';
import { MongoJob } from '@core/data-ingestion/domain/job/MongoJob';
import MongoDepthConfig from '@/screens/data-ingestion/mongo-job-form/MongoDepthConfig.vue';
import GenericJdbcFromDatabaseSuggestion from '@/screens/data-ingestion/components/generic-jdbc-job-form/GenericJdbcFromDatabaseSuggestion.vue';
import { GenericJdbcJob } from '@core/data-ingestion/domain/job/GenericJdbcJob';
import JobLakeConfig from '@/screens/data-ingestion/components/lake-config/JobLakeConfig.vue';
import JobSyncConfig from '@/screens/data-ingestion/components/sync-confg/JobSyncConfig.vue';
import DataSourceConfig from '@/screens/data-ingestion/components/DataSourceConfig.vue';
import JobWareHouseConfig from '@/screens/data-ingestion/components/warehouse-config/JobWareHouseConfig.vue';
import { cloneDeep } from 'lodash';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import ShopifyFromDatabaseSuggestion from '@/screens/data-ingestion/components/ShopifyFromDatabaseSuggestion.vue';
import { ShopifyJob } from '@core/data-ingestion/domain/job/ShopifyJob';
import S3DataSourceConfig from './s3-csv/S3DataSourceConfig.vue';
import { ChartUtils } from '@/utils';
import GoogleAnalyticConfig from '@/screens/data-ingestion/components/google-analytics/GoogleAnalyticConfig.vue';
import { GASourceInfo } from '@core/data-ingestion/domain/data-source/GASourceInfo';
import TiktokAdsFromDatabaseSuggestion from '@/screens/data-ingestion/components/TiktokAdsFromDatabaseSuggestion.vue';
import TiktokAdsSyncModeConfig from '@/screens/data-ingestion/components/tiktok/TiktokAdsSyncModeConfig.vue';
import TiktokSourceConfig from '@/screens/data-ingestion/components/tiktok/TiktokSourceConfig.vue';
import GoogleAnalytic4Config from './google-analytics-4/GoogleAnalytic4Config.vue';
import { GA4SourceInfo } from '@core/data-ingestion/domain/data-source/GA4SourceInfo';

@Component({
  components: {
    TiktokAdsSyncModeConfig,
    ShopifyFromDatabaseSuggestion,
    MongoFromDatabaseSuggestion,
    BigQueryExtraForm,
    BigQueryFromDatabaseSuggestion,
    JdbcFromDatabaseSuggestion,
    GenericJdbcFromDatabaseSuggestion,
    FromDatabaseSuggestion: JdbcDatabaseSuggestion,
    SingleChoiceItem,
    SchedulerSettingV2,
    WareHouseConfig,
    LakeHouseConfig,
    DestDatabaseSuggestion,
    EtlModal,
    DiDropdown,
    DynamicSuggestionInput,
    MongoDepthConfig,
    JobLakeConfig,
    JobSyncConfig,
    DataSourceConfig,
    JobWareHouseConfig,
    S3DataSourceConfig,
    GoogleAnalyticConfig,
    TiktokAdsFromDatabaseSuggestion,
    TiktokSourceConfig,
    GoogleAnalytic4Config
  },
  validations: {
    jdbcJob: {
      displayName: { required },
      sourceId: { minValue: minValue(1) }
    }
  }
})
export default class JobCreationModal extends Vue {
  private readonly jobName = JobName;
  private scrollOption = VerticalScrollConfigs;
  private jdbcJob: Job = JdbcJob.default(DataSourceInfo.default(DataSourceType.MySql));
  private isShowModal = false;
  private status = Status.Loaded;
  private errorMessage = '';
  private readonly syncMode = SyncMode;
  private isValidate = false;

  private fromDatabaseLoading = false;
  private fromTableLoading = false;

  private isCreateNewDatabase = false;
  private newDbDisplayName = '';
  @Inject
  private readonly schemaService!: SchemaService;

  @Ref()
  private readonly bigQueryFromDatabaseSuggestion!: BigQueryFromDatabaseSuggestion;

  @Ref()
  private readonly jdbcFromDatabaseSuggestion!: JdbcFromDatabaseSuggestion;

  @Ref()
  private readonly genericJdbcFromDatabaseSuggestion!: GenericJdbcFromDatabaseSuggestion;

  @Ref()
  private readonly mongoFromDatabaseSuggestion!: MongoFromDatabaseSuggestion;

  @Ref()
  private readonly shopifyFromDatabaseSuggestion!: ShopifyFromDatabaseSuggestion;

  @Ref()
  private readonly tiktokSourceConfig?: TiktokSourceConfig;

  @Ref()
  private readonly jobSyncModeConfig!: JobSyncConfig;

  @Ref()
  private readonly s3FromSuggestion!: S3DataSourceConfig;

  @Ref()
  //@ts-ignore
  private readonly destDatabase!: DestDatabaseSuggestion;

  private readonly fromDatabaseNameDefaultOption: any = {
    label: 'Select database please...',
    type: '',
    isDefaultLabel: true
  };

  private readonly fromTableNameDefaultOption: any = {
    label: 'Select table please...',
    type: '',
    isDefaultLabel: true
  };
  @Ref()
  private readonly modal!: EtlModal;

  @Ref()
  private readonly jobWareHouseConfig!: JobWareHouseConfig;

  @Ref()
  private readonly googleAnalyticConfig!: GoogleAnalyticConfig;

  @Ref()
  private readonly googleAnalytic4Config!: GoogleAnalytic4Config;

  private get actionName() {
    if (Job.getJobFormConfigMode(this.jdbcJob) === FormMode.Create) {
      return 'Add job';
    } else {
      return 'Save';
    }
  }

  private get isMobile() {
    return ChartUtils.isMobile();
  }

  private get modalTitle() {
    if (Job.getJobFormConfigMode(this.jdbcJob) === FormMode.Create) {
      return 'Add Job';
    } else {
      return 'Update Job';
    }
  }

  private get isEnableSyncToDataWarehouse() {
    return this.jdbcJob.destinations.some(dataDestination => dataDestination === DataDestination.Clickhouse);
  }

  private get isInValidSyncToDataWareHouse() {
    return !this.jobWareHouseConfig.isValidWarehouseConfig();
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  private get isError() {
    return this.status === Status.Error;
  }

  private get isJdbcJob(): boolean {
    return Job.isJdbcJob(this.jdbcJob);
  }

  private get isMongoJob(): boolean {
    return Job.isMongoJob(this.jdbcJob);
  }

  private get isGoogleAnalyticJob(): boolean {
    return Job.isGoogleAnalyticJob(this.jdbcJob);
  }

  private get isGoogleAnalytic4Job(): boolean {
    return Job.isGoogleAnalytic4Job(this.jdbcJob);
  }

  private get isGenericJdbcJob(): boolean {
    return Job.isGenericJdbcJob(this.jdbcJob);
  }

  private get isBigQueryJob(): boolean {
    return Job.isBigQueryJob(this.jdbcJob);
  }

  private get isShopifyJob(): boolean {
    return Job.isShopifyJob(this.jdbcJob);
  }

  private get isTiktokAdsJob() {
    return Job.isTiktokAdsJob(this.jdbcJob);
  }

  private get isS3Job(): boolean {
    return Job.isS3Job(this.jdbcJob);
  }

  async show(jdbcJob: Job) {
    this.jdbcJob = jdbcJob;
    this.isShowModal = true;
    //@ts-ignored
    this.modal.show();
    await this.loadFromData();
  }

  async loadFromData() {
    if (Job.getJobFormConfigMode(this.jdbcJob) === FormMode.Edit) {
      await this.$nextTick(async () => {
        try {
          this.fromDatabaseLoading = true;
          this.fromTableLoading = true;
          switch (this.jdbcJob.jobType) {
            case JobType.BigQuery:
              await this.bigQueryFromDatabaseSuggestion.handleLoadBigQueryFromData();
              break;
            case JobType.Mongo:
              await this.mongoFromDatabaseSuggestion.handleLoadMongoFromData();
              break;
            case JobType.GenericJdbc:
              await this.genericJdbcFromDatabaseSuggestion.handleLoadMongoFromData();
              break;
            case JobType.Shopify:
              await this.shopifyFromDatabaseSuggestion.handleLoadShopifyFromData();
              break;
            case JobType.S3:
            case JobType.GoogleAnalytics:
            case JobType.GA4:
              ///Nothing to do
              break;
            case JobType.Tiktok:
              await this.tiktokSourceConfig?.loadData();
              break;
            default:
              await this.jdbcFromDatabaseSuggestion.handleLoadJdbcFromData();
          }
        } catch (e) {
          Log.error('JobCreationModal::loadFromData::error::', e.message);
        } finally {
          this.fromDatabaseLoading = false;
          this.fromTableLoading = false;
        }
      });
    }
  }

  hide() {
    //@ts-ignored
    this.modal.hide();
  }

  handleHidden() {
    this.jdbcJob = JdbcJob.default(DataSourceInfo.default(DataSourceType.MySql));
    this.isShowModal = false;
    this.hideLoading();
    this.$v.$reset();
    this.isValidate = false;
    DataSourceModule.setDatabaseNames([]);
    DataSourceModule.setTableNames([]);
    DataSourceModule.setIncrementalColumns([]);
  }

  public async handleSelectGoogleServiceAccountSource(source: BigQuerySourceInfoV2) {
    this.jdbcJob = this.getJobFromBigQuerySource(source);
    this.fromDatabaseLoading = true;
    await DataSourceModule.loadDatabaseNames({
      id: source.id,
      projectName: (this.jdbcJob as BigQueryJob).projectName,
      location: (this.jdbcJob as BigQueryJob).location
    });
  }

  private hideLoading() {
    this.status = Status.Loaded;
  }

  private showError(message: string) {
    this.status = Status.Error;
    this.errorMessage = message;
  }

  private showLoading() {
    this.status = Status.Loading;
  }

  @AtomicAction()
  private async handleSubmitJob() {
    try {
      this.showLoading();
      const job: Job = this.jdbcJob;
      Log.debug('Submit Job', job);
      this.ensureJobConfig(job);
      if (this.isValidJob()) {
        await this.createDatabase(this.newDbDisplayName);
        await this.submitJob(job);
        this.$emit('submit');
        this.hide();
      }
      this.hideLoading();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('JobCreationModal::handleSubmitJobJob::exception::', exception.message);
    }
  }

  private ensureJobConfig(job: Job) {
    switch (job.className) {
      case JobName.MongoJob: {
        const flattenDepth = (job as MongoJob).flattenDepth;
        if (flattenDepth !== undefined && flattenDepth < 0) {
          throw new DIException('Flatten Column must be positive');
        }
        break;
      }
      default: {
        ///Nothing to do
      }
    }
  }

  private async createDatabase(name: string) {
    try {
      const databaseInfo = DatabaseSchemaModule.databaseInfos.find(db => db.name === name);
      if (this.isCreateNewDatabase && !databaseInfo) {
        const databaseInfo = await this.schemaService.createDatabase(new DatabaseCreateRequest(name, name));
        this.jdbcJob.destDatabaseName = databaseInfo.name;
        DatabaseSchemaModule.addNewDatabaseInfo(databaseInfo);
      }
    } catch (e) {
      const ex = DIException.fromObject(e);
      Log.error('MultiJobCreationModal::createDatabase::error::', e.message, 'reason::', e.reason);
      if (ex.reason === ApiExceptions.unauthorized) {
        return Promise.reject(new DIException('You have no permission to create database'));
      } else {
        return Promise.reject(ex);
      }
    }
  }

  private isValidJob() {
    this.isValidate = true;
    this.$v.$touch();
    if (this.$v.$invalid || !this.isValidFromDatabase() || !this.isValidSyncMode() || this.isInValidSyncToDataWareHouse) {
      return false;
    }
    return true;
  }

  private async submitJob(job: Job) {
    const jobConfigFormMode: FormMode = Job.getJobFormConfigMode(job);
    const clonedJob = cloneDeep(job);
    clonedJob.scheduleTime = TimeScheduler.toSchedulerV2(job.scheduleTime!);
    switch (jobConfigFormMode) {
      case FormMode.Create:
        await JobModule.create(clonedJob);
        break;
      case FormMode.Edit:
        await JobModule.update(clonedJob);
        break;
      default:
        throw new DIException(`Unsupported ${jobConfigFormMode} Job`);
    }
  }

  private async handleSelectDataSource(item: any) {
    try {
      if (item.source) {
        Log.debug('handleSelectSource::', item.source);
        switch (item.source.className as DataSources) {
          case DataSources.GoogleServiceAccountSource:
            await this.handleSelectGoogleServiceAccountSource(item.source);
            break;
          case DataSources.MongoDbSource:
            await this.handleSelectMongoSource(item.source);
            break;
          case DataSources.ShopifySource:
            await this.handleSelectShopifySource(item.source);
            break;
          case DataSources.JdbcSource: {
            if (item.source.sourceType === DataSourceType.GenericJdbc) {
              await this.handleSelectGenericJdbcSource(item.source);
            } else {
              await this.handleSelectJdbcSource(item.source);
            }
            break;
          }
          case DataSources.S3Source:
            break;
          case DataSources.GASource:
            await this.handleSelectGASource(item.source);
            break;
          case DataSources.TiktokAds:
            await this.handleSelectTiktokSource(item.source);
            break;
          case DataSources.GA4Source:
            await this.handleSelectGA4Source(item.source);
            break;
          default:
            await this.handleSelectJdbcSource(item.source);
        }
      }
    } catch (e) {
      PopupUtils.showError(e.message);
      Log.error('JobCreationModal::handleSelectDataSource::error::', e.message);
    } finally {
      this.fromDatabaseLoading = false;
    }
  }

  private getProjectId(credential: string): string {
    try {
      return JSON.parse(credential).project_id;
    } catch (e) {
      return '';
    }
  }

  private getJobFromBigQuerySource(source: BigQuerySourceInfoV2): BigQueryJob {
    const job = Job.default(source);
    const projectId = this.getProjectId(source.credential);
    const bigQueryJob = BigQueryJob.fromObject({ ...this.jdbcJob, jobType: job.jobType, projectName: projectId });
    bigQueryJob.datasetName = this.fromDatabaseNameDefaultOption.type;
    bigQueryJob.tableName = this.fromDatabaseNameDefaultOption.type;
    return bigQueryJob;
  }

  private async handleSelectJdbcSource(source: DataSourceInfo) {
    this.jdbcJob = this.getJobFromJdbcSource(source);
    this.fromDatabaseLoading = true;
    await DataSourceModule.loadDatabaseNames({ id: source.id });
  }

  private async handleSelectGASource(source: DataSourceInfo) {
    this.jdbcJob = this.getJobFromGASource(source as GASourceInfo);
    this.fromDatabaseLoading = true;
    await this.googleAnalyticConfig.loadData();
  }

  private getJobFromGASource(gaSourceInfo: GASourceInfo) {
    const jdbcJob = GoogleAnalyticJob.default();
    jdbcJob.jobId = this.jdbcJob.jobId;
    jdbcJob.sourceId = gaSourceInfo.id;
    jdbcJob.displayName = this.jdbcJob.displayName;
    return jdbcJob;
  }

  private async handleSelectGA4Source(source: DataSourceInfo) {
    this.jdbcJob = this.getJobFromGA4Source(source as GA4SourceInfo);
    this.$nextTick(async () => {
      await this.googleAnalytic4Config.loadData();
    });
  }

  private getJobFromGA4Source(gaSourceInfo: GA4SourceInfo) {
    const jdbcJob = GA4Job.default();
    jdbcJob.jobId = this.jdbcJob.jobId;
    jdbcJob.displayName = this.jdbcJob.displayName;
    jdbcJob.sourceId = gaSourceInfo.id;
    return jdbcJob;
  }

  private async handleSelectTiktokSource(source: TiktokSourceInfo) {
    Log.debug('handleSelectTiktokSource::', source);
    const jobId = this.jdbcJob.jobId;
    this.jdbcJob = Job.default(source).withDisplayName(this.jdbcJob.displayName);
    this.jdbcJob.sourceId = source.id;
    this.jdbcJob.jobId = jobId;
    this.$nextTick(async () => {
      await this.tiktokSourceConfig?.loadData();
    });
  }

  private async handleSelectMongoSource(source: DataSourceInfo) {
    this.jdbcJob = this.getJobFromMongoSource(source);
    Log.debug('handleSelectMongoSource::', this.jdbcJob);
    this.fromDatabaseLoading = true;
    await DataSourceModule.loadDatabaseNames({ id: source.id });
  }

  private async handleSelectShopifySource(source: DataSourceInfo) {
    this.jdbcJob = this.getJobFromShopifySource(source);
    Log.debug('handleSelectShopifySource::', this.jdbcJob);
    this.fromDatabaseLoading = true;
    await DataSourceModule.loadTableNames({ id: source.id, dbName: '' });
  }

  private async handleSelectGenericJdbcSource(source: DataSourceInfo) {
    this.jdbcJob = this.getJobFromGenericJdbcSource(source);
    Log.debug('handleSelectGenericSource::', this.jdbcJob);
    this.fromDatabaseLoading = true;
    await DataSourceModule.loadDatabaseNames({ id: source.id });
  }

  private getJobFromJdbcSource(jdbcSource: DataSourceInfo) {
    const job = Job.default(jdbcSource);
    const jdbcJob = JdbcJob.fromObject({ ...this.jdbcJob, jobType: job.jobType });
    jdbcJob.databaseName = this.fromDatabaseNameDefaultOption.type;
    jdbcJob.tableName = this.fromTableNameDefaultOption.type;
    return jdbcJob;
  }

  private getJobFromGenericJdbcSource(jdbcSource: DataSourceInfo) {
    const job = Job.default(jdbcSource);
    const jdbcJob = GenericJdbcJob.fromObject({ ...this.jdbcJob });
    jdbcJob.databaseName = this.fromDatabaseNameDefaultOption.type;
    jdbcJob.tableName = this.fromTableNameDefaultOption.type;
    Log.debug('jdbc::', jdbcJob);
    return jdbcJob;
  }

  private getJobFromMongoSource(mongoSource: DataSourceInfo) {
    const job = Job.default(mongoSource);
    const jdbcJob = MongoJob.fromObject({ ...this.jdbcJob, jobType: job.jobType });
    jdbcJob.databaseName = this.fromDatabaseNameDefaultOption.type;
    jdbcJob.tableName = this.fromTableNameDefaultOption.type;
    return jdbcJob;
  }

  private getJobFromShopifySource(shopifySource: DataSourceInfo) {
    const job = Job.default(shopifySource);
    const jdbcJob = ShopifyJob.fromObject({ ...this.jdbcJob, jobType: job.jobType });
    jdbcJob.tableName = this.fromTableNameDefaultOption.type;
    return jdbcJob;
  }

  private isValidFromDatabase() {
    switch (this.jdbcJob.jobType) {
      case JobType.BigQuery: {
        return this.bigQueryFromDatabaseSuggestion.isValidDatabaseSuggestion();
      }
      case JobType.Mongo:
        return this.mongoFromDatabaseSuggestion.isValidDatabaseSuggestion();
      case JobType.GenericJdbc:
        return this.genericJdbcFromDatabaseSuggestion.isValidDatabaseSuggestion();
      case JobType.Shopify:
        return this.shopifyFromDatabaseSuggestion.isValidDatabaseSuggestion();
      case JobType.S3:
        return this.s3FromSuggestion.isValidFromSuggestion();
      case JobType.GoogleAnalytics:
        return this.googleAnalyticConfig.isValidSource();
      case JobType.Tiktok:
        return this.tiktokSourceConfig?.isValidSource() ?? false;
      case JobType.GA4:
        return this.googleAnalytic4Config.isValidSource();
      default:
        return this.jdbcFromDatabaseSuggestion.isValidDatabaseSuggestion();
    }
  }

  private isValidSyncMode() {
    return this.jobSyncModeConfig.validSyncMode();
  }

  private handleDestinationDbChanged(name: string, isCreateNew: boolean) {
    this.isCreateNewDatabase = isCreateNew;
    this.newDbDisplayName = name;
  }

  private fromDatabaseChanged(dbName: string) {
    Log.debug('JobCreationModal::databaseFromChanged', dbName);
    if (this.isEnableSyncToDataWarehouse) {
      this.destDatabase.setDatabaseName(dbName);
    }
  }

  private fromTableChanged(tblName: string) {
    if (this.isEnableSyncToDataWarehouse) {
      this.destDatabase.setTableName(tblName);
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.job-creation-modal {
  .title {
    @include regular-text();
    font-size: 24px;
    margin-bottom: 4px;
  }

  .sub-title {
    margin-bottom: 12px;

    @media screen and (max-width: 500px) {
      display: none;
    }
  }

  .modal-dialog {
    margin: auto;
  }

  .modal-header {
    background: var(--secondary);
    border-bottom: solid 1px var(--primary) !important;
  }

  .modal-body {
    background: var(--secondary);
    padding: 0;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .mb-12px {
    margin-bottom: 12px;
  }

  .mt-12px {
    margin-top: 12px !important;
  }

  .select-container {
    margin-top: 0;
    height: 34px !important;

    .relative {
      height: 34px !important;

      > span {
        height: 34px !important;

        > button {
          height: 34px !important;
        }
      }
    }

    button {
      padding-left: 12px !important;
    }

    .dropdown-input-placeholder {
      //color: #a8aaaf !important;
    }
  }
}

.job-creation-modal-body {
  //height: 370px;
  width: 100%;

  @import '~@/screens/lake-house/views/job/output-form/OutputForm.scss';

  .job-section {
    //padding: 12px;
    text-align: left;
    background: var(--secondary);
    border-radius: 4px;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 16px;
    }

    &:first-child {
      margin-top: 16px;
    }

    > label {
      @include regular-text(0.23px, var(--text-color));
      font-size: 14px;
      margin-bottom: 12px;
      line-height: 1;
    }

    .export-form label {
      line-height: 1.4;
    }

    .input {
      input {
        height: 34px;
        background-color: var(--primary);
        padding-left: 12px;

        &::placeholder {
          @include regular-text(0.17px, #a8aaaf);
          font-size: 12px;
        }
      }

      .dropdown-input-placeholder.default-label,
      .dropdown-input-placeholder.use-placeholder {
        @include regular-text(0.17px);
        font-size: 12px;
        color: #a8aaaf !important;
      }

      #datasource-dropdown {
        height: 34px;
      }

      .database-suggestion-form {
        margin: 0;

        .form-group {
          margin-bottom: 0 !important;

          label {
            display: none;
          }

          > div {
            width: 100%;
          }

          .select-container {
            width: unset;
          }
        }
      }

      .di-calendar-input-container {
        background: var(--primary);
        border-radius: 4px;
        span {
          order: -1;
          width: 100%;
          .input-calendar {
            width: 100%;
            margin-left: 0;
            text-align: left;
          }
        }
      }
    }
  }

  .save-mode {
    display: none !important;
  }

  #data-warehouse-config {
    > div {
      margin-top: 12px;
    }
  }

  #data-lake-config {
    .input {
      margin-bottom: 0 !important;
    }

    .icon-block {
      padding: 4px !important;

      i {
        font-size: 16px;
      }
    }
  }

  #data-lake-config {
    .input-group-append {
      display: flex;
      align-items: center;
      background: var(--primary);
      border-radius: 4px;

      div {
        cursor: pointer;
        display: flex;
        align-content: stretch;
        height: 100%;
        padding: 9px 12px;
        background: var(--primary);
      }
    }
  }

  #sync-mode-radio-group {
    label {
      @include regular-text(0.23px, var(--text-color));
      font-size: 12px;
      margin-left: 8px;
    }

    input.form-check-input {
      transform: scale(1.264);
      height: unset;
    }
  }

  #setting-job-scheduler {
    //padding-top: 16px;
    padding-bottom: 8px;

    label {
      line-height: 1.4 !important;
    }

    .frequency-options > label {
      @include regular-text(0.23px, var(--text-color));
      font-size: 14px;
      line-height: 1;
      opacity: 1;
    }

    .frequency-setting .frequency-radio-item .bv-no-focus-ring {
      @media screen and (max-width: 500px) {
        flex-wrap: wrap;
        width: auto;

        .form-check-inline {
          padding-bottom: 4px;
        }
      }
    }

    .job-scheduler-form-group > label {
      opacity: 1;
      line-height: 1;
    }

    .frequency-setting {
      justify-content: left;
      align-items: start;
      flex-direction: column;

      > label {
        margin-bottom: 12px;
        line-height: 1;
      }

      .frequency-radio-item {
        width: 100%;

        .bv-no-focus-ring {
          width: 100%;
          justify-content: space-between;

          > .form-check-inline {
            display: flex;
            align-items: center;

            label {
              line-height: 1 !important;

              > span {
                @include regular-text(0.17px, var(--secondary-text-colir));
                line-height: 1;
              }
            }
          }

          .form-check-label {
            margin: 0;
            line-height: 1;
          }
        }
      }
    }
  }

  //.job-scheduler-form {
  //  .job-scheduler-form-group {
  //    label {
  //      opacity: 1;
  //    }
  //  }
  //}
  .error-message {
    color: var(--danger);
    background: var(--secondary);
    padding: 0 12px;
    word-break: break-word;
  }

  .dropdown-loading {
    position: relative;

    .loading {
      position: absolute;
      z-index: 10;
      top: 10px;

      width: 100%;
      //height: 100%;

      margin-left: auto;
      display: flex;
      align-items: center;
      justify-content: right;

      i {
        margin-right: 10px;
        background: var(--input-background-color);
      }
    }
  }

  .scroll-body {
    max-height: 371px;
    padding: 0 16px;
  }

  #location-dropdown {
    .dropdown-input-placeholder.default-label,
    .dropdown-input-placeholder {
      @include regular-text(0.17px);
      font-size: 14px;
    }
  }

  .form-custom {
    label {
      line-height: 1;
    }
  }
}
</style>
