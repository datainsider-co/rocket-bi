<template>
  <div v-b-hover="handleHover" class="d-flex flex-row align-items-center">
    <StatusWidget :renderWhen="renderWhen" :status="status" @retry="retryLoadData">
      <FilterWidget
        v-if="filterData"
        :id="filter.id"
        :backgroundColor="filter.backgroundColor"
        :data="filterData"
        :filterType="filter.className"
        :setting="filter.setting"
        :showEditComponent="showEditComponent"
        :subTitle="filter.description"
        :textColor="filter.textColor"
        :title="filter.name"
        @hook:mounted="handleOnRendered"
      >
      </FilterWidget>
    </StatusWidget>
    <template v-if="showEditComponent">
      <b-icon-three-dots-vertical v-show="isShowEdit" class="ml-auto btn-icon btn-ghost di-popup ic-16 mr-1" @click.prevent="clickSeeMore">
      </b-icon-three-dots-vertical>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Prop, Provide, Vue } from 'vue-property-decorator';
import { BuilderMode, ContextMenuItem, DashboardOptions, Routers, Status } from '@/shared';
import { DashboardModeModule, DashboardModule, FilterModule, RenderControllerModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import FilterWidget from '@filter/FilterWidget.vue';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { DIException, QueryRelatedWidget } from '@core/common/domain';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import { RouterUtils } from '@/utils/RouterUtils';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import ChartHolder from '@/screens/dashboard-detail/components/widget-container/charts/ChartHolder';

@Component({
  components: {
    FilterWidget,
    StatusWidget
  }
})
export default class FilterContainer extends Vue {
  readonly renderWhen = ChartHolder.RENDER_WHEN;
  isHovered = false;
  @Prop({ required: true })
  filter!: QueryRelatedWidget;
  @Prop({ type: Boolean, default: false })
  showEditComponent!: boolean;
  // Provide from DiGridstackItem
  @Inject()
  remove!: (fn: Function) => void;

  get isShowEdit() {
    return this.showEditComponent && this.isHovered;
  }

  get filterClass(): string {
    return this.showEditComponent ? 'disable' : '';
  }

  get filterData(): any {
    throw new DIException('No implement');
    // return DataModule.chartDataResponses[this.filter.id];
  }

  get status(): Status {
    return Status.Error;
    // return DataModule.statuses[this.filter.id];
  }

  private get menuItems(): ContextMenuItem[] {
    return [
      {
        text: DashboardOptions.CONFIG_FILTER,
        click: this.configData,
        disabled: !DashboardModeModule.canEdit
      },
      {
        text: DashboardOptions.DUPLICATE,
        click: this.duplicateWidget,
        disabled: !DashboardModeModule.canDuplicate
      },
      {
        text: DashboardOptions.DELETE,
        click: this.deleteFilter,
        disabled: !DashboardModeModule.canDelete
      }
    ];
  }

  //Provide value into filter
  @Provide()
  private get defaultValue(): any {
    return '';
  }

  private handleHover(isHovered: boolean) {
    this.isHovered = isHovered;
  }

  private clickSeeMore(event: Event) {
    this.$root.$emit(DashboardEvents.ShowContextMenu, event, this.menuItems);
  }

  private configData() {
    PopupUtils.hideAllPopup();
    const dashboard = DashboardModule.currentDashboard;
    if (dashboard) {
      const dataManager = Di.get(DataManager);
      dataManager.saveCurrentDashboardId(dashboard.id.toString());
      dataManager.saveCurrentDashboard(dashboard);
      dataManager.saveCurrentWidget(this.filter);
      dataManager.saveChartBuilderMode(BuilderMode.Update);
      RouterUtils.navigateToDataBuilder(this.$route, FilterModule.routerFilters);
    }
  }

  private duplicateWidget() {
    PopupUtils.hideAllPopup();
    WidgetModule.handleDuplicateWidget(this.filter);
  }

  private deleteFilter() {
    this.remove(() => {
      PopupUtils.hideAllPopup();
      WidgetModule.handleDeleteWidget(this.filter);
    });
  }

  private handleOnRendered() {
    Log.debug('ChartContainer::handleOnRendered', this.filter.id);
    this.$nextTick(() => {
      RenderControllerModule.completeRender(this.filter.id);
    });
  }

  private retryLoadData() {
    // DataControllerModule.renderChartOrFilter({ widget: this.filter, force: true });
  }

  // Provide function into filter
  @Provide()
  private onFilterValueChanged(value: any) {
    //
  }
}
</script>

<style lang="scss" scoped>
.pad-l-15 {
  padding-left: 15px;
}
</style>
