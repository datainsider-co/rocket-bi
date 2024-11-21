<template>
  <BModal
    id="source-setup-progress-modal"
    centered
    class="rounded"
    size="lg"
    v-model="isShow"
    lazy
    :ok-disabled="model.isError || model.isRunning || model.isNotStarted"
    :cancel-disabled="loading"
    :ok-title="actionName"
    cancel-title="Back"
    @ok="submit"
    @cancel="back"
    @hidden="resetModel"
    :no-close-on-backdrop="model.isError || model.isRunning || model.isNotStarted"
    :no-close-on-esc="model.isError || model.isRunning || model.isNotStarted"
  >
    <template #modal-header>
      <div>
        <div id="modal-title">{{ displayName }} Config Progress</div>
      </div>
    </template>
    <div id="source-progress-body">
      <vuescroll :ops="scrollConfig">
        <div class="scroll-body">
          <div class="intro">
            You're almost there! Just a few more steps and you'll be ready to go. Hang on while we:
          </div>
          <div v-for="stage in stages" :key="stage.name" class="clickhouse-setup-progress-body--status-item">
            <div v-if="stage.isRunning" class=" mb-18px d-flex align-items-center">
              <DiLoading mode="small"></DiLoading>
              <div class="clickhouse-setup-progress-body--status-item--title">
                {{ getStageDisplayName(stage.name) }} <span v-if="stage.total >= 0">({{ stage.progress }}/{{ stage.total }})</span>
              </div>
            </div>
            <div v-else-if="stage.isSuccess" class=" mb-18px d-flex align-items-center">
              <img class="clickhouse-setup-progress-body--status-item--icon" src="@/assets/icon/ic_success.svg" alt="success" />
              <div class="clickhouse-setup-progress-body--status-item--title">{{ getStageDisplayName(stage.name) }}</div>
            </div>
            <div v-else-if="stage.isError" class="mb-18px d-flex align-items-center">
              <img class="clickhouse-setup-progress-body--status-item--icon" src="@/assets/icon/ic_error.svg" alt="error" />
              <div class="clickhouse-setup-progress-body--status-item--title">{{ getStageDisplayName(stage.name) }}</div>
            </div>
          </div>
          <div v-if="model.stages[model.stages.length - 1]" :class="currentStatusClass(model.status)">
            <ErrorMessage
              v-if="model.stages[model.stages.length - 1].isError"
              title="Error"
              :message="`Error: ${model.stages[model.stages.length - 1].message}`"
            />
            <span v-if="model.stages[model.stages.length - 1].isSuccess">
              Woohoo! You did it! Your RocketBI setup is complete. Explore our amazing features now!
            </span>
            <span v-if="model.stages[model.stages.length - 1].isTerminated">
              The progress is terminated!
            </span>
          </div>
        </div>
      </vuescroll>
    </div>
  </BModal>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import DiLoading from '@/shared/components/DiLoading.vue';
import { Routers, VerticalScrollConfigs } from '@/shared';
import { RefreshSchemaHistory, RefreshSchemaStage, RefreshSchemaStageName, StageStatus } from '@core/connector-config';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';
import { Log } from '@core/utils';
import { PopupUtils, RouterUtils } from '@/utils';
import ErrorMessage from '@/screens/organization-settings/views/connector-config/ErrorMessage.vue';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';

@Component({
  components: { ErrorMessage, DiLoading }
})
export default class ConnectorSetupProgressModal extends Vue {
  private readonly scrollConfig = VerticalScrollConfigs;
  private loading = false;
  private isShow = false;

  private callback: (() => void) | null = null;
  private backCallback: (() => void) | null = null;
  private interval = 0;

  private get model(): RefreshSchemaHistory {
    return ConnectionModule.status;
  }

  private get actionName() {
    return 'Next';
  }

  private get currentStatus() {
    return this.model.status;
  }

  private get isShowBack() {
    return this.currentStatus === StageStatus.Error;
  }

  private getStage(name: RefreshSchemaStageName): RefreshSchemaStage {
    const status: RefreshSchemaStage | undefined = this.model.stages.find(stage => stage.name === name);
    const defaultStage: RefreshSchemaStage = RefreshSchemaStage.default(name);
    if (status && !status.isSuccess && (this.currentStatus === StageStatus.Error || this.currentStatus === StageStatus.Running)) {
      status?.setStatus(this.currentStatus);
    }
    if (this.currentStatus === StageStatus.Error) {
      defaultStage.setStatus(StageStatus.Error);
    }
    return status ?? defaultStage;
  }

