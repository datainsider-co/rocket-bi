<template>
  <div>
    <VueContext ref="contextMenu" class="widget-context-menu" tag="div">
      <DataListing :records="contextMenuOptions" keyForDisplay="text" keyForValue="click" @onClick="handleChooseOption" />
    </VueContext>
    <ZoomSettingContextMenu ref="zoomMenu"></ZoomSettingContextMenu>
    <DrilldownSettingContextMenu ref="drilldownMenu"></DrilldownSettingContextMenu>
    <DashboardListingContextMenu ref="dashboardMenu"></DashboardListingContextMenu>
    <DimensionPicker ref="dimensionPicker"></DimensionPicker>
    <CalendarContextMenu ref="calendarContextMenu"></CalendarContextMenu>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import {
  ChartInfo,
  DashboardId,
  DimensionListing,
  Drilldownable,
  Field,
  Filterable,
  MapQuerySetting,
  NumberQuerySetting,
  QuerySettingType
} from '@core/domain';
import { MouseEventData } from '@chart/BaseChart';
import DataListing from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/DataListing.vue';
import { ContextMenuItem, Routers } from '@/shared';
import VueContext from 'vue-context';
import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';
import { cloneDeep, get, isFunction } from 'lodash';
import DrilldownSettingContextMenu from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/Drilldown/DrilldownSettingContextMenu.vue';
import ZoomSettingContextMenu from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/Zoom/ZoomSettingContextMenu.vue';
import DashboardListingContextMenu from '@/screens/DashboardDetail/components/DrillThrough/DashboardListingContextMenu.vue';
import { DI } from '@core/modules';
import { DataManager } from '@core/services';
import {
  _ChartStore,
  CrossFilterData,
  DashboardControllerModule,
  DashboardModule,
  DrilldownDataStoreModule,
  FilterModule,
  QuerySettingModule
} from '@/screens/DashboardDetail/stores';
import { ZoomModule } from '@/store/modules/zoom.store';
import { DrillThroughResolver } from '@/screens/DashboardDetail/components/DrillThrough/DrillThroguhHandler/DrillThroughResolver';
import { ListUtils } from '@/utils';
import DimensionPicker from '@/screens/DashboardDetail/components/DimensionPicker.vue';
import { GeolocationModule } from '@/store/modules/data_builder/geolocation.store';
import CalendarContextMenu, { CalendarPickerOptions } from '@/shared/components/CalendarContextMenu.vue';
import { RouterUtils } from '@/utils/RouterUtils';

@Component({
  components: {
    DimensionPicker,
    ZoomSettingContextMenu,
    DrilldownSettingContextMenu,
    DataListing,
    VueContext,
    DashboardListingContextMenu,
    CalendarContextMenu
  }
})
export default class WidgetContextMenu extends Vue {
  private contextMenuOptions: ContextMenuItem[] = [];
  @Ref()
  private readonly contextMenu?: VueContext;

  @Ref()
  private readonly zoomMenu?: ZoomSettingContextMenu;

  @Ref()
  private readonly drilldownMenu?: DrilldownSettingContextMenu;

  @Ref()
  private readonly dashboardMenu?: DashboardListingContextMenu;

  @Ref()
  private readonly dimensionPicker?: DimensionPicker;

  @Ref()
  private readonly calendarContextMenu?: CalendarContextMenu;

  private readonly drillThroughResolver = new DrillThroughResolver();

  show(metaData: ChartInfo, mouseEventData: MouseEventData<string>) {
    this.contextMenuOptions = this.getMenuOptions(metaData, mouseEventData);
    this.contextMenu?.open(mouseEventData.event, {});
  }

  showOnWidget(metaData: ChartInfo, event: MouseEvent) {
    this.contextMenuOptions = this.getWidgetMenuOptions(metaData, event);
    this.contextMenu?.open(event, {});
  }

  private getWidgetMenuOptions(metaData: ChartInfo, event: MouseEvent): ContextMenuItem[] {
    const options: ContextMenuItem[] = [
      {
        text: 'Use as a filter',
        click: () => this.handleClickUseAsCrossFilterOnWidget(metaData, event),
        disabled: this.isDisableCrossFilter(metaData)
      },
      {
        text: 'Change Date Function',
        click: () => this.handleClickZoom(metaData, event),
        disabled: this.isDisableZoom(metaData)
      },
      {
        text: 'Drill down',
        click: () => this.showDrilldownMenu(metaData, new MouseEventData<string>(event, '')),
        disabled: this.isDisableDrilldown(metaData)
      },
      {
        text: 'Drill through',
        click: () => this.handleClickDrillThroughOnWidget(metaData, event),
        disabled: this.isDisableDrillThrough(metaData)
      },
      {
        text: 'Reset filter',
        click: () => this.resetCrossFilter(metaData),
        disabled: this.isDisableResetFilter(metaData)
      },
      {
        text: 'Reset drill down',
        click: () => this.resetDrilldown(metaData),
        disabled: this.isDisableResetDrilldown(metaData)
      },
      {
        text: 'Download CSV',
        click: () => this.downloadCSV(metaData),
        disabled: NumberQuerySetting.isNumberQuerySetting(metaData.setting)
      }
    ];

    return this.removeDisabledOptions(options);
  }

