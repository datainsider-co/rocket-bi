<template>
  <EtlModal
    ref="modal"
    :actionName="actionName"
    :borderCancel="true"
    :loading="isLoading"
    :width="468"
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
      <vuescroll>
        <div class="scroll-body">
          <div class="job-section">
            <label>Job name</label>
            <div class="input">
              <BFormInput :id="genInputId('job-name')" v-model="job.displayName" autocomplete="off" autofocus placeholder="Input job name"></BFormInput>
              <template v-if="$v.job.displayName.$error">
                <div class="error-message mt-1">Job name is required.</div>
              </template>
            </div>
          </div>
          <div class="job-section">
            <div class="input">
              <DataSourceConfig :job.sync="job" @selected="handleSelectDataSource" />
              <S3DataSourceConfig :job.sync="job" ref="s3FromSuggestion" />
            </div>
          </div>

          <template>
            <JobWareHouseConfig
              class="job-section export-form"
              v-if="isSingleTable"
              ref="jobWareHouseConfig"
              :job.sync="job"
              :is-validate="isValidate"
              :is-in-valid-sync-to-data-ware-house="isInValidSyncToDataWareHouse"
              :is-invalid-destination-database="isInvalidDestinationDatabase"
              @changeDatabase="handleDestinationDbChanged"
            />
          </template>

          <JobLakeConfig :job.sync="job" class="job-section export-form" />
          <div class="job-section">
            <JobSyncConfig ref="jobSyncModeConfig" :is-validate="isValidate" :job.sync="job" :single-table="isSingleTable"></JobSyncConfig>
            <SchedulerSettingV2
              id="setting-job-scheduler"
              :scheduler-time="job.scheduleTime"
              @change="
                newScheduler => {
                  job.scheduleTime = newScheduler;
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
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import DataSourceConfig from '@/screens/data-ingestion/components/DataSourceConfig.vue';
import DynamicSuggestionInput from '@/screens/data-ingestion/components/DynamicSuggestionInput.vue';
import SchedulerSettingV2 from '@/screens/data-ingestion/components/job-scheduler-form/SchedulerSettingV2.vue';
import JobLakeConfig from '@/screens/data-ingestion/components/lake-config/JobLakeConfig.vue';
import S3DataSourceConfig from '@/screens/data-ingestion/components/s3-csv/S3DataSourceConfig.vue';
import JobSyncConfig from '@/screens/data-ingestion/components/sync-confg/JobSyncConfig.vue';
import JobWareHouseConfig from '@/screens/data-ingestion/components/warehouse-config/JobWareHouseConfig.vue';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';
import { JobModule } from '@/screens/data-ingestion/store/JobStore';
import LakeHouseConfig from '@/screens/lake-house/views/job/output-form/LakeHouseConfig.vue';
import WareHouseConfig from '@/screens/lake-house/views/job/output-form/WareHouseConfig.vue';
import { ApiExceptions, Status } from '@/shared';
import { Track } from '@/shared/anotation';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { PopupUtils } from '@/utils/PopupUtils';
import { StringUtils } from '@/utils/StringUtils';
import { DataDestination, FormMode, Job, S3Job, S3SourceInfo, SyncMode } from '@core/data-ingestion';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { DatabaseCreateRequest, DIException } from '@core/common/domain';
import { SchemaService } from '@core/schema/service/SchemaService';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Log } from '@core/utils';
import { cloneDeep } from 'lodash';
import { Inject } from 'typescript-ioc';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { minValue, required } from 'vuelidate/lib/validators';

@Component({
  components: {
    SingleChoiceItem,
    SchedulerSettingV2,
    WareHouseConfig,
    LakeHouseConfig,
    EtlModal,
    DiDropdown,
    DynamicSuggestionInput,
    JobLakeConfig,
    JobSyncConfig,
    DataSourceConfig,
    JobWareHouseConfig,
    S3DataSourceConfig
  },
  validations: {
    job: {
      displayName: { required },
      sourceId: { minValue: minValue(1) }
    }
  }
})
export default class S3JobConfigModal extends Vue {
  private readonly jobName = JobName;
  private readonly syncMode = SyncMode;

  private job: S3Job | null = null;
  private onCompleted: ((job: S3Job) => void) | null = null;
  private isShowModal = false;
  private status = Status.Loaded;
  private errorMessage = '';
  private isValidate = false;

  private isCreateNewDatabase = false;
  private newDbName = '';
  private isSingleTable = true;
  @Inject
  private readonly schemaService!: SchemaService;

  @Ref()
  private readonly s3FromSuggestion!: S3DataSourceConfig;

  @Ref()
  private readonly jobSyncModeConfig!: JobSyncConfig;

  @Ref()
  private readonly jobWareHouseConfig!: JobWareHouseConfig;

  @Ref()
  private readonly modal!: EtlModal;

  private get actionName() {
    return 'Preview';
  }

  private get modalTitle() {
    if (this.job && Job.getJobFormConfigMode(this.job) === FormMode.Create) {
      return 'Add Job';
    } else {
      return 'Update Job';
    }
  }

