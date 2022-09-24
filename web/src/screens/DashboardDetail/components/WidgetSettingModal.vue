<template>
  <EtlModal
    ref="modal"
    class="edit-tab-modal"
    @submit="submit"
    @hidden="resetModel"
    :loading="loading"
    :title="title"
    actionName="Save"
    borderCancel
    backdrop
    :width="1200"
    builder-default-style
  >
    <div class="edit-tab-modal-container">
      <div class="preview-tab-container" v-if="isTabWidget" widget-preview-area>
        <div class="space-container"></div>
        <TabViewer class="preview-tab" :is-show-add="false" :is-show-component="false" :widget="widget" />
        <div class="space-container"></div>
      </div>
      <DynamicConditionViewer
        v-if="isDynamicCondition"
        :isPreview="true"
        class="preview-tab-container align-items-start"
        :is-show-component="false"
        :widget="widget"
      />
      <div class="setting-tab-container" v-if="widget">
        <vuescroll :ops="scrollOption" style="position:unset">
          <TabWidgetSetting v-if="isTabWidget" :widget.sync="widget" />
          <DynamicConditionSetting v-if="isDynamicCondition" :widget.sync="widget" />
        </vuescroll>
      </div>
    </div>
  </EtlModal>
</template>

<script lang="ts">
import TabViewer from '@/screens/DashboardDetail/components/WidgetContainer/other/TabViewer.vue';
import EtlModalCtrl from '@/screens/DataCook/components/EtlModal/EtlModal.ctrl';
import EtlModal from '@/screens/DataCook/components/EtlModal/EtlModal.vue';
import { VerticalScrollConfigs } from '@/shared';
import { Widget, Widgets } from '@core/domain';
import { DashboardService } from '@core/services';
import { cloneDeep } from 'lodash';
import { Inject } from 'typescript-ioc';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Config } from 'vuescroll';
import TabWidgetSetting from '@/screens/DashboardDetail/components/WidgetSetting/TabWidgetSetting.vue';
import DynamicConditionSetting from '@/screens/DashboardDetail/components/WidgetSetting/DynamicConditionSetting.vue';
import DynamicConditionViewer from '@/screens/DashboardDetail/components/WidgetContainer/other/DynamicConditionViewer.vue';

@Component({ components: { DynamicConditionViewer, TabViewer, EtlModal, TabWidgetSetting, DynamicConditionSetting } })
export default class WidgetSettingModal extends Vue {
  scrollOption: Config = VerticalScrollConfigs;

  @Ref()
  private modal!: EtlModalCtrl;

  @Inject
  private dashboardService!: DashboardService;

  private widget: Widget | null = null;

  private callback: ((widget: Widget) => void) | null = null;

  private loading = false;

  private error = '';

  show(widget: Widget, onCompleted?: (widget: Widget) => void) {
    this.widget = cloneDeep(widget);
    this.callback = onCompleted || null;
    this.$nextTick(() => {
      this.modal.show();
    });
  }

  private resetModel() {
    this.widget = null;
    this.callback = null;
  }

  private async submit() {
    this.modal.hide();
    if (this.callback && this.widget) {
      this.callback(this.widget);
    }
  }

  private get title(): string {
    switch (this.widget?.className) {
      case Widgets.Tab:
        return 'Config Tab';
      case Widgets.DynamicFunctionWidget:
        return 'Config Control';
      default:
        return 'Config';
    }
  }

  private get isTabWidget(): boolean {
    return this.widget?.className === Widgets.Tab;
  }

  private get isDynamicCondition(): boolean {
    return this.widget?.className === Widgets.DynamicConditionWidget;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

$setting-width: 350px;
.edit-tab-modal {
  .edit-tab-modal-container {
    height: 600px;
    display: flex;

    .preview-tab-container {
      width: calc(100% - 350px);
      align-items: center;
      background: var(--dashboard-gradient-background-color, transparent);
      margin-right: 16px;
      border-radius: 4px;
      //padding: 16px;

      .space-container {
        height: 20%;
      }

      .tab-viewer-container {
        .card {
          height: 50%;

          .tab-content {
            height: 100%;
          }
        }
      }
    }

    .setting-tab-container {
      width: $setting-width;
      height: 100%;
      background: var(--secondary);
      padding: 16px;
      border-radius: 4px;
    }
  }
}
</style>
