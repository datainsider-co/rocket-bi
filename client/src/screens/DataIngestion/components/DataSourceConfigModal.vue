<template>
  <BModal
    v-model="isShowSync"
    class="position-relative"
    :ok-title="okTitle"
    centered
    size="lg"
    :hide-header="true"
    @ok="handleSubmit"
    @cancel="handleTestConnection"
    @hide="onHide"
    @show="onShowModal"
  >
    <img class="btn-close btn-ghost position-absolute" src="@/assets/icon/ic_close.svg" alt="" @click="closeModal" />
    <div class="modal-title text-center">DataSource Config</div>
    <div class="modal-sub-title text-center">Config information of DataSource</div>

    <div class="d-flex flex-column justify-content-center">
      <DataSourceConfigForm :form-render="dataSourceRender"></DataSourceConfigForm>
      <div :class="{ 'd-none': isHideTestConnection, 'd-flex': !isHideTestConnection }" class="form-item w-100 justify-content-center align-items-center">
        <div class="title"></div>
        <div class="input test-connection d-flex justify-content-between">
          <!--          <TestConnection :status="connectionStatus" @handleTestConnection="handleTestConnection"></TestConnection>-->
          <div v-if="isTestConnection" class="p-0 text-center">
            <BSpinner v-if="isTestConnectionLoading" small class="text-center"></BSpinner>
            <div v-else :class="statusClass" class="text-right">{{ statusMessage }}</div>
          </div>
        </div>
      </div>
    </div>
    <template #modal-footer="{ok}">
      <div class="custom-footer d-flex col-12 p-0 m-0 mr-1">
        <DiButton
          id="button-test-connection"
          :class="{ 'd-none': isHideTestConnection }"
          class="button-test btn-ghost col-6"
          title="Test Connection"
          @click="handleTestConnection"
        >
          <img src="@/assets/icon/data_ingestion/ic_connect.svg" class="ic-16" alt="" />
        </DiButton>
        <DiButton id="button-submit" :class="{ 'ml-auto': isHideTestConnection }" class="button-add btn-primary col-6" :title="okTitle" @click="ok"> </DiButton>
      </div>
    </template>
  </BModal>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import DiButton from '@/shared/components/Common/DiButton.vue';
import MessageContainer from '@/shared/components/MessageContainer.vue';
import { Log } from '@core/utils';
import { DataSourceConfigForm } from '@/screens/DataIngestion/components/DataSourceConfigForm/DataSourceConfigForm';
import { DataSourceInfo } from '@core/DataIngestion/Domain/DataSource/DataSourceInfo';
import { DataSourceModule } from '@/screens/DataIngestion/store/DataSourceStore';
import { DataSourceFormRender } from '@/screens/DataIngestion/FormBuilder/DataSourceFormRender';
import TestConnection, { ConnectionStatus } from '@/screens/DataIngestion/components/TestConnection.vue';
import { DIException } from '@core/domain';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import { DataSourceType } from '@core/DataIngestion';
import TSLForm from '@/screens/DataCook/components/SaveToDatabase/TSLForm.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import DiDropdown from '@/shared/components/Common/DiDropdown/DiDropdown.vue';

@Component({
  components: { TestConnection, MessageContainer, DiButton, DiCustomModal, DataSourceConfigForm, TSLForm, DiDropdown }
})
export default class DataSourceConfigModal extends Vue {
  private static readonly DEFAULT_ID = -1;
  private connectionStatus: ConnectionStatus = ConnectionStatus.Failed;
  private isTestConnection = false;

  @PropSync('isShow', { type: Boolean })
  isShowSync!: boolean;

  @Prop({ required: true })
  private readonly dataSourceRender!: DataSourceFormRender;

  private closeModal() {
    this.isShowSync = false;
  }

  private get statusClass() {
    return {
      'status-error': this.connectionStatus === ConnectionStatus.Failed,
      'status-success': this.connectionStatus === ConnectionStatus.Success
    };
  }

  private get statusMessage(): string {
    switch (this.connectionStatus) {
      case ConnectionStatus.Success:
        return TestConnection.CONNECTION_SUCCESS;
      case ConnectionStatus.Failed:
        return TestConnection.CONNECTION_FAILED;
      default:
        return TestConnection.CONNECTION_FAILED;
    }
  }

