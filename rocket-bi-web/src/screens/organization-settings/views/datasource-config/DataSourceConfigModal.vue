<template>
  <BModal
    id="source-config-modal"
    centered
    class="rounded"
    size="lg"
    v-model="isShow"
    lazy
    :ok-disabled="loading"
    :cancel-disabled="loading"
    ok-title="Apply"
    :cancel-title="cancelTitle"
    @ok="event => submitSource(model, event)"
    @cancel="cancel"
    :no-close-on-backdrop="!enableBack"
    :no-close-on-esc="!enableBack"
  >
    <template #modal-header>
      <div>
        <div id="source-config-modal-title">{{ modalTitle }} Config</div>
        <div id="source-config-modal-subtitle">
          To get started, you need to give us access to your {{ modalTitle }}. Follow these simple steps to complete your setup.
        </div>
      </div>
    </template>
    <!--    <vuescroll :ops="scrollOptions">-->
    <component :is="toComponent" :model.sync="model" ref="sourceConfig" />

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
import { Vue, Component, Ref } from 'vue-property-decorator';
import { ClickhouseConfigService, DataSource, DataSourceType } from '@core/clickhouse-config';
import { Inject } from 'typescript-ioc';
import { Log } from '@core/utils';
import { VerticalScrollConfigs } from '@/shared';
import { InvalidDataException } from '@core/common/domain';
import { cloneDeep } from 'lodash';
import ErrorMessage from '@/screens/organization-settings/views/clickhouse-config/ErrorMessage.vue';
import SuccessMessage from '@/screens/organization-settings/views/clickhouse-config/SuccessMessage.vue';

const BigquerySourceConfig = () => import('@/screens/organization-settings/views/datasource-config/source-config-impl/BigQuerySourceConfig.vue');
const ClickhouseSourceConfig = () => import('@/screens/organization-settings/views/clickhouse-config/ClickhouseSourceForm.vue');

const MySQLSourceConfig = () => import('@/screens/organization-settings/views/datasource-config/source-config-impl/my_sql/MySQLSourceConfig.vue');
const VerticaSourceConfig = () => import('@/screens/organization-settings/views/datasource-config/source-config-impl/vertica/VerticaSourceConfig.vue');
@Component({
  components: { ErrorMessage, SuccessMessage }
})
export default class DataSourceConfigModal extends Vue {
  private scrollOptions = VerticalScrollConfigs;
  static readonly components = new Map<string, Function>([
    [DataSourceType.Bigquery, BigquerySourceConfig],
    [DataSourceType.Clickhouse, ClickhouseSourceConfig],
    [DataSourceType.MySQL, MySQLSourceConfig],
    [DataSourceType.Vertica, VerticaSourceConfig]
  ]);
  private model: DataSource | null = null;
  private callback: ((source: DataSource) => void) | null = null;
  private onBack: (() => void) | null = null;
  private loading = false;
  private enableBack = false;
  private isShowConnectionStatus = false;
  private isTestConnectionLoading = false;
  private isTestConnectionSuccess = false;
  private isShow = false;
  private testErrorMessage = '';
  private cancelTitle = 'Back';
  @Ref()
  private sourceConfig: any;

  @Inject
  private clickhouseConfigService!: ClickhouseConfigService;

  show(source: DataSource, enableBack: boolean, cancelTitle: string, callback: (source: DataSource) => void, onBack: () => void) {
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
    this.model = null;
    this.isShowConnectionStatus = false;
    this.enableBack = false;
    this.loading = false;
    this.testErrorMessage = '';
    this.cancelTitle = 'Back';
  }

  private get toComponent(): Function | undefined {
    if (this.model) {
      return DataSourceConfigModal.components.get(this.model.className);
    }
    return void 0;
  }

  private async testConnection(source: DataSource | null) {
    if (!source) {
      return;
    }

    this.isTestConnectionLoading = true;
    this.isShowConnectionStatus = false;
    this.testErrorMessage = '';
    try {
      this.sourceConfig.valid();
      this.isTestConnectionSuccess = await this.clickhouseConfigService.testConnection(source!);
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

  private async submitSource(source: DataSource | null, event: MouseEvent) {
    event.preventDefault();
    if (!source) {
      return;
    }
    try {
      this.loading = true;
      this.testErrorMessage = '';
      this.sourceConfig.valid();
      const createdSource: DataSource = await this.clickhouseConfigService.setSource(source!);
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
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';

#source-config-modal {
  @include regular-text();

  .modal-header {
    border-bottom: 1px solid rgba(60, 60, 60, 0.26) !important;
    padding: 12px 20px !important;

    #source-config-modal-title {
      font-weight: 500;
      font-size: 20px;
      line-height: 150%;
      margin-bottom: 4px;
    }

    #source-config-modal-subtitle {
      font-weight: 400;
      font-size: 16px;
      line-height: 132%;
    }
  }

  .modal-body {
    max-height: 450px;
    padding: 21px 20px !important;
    overflow: auto;
  }

  .modal-footer {
    border-top: 1px solid rgba(60, 60, 60, 0.26) !important;
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
