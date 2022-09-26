<template>
  <DiCustomModal id="clickhouse-config-modal" ref="modal" title="Clickhouse Source Config" size="md" @onClickOk="submit">
    <template #subtitle>
      <div class="modal-subtitle">Config information of DataSource</div>
    </template>
    <div v-if="clickhouseSource" class="clickhouse-config">
      <div class="clickhouse-config-text-area-form-control">
        <div class="clickhouse-config-text-area-form-control-title">Jdbc Url</div>
        <BFormTextarea
          @keydown.enter="submit"
          trim
          placeholder="Clickhouse Url"
          autofocus
          v-model="clickhouseSource.jdbcUrl"
          class="clickhouse-config-text-area-form-control-input"
        >
        </BFormTextarea>
      </div>
      <template v-if="$v.clickhouseSource.jdbcUrl.$error" class="error-message error">
        Clickhouse Url is required.
      </template>
      <div class="clickhouse-config-form-control">
        <div class="clickhouse-config-form-control-title">Username</div>
        <BFormInput
          class="clickhouse-config-form-control-input"
          placeholder="Input username"
          :autocomplete="false"
          @keydown.enter="submit"
          v-model="clickhouseSource.username"
        ></BFormInput>
      </div>
      <div v-if="$v.clickhouseSource.username.$error" class="error-message error">
        Jdbc Url is required.
      </div>
      <div class="clickhouse-config-form-control">
        <div class="clickhouse-config-form-control-title">Password</div>
        <BFormInput
          class="clickhouse-config-form-control-input"
          placeholder="Input password"
          type="password"
          :autocomplete="false"
          @keydown.enter="submit"
          v-model="clickhouseSource.password"
        ></BFormInput>
      </div>
      <div class="clickhouse-config-form-control">
        <div class="clickhouse-config-form-control-title">Cluster Name</div>
        <BFormInput
          class="clickhouse-config-form-control-input"
          placeholder="Input cluster name"
          autocomplete="off"
          @keydown.tab="submit"
          @keydown.enter="submit"
          trim
          v-model="clickhouseSource.clusterName"
        ></BFormInput>
        <div v-if="$v.clickhouseSource.clusterName.$error" class="error-message error">
          Cluster name is required.
        </div>
      </div>
      <div class="test-connection">
        <div v-if="isShowTestConnectionStatus" class="text-left">
          <BSpinner v-if="isTestConnectionLoading" small></BSpinner>
          <div v-else :class="statusClass">{{ statusMessage }}</div>
        </div>
      </div>
      <div class="error-message error">{{ errorMessage }}</div>
    </div>
    <template v-slot:modal-footer="{ cancel, ok }">
      <div class="d-flex w-100 m-0 custom-footer">
        <div class="flex-fill d-flex align-items-center">
          <DiButton class="test-connection-button w-50 mr-3" title="Test Connection" variant="secondary" @click="handleTestConnection(clickhouseSource)">
            <img src="@/assets/icon/data_ingestion/ic_connect.svg" class="ic-16" alt="" />
          </DiButton>
          <DiButton :disabled="isLoading" :isLoading="isLoading" class="w-50" :title="actionName" primary @click="ok()"> </DiButton>
        </div>
      </div>
    </template>
  </DiCustomModal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { ClickhouseSource } from '@core/ClickhouseConfig/Domain/ClickhouseSource/ClickhouseSource';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { Log } from '@core/utils';
import { required } from 'vuelidate/lib/validators';
import { FormMode } from '@core/DataIngestion';
import { Inject } from 'typescript-ioc';
import { ClickhouseConfigService } from '@core/ClickhouseConfig';
import { Status } from '@/shared';

@Component({
  components: {
    DiCustomModal
  },
  validations: {
    clickhouseSource: {
      jdbcUrl: { required },
      username: { required },
      clusterName: { required }
    }
  }
})
export default class ClickhouseSourceModal extends Vue {
  private isLoading = false;
  private errorMessage = '';
  private clickhouseSource: ClickhouseSource = ClickhouseSource.default();
  private formMode = FormMode.Create;
  private isTestConnectionLoading = false;
  private isTestConnectionSuccess = false;
  private isShowTestConnectionStatus = false;
  private callback?: (source: ClickhouseSource) => void;
  private onSuccess?: () => void;

