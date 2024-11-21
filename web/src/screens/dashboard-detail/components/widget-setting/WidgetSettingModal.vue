<template>
  <DiCustomModal
    id="widget-setting-modal"
    ref="modal"
    size="lg"
    title="Widgets Settings"
    hide-header-close
    ok-title="Save"
    @onClickOk.prevent="applySetting"
    button-size="small"
  >
    <template #header-icon>
      <i class="di-icon-edit-dashboard mar-r-8"></i>
    </template>
    <template #default>
      <DiTab :tabs="tabs">
        <template #primary_text>
          <WidgetTextSetting
            ref="primaryTextSetting"
            v-model="tempSetting.widgetSetting.primaryText"
            placeholder="Primary Text is used for chart title..."
            :default-color="defaultPrimaryTextColor"
            @applySetting="applySetting"
          />
        </template>
        <template #secondary_text>
          <WidgetTextSetting
            ref="secondaryTextSetting"
            v-model="tempSetting.widgetSetting.secondaryText"
            placeholder="Secondary Text is used for descriptions, tooltips..."
            :default-color="defaultSecondaryTextColor"
            @applySetting="applySetting"
          />
        </template>
        <template #padding_and_border>
          <PaddingAndBorderSetting ref="paddingAndBorderSetting" v-model="tempSetting" @applySetting="applySetting" />
        </template>
        <template #background_color>
          <WidgetColorSetting v-model="tempSetting.widgetSetting.background" @applySetting="applySetting" />
        </template>
      </DiTab>
    </template>
  </DiCustomModal>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Ref } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { DashboardSetting, DIException, TextStyleSetting } from '@core/common/domain';
import { cloneDeep } from 'lodash';
import DiTab, { DiTabData } from '@/shared/components/DiTab.vue';
import PaddingAndBorderSetting from '@/screens/dashboard-detail/components/widget-setting/PaddingAndBorderSetting.vue';
import WidgetTextSetting from '@/screens/dashboard-detail/components/widget-setting/WidgetTextSetting.vue';
import WidgetColorSetting from '@/screens/dashboard-detail/components/widget-setting/WidgetColorSetting.vue';

@Component({
  components: {
    DiTab,
    DiCustomModal,
    PaddingAndBorderSetting,
    WidgetTextSetting,
    WidgetColorSetting
  }
})
export default class WidgetSettingModal extends Vue {
  protected tempSetting = DashboardSetting.default();
  protected onApply?: (setting: DashboardSetting) => Promise<void>;

  @Ref()
  protected readonly modal!: DiCustomModal;

  @Ref()
  protected readonly primaryTextSetting!: WidgetTextSetting;

  @Ref()
  protected readonly secondaryTextSetting!: WidgetTextSetting;

  @Ref()
  protected readonly paddingAndBorderSetting!: PaddingAndBorderSetting;

  @Ref()
  protected readonly widgetColorSetting!: WidgetColorSetting;

  protected get defaultPrimaryTextColor(): string {
    return TextStyleSetting.primaryDefault().color;
  }

  protected get defaultSecondaryTextColor(): string {
    return TextStyleSetting.secondaryDefault().color;
  }

  protected get tabs(): DiTabData[] {
    return [
      {
        key: 'primary_text',
        label: 'Primary Text',
        iconClass: 'di-icon-minimize-text'
      },
      {
        key: 'secondary_text',
        label: 'Secondary Text',
        iconClass: 'di-icon-minimize-text'
      },
      {
        key: 'padding_and_border',
        label: 'Padding and Border',
        iconClass: 'di-icon-border-all'
      },
      {
        key: 'background_color',
        label: 'Background color',
        iconClass: 'di-icon-color'
      }
    ];
  }

  show(setting: DashboardSetting, onApply?: (setting: DashboardSetting) => Promise<void>) {
    this.tempSetting = cloneDeep(setting);
    this.onApply = onApply;
    this.modal.show();
  }

  hide() {
    this.modal.hide();
  }

  protected async applySetting(): Promise<void> {
    try {
      this.modal.setLoading(true);
      this.ensureSetting();
      const newSetting = cloneDeep(this.tempSetting);
      if (this.onApply) {
        await this.onApply(newSetting);
      }
      this.modal.hide();
    } catch (error) {
      const ex = DIException.fromObject(error);
      this.modal.setError(ex.getPrettyMessage());
    } finally {
      this.modal.setLoading(false);
    }
  }

  private ensureSetting(): void {
    this.primaryTextSetting?.ensureSetting();
    this.secondaryTextSetting?.ensureSetting();
    this.paddingAndBorderSetting?.ensureSetting();
    this.widgetColorSetting?.ensureSetting();
  }
}
</script>

<style lang="scss">
#widget-setting-modal {
  .modal-body {
    min-height: 455px;

    .modal-body {
      //padding: 0;
      min-height: unset;
    }
  }
}
</style>