  private get isEnableSyncToDataWarehouse() {
    return this.job?.destinations?.some(dataDestination => dataDestination === DataDestination.Clickhouse) ?? false;
  }

  private get isInValidSyncToDataWareHouse() {
    return this.isInvalidDestinationTable || this.isInvalidDestinationDatabase;
  }

  private get isInvalidDestinationTable() {
    return false;
  }

  private get isInvalidDestinationDatabase() {
    return this.isEnableSyncToDataWarehouse && StringUtils.isEmpty(this.job?.destDatabaseName);
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  private get isError() {
    return this.status === Status.Error;
  }

  async show(job: S3Job, onCompleted?: (job: S3Job) => void) {
    this.job = cloneDeep(job);
    this.onCompleted = onCompleted || null;
    this.isShowModal = true;
    //@ts-ignored
    this.modal.show();
  }

  hide() {
    //@ts-ignored
    this.modal.hide();
  }

  handleHidden() {
    this.job = null;
    this.onCompleted = null;
    this.isShowModal = false;
    this.hideLoading();
    this.$v.$reset();
    this.isValidate = false;
    this.isSingleTable = true;
    DataSourceModule.setDatabaseNames([]);
    DataSourceModule.setTableNames([]);
    DataSourceModule.setIncrementalColumns([]);
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
    Log.debug('handleSubmitJob', this.job);
    try {
      this.showLoading();
      if (this.isValidJob()) {
        await this.createDatabase(this.newDbName);
        if (this.onCompleted) {
          this.onCompleted(this.job!);
        }
        this.hide();
        this.hideLoading();
      }
      this.hideLoading();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('JobScreen::handleSubmitJobJob::exception::', exception.message);
    }
  }

  private async createDatabase(name: string) {
    try {
      const databaseInfo = DatabaseSchemaModule.databaseInfos.find(db => db.name === name);
      if (this.isCreateNewDatabase && !databaseInfo) {
        const databaseInfo = await this.schemaService.createDatabase(new DatabaseCreateRequest(name, name));
        this.job!.destDatabaseName = databaseInfo.name;
        DatabaseSchemaModule.setDatabaseInfo(databaseInfo);
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
    Log.debug('isValidJob', this.$v.$invalid, !this.isValidFromDatabase(), !this.isValidSyncMode(), this.isInValidSyncToDataWareHouse);
    if (this.$v.$invalid || !this.isValidFromDatabase() || !this.isValidSyncMode() || this.isInValidSyncToDataWareHouse) {
      return false;
    }

    return true;
  }

  private async submitJob(job: Job) {
    const jobConfigFormMode: FormMode = Job.getJobFormConfigMode(job);
    switch (jobConfigFormMode) {
      case FormMode.Create:
        if (this.isSingleTable) {
          await JobModule.create(job);
        } else {
          const tableNames = [...DataSourceModule.tableNames];
          await JobModule.createMulti({ job: job, tables: tableNames });
        }
        break;
      case FormMode.Edit:
        await JobModule.update(job);
        break;
      default:
        throw new DIException(`Unsupported ${jobConfigFormMode} Job`);
    }
  }

  @Track(TrackEvents.DataSourceSelect, {
    source_id: (_: S3JobConfigModal, args: any) => args[0].source.id,
    source_type: (_: S3JobConfigModal, args: any) => args[0].source.sourceType,
    source_name: (_: S3JobConfigModal, args: any) => args[0].source.getDisplayName()
  })
  private async handleSelectDataSource(item: any) {
    try {
      this.job = this.getJobFromS3Source(item.source) as S3Job;
    } catch (e) {
      PopupUtils.showError(e.message);
      Log.error('JobCreationModal::handleSelectDataSource::error::', e.message);
    }
  }

  private getJobFromS3Source(dataSource: S3SourceInfo) {
    return Job.default(dataSource);
  }

  private isValidFromDatabase() {
    return this.s3FromSuggestion.isValidFromSuggestion();
  }

  private isValidSyncMode() {
    return this.jobSyncModeConfig.validSyncMode();
  }

  private handleDestinationDbChanged(name: string, isCreateNew: boolean) {
    this.isCreateNewDatabase = isCreateNew;
    this.newDbName = name;
  }

  // @Track(TrackEvents.SelectDatabase, { database_name: (_: S3JobModal, args: any) => args[0] })
  // private fromDatabaseChanged(dbName: string) {
  //   Log.debug('JobCreationModal::databaseFromChanged', dbName);
  //   if (this.isEnableSyncToDataWarehouse && this.isSingleTable) {
  //     this.jobWareHouseConfig.setDatabaseName(dbName);
  //   } else if (this.isEnableSyncToDataWarehouse && !this.isSingleTable) {
  //     this.multiJobWareHouseConfig.setDatabaseName(dbName);
  //   }
  // }
  //
  // @Track(TrackEvents.SelectTable, { table_name: (_: S3JobModal, args: any) => args[0] })
  // private fromTableChanged(tblName: string) {
  //   if (this.isEnableSyncToDataWarehouse && this.isSingleTable) {
  //     this.jobWareHouseConfig.setTableName(tblName);
  //   }
  // }
}
</script>
