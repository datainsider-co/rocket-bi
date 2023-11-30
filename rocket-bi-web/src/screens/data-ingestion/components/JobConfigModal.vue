<template>
  <BModal
    id="job-config-modal"
    ref="modal"
    class="position-relative"
    :ok-title="okTitle"
    centered
    no-close-on-backdrop
    size="job-config"
    :hide-header="true"
    @ok="handleClickOk"
    @show="onShowModal"
    @hide="onHide"
  >
    <div>
      <div class="custom-header d-flex mb-4 ml-3 mr-3">
        <div>
          <div class="modal-title">{{ title }}</div>
          <div class="modal-sub-title">Config information for Job</div>
        </div>
        <div class="custom-footer ml-auto d-flex p-0">
          <DiButton id="cancel-button" class="button-test" title="Cancel" @click="closeModal"> </DiButton>
          <DiButton :disabled="isLoading" :isLoading="isLoading" id="button-submit" class="button-add btn-primary" :title="okTitle" @click="handleClickOk">
          </DiButton>
        </div>
      </div>
      <div class="job-form-container d-flex w-100 justify-content-center align-items-center">
        <vuescroll :ops="verticalScrollConfig">
          <div class="d-flex flex-column mr-3 ml-3 job-form-scroll-body">
            <JobConfigForm :render-engine="jobConfigFormRender" @changeDatabase="handleDestinationDbChanged"></JobConfigForm>
          </div>
        </vuescroll>
      </div>
    </div>

    <template #modal-footer>
      <div class="footer-container">
        <div v-if="isError" class="error">
          {{ errorMessage }}
        </div>
        <div class="test-connection-container align-items-center" :class="testConnectionClass">
          <div class="test-connection-button d-flex align-items-center" @click="handleTestConnection">
            <img src="@/assets/icon/data_ingestion/ic_connect.svg" class="ic-16" alt="" />
            <span>Test Connection</span>
          </div>

          <div :class="testConnectionClass" class="ml-auto">
            <div class="test-connection">
              <div v-if="isConnectionTesting" class="w-100 p-0">
                <BSpinner v-if="isTestConnectionLoading" small></BSpinner>
                <div v-else :class="statusClass">{{ statusMessage }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </BModal>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import DiCustomCenterModal from '@/screens/data-ingestion/components/DiCustomCenterModal.vue';
import { JobFormRender } from '@/screens/data-ingestion/form-builder/JobFormRender';
import { JobConfigForm } from '@/screens/data-ingestion/components/data-source-config-form/JobConfigForm';
import { Log } from '@core/utils';
import { Job } from '@core/data-ingestion/domain/job/Job';
import { JobModule } from '@/screens/data-ingestion/store/JobStore';
import { FormMode } from '@core/data-ingestion/domain/job/FormMode';
import { DatabaseCreateRequest, DIException } from '@core/common/domain';
import { AtomicAction } from '@core/common/misc';
import { JobType } from '@core/data-ingestion';
import 'vuescroll/dist/vuescroll.css';
import { ApiExceptions, Status, VerticalScrollConfigs } from '@/shared';
import { BModal, BvEvent } from 'bootstrap-vue';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { Inject } from 'typescript-ioc';
import { SchemaService } from '@core/schema/service/SchemaService';
import { EventBus } from '@/event-bus/EventBus';
import { ConnectionStatus } from './TestConnection';

@Component({
  components: { DiCustomCenterModal, JobConfigForm }
})
export default class JobConfigModal extends Vue {
  protected readonly verticalScrollConfig = VerticalScrollConfigs;
  protected connectionStatus: ConnectionStatus = ConnectionStatus.Failed;
  protected isConnectionTesting = false;
  protected submitCallback: ((job: Job) => void) | null = null;

  protected status = Status.Loaded;
  protected errorMessage = '';
  protected isCreateDestDb = false;
  protected newDbName = '';

  @Ref()
  protected modal!: BModal;

  @Inject
  protected schemaService!: SchemaService;

  @Prop({ required: true })
  protected jobConfigFormRender!: JobFormRender;

  protected get isLoading() {
    return this.status === Status.Loading;
  }

  protected get isError() {
    return this.status === Status.Error;
  }

  protected showLoading() {
    this.status = Status.Loading;
  }

  protected showLoaded() {
    this.status = Status.Loaded;
  }

  protected showError(ex: DIException) {
    this.status = Status.Error;
    this.errorMessage = ex.getPrettyMessage();
  }

  protected get okTitle(): string {
    const job: Job = this.jobConfigFormRender.createJob();
    const mode: FormMode = Job.getJobFormConfigMode(job);
    switch (mode) {
      case FormMode.Edit:
        return 'Update';
      case FormMode.Create:
        return 'Add';
      default:
        throw new DIException(`Unsupported form mode ${mode}`);
    }
  }

  protected get title(): string {
    const job: Job = this.jobConfigFormRender.createJob();
    const mode: FormMode = Job.getJobFormConfigMode(job);
    switch (mode) {
      case FormMode.Edit:
        return 'Update Job';
      case FormMode.Create:
        return 'Add Job';
      default:
        throw new DIException(`Unsupported form mode ${mode}`);
    }
  }

  protected get testConnectionClass() {
    return {
      'd-none': this.isHideTestConnection,
      'd-flex': !this.isHideTestConnection
    };
  }

  protected get isHideTestConnection() {
    const jobType: JobType = this.jobConfigFormRender.createJob().jobType;
    Log.debug('JobConfigFormModal::isHideTestConnection::jobType::', this.jobConfigFormRender.createJob());
    switch (jobType) {
      case JobType.GoogleSheet:
        return true;
      default:
        return false;
    }
  }

  protected get isSuccessConnection(): boolean {
    return this.connectionStatus === ConnectionStatus.Success;
  }

  protected get statusClass() {
    return {
      'status-error': this.connectionStatus === ConnectionStatus.Failed,
      'status-success': this.connectionStatus === ConnectionStatus.Success
    };
  }

  protected get statusMessage(): string {
    switch (this.connectionStatus) {
      case ConnectionStatus.Success:
        return 'Connection success';
      case ConnectionStatus.Failed:
        return 'Connection failed';
      default:
        return 'Connection failed';
    }
  }

  protected get isTestConnectionLoading(): boolean {
    return this.connectionStatus === ConnectionStatus.Loading;
    // return true
  }

  show(callback: (job: Job) => void) {
    EventBus.onDestDatabaseNameChange(this.handleDestinationDbChanged);
    this.submitCallback = callback;
    this.modal.show();
  }

  closeModal() {
    this.modal.hide();
  }

  protected onHide() {
    this.submitCallback = null;
    this.isConnectionTesting = false;
    EventBus.offDestDatabaseNameChange(this.handleDestinationDbChanged);
  }

  @AtomicAction()
  protected async handleClickOk(e: BvEvent) {
    try {
      e.preventDefault();
      this.showLoading();
      const job = this.jobConfigFormRender.createJob();
      await this.handleCreateDestDatabase(job, this.newDbName);
      if (this.submitCallback) {
        this.submitCallback(job);
      }
      this.showLoaded();
    } catch (e) {
      const ex = DIException.fromObject(e);
      this.showError(ex);
    }
  }

  protected handleDestinationDbChanged(name: string, isCreateNew: boolean) {
    Log.debug('JobConfigModal::handleDestinationDbChanged::dbName::', name, isCreateNew);
    this.isCreateDestDb = isCreateNew;
    this.newDbName = name;
  }

  protected async handleCreateDestDatabase(job: Job, name: string) {
    try {
      const databaseInfo = DatabaseSchemaModule.databaseInfos.find(db => db.name === name);
      if (this.isCreateDestDb && !databaseInfo) {
        const dbInfo = await this.schemaService.createDatabase(new DatabaseCreateRequest(name, name));
        DatabaseSchemaModule.setDatabaseInfo(dbInfo);
        job.copyWithDestDbName(dbInfo.name);
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

  @AtomicAction()
  protected async handleTestConnection(): Promise<void> {
    try {
      this.isConnectionTesting = true;
      this.connectionStatus = ConnectionStatus.Loading;
      const job: Job = this.jobConfigFormRender.createJob();
      const isSuccess = await JobModule.testJobConnection(job);
      this.connectionStatus = isSuccess ? ConnectionStatus.Success : ConnectionStatus.Failed;
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      this.connectionStatus = ConnectionStatus.Failed;
      Log.error('JobConfigModal::handleTestConnection::exception', exception.message);
    }
  }

  protected onShowModal() {
    this.reset();
  }

  protected reset() {
    this.connectionStatus = ConnectionStatus.Failed;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.input {
  margin-top: 16px;
}

.modal-title {
  font-size: 24px;
  //padding: 10px 25px 8px 25px;
  line-height: 28px;
  letter-spacing: 0.4px;
  font-weight: 500;
  color: var(--text-color);
  height: 28px;
  margin-bottom: 4px;
}

.modal-sub-title {
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: 0.4px;
  color: var(--secondary-text-color);
}

.btn-close {
  top: 12px;
  right: 12px;

  .title {
    width: 0;
  }
}

.status-error {
  color: var(--warning);
}

.status-success {
  color: var(--success);
}

.form-item + .form-item {
  margin-top: 8px;
}

.test-connection {
  height: 21px;
}

#cancel-button {
  margin-right: 8px;
}

.test-connection-button {
  cursor: pointer;
  img {
    margin-right: 8px;
  }
  span {
    color: var(--accent);
  }
}

.custom-footer {
  .di-button {
    width: 82px;
    height: 26px;
  }
}

.job-form-container {
  width: fit-content;

  .job-form-scroll-body {
    max-height: 400px;
  }
}

::v-deep {
  #job-config-modal {
    .modal-dialog {
      width: fit-content;
      min-width: 534px;
    }

    .modal-body {
      padding: 16px 0 0px;
      background: var(--primary);
      border-top-right-radius: 4px;
      border-top-left-radius: 4px;
      z-index: 10 !important;
    }

    .modal-footer {
      background: var(--primary);
      padding: 0 16px 16px;
      border-top: 0;
      .footer-container {
        padding-left: 16px;
        background: var(--secondary);
        display: flex;
        margin: 0;
        flex-direction: column;
        width: 100%;
        .test-connection-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 16px;
          width: 100%;
        }

        .error {
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
}
</style>