  private getMenuOptions(metaData: ChartInfo, mouseEventData: MouseEventData<string>): ContextMenuItem[] {
    const options: ContextMenuItem[] = [
      {
        text: 'Use as a filter',
        click: () => this.handleClickUseAsCrossFilter(metaData, mouseEventData.data),
        disabled: this.isDisableCrossFilter(metaData)
      },
      {
        text: 'Change Date Function',
        click: () => this.handleClickZoom(metaData, mouseEventData.event),
        disabled: this.isDisableZoom(metaData)
      },
      {
        text: 'Drill down',
        click: () => this.showDrilldownMenu(metaData, mouseEventData),
        disabled: this.isDisableDrilldown(metaData, mouseEventData)
      },
      {
        text: 'Drill through',
        click: () => this.handleClickDrillThrough(metaData, mouseEventData.event, mouseEventData.data),
        disabled: this.isDisableDrillThrough(metaData)
      },
      {
        text: 'Reset filter',
        click: () => this.resetCrossFilter(metaData),
        disabled: this.isDisableResetFilter(metaData)
      },
      {
        text: 'Reset drill down',
        click: () => this.resetDrilldown(metaData),
        disabled: this.isDisableResetDrilldown(metaData)
      },
      {
        text: 'Download CSV',
        click: () => this.downloadCSV(metaData),
        disabled: NumberQuerySetting.isNumberQuerySetting(metaData.setting)
      }
    ];

    return this.removeDisabledOptions(options);
  }

  mounted() {
    this.$root.$on(DashboardEvents.HideDrillDown, this.hideDrilldown);
  }

  beforeDestroy() {
    this.$root.$off(DashboardEvents.HideDrillDown, this.hideDrilldown);
  }

  private dashboardId(): string {
    return DashboardModule.id!.toString();
  }

  private handleChooseOption(clickFn: Function): void {
    this.contextMenu?.close();
    if (isFunction(clickFn)) {
      clickFn();
    }
  }

  private handleClickZoom(metaData: ChartInfo, event: MouseEvent) {
    this.zoomMenu?.show(metaData, event);
  }

  public showDrilldownMenu(metaData: ChartInfo, event: MouseEventData<string>) {
    this.drilldownMenu?.show(metaData, event);
  }

  private handleClickDrillThrough(metaData: ChartInfo, event: MouseEvent, value: string) {
    const fields: Field[] = this.getAllFieldsForDrillThrough(metaData, value);
    this.dashboardMenu?.show({
      event: event,
      currentDashboardId: DashboardModule.id!,
      currentFields: fields,
      onDashboardSelected: (dashboardId: DashboardId) => this.drillThrough(dashboardId, metaData, value)
    });
  }

  public hideDrilldown() {
    this.drilldownMenu?.hide();
  }

  private getAllFieldsForDrillThrough(metaData: ChartInfo, value: string): Field[] {
    const finalMetaData = this.getFinalMetaData(metaData);
    const mainFilters = this.getAllMainFilters(finalMetaData, value);
    return mainFilters.map(filter => filter.field);
  }

  private drillThrough(dashboardDrillThrough: DashboardId, metaData: ChartInfo, value: string) {
    const finalMetaData = this.getFinalMetaData(metaData);
    const mainFilters = this.getAllMainFilters(finalMetaData, value);
    const filtersAsString = JSON.stringify(mainFilters);
    this.openDashboardTab(dashboardDrillThrough, filtersAsString);
  }

  private getAllMainFilters(metaData: ChartInfo, value: string) {
    const dataManager = DI.get(DataManager);
    const mainFilters = dataManager.getMainFilters(this.dashboardId());
    const extraFilters = this.drillThroughResolver.createFilter(metaData, value);
    return [...mainFilters, ...extraFilters];
  }

  private openDashboardTab(dashboardId: DashboardId, filtersAsString: string) {
    const query = {
      ...this.$route.query,
      filters: filtersAsString
    };
    const route = this.$router.resolve({
      name: Routers.Dashboard,
      params: {
        name: RouterUtils.buildParamPath(dashboardId)
      },
      query: query
    });
    window.open(route.href, '_blank');
  }

