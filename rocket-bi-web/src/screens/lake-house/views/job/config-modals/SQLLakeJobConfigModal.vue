<template>
  <BModal v-model="isShowSync" :hide-header="true" :ok-title="submitTitle" centered class="position-relative" size="lg" @ok="handleSubmitJob" @hidden="reset">
    <div>
      <div class="custom-header d-flex mb-3 ml-3 mr-3">
        <div>
          <div class="modal-title" v-if="job.isCreate">Create Job</div>
          <div class="modal-title" v-else>Update Job</div>
        </div>
        <div class="custom-footer ml-auto d-flex p-0">
          <DiButton id="cancel-button" class="button-test" title="Cancel" @click="hide"></DiButton>
          <DiButton id="button-submit" :disabled="isDisableSubmit()" :title="submitTitle" class="button-add btn-primary" @click="handleSubmitJob" />
        </div>
      </div>

      <div class="job-form-container d-flex w-100 justify-content-center align-items-center">
        <vuescroll ref="scroller">
          <div class="d-flex flex-column mx-3 mt-3 mb-3 job-form-scroll-body">
            <div class="jdbc-job-section">
              <div class="job-config-item">
                <div class="title">Name</div>
                <div class="input">
                  <BFormInput
                    :id="genInputId('job-name')"
                    class="text-truncate"
                    autofocus
                    v-model="clonedSQLJob.name"
                    autocomplete="off"
                    placeholder="Input job name"
                  ></BFormInput>
                </div>
              </div>
              <SchedulerSettingV2
                :schedulerTime="clonedSQLJob.scheduleTime"
                class="lake-scheduler-form"
                @change="scheduler => (clonedSQLJob.scheduleTime = scheduler)"
              ></SchedulerSettingV2>
            </div>
            <div class="jdbc-job-section">
              <OutputForm ref="outputForm" :lake-config.sync="dataLakeConfig" :ware-house-config.sync="dataWareHouseConfig" @submit="handleSubmitJob" />
            </div>
          </div>
        </vuescroll>
      </div>
      <div class="d-flex align-items-center mt-2 mx-3">
        <div v-if="isLoadingStatus" class="spinner">
          <BSpinner class="text-center" small></BSpinner>
        </div>
        <div v-else-if="isErrorStatus" class="text-danger ">
          {{ errorMessage }}
        </div>
        <div v-else style="height:18px;"></div>
      </div>
    </div>
    <template #modal-footer>
      <div></div>
    </template>
  </BModal>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Ref, Vue, Watch } from 'vue-property-decorator';
import DiCustomCenterModal from '@/screens/data-ingestion/components/DiCustomCenterModal.vue';
import { JobConfigForm } from '@/screens/data-ingestion/components/data-source-config-form/JobConfigForm';
import 'vuescroll/dist/vuescroll.css';
import { ScheduleService } from '@core/lake-house';
import SchedulerSettingV2 from '@/screens/data-ingestion/components/job-scheduler-form/SchedulerSettingV2.vue';
import { Log } from '@core/utils';
import Vuescroll from 'vuescroll';
import OutputForm from '@/screens/lake-house/views/job/output-form/OutputForm.vue';
import { LakeHouseUIConfig } from '@/screens/lake-house/views/job/LakeHouseUIConfig';
import { WareHouseUIConfig } from '@/screens/lake-house/views/job/WareHouseUIConfig';
import { Status } from '@/shared';
import { Inject } from 'typescript-ioc';
import { DIException } from '@core/common/domain';
import { StringUtils } from '@/utils/StringUtils';
import { cloneDeep } from 'lodash';
import { SQLJob } from '@core/lake-house/domain/lake-job/SQLJob';
import { LakeJobService } from '@core/lake-house/service/LakeJobService';
import { ResultOutputs } from '@core/lake-house/domain/lake-job/output-info/ResultOutputs';
import { ResultOutput } from '@core/lake-house/domain/lake-job/output-info/ResultOutput';
import { ListUtils } from '@/utils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';

@Component({
  components: {
    OutputForm,
    DiCustomCenterModal,
    JobConfigForm,
    SchedulerSettingV2
  }
})
export default class SQLLakeJobConfigModal extends Vue {
  @PropSync('isShow', { type: Boolean })
  isShowSync!: boolean;

  @Inject
  private readonly scheduleService!: ScheduleService;

  @Inject
  private readonly lakeJobService!: LakeJobService;

  @Prop({ required: true })
  private job!: SQLJob;
  private status: Status = Status.Empty;
  private clonedSQLJob: SQLJob = cloneDeep(this.job);
  @Ref()
  private scroller?: Vuescroll;

