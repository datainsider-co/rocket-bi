<template>
  <EtlModal
    class="clickhouse-source-modal"
    ref="modal"
    @submit="submit"
    @hidden="resetModel"
    :loading="loading"
    :actionName="actionName"
    title="Clickhouse Config"
    :width="520"
    backdrop="static"
  >
    <form @submit.prevent="submit" v-if="model" class=" clickhouse-source-form">
      <vuescroll :ops="scrollConfig">
        <div class="scroll-body">
          <ClickhouseSourceForm class="persist-configuration-info" :source="model" />
          <input type="submit" class="d-none" />
        </div>
      </vuescroll>
      <div class="test-connection d-flex justify-content-between">
        <div class="d-flex w-60 cursor-pointer align-items-center" @click="handleTestConnection(model)">
          <img src="@/assets/icon/data_ingestion/ic_connect.svg" class="ic-16" alt="" />
          <div class="ml-1 test-connection--title">Test Connection</div>
        </div>
        <div v-if="isShowConnectionStatus" class="col-5 p-0 text-center">
          <BSpinner v-if="isTestConnectionLoading" small class="text-center"></BSpinner>
          <div v-else :class="statusClass" class="text-right">{{ statusMessage }}</div>
        </div>
      </div>
    </form>
    <template #header-action>
      <button v-if="isShowCancelButton" class="cancel-button btn btn-sm btn-secondary border mr-2" @click.prevent="cancel">
        Cancel
      </button>
      <button :disabled="loading" class="submit-button btn btn-sm btn-primary px-3" @click.prevent="submit">
        <i v-if="loading" class="fa fa-spin fa-spinner"></i>
        {{ actionName }}
      </button>
    </template>
    <template #header>
      <div class="flex flex-column ">
        <h4>Clickhouse Config</h4>
        <h6 class="text-left">To get started, you need to give us access to your Clickhouse. Follow these simple steps to complete your setup:</h6>
      </div>
    </template>
  </EtlModal>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { Log } from '@core/utils';
import { VerticalScrollConfigs } from '@/shared';
import { ClickhouseConfigService, ClickhouseSource } from '@core/clickhouse-config';
import ClickhouseSourceForm from '@/screens/organization-settings/views/clickhouse-config/ClickhouseSourceForm.vue';
import { Inject } from 'typescript-ioc';
import { PopupUtils } from '@/utils';

@Component({
  components: {
    ClickhouseSourceForm,
    EtlModal
  }
})
export default class ClickhouseSourceModal extends Vue {
  private readonly scrollConfig = VerticalScrollConfigs;
  private model: ClickhouseSource = ClickhouseSource.default();
  private callback: ((source: ClickhouseSource) => void) | null = null;
  private loading = false;
  private isShowCancelButton = false;
  private isShowConnectionStatus = false;
  private isTestConnectionLoading = false;
  private isTestConnectionSuccess = false;

  @Ref()
  private readonly modal!: EtlModal;
  @Inject
  private clickhouseConfigService!: ClickhouseConfigService;

  private get actionName() {
    return this.model.isEdit ? 'Update' : 'Add';
  }

  show(source: ClickhouseSource, isShowCancelButton: boolean, callback?: (source: ClickhouseSource) => void) {
    Log.debug('ClickhouseSourceModal::show::source::', this.model);
    this.model = source;
    this.isShowConnectionStatus = false;
    this.isShowCancelButton = isShowCancelButton;
    if (callback) {
      this.callback = callback;
    }
    // @ts-ignore
    this.modal.show();
  }

  private resetModel() {
    this.model = ClickhouseSource.default();
    this.callback = null;
    this.loading = false;
  }

  private async submit() {
    try {
      this.loading = true;
      if (this.model && this.callback) {
        await this.callback(this.model);
        this.loading = false;
        this.modal.hide();
      }
    } catch (e) {
      Log.error(`ClickhouseSourceModal::submit::error::`, e);
      PopupUtils.showError(e.message);
    } finally {
      this.loading = false;
    }
  }

  private cancel() {
    this.modal.hide();
  }

  private get statusMessage() {
    return this.isTestConnectionSuccess ? 'Connection success' : 'Connection failed';
  }

  private get statusClass() {
    return {
      'status-error': !this.isTestConnectionSuccess,
      'status-success': this.isTestConnectionSuccess
    };
  }

  private async handleTestConnection(source: ClickhouseSource) {
    try {
      this.isShowConnectionStatus = true;
      this.isTestConnectionLoading = true;
      this.isTestConnectionSuccess = await this.clickhouseConfigService.testConnection(source);
    } catch (e) {
      Log.error('ClickhouseSourceModal::handleTestConnection::error::', e.message);
      this.isTestConnectionSuccess = false;
      PopupUtils.showError(e.message);
    } finally {
      this.isTestConnectionLoading = false;
    }
  }
}
</script>
<style lang="scss">
.clickhouse-source-modal {
  .submit-button,
  .cancel-button {
    display: flex;
    justify-content: center;
    width: 95px;
    i {
      margin-right: 4px;
    }
  }
  .cancel-button {
    height: 24.5px;
  }

  .test-connection {
    height: 32px;
    display: flex;
    align-items: center;
    margin-right: 12px;

    &--title {
      color: var(--accent);
    }

    .status-error {
      color: var(--warning);
    }

    .status-success {
      color: var(--success);
    }
  }

  .scroll-body {
    max-height: 389px;
    padding-right: 12px;
  }
  .modal-content {
    .modal-header {
      background: var(--secondary);
      border: 1px solid #f2f2f7;
      padding-bottom: 10px !important;
    }
    .modal-body {
      padding: 0;
      background: var(--secondary);
      border-top: 1px solid #bebebe;
      .clickhouse-source-form {
        background-color: var(--secondary);
        padding: 16px 4px 0px 16px;
        border-radius: 4px;
      }
    }
  }
  .select-container {
    height: 34px;
    button {
      height: 34px;
    }
    ul li {
      height: 34px;
    }
    button {
      div {
      }
      .form-group.di-theme {
        margin-bottom: 0;
      }
      height: 34px;
    }
  }
  .persist-configuration-info {
    input {
      padding: 0 12px;
      min-height: 34px !important;
    }
    .title {
      margin-bottom: 8px;
    }
  }
}
</style>
