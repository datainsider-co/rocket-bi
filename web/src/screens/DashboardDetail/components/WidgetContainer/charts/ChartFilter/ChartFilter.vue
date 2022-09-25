<template>
  <div
    v-if="usingIcon"
    ref="btnChartFilterIcon"
    v-b-tooltip.d500.top="'Filter'"
    class="d-table btn-icon-28 btn-ghost"
    tabindex="-1"
    title="Filter"
    @click="handleClickChartFilter"
  >
    <div :id="genBtnId(`${metaData.id}-chart-filter`)" class="d-table-cell align-middle text-center">
      <img alt="" src="@/assets/icon/ic-inner-filter.svg" style="margin-bottom:4px; height: 14px; width: 14px;" />
    </div>
    <ChartFilterPopover
      v-if="isShowPopover"
      v-model="dropDownSelectedId"
      :data="selectOptions"
      :meta-data="metaData"
      :selected-value="dropDownSelectedId"
      :targetId="genBtnId(`${metaData.id}-chart-filter`)"
      @hide="handleHidePopover"
      @onSelected="handleItemPopoverSelected"
    />
  </div>
  <div v-else class="chart-filter-container">
    <vuescroll v-if="displayAsTab" :ops="scrollOptions" class="selection-container">
      <div :style="containerStyle" class="d-flex flex-row">
        <NormalTabItem
          v-for="(item, index) in selectOptions"
          :key="index"
          :isSelected="isSelected(item)"
          :item="item"
          class="horizontal"
          @onSelectItem="handleItemPopoverSelected(item.id)"
        />
      </div>
    </vuescroll>
    <DiDropdown
      v-else
      :id="genDropdownId(`${metaData.id}-chart-filter`)"
      v-model="dropDownSelectedId"
      :append-at-root="true"
      :data="selectOptions"
      boundary="window"
      class="dropdown-item mr-2"
      label-props="displayName"
      value-props="id"
    >
    </DiDropdown>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { ChartInfo, FilterRequest, In, QuerySetting, TabFilterOption, TableResponse, WidgetId } from '@core/domain';
import { _ChartStore, FilterModule } from '@/screens/DashboardDetail/stores';
import { HorizontalScrollConfig, SelectOption, TabFilterDisplay } from '@/shared';
import NormalTabItem from '@/shared/components/filters/NormalTabItem.vue';
import { get, isString } from 'lodash';
import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/popup.utils';
import ChartFilterPopover from '@/screens/DashboardDetail/components/WidgetContainer/charts/ChartFilter/ChartFilterPopover.vue';
import { StringUtils } from '@/utils/string.utils';

@Component({ components: { NormalTabItem, ChartFilterPopover } })
export default class ChartFilter extends Vue {
  readonly DISPLAY_INDEX = 0;
  readonly VALUE_INDEX = 1;
  readonly WIDTH_OF_PARENT_WIDGET_USING_ICON = 550;
  readonly OPTION_SHOW_ALL = {
    displayName: 'Show All',
    id: 'showAll'
  };
  readonly emptyValue = '--';
  private readonly scrollOptions = HorizontalScrollConfig;

  @Prop({ required: true, type: Object })
  private readonly metaData!: ChartInfo;

  @Ref()
  private readonly btnChartFilterIcon?: HTMLElement;

  private dropDownSelectedId = this.OPTION_SHOW_ALL.id;

  private usingIcon = false;

  private isShowPopover = false;

  get selectOptionAsMap(): Map<string, SelectOption> {
    if (this.response) {
      const haveLabelColumn: boolean = this.response.headers.length == 2;
      const valueIndex = haveLabelColumn ? this.VALUE_INDEX : this.DISPLAY_INDEX;
      const options: any[] = this.response.records
        ?.map(row => {
          const display = row[this.DISPLAY_INDEX];
          const value = row[valueIndex];
          return [
            value,
            {
              displayName: isString(display) && StringUtils.isEmpty(display) ? this.emptyValue : display,
              id: isString(value) && StringUtils.isEmpty(value) ? this.emptyValue : value
            }
          ];
        })
        ?.sort((a, b) => {
          const optionsA = a[1];
          const optionsB = b[1];
          return StringUtils.compare(optionsA.displayName, optionsB.displayName);
        });

      return new Map([[this.OPTION_SHOW_ALL.id, this.OPTION_SHOW_ALL], ...options]);
    } else {
      return new Map([[this.OPTION_SHOW_ALL.id, this.OPTION_SHOW_ALL]]);
    }
  }

  get containerStyle() {
    // const alignKey = this.direction == Direction.column ? 'justify-content' : 'align-self';
    return {
      '--background-color': this.options.options.background,
      // '--text-color': this.setting.options.textColor,
      // [alignKey]: this.setting.options.align ?? 'center',
      '--background-active': this.options.options.activeColor,
      '--background-de-active': this.options.options.deActiveColor
    };
  }

  private get selectOptions(): SelectOption[] {
    return Array.from(this.selectOptionAsMap.values());
  }

  private get response(): TableResponse {
    return _ChartStore.chartDataResponses[this.metaData.chartFilter!.id] as TableResponse;
  }

  private get options(): TabFilterOption {
    return this.metaData.chartFilter!.setting.getChartOption() as TabFilterOption;
  }

