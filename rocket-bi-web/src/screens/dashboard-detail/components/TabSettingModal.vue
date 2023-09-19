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
      <div class="preview-tab-container" v-if="isFilterPanel" widget-preview-area>
        <FilterPanelViewer class="preview-group" is-preview :is-show-component="false" :widget="widget" />
      </div>
      <div class="preview-tab-container" v-else-if="isTabWidget" widget-preview-area>
        <div class="space-container"></div>
        <TabViewer class="preview-tab" :is-show-add="false" :is-show-component="false" :widget="widget" />
        <div class="space-container"></div>
      </div>
      <div class="setting-tab-container" v-if="widget">
        <vuescroll :ops="scrollOption" style="position:unset">
          <FilterPanelSetting v-if="isFilterPanel" :widget.sync="widget" />
          <TabWidgetSetting v-else-if="isTabWidget" :widget.sync="widget" />
        </vuescroll>
      </div>
    </div>
  </EtlModal>
</template>

<script lang="ts">
import TabViewer from '@/screens/dashboard-detail/components/widget-container/other/TabViewer.vue';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { VerticalScrollConfigs } from '@/shared';
import { GroupFilter, Widget, Widgets } from '@core/common/domain';
import { DashboardService } from '@core/common/services';
import { cloneDeep } from 'lodash';
import { Inject } from 'typescript-ioc';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Config } from 'vuescroll';
import TabWidgetSetting from '@/screens/dashboard-detail/components/widget-setting/TabWidgetSetting.vue';
import FilterPanelViewer from '@/screens/dashboard-detail/components/widget-container/other/FilterPanelViewer.vue';
import FilterPanelSetting from '@/screens/dashboard-detail/components/widget-setting/filter-panel-setting/FilterPanelSetting.vue';

@Component({
  components: {
    FilterPanelViewer,
    TabViewer,
    EtlModal,
    TabWidgetSetting,
    FilterPanelSetting
  }
})
export default class TabSettingModal extends Vue {
  scrollOption: Config = VerticalScrollConfigs;

  @Ref()
  private modal!: EtlModal;

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
      default:
        return 'Config';
    }
  }

  private get isTabWidget(): boolean {
    return this.widget?.className === Widgets.Tab;
  }

  private get isFilterPanel(): boolean {
    return GroupFilter.isGroupFilter(this.widget);
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
