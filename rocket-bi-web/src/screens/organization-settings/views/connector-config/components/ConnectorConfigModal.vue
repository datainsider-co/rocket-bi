<template>
  <BModal
    id="connector-config-modal"
    centered
    class="rounded"
    size="lg"
    lazy
    ok-title="Apply"
    v-model="isShow"
    :ok-disabled="loading"
    :cancel-disabled="loading"
    :cancel-title="cancelTitle"
    :no-close-on-backdrop="!enableBack"
    :no-close-on-esc="!enableBack"
    @cancel="cancel"
    @hidden="reset"
    @ok="event => submitSource(model, event)"
  >
    <template #modal-header>
      <div>
        <div id="connector-config-modal-title">{{ modalTitle }} Config</div>
        <div id="connector-config-modal-subtitle">
          To get started, you need to give us access to your {{ modalTitle }}. Follow these simple steps to complete your setup.
        </div>
      </div>
    </template>
    <!--    <vuescroll :ops="scrollOptions">-->
    <component :is="toComponent" :model.sync="model" ref="connectorForm" @loadPublicKeyError="handleLoadPublicKeyError" />

    <DiIconTextButton id="test-connection-btn" title="Test connection" @click="testConnection(model)">
      <BSpinner v-if="isTestConnectionLoading" small></BSpinner>
      <i v-else class="di-icon-share"></i>
    </DiIconTextButton>
    <SuccessMessage title="Success connection" class="mt-3" v-if="!isTestConnectionLoading && isShowConnectionStatus && isTestConnectionSuccess" />
    <ErrorMessage title="Error status" :message="testErrorMessage" class="mt-3" v-if="!isTestConnectionLoading && isShowConnectionStatus && testErrorMessage" />
    <!--    </vuescroll>-->
  </BModal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Connector, ConnectorService, ConnectorType } from '@core/connector-config';
import { Inject } from 'typescript-ioc';
import { Log } from '@core/utils';
import { DIException, InvalidDataException } from '@core/common/domain';
import { cloneDeep } from 'lodash';
import ErrorMessage from '@/screens/organization-settings/views/connector-config/ErrorMessage.vue';
import SuccessMessage from '@/screens/organization-settings/views/connector-config/SuccessMessage.vue';
import { AbstractConnectorForm } from '@/screens/organization-settings/views/connector-config/components/connector-form/AbstractConnectorForm';

@Component({
  components: { ErrorMessage, SuccessMessage }
})
export default class ConnectorConfigModal extends Vue {
  static readonly components = new Map<string, Function>([
    [ConnectorType.Bigquery, () => import('./connector-form/connector-form-impl/BigQueryConnectorForm.vue')],
    [ConnectorType.Clickhouse, () => import('./connector-form/connector-form-impl/ClickhouseConnectorForm.vue')],
    [ConnectorType.MySQL, () => import('./connector-form/connector-form-impl/MySQLConnectorForm.vue')],
    [ConnectorType.Vertica, () => import('./connector-form/connector-form-impl/VerticaConnectorForm.vue')],
    [ConnectorType.PostgreSQL, () => import('./connector-form/connector-form-impl/PostgreSQLConnectorForm.vue')],
    [ConnectorType.Redshift, () => import('./connector-form/connector-form-impl/RedshiftConnectorForm.vue')]
  ]);
  protected model: Connector | null = null;
  protected callback: ((source: Connector) => void) | null = null;
  protected onBack: (() => void) | null = null;
  protected loading = false;
  protected enableBack = false;
  protected isShowConnectionStatus = false;
  protected isTestConnectionLoading = false;
  protected isTestConnectionSuccess = false;
  protected isShow = false;
  protected testErrorMessage = '';
  protected cancelTitle = 'Back';

  @Ref()
  protected readonly connectorForm!: AbstractConnectorForm<Connector>;

  @Inject
  protected connectorService!: ConnectorService;

  show(source: Connector, enableBack: boolean, cancelTitle: string, callback: (source: Connector) => void, onBack: () => void) {
    Log.debug('DataSourceConfigModal::show::source::', this.model);
    this.model = cloneDeep(source);
    this.isShowConnectionStatus = false;
    this.enableBack = enableBack;
    this.callback = callback;
    this.onBack = onBack;
    this.cancelTitle = cancelTitle;
    this.isShow = true;
  }