  @Ref()
  private modal!: DiCustomModal;

  @Inject
  private clickhouseConfigService!: ClickhouseConfigService;

  private get actionName() {
    return this.formMode === FormMode.Create ? 'Create' : 'Update';
  }

  showCreate(callback?: (source: ClickhouseSource) => void, onSuccess?: () => void) {
    this.callback = callback;
    this.onSuccess = onSuccess;
    this.modal.show();
  }

  showEdit(source: ClickhouseSource, callback?: (source: ClickhouseSource) => void, onSuccess?: () => void) {
    this.clickhouseSource = source;
    this.formMode = FormMode.Edit;
    this.callback = callback;
    this.onSuccess = onSuccess;
    this.modal.show();
  }

  private isValidSource(): boolean {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  hide() {
    this.modal.hide();
  }

  reset() {
    this.clickhouseSource = ClickhouseSource.default();
    this.isShowTestConnectionStatus = false;
    this.formMode = FormMode.Create;
    this.callback = undefined;
  }

  private get statusClass() {
    return {
      'status-error': this.isTestConnectionSuccess === false,
      'status-success': this.isTestConnectionSuccess === true
    };
  }

  private get statusMessage(): string {
    return this.isTestConnectionSuccess ? 'Connection success' : 'Connection failed';
  }

  private async handleTestConnection(source: ClickhouseSource) {
    try {
      this.isTestConnectionLoading = true;
      this.isShowTestConnectionStatus = true;
      this.isTestConnectionSuccess = (await this.clickhouseConfigService.testConnection(source)).isSuccess;
    } catch (e) {
      Log.error('ClickhouseSourceModal::handleTestConnection::error::', e.message);
      this.isTestConnectionSuccess = false;
    } finally {
      this.isTestConnectionLoading = false;
    }
  }

  private async submit(e: Event) {
    try {
      e.preventDefault();
      this.isLoading = true;
      if (this.isValidSource() && this.callback) {
        await this.callback(this.clickhouseSource!);
        this.hide();
        if (this.onSuccess) {
          await this.onSuccess();
        }
      }
    } catch (e) {
      Log.error('ClickhouseSourceModal::submit::error::', e.message);
      this.errorMessage = e.message;
    } finally {
      this.isLoading = false;
    }
  }
}
</script>

<style lang="scss">
#clickhouse-config-modal {
  --clickhouse-title-width: 100px;

  .modal-body {
    padding: 31px 24px 4px;
  }
  .modal-header {
    h6 {
      margin: 0 auto;
      padding-left: 24px;
      font-size: 16px;

      display: flex;
      flex-direction: column;
      .modal-subtitle {
        font-weight: normal;
        margin-top: 8px;
      }
    }
    .close {
      padding: 0;
      margin: 0;
    }
  }

  .modal-footer {
    padding: 12px 24px 24px;

    .di-button {
      height: 42px;
    }

    .test-connection-button {
      .title {
        color: var(--accent);
      }
    }

    .custom-footer {
      > div {
        margin-left: var(--clickhouse-title-width);
      }
    }
  }

  .clickhouse-config {
    .error-message {
      margin-left: var(--clickhouse-title-width);
      margin-top: 4px;
      font-size: 12px;
      padding-left: 16px;
    }

    .test-connection {
      margin-left: var(--clickhouse-title-width);
      margin-top: 8px;
      .status-error {
        color: var(--warning);
      }

      .status-success {
        color: var(--success);
      }
    }

    &-form-control {
      display: flex;
      align-items: center;
      &-title {
        line-height: 1;
        min-width: var(--clickhouse-title-width);
      }
      &-input {
        height: 34px;
        padding: 0 16px;
        min-width: calc(100% - var(--clickhouse-title-width));
      }
      padding-top: 12px;
    }

    &-text-area-form-control {
      display: flex;
      align-items: baseline;

      &-title {
        line-height: 1;
        min-width: var(--clickhouse-title-width);
      }

      &-input {
        padding: 5px 16px 10px;
        background: var(--input-background-color) !important;
        min-height: var(--clickhouse-title-width);
        max-height: 300px;
        width: calc(100% - var(--clickhouse-title-width));

        &::placeholder {
          padding-top: 5px;
        }
      }
    }
  }
}
</style>
