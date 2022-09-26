<template>
  <div class="dynamic-function-widget-container" :style="containerStyle">
    <InputControlViewer :widget="widget" :isPreview="isPreview" :showEditComponent="showEditComponent" />
    <ActionMore
      class="widget-action-more mt-3"
      v-if="showEditComponent"
      :id="`${widget.id}`"
      @editTitle="handleEditTitle"
      @editChart="handleEdit"
      @duplicate="handleDuplicate"
      @delete="handleDelete"
    />
  </div>
</template>

<script lang="ts">
import { Component, Inject, Prop, Vue } from 'vue-property-decorator';
import { DynamicFunctionWidget } from '@core/domain';
import { ChartType } from '@/shared';
import { WidgetModule } from '@/screens/DashboardDetail/stores';
import ActionMore from '@/screens/DashboardDetail/components/WidgetContainer/other/ActionMore.vue';
import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';
import { PopupUtils } from '@/utils/popup.utils';
import Swal from 'sweetalert2';
import TabControlViewer from '@/screens/DashboardDetail/components/WidgetContainer/other/ControlView/TabControlViewer.vue';
import InputControlViewer from '@/screens/DashboardDetail/components/WidgetContainer/other/ControlView/InputControlViewer.vue';
import { DynamicConditionWidget } from '@core/domain/Model/Widget/Filter/DynamicConditionWidget';

@Component({ components: { ActionMore, TabControlViewer, InputControlViewer } })
export default class DynamicConditionViewer extends Vue {
  $alert!: typeof Swal;

  @Prop({ required: true })
  private readonly widget!: DynamicConditionWidget;

  @Prop({ required: false, default: false })
  private readonly showEditComponent!: boolean;

  @Prop({ required: false, default: false })
  private readonly isPreview!: boolean;
  // Provide from DiGridstackItem
  @Inject()
  remove?: (fn: Function) => void;

  private get containerStyle() {
    // const alignKey = this.direction == Direction.column ? 'justify-content' : 'align-self';
    return {
      '--background-color': this.widget.backgroundColor ?? this.widget.options.background ?? 'var(--chart-background-color)',
      // '--text-color': this.setting.options.textColor,
      // [alignKey]: this.widget.options.align ?? 'center',
      '--background-active': this.widget.options.activeColor ?? 'var(--tab-filter-background-active)',
      '--background-de-active': this.widget.options.deActiveColor ?? 'var(--tab-filter-background-de-active)',
      background: this.widget.backgroundColor ?? this.widget.options.background ?? 'var(--chart-background-color)'
    };
  }

  private handleEditTitle() {
    this.$root.$emit(DashboardEvents.ShowEditChartTitleModal, this.widget);
  }

  private handleEdit() {
    this.$root.$emit(DashboardEvents.UpdateDynamicConditionWidget, this.widget);
  }

  private async handleDuplicate() {
    await WidgetModule.handleDuplicateWidget(this.widget);
  }

  private async handleDelete() {
    const { isConfirmed } = await this.$alert.fire({
      icon: 'warning',
      title: 'Remove widget',
      html: `Are you sure that you want to remove this widget?`,
      confirmButtonText: 'Yes',
      showCancelButton: true,
      cancelButtonText: 'No'
    });
    if (this.remove && isConfirmed) {
      this.remove(() => {
        PopupUtils.hideAllPopup();
        WidgetModule.handleDeleteWidget(this.widget).catch(ex => {
          PopupUtils.showError('Can not remove widget, refresh page and try again');
        });
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.dynamic-function-widget-container {
  height: 100%;
  width: 100%;
  display: flex;

  .tab-filter-container {
    width: 100%;
    display: flex;
    padding: 15px;
  }

  .widget-action-more {
    position: absolute;
    right: 0;
    top: 0;
    z-index: 2;
  }

  .tab-display-row {
    > .horizon-tab-filter-info {
      flex-shrink: 1;
      //overflow: hidden;
      max-width: 80%;
    }

    > .tab-selection-fit-content {
      flex: 3;
    }
  }
}
</style>
