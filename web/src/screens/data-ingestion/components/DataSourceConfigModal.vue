<template>
  <BModal
    id="source-config-modal"
    v-model="isShowSync"
    class="position-relative"
    :ok-title="okTitle"
    centered
    size="lg"
    :hide-header="true"
    modal-class="data-source-modal"
    footer-class="data-source-modal--footer"
    body-class="data-source-modal--body"
    dialog-class="data-source-modal--dialog"
    @ok="handleSubmit"
    @cancel="handleTestConnection"
    @hidden="onHidden"
  >
    <img class="btn-close btn-ghost position-absolute" src="@/assets/icon/ic_close.svg" alt="" @click="closeModal" />
    <div class="modal-title text-center">DataSource Config</div>
    <div class="modal-sub-title text-center">Config information of DataSource</div>

    <div class="d-flex flex-column justify-content-center">
      <DataSourceConfigForm :form-render="sourceRender"></DataSourceConfigForm>
      <div class="source-form-status">
        <div
          class="source-form-status--test-connection"
          :class="{
            'test-connection-show': connectionStatus == ConnectionStatus.Failed || connectionStatus == ConnectionStatus.Success
          }"
        >
          <div v-if="connectionStatus == ConnectionStatus.Success" class="source-form-status--test-connection--success">
            <i class="di-icon-check-circle"></i>
            <span>Connection Success</span>
          </div>
          <div v-if="connectionStatus == ConnectionStatus.Failed" :title="connectionErrorMsg" class="source-form-status--test-connection--error">
            <i class="di-icon-error"></i>
            <span>{{ connectionErrorMsg }}</span>
          </div>
        </div>
        <div class="source-form-status--validate" v-if="errorMsg">{{ errorMsg }}</div>
      </div>
    </div>
    <template #modal-footer>
      <DiButton
        text-accent
        id="re-authen-btn"
        title="Re-Connect"
        :class="{ 'd-none': !isShowReAuthenButton }"
        @click="handleReAuthentication(sourceRender.createDataSourceInfo())"
      >
        <img id="ic_google" src="@/assets/icon/ic_google.svg" alt="" />
      </DiButton>
      <DiButton
        text-accent
        id="button-add-field"
        :class="{ 'd-none': isHiddenAddPropertyBtn }"
        class="mr-auto"
        title="Add Properties"
        @click="handleAddProperty"
      >
        <i class="di-icon-add ic-16" />
      </DiButton>
      <DiButton
        text-accent
        id="button-test-connection"
        :class="{ 'd-none': isHiddenTestConnectionBtn }"
        class="ml-auto mr-2"
        title="Test Connection"
        @click="handleTestConnection"
        :is-loading="connectionStatus == ConnectionStatus.Loading"
      >
        <i v-if="connectionStatus != ConnectionStatus.Loading" class="di-icon-connect" />
      </DiButton>
      <DiButton
        id="button-submit"
        primary
        :class="{ 'ml-auto': isHiddenTestConnectionBtn && isHiddenAddPropertyBtn }"
        :title="okTitle"
        style="width: 100px"
        @click="handleSubmit"
      ></DiButton>
    </template>
    <ManagePropertyModal ref="managePropertyModal" />
  </BModal>
</template>

<script lang="ts">
import { Component, PropSync, Ref, Vue } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import MessageContainer from '@/shared/components/MessageContainer.vue';
import { Log } from '@core/utils';
import { DataSourceConfigForm } from '@/screens/data-ingestion/components/data-source-config-form/DataSourceConfigForm';
import { DataSourceInfo } from '@core/data-ingestion/domain/data-source/DataSourceInfo';
import { DataSourceFormRender } from '@/screens/data-ingestion/form-builder/DataSourceFormRender';
import { DIException } from '@core/common/domain';
import { AtomicAction } from '@core/common/misc';
import { DataSourceType, SupportCustomProperty } from '@core/data-ingestion';
import TSLForm from '@/screens/data-cook/components/save-to-database/TSLForm.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { CustomPropertyInfo } from '@/screens/user-management/components/user-detail/AddNewFieldModal.vue';
import ManagePropertyModal from '@/screens/data-ingestion/form-builder/render-impl/ManagePropertyModal.vue';
import { cloneDeep } from 'lodash';
import { ConnectionStatus } from './TestConnection';
import { DataSourceModule } from '@/screens/data-ingestion/store/DataSourceStore';

@Component({
  components: {
    MessageContainer,
    DiButton,
    DiCustomModal,
    DataSourceConfigForm,
    TSLForm,
    ManagePropertyModal,
    DiDropdown
  }
})
export default class DataSourceConfigModal extends Vue {
  protected static readonly DEFAULT_ID = -1;
  protected ConnectionStatus = ConnectionStatus;
  protected connectionStatus: ConnectionStatus = ConnectionStatus.None;
  // protected isTestConnection = true;
  protected connectionErrorMsg = '';
  protected errorMsg = '';

  @PropSync('isShow', { type: Boolean })
  protected isShowSync!: boolean;

