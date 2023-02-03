<template>
  <div>
    <div>
      <template>
        <template v-if="isEditMode">
          <div :id="id" ref="btnMenuRef" v-b-tooltip.d500.top="'More'" class="d-table btn-icon-40 btn-ghost" tabindex="-1" title="More" @click="toggleMenu">
            <div class="d-table-cell align-middle text-center">
              <i class="di-icon-setting"></i>
            </div>
          </div>
          <b-popover :custom-class="getPopoverClass()" :show.sync="isShowMenu" :target="id" placement="BottomLeft" triggers="click blur">
            <div class="action-more regular-icon-16 text-left">
              <template v-for="(item, index) in menuOptions">
                <DiButton
                  :id="genBtnId(`action-${item.text}`, index)"
                  :key="genBtnId(`action-${item.text}`, index)"
                  :is-disable="item.disabled"
                  :title="item.text"
                  @click="onClickItem(item)"
                >
                  <img v-if="hasIcon(item.icon)" :src="require(`@/assets/icon/${item.icon}`)" alt="" />
                </DiButton>
              </template>
            </div>
          </b-popover>
        </template>
        <template v-else>
          <div class="d-flex flex-row">
            <div
              v-if="canZoom()"
              :id="zoomId"
              ref="btnZoomRef"
              v-b-tooltip.d500.top="'Zoom'"
              class="d-table btn-icon-40 btn-ghost"
              tabindex="-1"
              title="Zoom"
              @click="toggleZoom"
            >
              <div class="d-table-cell align-middle text-center">
                <i class="di-icon-zoom"></i>
              </div>
            </div>
            <div
              v-if="enableDrilldownIcon()"
              :id="drilldownId"
              ref="btnDrilldownRef"
              v-b-tooltip.d500.top="'Drilldown'"
              class="d-table btn-icon-40 btn-ghost"
              tabindex="-1"
              @click.stop="toggleDrilldown"
            >
              <div class="d-table-cell align-middle text-center">
                <i class="di-icon-drilldown"></i>
              </div>
            </div>
          </div>
        </template>
      </template>

      <ZoomSettingPopover v-if="isShowZoom" :meta-data="metaData" :targetId="zoomId" @hide="hideZoomPopover" />
    </div>
    <template v-if="isShowDrilldown">
      <DrilldownSettingPopover :metaData="metaData" :targetId="drilldownId" @hide="hideDrilldown" />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import DiButton from '@/shared/components/common/DiButton.vue';
import { DashboardModeModule } from '@/screens/dashboard-detail/stores/dashboard/DashboardModeStore';
import { ContextMenuItem, DashboardMode, DashboardOptions } from '@/shared';
import { ChartInfo, WidgetId } from '@core/common/domain/model';
import { ZoomModule } from '@/store/modules/ZoomStore';
import DrilldownSettingPopover from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/drilldown/DrilldownSettingPopover.vue';
import { Drilldownable } from '@core/common/domain/model/query/features/Drilldownable';
import ZoomSettingPopover from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/zoom/ZoomSettingPopover.vue';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import DrilldownSetting from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/drilldown/DrilldownSetting.vue';
import VueContext from 'vue-context';
import { MouseEventData } from '@chart/BaseChart';
import { Log } from '@core/utils';
import { TimeoutUtils } from '@/utils';

export enum MoreActionStatus {
  Zoom = 'zoom',
  Drilldown = 'drilldown',
  None = 'none'
}

@Component({
  components: { DrilldownSetting, DrilldownSettingPopover, DiButton, ZoomSettingPopover, VueContext }
})
export default class ActionWidgetMore extends Vue {
  private moreStatus: MoreActionStatus = MoreActionStatus.None;
  private isShowMenu = false;
  private isShowZoom = false;
  private isShowDrilldown = false;