  private getStageDisplayName(name: RefreshSchemaStageName) {
    switch (name) {
      case RefreshSchemaStageName.TestConnection:
        return `Connect to your ${this.displayName} database.`;
      case RefreshSchemaStageName.ScanDatabase:
        return `Fetch ${this.displayName} schema into Data Warehouse.`;
      case RefreshSchemaStageName.Completed:
        return 'Finish up.';
    }
  }

  private currentStatusClass(status: StageStatus) {
    return {
      'message-success': status === StageStatus.Success,
      'message-error': status === StageStatus.Error
    };
  }

  private get stages() {
    return [
      this.getStage(RefreshSchemaStageName.TestConnection),
      this.getStage(RefreshSchemaStageName.ScanDatabase),
      this.getStage(RefreshSchemaStageName.Completed)
    ];
  }

  async show(callbackOptions: { callback?: () => void; backCallback?: () => void }) {
    if (callbackOptions?.callback) {
      this.callback = callbackOptions.callback;
    }
    if (callbackOptions?.backCallback) {
      this.backCallback = callbackOptions.backCallback;
    }
    ConnectionModule.setStatus(RefreshSchemaHistory.default());
    this.isShow = true;
    await this.handleRefreshSchema();
    await this.handleRefreshStatus();
  }

  private get isDisabledSubmit() {
    return this.stages[2].isRunning;
  }

  private handleRefreshStatus() {
    //wait auto refresh time and call refresh
    if (!this.loading) {
      this.interval = setInterval(async () => {
        Log.debug('handleRefreshStatus');
        await this.handleGetStatus();
        if (!this.stages[2].isRunning) {
          clearInterval(this.interval);
        }
      }, 1000);
    }
  }

  private resetModel() {
    this.callback = null;
    this.loading = false;
  }

  private async handleRefreshSchema() {
    try {
      await ConnectionModule.refreshSchema();
    } catch (e) {
      Log.error('ClickhouseSetupProgress::handleRefreshSchema::error::', e);
    }
  }

  private async handleGetStatus() {
    try {
      await ConnectionModule.loadStatus();
    } catch (e) {
      Log.error('ClickhouseSetupProgress::handleGetStatus::error::', e);
    }
  }

  private async submit() {
    try {
      this.loading = true;
      if (this.callback) {
        this.callback();
      }
      DatabaseSchemaModule.reset();
      ConnectionModule.setIsExistedSource(true);
      await RouterUtils.to(Routers.DataSchema);
    } catch (e) {
      Log.error('ClickhouseSetupProgressModal::submit::error::', e);
      PopupUtils.showError(e.message);
    } finally {
      this.loading = false;
    }
  }

  private get displayName(): string {
    return ConnectionModule.source?.displayName ?? '';
  }

  private back() {
    if (this.backCallback) {
      this.backCallback();
    }
    this.hide();
  }

  private hide() {
    this.isShow = false;
    this.callback = null;
    this.backCallback = null;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';

#source-setup-progress-modal {
  @include regular-text();

  .modal-header {
    border-bottom: 1px solid rgba(60, 60, 60, 0.26) !important;
    padding: 12px 20px !important;

    #modal-title {
      font-weight: 500;
      font-size: 22px;
      line-height: 150%;
    }
  }

  .modal-body {
    max-height: 450px;
    padding: 21px 20px !important;
    overflow: auto;

    #source-progress-body {
      .intro {
        font-size: 18px;
        font-weight: 500;
        line-height: 155%;
        margin-bottom: 18px;
      }

      .mb-18px {
        margin-bottom: 18px;
      }

      .clickhouse-setup-progress-body--status-item {
        font-size: 16px;
        line-height: 132%;

        &--title {
          margin-left: 14px;
        }

        .loading-container {
          height: 20px;
          width: 20px;
        }

        &--icon {
          height: 20px;
          width: 20px;
        }
      }

      .message-success,
      .message-error {
        margin-top: 26px;
      }
    }
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
}
</style>
