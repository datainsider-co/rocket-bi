<template>
  <EtlModal
    class="clickhouse-setup-progress"
    ref="modal"
    @submit="submit"
    @hidden="resetModel"
    :loading="loading"
    :actionName="actionName"
    :title="`${displayName} Config`"
    :width="520"
    backdrop="static"
  >
    <div class=" clickhouse-setup-progress-body">
      <vuescroll :ops="scrollConfig">
        <div class="scroll-body">
          <div class="intro">
            You're almost there! Just a few more steps and you'll be ready to go. Hang on while we:
          </div>
          <div v-for="stage in stages" :key="stage.name" class="clickhouse-setup-progress-body--status-item">
            <div v-if="stage.isRunning" class="d-flex align-items-center">
              <DiLoading></DiLoading>
              <div class="clickhouse-setup-progress-body--status-item--title">
                {{ getStageDisplayName(stage.name) }} <span v-if="stage.total >= 0">({{ stage.progress }}/{{ stage.total }})</span>
              </div>
            </div>
            <div v-else-if="stage.isSuccess" class="d-flex align-items-center">
              <img class="clickhouse-setup-progress-body--status-item--icon" src="@/assets/icon/ic_success.svg" alt="success" />
              <div class="clickhouse-setup-progress-body--status-item--title">{{ getStageDisplayName(stage.name) }}</div>
            </div>
            <div v-else-if="stage.isError" class="d-flex align-items-center">
              <img class="clickhouse-setup-progress-body--status-item--icon" src="@/assets/icon/ic_error.svg" alt="error" />
              <div class="clickhouse-setup-progress-body--status-item--title">{{ getStageDisplayName(stage.name) }}</div>
            </div>
          </div>
          <div v-if="model.stages[model.stages.length - 1]" :class="currentStatusClass(model.status)">
            <span v-if="model.stages[model.stages.length - 1].isError"> Error: {{ model.stages[model.stages.length - 1].message }} </span>
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
    <template #header-action>
      <div>
        <button v-if="isShowBack" :disabled="loading || isDisabledSubmit" class="submit-button btn btn-sm btn-primary px-3" @click.prevent="back">
          Back
        </button>
        <button v-else :disabled="loading || isDisabledSubmit" class="submit-button btn btn-sm btn-primary px-3" @click.prevent="submit">
          <div class="d-flex align-items-center justify-content-center">
            <i v-if="loading" class="fa fa-spin fa-spinner"></i>
            {{ actionName }}
          </div>
        </button>
      </div>
    </template>
    <template #header>
      <div class="flex flex-column ">
        <h4>{{ displayName }} Setup Progress</h4>
        <!--        <h6 class="text-left">You must complete Clickhouse configuration in order to use Rocket BI features</h6>-->
      </div>
    </template>
  </EtlModal>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { VerticalScrollConfigs, Routers } from '@/shared';
import { RefreshSchemaHistory, RefreshSchemaStage, RefreshSchemaStageName, StageStatus } from '@core/clickhouse-config';
import ClickhouseSourceForm from '@/screens/organization-settings/views/clickhouse-config/ClickhouseSourceForm.vue';
import DiLoading from '@/shared/components/DiLoading.vue';
import { Log } from '@core/utils';
import { PopupUtils, RouterUtils } from '@/utils';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';

@Component({
  components: {
    DiLoading,
    ClickhouseSourceForm,
    EtlModal
  }
})
export default class ClickhouseSetupProgressModal extends Vue {
  private readonly scrollConfig = VerticalScrollConfigs;
  private callback: (() => void) | null = null;
  private backCallback: (() => void) | null = null;
  private loading = false;
  private interval = 0;

  @Ref()
  private readonly modal!: EtlModal;

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
        return 'Connect to your Clickhouse database.';
      case RefreshSchemaStageName.ScanDatabase:
        return 'Fetch Clickhouse schema into Data Warehouse.';
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
    // @ts-ignore
    this.modal.show();
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
    this.modal.hide();
    if (this.backCallback) {
      this.backCallback();
    }
  }
}
</script>
<style lang="scss">
@import '~@/themes/scss/mixin.scss';
.clickhouse-setup-progress {
  .submit-button,
  .cancel-button {
    justify-content: center;
    width: 95px;
    i {
      margin-right: 4px;
    }
  }
  .cancel-button {
    height: 24.5px;
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
      .clickhouse-setup-progress-body {
        background-color: var(--secondary);
        height: 468px;
        padding: 16px 4px 16px 16px;
        border-radius: 4px;

        .intro {
          @include regular-text();
          font-size: 16px;
          font-weight: 400;
          color: var(--text-color);
          margin-bottom: 12px;
        }

        &--status-item {
          margin-bottom: 8px;
          &--icon {
            width: 24px;
            height: 24px;
          }
          &--title {
            @include regular-text();
            font-size: 16px;
            font-weight: 400;
            color: var(--text-color);
            margin-left: 8px;
          }
        }

        .message-error,
        .message-success {
          @include regular-text();
          font-size: 16px;
          font-weight: 400;
        }
        .message-error {
          color: var(--danger);
        }
      }
    }
  }
}
</style>