  hide() {
    this.isShow = false;
  }

  protected reset(): void {
    this.model = null;
    this.isShowConnectionStatus = false;
    this.enableBack = false;
    this.loading = false;
    this.testErrorMessage = '';
    this.cancelTitle = 'Back';
  }

  protected get toComponent(): Function | undefined {
    if (this.model) {
      return ConnectorConfigModal.components.get(this.model.className);
    }
    return void 0;
  }

  protected async testConnection(source: Connector | null) {
    if (!source) {
      return;
    }

    this.isTestConnectionLoading = true;
    this.isShowConnectionStatus = false;
    this.testErrorMessage = '';
    try {
      this.connectorForm.valid();
      const clonedSource = cloneDeep(source);
      if (clonedSource.tunnelConfig) {
        clonedSource.tunnelConfig.timeoutMs = 30000;
      }
      this.isTestConnectionSuccess = await this.connectorService.testConnection(clonedSource!);
      this.isShowConnectionStatus = true;
    } catch (ex) {
      if (InvalidDataException.isInvalidDataException(ex)) {
        this.isShowConnectionStatus = false;
        return;
      }
      this.isShowConnectionStatus = true;
      this.isTestConnectionSuccess = false;
      this.testErrorMessage = ex.message;
    } finally {
      this.isTestConnectionLoading = false;
    }
  }

  protected async submitSource(source: Connector | null, event?: MouseEvent) {
    event?.preventDefault();
    if (!source) {
      return;
    }
    try {
      this.loading = true;
      this.testErrorMessage = '';
      this.connectorForm.valid();
      const createdSource: Connector = await this.connectorService.setSource(source!);
      this.callback ? this.callback(createdSource) : null;
      this.hide();
    } catch (ex) {
      if (InvalidDataException.isInvalidDataException(ex)) {
        return;
      }
      this.testErrorMessage = ex.message;
    } finally {
      this.loading = false;
    }
  }

  cancel() {
    Log.debug('cancel::');
    this.onBack ? this.onBack() : null;
    this.hide();
  }

  get modalTitle(): string {
    return this.model?.displayName ?? '';
  }

  protected handleLoadPublicKeyError(ex: DIException) {
    this.testErrorMessage = ex.message;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';

#connector-config-modal {
  @include regular-text();

  .modal-header {
    //border-bottom: 1px solid rgba(60, 60, 60, 0.26) !important;
    padding: 12px 20px !important;

    #connector-config-modal-title {
      font-weight: 500;
      font-size: 20px;
      line-height: 150%;
      margin-bottom: 4px;
    }

    #connector-config-modal-subtitle {
      font-weight: 400;
      font-size: 16px;
      line-height: 132%;
    }
  }

  .modal-body {
    max-height: 500px;
    padding: 21px 20px !important;
    overflow: auto;
  }

  .modal-footer {
    //border-top: 1px solid rgba(60, 60, 60, 0.26) !important;
    padding: 0.75rem 1.25rem !important;

    .btn-primary {
      padding: 11.5px 36px;
      margin: 0;
    }

    .btn-secondary {
      padding: 10.5px 17.5px;
      margin: 0;
    }

    .btn + .btn {
      margin-left: 12px;
    }
  }

  #test-connection-btn {
    width: fit-content;
    border: 1px solid var(--accent) !important;
    color: var(--accent) !important;
    padding: 17px 22px;

    > span {
      margin-left: 0;
      color: var(--accent) !important;
    }

    i {
      margin-right: 8px;
    }

    span + span {
      margin-left: 6px;
    }
  }

  .notification-area {
    @include regular-text();
    display: flex;
    flex-direction: row;
    padding: 15px;
    border-radius: 8px;
    align-items: center;

    img {
      margin-right: 12px;
      height: 24px;
      width: 24px;
    }

    .info {
      display: flex;
      flex-direction: column;
    }

    &.success {
      background-color: #effff9;
      border: 1px solid #14c684;

      .title {
        font-size: 15px;
        font-weight: 400;
        line-height: 100%;
      }
    }

    &.error {
      background-color: #fff6f6;
      border: 1px solid #ff5151;
      align-items: start;

      .title {
        font-size: 15px;
        font-weight: 500;
        line-height: 100%;
        margin-bottom: 4px;
      }
    }
  }
}
</style>