  private get displayAsTab(): boolean {
    return (this.metaData.chartFilter!.setting.getChartOption() as TabFilterOption)?.options?.displayAs === TabFilterDisplay.normal;
  }

  // created() {
  //   this.updateIconChartFilter(this.metaData);
  // }

  mounted() {
    this.dropDownSelectedId = this.getSelectedValue();
    this.$root.$on(DashboardEvents.ResizeWidget, this.handleWidgetResize);
  }

  updated() {
    this.updateIconChartFilter(this.metaData);
  }

  beforeDestroy() {
    this.unregisterEvents();
  }

  @Watch('metaData.chartFilter.setting', { deep: true })
  handleSettingChange() {
    this.dropDownSelectedId = this.getSelectedValue();
  }

  private isSelected(item: SelectOption) {
    return this.dropDownSelectedId === item.id;
  }

  @Watch('dropDownSelectedId')
  private handleItemSelected(value: any) {
    Log.debug('handleItemSelected: request', value);
    const isSelectAll = value === this.OPTION_SHOW_ALL.id;
    if (isSelectAll) {
      this.clearFilter();
    } else {
      const filterValue = [this.isEmptyValue(value) ? '' : value];
      const request = this.buildFilterRequest(filterValue, this.metaData);
      if (request) {
        this.setFilter(request);
      }
    }
  }

  private isEmptyValue(value: any): boolean {
    return !this.selectOptionAsMap.has(value) && value === this.emptyValue;
  }

  private handleItemPopoverSelected(value: any) {
    this.dropDownSelectedId = value;
  }

  @Emit('onDelete')
  private clearFilter() {
    return;
  }

  @Emit('onFilterSelect')
  private setFilter(request: FilterRequest) {
    return request;
  }

  private buildFilterRequest(value: any[], parentChartInfo: ChartInfo) {
    const { id } = parentChartInfo;
    const querySetting: QuerySetting = parentChartInfo.chartFilter!.setting;
    return FilterRequest.fromValues(id, querySetting, value);
  }

  private getSelectedValue() {
    const isUsingDefault = this.options?.options?.default?.setting?.value != null;
    const valueFromSetting = get(this.options, 'options.default.setting.value[0]', this.OPTION_SHOW_ALL.id);
    const valueInStore = (FilterModule.innerFilters.get(this.metaData.id)?.condition as In)?.possibleValues[0] ?? void 0;
    return valueInStore ?? (isUsingDefault ? valueFromSetting : this.OPTION_SHOW_ALL.id);
  }

  private handleWidgetResize(id: WidgetId) {
    const isParentWidgetResize = id === this.metaData.id;
    if (isParentWidgetResize) {
      this.updateIconChartFilter(this.metaData);
    }
  }

  private unregisterEvents() {
    this.$root.$off(DashboardEvents.ResizeWidget, this.handleWidgetResize);
  }

  private updateIconChartFilter(parentChartInfo: ChartInfo) {
    const widthOfParent = document.getElementById(`${parentChartInfo.id}-chart-holder`)?.clientWidth ?? 0;
    Log.debug('updateIconChartFilter::widthOfParent', widthOfParent, document.getElementById(`${parentChartInfo.id}-chart-holder`));
    if (widthOfParent < this.WIDTH_OF_PARENT_WIDGET_USING_ICON) {
      this.usingIcon = true;
    } else {
      this.usingIcon = false;
    }
  }

  private handleClickChartFilter() {
    PopupUtils.hideAllPopup();
    this.btnChartFilterIcon?.focus();
    const isShow = !this.isShowPopover;
    Log.debug('handleClickChartFilter', this.isShowPopover);
    this.displayPopover(isShow);
  }

  private displayPopover(show: boolean) {
    this.isShowPopover = show;
    if (show) {
      this.$nextTick(() => {
        this.clickOutsideListener();
      });
    } else {
      this.unregisterFunctionHidePopover();
    }
  }

  private clickOutsideListener() {
    const app: HTMLElement | null = document.getElementById('app');
    if (app) {
      app.addEventListener('click', this.handleHidePopover);
    }
  }

  private unregisterFunctionHidePopover() {
    const app: HTMLElement | null = document.getElementById('app');
    if (app) {
      app.removeEventListener('click', this.handleHidePopover);
    }
  }

  private handleHidePopover(event: MouseEvent) {
    const isClickOutsizeButtonZoom = !(this.btnChartFilterIcon?.contains(event.target as Element) ?? false);
    if (isClickOutsizeButtonZoom) {
      this.displayPopover(false);
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.btn-icon-28 {
  height: 40px;
  width: 40px;
}

.chart-filter-container {
  .selection-container {
    max-width: 210px;
    margin: 6px 0 0 0;

    .horizontal {
      margin-right: 8px;

      & :nth-last-child(1) {
        margin-right: 0;
      }
    }

    .horizontal.selected {
      background-color: var(--background-active, var(--tab-filter-backgroundr-active)) !important;
    }
  }

  .dropdown-item {
    height: 28px;
    max-width: 140px;
    background: var(--tab-filter-dropdown-background);
    margin-top: 6px;
    padding: 0;

    ::v-deep {
      .relative > span > button {
        background: var(--tab-filter-dropdown-background);
        color: var(--text-color);
        height: 28px;
      }
    }

    :hover {
      background: transparent;
    }
  }
}
</style>