  private isDisableZoom(metaData: ChartInfo) {
    const options = metaData.setting.getChartOption()?.options ?? {};
    const isEnableZoom = options.isEnableZoom ?? false;
    return !(isEnableZoom && ZoomModule.canZoom(metaData.id));
  }

  private isDisableCrossFilter(metaData: ChartInfo): boolean {
    return !Filterable.isFilterable(metaData.setting);
  }

  private isDisableResetFilter(metaData: ChartInfo): boolean {
    return FilterModule.currentCrossFilterData === null;
  }

  private isDisableDrilldown(metaData: ChartInfo, mouseEvent?: MouseEventData<string>): boolean {
    const isDrilldownable = Drilldownable.isDrilldownable(metaData.setting);
    ///Nếu là Map Query nhưng không có chỉ đinh một location cụ thể thì sẽ không cho hiển thị Drilldown
    ///Nếu là Map Query, đã chỉ định locaton, nhưng không support map thì sẽ không hiện thi Drilldown
    ///Các trường hợp còn lại mở drilldown nếu query thích hợp
    if (MapQuerySetting.isMapQuery(metaData.setting)) {
      const code = get(mouseEvent, 'extraData.point.options.code', null);
      if (code) {
        const area = GeolocationModule.getGeoArea(code);
        return !area || !isDrilldownable;
      } else {
        return true;
      }
    } else {
      return !isDrilldownable;
    }
  }

  private isDisableDrillThrough(metaData: ChartInfo) {
    switch (metaData.setting.className) {
      case QuerySettingType.TabFilter:
        return true;
      default:
        return false;
    }
  }

  private resetDrilldown(metaData: ChartInfo) {
    const { id, setting } = metaData;
    DrilldownDataStoreModule.resetDrilldown(metaData.id);
    ZoomModule.registerZoomDataById({ id: id, query: setting });
    QuerySettingModule.setQuerySetting({ id: id, query: setting });
    DashboardControllerModule.renderChartOrFilter({ widget: metaData });
  }

  private downloadCSV(metaData: ChartInfo) {
    const { id, setting } = metaData;
    this.$root.$emit(DashboardEvents.DownloadCSV, metaData.id);
  }

  private resetCrossFilter(metaData: ChartInfo) {
    FilterModule.handleRemoveCrossFilter();
  }

  private handleClickUseAsCrossFilter(metaData: ChartInfo, value: string) {
    this.$root.$emit(DashboardEvents.ApplyCrossFilter, new CrossFilterData(metaData.id, value));
  }

  private isDisableResetDrilldown(metaData: ChartInfo) {
    return !DrilldownDataStoreModule.hasDrilldown(metaData.id);
  }

  private removeDisabledOptions(options: ContextMenuItem[]) {
    return options.filter(option => !option.disabled);
  }

  private getFinalMetaData(metaData: ChartInfo) {
    const finalMetaData = cloneDeep(metaData);
    const historySettings = DrilldownDataStoreModule.getQuerySettings(metaData.id);
    finalMetaData.setting = ListUtils.getLast(historySettings) ?? finalMetaData.setting;
    return finalMetaData;
  }

  private handleClickUseAsCrossFilterOnWidget(metaData: ChartInfo, event: MouseEvent) {
    const chartResponse = _ChartStore.getChartResponse(metaData.id);
    if (DimensionListing.isDimensionListing(chartResponse)) {
      this.dimensionPicker?.show(event, chartResponse, value => this.handleClickUseAsCrossFilter(metaData, value));
    }
  }

  private handleClickDrillThroughOnWidget(metaData: ChartInfo, event: MouseEvent) {
    const chartResponse = _ChartStore.getChartResponse(metaData.id);
    if (DimensionListing.isDimensionListing(chartResponse)) {
      this.dimensionPicker?.show(event, chartResponse, value => this.handleClickDrillThrough(metaData, event, value));
    }
  }

  public showCalendar(event: MouseEventData<Date>, onDateSelected?: (newDate: Date) => void, options?: CalendarPickerOptions) {
    this.calendarContextMenu?.show(event, onDateSelected, options);
  }
  public hideCalendar() {
    this.calendarContextMenu?.hide();
  }
}
</script>

<style lang="scss">
div.v-context.widget-context-menu {
  min-width: 160px;
  padding: 4px 0;

  h4 {
    font-size: 14px;
    font-stretch: normal;
    font-style: normal;
    font-weight: normal;
    line-height: normal;
    opacity: 0.8;
  }
}
</style>