  @Ref()
  private readonly btnMenuRef?: HTMLElement;
  @Ref()
  private readonly btnZoomRef?: HTMLElement;
  @Ref()
  private readonly btnDrilldownRef?: HTMLElement;
  @Ref()
  private readonly drilldownSetting!: DrilldownSetting;
  @Prop({ required: true, type: String })
  private id!: string;
  @Prop({ required: true, type: String })
  private drilldownId!: string;
  @Prop({ required: true, type: String })
  private zoomId!: string;
  @Prop({ required: true, type: Object })
  private metaData!: ChartInfo;
  @Prop({ required: true })
  private readonly dashboardMode!: DashboardMode;
  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private handleEditChart?: () => void;
  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private handleAddInnerFilter?: () => void;
  @Inject({ default: undefined })
  private handleUpdateInnerFilter?: () => void;
  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private handleDeleteInnerFilter?: () => void;
  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private handleEditTitle?: () => void;
  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private duplicateChart?: () => void;
  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private deleteChart?: () => void;

  @Inject({ default: undefined })
  private copyChart?: () => void;

  private get isEditMode(): boolean {
    return this.dashboardMode == DashboardMode.Edit;
  }

  private get menuOptions(): ContextMenuItem[] {
    return [
      {
        text: DashboardOptions.EDIT_TITLE,
        click: this.handleEditTitle,
        disabled: !DashboardModeModule.canEdit
      },
      {
        text: DashboardOptions.CONFIG_CHART,
        click: this.handleEditChart,
        disabled: !DashboardModeModule.canEdit
      },
      {
        text: 'Copy chart',
        click: this.copyChart,
        disabled: !DashboardModeModule.canDuplicate
      },
      {
        text: DashboardOptions.ADD_FILTER_WIDGET,
        click: this.handleAddInnerFilter,
        disabled: !DashboardModeModule.canEdit,
        hidden: this.metaData.containChartFilter
      },
      {
        text: DashboardOptions.UPDATE_FILTER_WIDGET,
        click: this.handleUpdateInnerFilter,
        disabled: !DashboardModeModule.canEdit,
        hidden: !this.metaData.containChartFilter
      },
      {
        text: DashboardOptions.DELETE_FILTER_WIDGET,
        click: this.handleDeleteInnerFilter,
        disabled: !DashboardModeModule.canEdit,
        hidden: !this.metaData.containChartFilter
      },
      {
        text: DashboardOptions.DUPLICATE_CHART,
        click: this.duplicateChart,
        disabled: !DashboardModeModule.canDuplicate
      },
      {
        text: DashboardOptions.DELETE,
        click: this.deleteChart,
        disabled: !DashboardModeModule.canDelete
      }
    ].filter(option => !(option.hidden ?? false));
  }

  @Watch('isEditMode')
  handleEditModeChange(isEditMode: boolean) {
    if (isEditMode) {
      this.hideDrilldown();
      this.hideZoomPopover();
      this.hideMenuPopover();
    }
  }

  handleClickDataPoint(id: WidgetId, mouseEventData: MouseEventData<string>): void {
    const canHandle = this.metaData.id == id && !this.isEditMode;
    if (canHandle) {
      this.hideDrilldown();
      this.$root.$emit(DashboardEvents.ShowContextMenuOnPointData, this.metaData, mouseEventData);
    } else {
      this.handleHidePopover(mouseEventData.event);
    }
  }

  mounted() {
    Log.debug('ActionWidgetMore::mounted', this.metaData.id);
    this.registerEvents();
  }

  beforeDestroy() {
    Log.debug('ActionWidgetMore::beforeDestroy', this.metaData.id);
    this.unregisterEvents();
  }

  private toggleMenu() {
    this.hideZoomPopover();
    this.hideDrilldown();
    this.btnMenuRef?.focus();
    this.isShowMenu = !this.isShowMenu;
  }

  private getPopoverClass(): string {
    switch (this.moreStatus) {
      case MoreActionStatus.Zoom:
        return 'none-action-container';
      case MoreActionStatus.Drilldown:
        return 'db-listing-searchable';
      default:
        return 'none-action-container';
    }
  }

  private hasIcon(icon?: string): boolean {
    return !!icon;
  }

  private toggleDrilldown(): void {
    this.hideMenuPopover();
    this.hideZoomPopover();
    this.$root.$emit(DashboardEvents.HideDrillDown);

    this.btnDrilldownRef?.focus();
    this.isShowDrilldown = !this.isShowDrilldown;

    if (this.isShowDrilldown) {
      this.moreStatus = MoreActionStatus.Drilldown;
      this.$nextTick(() => {
        this.clickOutsideListener();
      });
    }
  }