  private get isTestConnectionLoading(): boolean {
    return this.connectionStatus === ConnectionStatus.Loading;
  }

  private get isEditMode() {
    return this.dataSourceRender.createDataSourceInfo().id !== DataSourceConfigModal.DEFAULT_ID;
  }

  private get isDisableSubmitButton() {
    if (this.isHideTestConnection || this.isSuccessConnection) {
      return false;
    } else {
      return true;
    }
  }

  private get isSuccessConnection(): boolean {
    return this.connectionStatus === ConnectionStatus.Success;
  }

  private get okTitle() {
    return this.isEditMode ? 'Update' : 'Add';
  }

  private get isHideTestConnection() {
    const sourceType: DataSourceType = this.dataSourceRender.createDataSourceInfo().sourceType;
    Log.debug('JobConfigFormModal::isHideTestConnection::jobType::', this.dataSourceRender.createDataSourceInfo());
    switch (sourceType) {
      // case DataSourceType.GoogleSheet:
      //   return true;
      default:
        return false;
    }
  }

  private async handleSubmit() {
    this.$emit('onClickOk');
  }

  private onHide() {
    this.isTestConnection = false;
  }

  @Track(TrackEvents.DataSourceTestConnection, {
    source_id: (_: DataSourceConfigModal, args: any) => _.dataSourceRender.createDataSourceInfo().id,
    source_type: (_: DataSourceConfigModal, args: any) => _.dataSourceRender.createDataSourceInfo().sourceType,
    source_name: (_: DataSourceConfigModal, args: any) => _.dataSourceRender.createDataSourceInfo().getDisplayName()
  })
  @AtomicAction()
  private async handleTestConnection(e: Event) {
    try {
      e.preventDefault();
      this.isTestConnection = true;
      const dataSourceInfo: DataSourceInfo = this.dataSourceRender.createDataSourceInfo();
      Log.debug('DataConfigModal::handleTestConnection::request::', dataSourceInfo);
      this.connectionStatus = ConnectionStatus.Loading;
      const isSuccess = await DataSourceModule.testDataSourceConnection(dataSourceInfo);
      this.updateConnectionStatus(isSuccess);
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      this.connectionStatus = ConnectionStatus.Failed;
      Log.error('DataSourceConfigModal::handleTestConnection::exception', exception.message);
    }
  }

  private updateConnectionStatus(isSuccess: boolean) {
    if (isSuccess) {
      this.connectionStatus = ConnectionStatus.Success;
    } else {
      this.connectionStatus = ConnectionStatus.Failed;
    }
  }

  private onShowModal() {
    this.reset();
  }

  private reset() {
    this.connectionStatus = ConnectionStatus.Failed;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';
.modal-title {
  font-size: 16px;
  padding: 10px 25px 8px 25px;
  line-height: 1.5;
  letter-spacing: 0.4px;
  font-weight: 500;
  color: var(--text-color);
}
.modal-sub-title {
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 0.4px;
  padding-bottom: 32px;
  color: var(--secondary-text-color);
}

.btn-close {
  top: 12px;
  right: 12px;
  .title {
    width: 0;
  }
}

.test-connection {
  height: 21px;
}

.form-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 450px;
  //class="item d-flex w-100 justify-content-center align-items-center"

  .title {
    width: 120px;
  }
  .input {
    width: 340px;
    margin-top: 16px;
    input {
      padding-left: 16px;
      cursor: text !important;
    }
  }
  .text-connection {
    color: var(--accent);
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

::v-deep {
  .modal-dialog {
    max-width: fit-content;
  }
  .modal-body {
    padding: 24px 24px 8px;
  }

  .modal-footer {
    width: 384px;
    padding: 8px 24px 24px 24px;
    margin-left: auto;
    display: flex;
    @media (max-width: 500px) {
      width: 100%;
    }
    .button-test {
      justify-content: center;
      height: 42px;
      .title {
        width: fit-content;
        color: var(--accent);
      }
    }
    .button-add {
      height: 42px;
      margin-left: 6px;
    }
  }
}
</style>
