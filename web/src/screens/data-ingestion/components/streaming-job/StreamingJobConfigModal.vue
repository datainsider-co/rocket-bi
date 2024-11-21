<template>
  <EtlModal
    ref="modal"
    :actionName="actionName"
    :borderCancel="true"
    :loading="isLoading"
    :width="468"
    backdrop="static"
    class="streaming-job-config-modal"
    @hidden="handleHidden"
    @submit="handleSubmitJob"
  >
    <template #header>
      <div class="mr-auto">
        <h4 class="title">{{ modalTitle }}</h4>
        <h6 class="sub-title">Config information for Job</h6>
      </div>
    </template>
    <div class="streaming-job-config-modal-body">
      <vuescroll :ops="scrollOption">
        <div class="scroll-body">
          <KafkaStreamingJobConfig v-if="isShowModal" ref="jobConfig" :job="job" />
        </div>
      </vuescroll>
      <div v-if="isError" class="error-message text-left mb-1">{{ errorMessage }}</div>
    </div>
  </EtlModal>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { KafkaStreamingJob } from '@core/data-ingestion';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { AtomicAction } from '@core/common/misc';
import { ApiExceptions, Status, VerticalScrollConfigs } from '@/shared';
import { JobName } from '@core/data-ingestion/domain/job/JobName';
import { ChartUtils, TimeoutUtils } from '@/utils';
import KafkaStreamingJobConfig from '@/screens/data-ingestion/components/streaming-job/KafkaStreamingJobConfig.vue';
import { StreamingJobConfig } from '@/screens/data-ingestion/components/streaming-job/StreamingJobConfig';
import { cloneDeep } from 'lodash';

type StreamingJobSubmitCallback = (job: KafkaStreamingJob) => void;

@Component({
  components: {
    KafkaStreamingJobConfig,
    EtlModal,
    DiDropdown
  }
})
export default class StreamingJobConfigModal extends Vue {
  private readonly jobName = JobName;
  private scrollOption = VerticalScrollConfigs;
  private status = Status.Loaded;
  private job: KafkaStreamingJob = KafkaStreamingJob.default();
  private isShowModal = false;
  private errorMessage = '';
  private submitCallback: StreamingJobSubmitCallback | null = null;
  private backCallback: StreamingJobSubmitCallback = () => this.hide();

  @Ref()
  private readonly modal!: EtlModal;

  @Ref()
  private readonly jobConfig!: StreamingJobConfig;

  private get actionName() {
    return 'Preview';
  }

  private get isMobile() {
    return ChartUtils.isMobile();
  }

  private get modalTitle() {
    return 'Add Job';
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  private get isError() {
    return this.status === Status.Error;
  }

  async show(job: KafkaStreamingJob, submitCallback: StreamingJobSubmitCallback, backCallback?: StreamingJobSubmitCallback) {
    this.job = cloneDeep(job);
    this.isShowModal = true;
    this.submitCallback = submitCallback;
    if (backCallback) {
      this.backCallback = backCallback;
    }
    //@ts-ignored
    this.modal.show();
    this.$nextTick(() => {
      this.jobConfig.initData();
    });
  }

  hide() {
    //@ts-ignored
    this.modal.hide();
  }

  handleHidden() {
    this.job = KafkaStreamingJob.default();
    this.isShowModal = false;
    this.submitCallback = null;
    this.backCallback = () => this.hide();
    this.jobConfig.resetData();
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
      const job: KafkaStreamingJob = await this.jobConfig.getJob();
      Log.debug('Submit Job', job);
      if (this.isValidJob() && this.submitCallback) {
        this.submitCallback(job);
        this.hide();
      }
      this.hideLoading();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('JobCreationModal::handleSubmitJobJob::exception::', exception.message);
    }
  }

  private async createDatabase(name: string) {
    try {
      //todo: update create database
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
    return this.jobConfig.isValidJob();
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.streaming-job-config-modal {
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
}

.streaming-job-config-modal-body {
  //height: 370px;
  width: 100%;
  .select-container {
    margin-top: 0;

    .relative > span > button > div {
      height: 34px !important;
    }

    button {
      padding-left: 12px !important;
    }

    .dropdown-input-placeholder.default-label,
    .dropdown-input-placeholder.use-placeholder {
      @include regular-text(0.17px);
      font-size: 12px;
      color: #a8aaaf !important;
    }

    .dropdown-input-placeholder {
      //color: #a8aaaf !important;
    }
  }

  input {
    height: 34px;
    background-color: var(--primary);
    padding-left: 12px;

    &::placeholder {
      @include regular-text(0.17px, #a8aaaf);
      font-size: 12px;
    }
  }

  @import '~@/screens/lake-house/views/job/output-form/OutputForm.scss';

  .job-section {
    //padding: 12px;
    text-align: left;
    background: var(--secondary);
    border-radius: 4px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 16px;
    }

    &:first-child {
      margin-top: 16px;
    }

    .export-form label {
      line-height: 1.4;
    }

    .di-input-component--input {
      height: 34px;
    }

    .di-input-component--label,
    > label {
      @include regular-text(0.23px, var(--text-color));
      font-size: 14px;
      margin-bottom: 12px;
      line-height: 1;
    }
  }

  .error-message {
    color: var(--danger);
    background: var(--secondary);
    padding: 0 12px;
    word-break: break-word;
  }

  .scroll-body {
    max-height: 371px;
    padding: 0 16px;
  }

  .select-db-tbl {
    label {
      margin-bottom: 12px;
      line-height: 1;
    }
  }
}
</style>