  @PropSync('dataSourceRender', { required: true, type: Object })
  protected sourceRender!: DataSourceFormRender;

  @Ref()
  protected readonly managePropertyModal!: ManagePropertyModal;

  protected closeModal() {
    this.isShowSync = false;
  }

  protected get isShowReAuthenButton(): boolean {
    if (!this.isEditMode) {
      return false;
    } else {
      switch (this.sourceRender.createDataSourceInfo().sourceType) {
        case DataSourceType.GA4:
        case DataSourceType.GA:
        case DataSourceType.GoogleAds:
        case DataSourceType.GoogleSearchConsole:
          return true;
        default:
          return false;
      }
    }
  }

  protected get isEditMode(): boolean {
    return this.sourceRender.createDataSourceInfo().id !== DataSourceConfigModal.DEFAULT_ID;
  }

  protected get okTitle(): string {
    return this.isEditMode ? 'Update' : 'Add';
  }

  protected get isHiddenTestConnectionBtn(): boolean {
    const sourceType: DataSourceType = this.sourceRender.createDataSourceInfo().sourceType;
    switch (sourceType) {
      // case DataSourceType.GoogleAds:
      //   return true;
      default:
        return false;
    }
  }

  protected get isHiddenAddPropertyBtn(): boolean {
    const sourceInfo: DataSourceInfo = this.sourceRender.createDataSourceInfo();
    return !SupportCustomProperty.isSupportCustomProperty(sourceInfo);
  }

  protected handleAddProperty(): void {
    const emptyField: CustomPropertyInfo = CustomPropertyInfo.empty();
    this.managePropertyModal.show(emptyField, async updateField => {
      const sourceInfo: SupportCustomProperty = (this.sourceRender.createDataSourceInfo() as unknown) as SupportCustomProperty;
      if (sourceInfo.isExistsProperty(updateField.fieldName)) {
        throw new DIException('Field is exist!');
      }
      sourceInfo.setProperty(updateField);
      this.sourceRender = cloneDeep(this.sourceRender);
    });
  }

  protected handleReAuthentication(sourceInfo: DataSourceInfo) {
    this.$emit('reAuthen', sourceInfo);
  }

  public async handleSubmit(): Promise<void> {
    try {
      // event.preventDefault();
      this.errorMsg = '';
      this.connectionErrorMsg = '';
      this.connectionStatus = ConnectionStatus.None;
      const source = this.sourceRender.createDataSourceInfo();
      Log.debug('handleSubmit::', source);
      this.sourceRender.validSource(source);
      this.$emit('onClickOk', source);
    } catch (ex) {
      Log.error('handleSubmit', ex);
      this.errorMsg = ex.message;
    }
  }

  protected onHidden() {
    this.$emit('reset');
    this.reset();
  }

  @AtomicAction()
  protected async handleTestConnection(e: Event): Promise<void> {
    try {
      e.preventDefault();
      // this.isTestConnection = true;
      this.errorMsg = '';
      this.connectionErrorMsg = '';
      this.connectionStatus = ConnectionStatus.Loading;
      const dataSourceInfo: DataSourceInfo = this.sourceRender.createDataSourceInfo();
      const isSuccess = await DataSourceModule.testConnection(dataSourceInfo);
      this.connectionStatus = isSuccess ? ConnectionStatus.Success : ConnectionStatus.Failed;
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      this.connectionStatus = ConnectionStatus.Failed;
      this.connectionErrorMsg = exception.getPrettyMessage();
      Log.error('DataSourceConfigModal::handleTestConnection::exception', exception.message);
    }
  }

  protected reset() {
    this.errorMsg = '';
    this.connectionErrorMsg = '';
    this.connectionStatus = ConnectionStatus.None;
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
}

.form-item + .form-item {
  margin-top: 8px;
}
</style>

<style lang="scss">
.data-source-modal {
  &--dialog {
    max-width: 509px;
  }

  &--body {
    padding: 24px 24px 8px;
  }

  &--footer {
    padding: 8px 20px 20px 20px;
    display: flex;
    flex-direction: row;
    align-items: flex-end;
  }

  .source-form-status {
    &--test-connection {
      margin-top: 12px;
      transition: opacity 0.5s ease-in-out;
      opacity: 0;

      &--error {
        display: flex;
        align-items: flex-start;
        justify-items: flex-start;
        color: var(--danger);

        i {
          margin-top: 3px;
          font-size: 14px;
          margin-right: 8px;
        }
        span {
          font-size: 14px;
          line-height: 1.4;
          letter-spacing: 0.4px;
          text-align: left;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      &--success {
        display: flex;
        align-items: center;
        justify-items: center;
        color: var(--success);

        i {
          font-size: 14px;
          margin-right: 8px;
        }
      }

      &.test-connection-show {
        opacity: 1;
      }
    }

    &--validate {
      margin-top: 12px;
      color: var(--danger);
      font-size: 14px;
      line-height: 1.4;
      letter-spacing: 0.4px;
      text-align: left;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}
</style>