  private clickOutsideListener() {
    const app: HTMLElement | null = document.getElementById('app');
    if (app) {
      app.addEventListener('click', this.handleHidePopover);
    }
  }

  private toggleZoom() {
    this.hideMenuPopover();
    this.hideDrilldown();

    this.btnZoomRef?.focus();
    this.isShowZoom = !this.isShowZoom;
    if (this.isShowZoom) {
      this.moreStatus = MoreActionStatus.Zoom;
    }
  }

  private canZoom(): boolean {
    const querySetting: QuerySetting = this.metaData.setting;
    Log.debug('querySetting::', this.metaData);
    const options = querySetting.getChartOption()?.options ?? {};
    const isEnableZoom: boolean = options.isEnableZoom ?? false;
    const enableIconZoom = options.enableIconZoom ?? false;
    Log.debug('canZoom::', enableIconZoom, isEnableZoom, ZoomModule.canZoom(this.metaData.id));
    return enableIconZoom && isEnableZoom && ZoomModule.canZoom(this.metaData.id);
  }

  private enableDrilldownIcon(): boolean {
    const querySetting: QuerySetting = this.metaData.setting;
    const options = querySetting.getChartOption()?.options ?? {};
    const enableDrilldown: boolean = options.isEnableDrilldown ?? false;
    return enableDrilldown && Drilldownable.isDrilldownable(querySetting);
    // const enableIconDrilldown = options.enableIconDrilldown ?? false;
    // return enableIconDrilldown && enableDrilldown && Drilldownable.isDrilldownable(querySetting);
  }

  private hideMenuPopover() {
    this.isShowMenu = false;
    this.moreStatus = MoreActionStatus.None;
  }

  private hideDrilldown() {
    this.moreStatus = MoreActionStatus.None;
    this.isShowDrilldown = false;
  }

  private hideZoomPopover() {
    this.isShowZoom = false;
    this.unregisterFunctionHidePopover();
    this.moreStatus = MoreActionStatus.None;
  }

  private unregisterFunctionHidePopover() {
    const app: HTMLElement | null = document.getElementById('app');
    if (app) {
      app.removeEventListener('click', this.handleHidePopover);
    }
  }

  private handleHidePopover(event: MouseEvent) {
    const isClickOutsizeButtonZoom = !(this.btnZoomRef?.contains(event.target as Element) ?? false);
    if (isClickOutsizeButtonZoom) {
      this.hideZoomPopover();
    }
    this.hideDrilldown();
    this.hideMenuPopover();
  }

  private registerEvents() {
    this.$root.$on(DashboardEvents.ClickDataPoint, this.handleClickDataPoint);
  }

  private unregisterEvents() {
    this.$root.$off(DashboardEvents.ClickDataPoint, this.handleClickDataPoint);
  }

  private onClickItem(item: ContextMenuItem) {
    this.isShowMenu = false;
    // fix: menu splash
    TimeoutUtils.waitAndExec(null, () => item.click(), 100);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.title-filter-menu {
  @include semi-bold-14();
}

.footer-filter-menu {
  @include regular-text-14();
}

.divider {
  background-color: rgba(255, 255, 255, 0.1);
  height: 1px;
  margin: 16px 0 16px 0;
}

.db-listing-searchable {
  background-color: var(--primary);
  border-radius: 4px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
  box-sizing: content-box;
  max-width: unset;
  padding: 16px;
  width: 256px;
  z-index: 10001;
}

.none-action-container {
  background-color: var(--menu-background-color);
  border: var(--menu-border) !important;
  border-radius: 4px;
  box-shadow: var(--menu-shadow);
  box-sizing: content-box;
  max-width: unset;
  padding: 0;
  text-align: left;
  width: 145px;

  ::v-deep {
    .arrow {
      display: none;
    }

    .popover-body {
      padding: 0 !important;
    }
  }
}

.btn-icon-40 {
  height: 40px;
  width: 40px;
}

.bg-none {
  background: none !important;

  &:active {
    background: none !important;
  }
}
</style>

<style lang="scss">
.action-more {
  .di-button + .di-button {
    margin-top: 4px;
  }

  .di-button {
    .title {
      color: var(--secondary-text-color);
      font-size: 14px;
      font-weight: normal;
      line-height: normal;
      text-align: left;
    }

    &:hover .title {
      color: var(--text-color);
    }
  }
}
</style>