  @Ref()
  private outputForm?: OutputForm;
  private errorMessage = '';
  private dataLakeConfig = LakeHouseUIConfig.default();
  private dataWareHouseConfig = WareHouseUIConfig.default();

  private get submitTitle(): string {
    return this.job.isCreate ? 'Add' : 'Update';
  }

  private isDisableSubmit() {
    const emptyQuery = StringUtils.isEmpty(this.clonedSQLJob.query);
    const emptyName = StringUtils.isEmpty(this.clonedSQLJob.name);
    const notHaveOutput = !(this.dataWareHouseConfig.enable || this.dataLakeConfig.enable);
    const isNotValidScheduler = !this.clonedSQLJob.scheduleTime.isValid();
    return emptyQuery || emptyName || notHaveOutput || isNotValidScheduler;
    // return false
  }

  private get isLoadingStatus(): boolean {
    return this.status === Status.Loading;
  }

  private get isErrorStatus(): boolean {
    return this.status === Status.Error;
  }

  updateOutputFormConfig() {
    if (ListUtils.isEmpty(this.clonedSQLJob.outputs)) {
      this.dataLakeConfig = LakeHouseUIConfig.default();
      this.dataWareHouseConfig = WareHouseUIConfig.default();
    } else {
      this.clonedSQLJob.outputs.forEach((output: ResultOutput) => {
        if (output) {
          switch (output.className as ResultOutputs) {
            case ResultOutputs.WareHouse: {
              this.dataWareHouseConfig.updateFromOutputInfo(output);
              break;
            }
            case ResultOutputs.LakeHouse: {
              this.dataLakeConfig.updateFromOutputInfo(output);
              break;
            }
          }
        }
      });
    }
  }

  @Watch('job', { immediate: true, deep: true })
  onJobChanged(job: SQLJob) {
    this.clonedSQLJob = cloneDeep(job);
    this.updateOutputFormConfig();
    Log.debug('onJobChanged', this.dataWareHouseConfig, this.job);
  }

  @Watch('dataLakeConfig.enable')
  handleDataLakeEnabled(enable: boolean) {
    if (enable) {
      this.scroller?.scrollTo({ y: 10000 });
    }
  }

  @Watch('dataWareHouseConfig.enable')
  handleDataWareHouseEnabled(enable: boolean) {
    if (enable) {
      Log.debug('enable', this.scroller);
      this.scroller?.scrollTo({ y: 10000 });
    }
  }

  private hide() {
    this.isShowSync = false;
  }

  private reset() {
    this.status = Status.Empty;
    this.clonedSQLJob = cloneDeep(this.job);
  }

  private async handleSubmitJob() {
    try {
      if (!this.isDisableSubmit()) {
        this.showLoading(true);
        await this.updateResultOutputs();
        await this.submitJob(this.clonedSQLJob);
        this.showLoading(false);
        this.hide();
        this.$emit('created');
      }
    } catch (e) {
      Log.error('LakeJobConfigModal::handleClickOk', e);
      const exception = DIException.fromObject(e);
      this.status = Status.Error;
      this.showError(exception);
    }
  }

  private showError(exception: DIException) {
    this.errorMessage = exception.message;
  }

  private async submitJob(job: SQLJob) {
    const clonedJob = cloneDeep(job);
    clonedJob.scheduleTime = TimeScheduler.toSchedulerV2(job.scheduleTime!);
    if (this.job.isCreate) {
      await this.lakeJobService.create(clonedJob);
      TrackingUtils.track(TrackEvents.LakeSubmitCreateSQLJob, { job_name: job.name, query: job.query });
    } else {
      await this.lakeJobService.update(clonedJob);
      TrackingUtils.track(TrackEvents.LakeSubmitEditSQLJob, { job_id: job.jobId, job_name: job.name, query: job.query });
    }
  }

  private showLoading(isLoading: boolean) {
    if (isLoading) {
      this.status = Status.Loading;
    } else {
      this.status = Status.Loaded;
    }
  }

  private async updateResultOutputs() {
    const outputs: ResultOutput[] = [];
    const lakeOutput = this.outputForm?.getLakeHouseOutput();
    Log.debug('updateOutput::', lakeOutput);
    //todo: fix here
    if (lakeOutput) {
      outputs.push(lakeOutput);
    }
    const wareHouseOutPut = await this.outputForm?.getWareHouseOutput();
    if (wareHouseOutPut) {
      outputs.push(wareHouseOutPut);
    }
    this.clonedSQLJob.outputs = outputs;
  }
}
</script>

<style lang="scss" scoped>
@import './LakeJobModal';
</style>
