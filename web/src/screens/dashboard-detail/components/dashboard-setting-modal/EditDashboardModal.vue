<template>
  <DiCustomModal
    id="edit-dashboard-setting"
    :no-close-on-backdrop="isLoading"
    :no-close-on-esc="isLoading"
    ref="modal"
    size="lg"
    title="Dashboard Settings"
    hide-header-close
    ok-title="Save"
    @onClickOk.prevent="applySetting"
    button-size="small"
  >
    <template #header-icon>
      <i class="di-icon-dashboard-2 mr-2"></i>
    </template>
    <template #default>
      <DiTab :tabs="tabs">
        <template #size>
          <DashboardSizeSetting ref="dashboardSizeSetting" v-model="tempSetting" @applySetting="applySetting"></DashboardSizeSetting>
        </template>
        <template #background>
          <DashboardBackgroundSetting ref="dashboardBackgroundSetting" v-model="tempSetting" @applySetting="applySetting"></DashboardBackgroundSetting>
        </template>
        <template #theme>
          <DashboardThemeSetting ref="dashboardThemeSetting" v-model="tempSetting" @applySetting="applySetting"></DashboardThemeSetting>
        </template>
        <template #color>
          <DashboardColorSetting ref="dashboardColorSetting" v-model="tempSetting" @applySetting="applySetting"></DashboardColorSetting>
        </template>
      </DiTab>
    </template>
  </DiCustomModal>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { Ref } from 'vue-property-decorator';
import { DiTabData } from '@/shared/components/DiTab.vue';
import DashboardSizeSetting from '@/screens/dashboard-detail/components/dashboard-setting-modal/components/DashboardSizeSetting.vue';
import DashboardBackgroundSetting from '@/screens/dashboard-detail/components/dashboard-setting-modal/components/DashboardBackgroundSetting.vue';
import { DashboardSetting, DIException } from '@core/common/domain';
import { cloneDeep } from 'lodash';
import DashboardColorSetting from '@/screens/dashboard-detail/components/dashboard-setting-modal/components/DashboardColorSetting.vue';
import DashboardThemeSetting from '@/screens/dashboard-detail/components/dashboard-setting-modal/components/DashboardThemeSetting.vue';

@Component({
  components: {
    DiCustomModal,
    DashboardSizeSetting,
    DashboardBackgroundSetting,
    DashboardColorSetting,
    DashboardThemeSetting
  }
})
export default class EditDashboardModal extends Vue {
  private tempSetting = DashboardSetting.default();

  @Ref()
  protected readonly modal!: DiCustomModal;

  @Ref()
  protected dashboardSizeSetting?: DashboardSizeSetting;

  @Ref()
  protected dashboardThemeSetting?: DashboardThemeSetting;

  @Ref()
  protected dashboardBackgroundSetting?: DashboardBackgroundSetting;

  @Ref()
  protected dashboardColorSetting?: DashboardColorSetting;

  protected isLoading = false;
  private onApply?: (setting: DashboardSetting) => Promise<void>;

  private get tabs(): DiTabData[] {
    return [
      {
        iconClass: 'di-icon-dashboard-2',
        key: 'size',
        label: 'Size'
      },
      {
        iconClass: 'di-icon-change-background',
        key: 'background',
        label: 'Background'
      },
      // {
      //   iconClass: 'di-icon-image',
      //   key: 'theme',
      //   label: 'Theme'
      // },
      {
        iconClass: 'di-icon-color',
        key: 'color',
        label: 'Color'
      }
    ];
  }

  show(currentSetting: DashboardSetting, onApply?: (setting: DashboardSetting) => Promise<void>): void {
    this.tempSetting = cloneDeep(currentSetting);
    this.onApply = onApply;
    this.$nextTick(() => {
      this.modal.show();
    });
  }

  hide() {
    this.$nextTick(() => {
      this.modal.hide();
    });
  }

  protected async applySetting(): Promise<void> {
    try {
      this.modal.setError(null);
      this.modal.setLoading(true);
      this.ensureSetting();
      const setting = cloneDeep(this.tempSetting);
      await this.onApply?.call(this, setting);

      this.$nextTick(() => {
        this.hide();
      });
    } catch (ex) {
      const error = DIException.fromObject(ex);
      this.modal.setError(error.message);
    } finally {
      this.modal.setLoading(false);
    }
  }

  protected ensureSetting(): void {
    this.dashboardSizeSetting?.ensureSetting();
    this.dashboardBackgroundSetting?.ensureSetting();
    this.dashboardColorSetting?.ensureSetting();
    this.dashboardThemeSetting?.ensureSetting();
  }
}
</script>

<style lang="scss">
#edit-dashboard-setting {
  .modal-body {
    min-height: 480px;

    .modal-body {
      //padding: 0;
      min-height: unset;
    }
  }
}
</style>
