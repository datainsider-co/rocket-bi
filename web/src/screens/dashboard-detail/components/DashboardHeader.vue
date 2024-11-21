<template>
  <div
    class="dashboard-header"
    :class="{
      'embedded-dashboard-header': isEmbeddedView
    }"
  >
    <div class="dashboard-header--bar">
      <div class="dashboard-header--bar--left">
        <i
          :id="genBtnId('dashboard-header-back')"
          class="di-icon-arrow-left-large btn-icon-border dashboard-header--bar--left--back"
          @click.stop="handleBack"
          v-show="!isEmbeddedView"
        ></i>
        <h4 :title="title">{{ title }}</h4>
        <i
          v-show="isEditMode() && !isEmbeddedView"
          class="di-icon-inline-edit btn-icon-border dashboard-header--bar--left--rename"
          @click="renameDashboard"
        ></i>
      </div>
      <div class="dashboard-header--bar--right">
        <DashboardControlBar ref="controlBar" :showResetFilters="haveFilters" :isMobile="isMobile" :isEmbeddedView="isEmbeddedView" />
      </div>
      <DiRenameModal title="Rename Dashboard" label="Dashboard Name" ref="renameDashboardModal" />
      <DiRenameModal title="Rename Chart" label="Chart Name" ref="renameChartModal" />
      <TextAreaModal ref="textAreaModal" />
      <ActionModal ref="actionModal" />
    </div>
    <div v-if="enableFilter && !isMobile && !isEmbeddedView" class="dashboard-header--filter">
      <FilterBar
        ref="filterBar"
        :filters="allLocalFilters"
        class="user-profile-filter"
        @onApplyFilter="handleApplyFilter"
        @onRemoveAt="handleRemoveFilterAt"
        @onStatusChange="handleFilterStatusChange"
        @onValuesChange="handleValuesFilterChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { CalendarData } from '@/shared/models';
import { Component, Prop, Provide, Ref, Vue, Watch } from 'vue-property-decorator';
import { DashboardId, DIException, FieldDetailInfo, InternalFilter, MainDateFilter2, ValueControlType, Widget, WidgetId } from '@core/common/domain';
import { DashboardMode, DateRange, isEdit, Routers } from '@/shared';
import { DashboardControllerModule, DashboardModeModule, DashboardModule, FilterModule, WidgetModule } from '@/screens/dashboard-detail/stores';

import DashboardControlBar from '@/screens/dashboard-detail/components/dashboard-control-bar/DashboardControlBar.vue';
import FilterBar from '@/shared/components/FilterBar.vue';
import { DateTimeUtils, ListUtils, PopupUtils } from '@/utils';
import { DataManager } from '@core/common/services';
import { Log } from '@core/utils';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { RouterUtils } from '@/utils/RouterUtils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import TextAreaModal from '@/screens/dashboard-detail/components/TextAreaModal.vue';
import ActionModal from '@/screens/dashboard-detail/components/ActionModal.vue';

@Component({
  components: { ActionModal, TextAreaModal, DashboardControlBar, FilterBar, DiRenameModal }
})
export default class DashboardHeader extends Vue {
  @Prop({ type: Boolean, default: false })
  private readonly isLogin!: boolean;

  @Ref()
  private readonly renameDashboardModal!: DiRenameModal;

  @Ref()
  private readonly renameChartModal!: DiRenameModal;

  @Ref()
  private readonly filterBar?: FilterBar;

  @Prop({ required: false, type: Boolean, default: true })
  private readonly enableFilter!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isMobile!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isEmbeddedView!: boolean;

  private localFilters: InternalFilter[] = [];
  private routerFilters: InternalFilter[] = [];

  @Ref()
  private readonly controlBar!: DashboardControlBar;

  @Ref()
  private readonly textAreaModal!: TextAreaModal;

  @Ref()
  private readonly actionModal!: ActionModal;

  private get title(): string {
    return DashboardModule.title ?? 'Untitled dashboard';
  }

  private get dashboardId(): DashboardId {
    return DashboardModule.dashboardId || -1;
  }

  private get mode(): DashboardMode {
    return DashboardModeModule.mode;
  }

  protected get allLocalFilters(): InternalFilter[] {
    return [...this.localFilters, ...this.routerFilters];
  }

  private get haveFilters(): boolean {
    return ListUtils.isNotEmpty(this.localFilters);
  }

  mounted() {
    this.$root.$on(DashboardEvents.ShowEditChartTitleModal, this.onShowEditChartTitleModal);
    this.$root.$on(DashboardEvents.ShowEditDescriptionModal, this.onShowEditDescriptionModal);
  }

  beforeDestroy() {
    this.$root.$off(DashboardEvents.ShowEditChartTitleModal, this.onShowEditChartTitleModal);
    this.$root.$off(DashboardEvents.ShowEditDescriptionModal, this.onShowEditDescriptionModal);
  }

  private onShowEditChartTitleModal(widget: Widget) {
    this.renameChartModal.show(widget.name, async (newName: string) => {
      try {
        this.renameChartModal.setLoading(true);
        await WidgetModule.updateTitleWidget({ widget: widget, newName: newName });
        this.renameChartModal.setLoading(false);
        this.renameChartModal.hide();
      } catch (ex) {
        const exception = DIException.fromObject(ex);
        this.renameChartModal.setError(exception.getPrettyMessage());
        this.renameChartModal.setLoading(false);
      }
    });
  }

  private onShowEditDescriptionModal(id: WidgetId, description: string) {
    const widget = WidgetModule.findWidgetById(id);
    if (!widget) {
      return;
    }

    const modalConfig = {
      title: 'Edit Summarize',
      label: 'Summarize'
    };
    this.textAreaModal.show(description, (newText: string) => this.handleSaveSummarize(widget, newText), modalConfig);
  }

  private handleSaveSummarize(widget: Widget, text: string) {
    const modalConfig = { title: 'Save', message: 'Would you like to save summarize to description?' };
    try {
      this.textAreaModal.hide();
      this.$nextTick(() => {
        this.actionModal.show(
          [
            {
              text: 'Copy',
              click: () => this.saveToClipboard(text)
            },
            {
              text: 'Save to description',
              click: async () => this.updateWidgetDescription(widget, text)
            }
          ],
          modalConfig
        );
      });
    } catch (e) {
      Log.error(e);
    }
  }

  private saveToClipboard(text: string) {
    try {
      navigator.clipboard.writeText(text);
    } catch (ex) {
      Log.error(ex);
      PopupUtils.showError('Copy to clipboard failed! Please try again.');
    }
  }

  private async updateWidgetDescription(widget: Widget, text: string) {
    try {
      await WidgetModule.updateWidgetDescription({ widget: widget, newName: text });
    } catch (ex) {
      Log.error(ex);
      const exception = DIException.fromObject(ex);
      PopupUtils.showError(exception.getPrettyMessage());
    }
  }

  @Provide()
  handleResetFilter() {
    this.localFilters = [];
    this.applyLocalFilters();
    this.saveLocalFilters();
  }

  @Watch('dashboardId', { immediate: true })
  private onDashboardIdChanged() {
    if (this.dashboardId) {
      this.localFilters = DataManager.getLocalFilters(this.dashboardId.toString());
      this.routerFilters = RouterUtils.getFilters(this.$route);
    }
  }

  isEditMode(): boolean {
    return isEdit(this.mode);
  }

  @Track(TrackEvents.DashboardRename, {
    dashboard_new_name: (_: DashboardHeader, args: any) => args[0],
    dashboard_id: (_: DashboardHeader, args: any) => _.dashboardId
  })
  protected renameDashboard(): void {
    this.renameDashboardModal.show(this.title, async (newName: string) => {
      try {
        this.renameDashboardModal.setLoading(true);
        await DashboardModule.handleRenameDashboard(newName);
        this.updateRouter(this.dashboardId, newName);
        this.renameDashboardModal.setLoading(false);
        this.renameDashboardModal.hide();
      } catch (ex) {
        const exception = DIException.fromObject(ex);
        this.renameDashboardModal.setLoading(false);
        this.renameDashboardModal.setError(exception.getPrettyMessage());
      }
    });
  }

  @Provide()
  private applyMainDateFilter(calendar: CalendarData | null): void {
    FilterModule.setMainDateData(calendar);
    if (calendar && calendar.chosenDateRange) {
      const valueMap = this.toValueMap(calendar.chosenDateRange);
      DashboardControllerModule.applyDynamicValues({
        id: MainDateFilter2.MAIN_DATE_ID,
        valueMap: valueMap
      });
    } else {
      this.applyMainDateAllTime();
    }
  }

  private toValueMap(chosenDateRange: DateRange): Map<ValueControlType, string[]> {
    return new Map([
      [ValueControlType.MinValue, [DateTimeUtils.formatDateTime(chosenDateRange.start)]],
      [ValueControlType.MaxValue, [DateTimeUtils.formatDateTime(chosenDateRange.end, true)]]
    ]);
  }

  @Provide()
  private applyMainDateAllTime(): void {
    FilterModule.removeMainDateData();
    DashboardControllerModule.applyDynamicValues({
      id: MainDateFilter2.MAIN_DATE_ID,
      valueMap: void 0
    });
  }

  private async applyLocalFilters(): Promise<void> {
    await FilterModule.setLocalFilters(this.allLocalFilters);
    FilterModule.setRouterFilters(this.routerFilters);
    await FilterModule.applyFilters();
  }

  @Track(TrackEvents.DashboardRemoveFilter)
  private handleRemoveFilterAt(index: number) {
    const inLocalStorage = this.localFilters.length > index;
    if (inLocalStorage) {
      this.localFilters = ListUtils.removeAt(this.localFilters, index);
    } else {
      this.routerFilters = ListUtils.removeAt(this.routerFilters, index - this.localFilters.length);
    }
    this.applyLocalFilters();
    this.saveLocalFilters();
  }

  @Track(TrackEvents.DashboardAddFilter)
  private handleApplyFilter(appliedFilter: InternalFilter) {
    this.applyLocalFilters();
    this.saveLocalFilters();
  }

  private handleFilterStatusChange(filter: InternalFilter) {
    this.applyLocalFilters();
    this.saveLocalFilters();
  }

  private handleValuesFilterChange(filter: InternalFilter) {
    this.applyLocalFilters();
    this.saveLocalFilters();
  }

  @Provide()
  private handleAddNewFilter(profileField: FieldDetailInfo) {
    const filter = InternalFilter.from(profileField.field, profileField.displayName, profileField.isNested);
    this.localFilters.push(filter);
    this.saveLocalFilters();
    this.filterBar?.showFilter(this.localFilters.indexOf(filter));
  }

  private saveLocalFilters() {
    DataManager.saveLocalFilters(this.dashboardId.toString(), this.localFilters);
  }

  private handleBack() {
    if (DashboardModule.previousPage && DashboardModule.previousPage.name != Routers.ChartBuilder) {
      this.$router.push({
        path: DashboardModule.previousPage.fullPath
      });
    } else {
      this.$router.push({ name: Routers.AllData });
    }
  }

  protected async updateRouter(dashboardId: DashboardId, name: string): Promise<void> {
    try {
      await this.$router.replace({
        params: {
          name: RouterUtils.buildParamPath(dashboardId, name)
        },
        query: this.$route.query
      });
    } catch (ex) {
      Log.debug('DashboardHeader::updateRouter::error::', ex);
    }
  }

  getControlBar(): DashboardControlBar {
    return this.controlBar;
  }
}
</script>

<style lang="scss">
.dashboard-header {
  //background: rgba(255, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 47px 0 28px;
  width: 100%;

  &--bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    margin: 9px 0;
    width: 100%;

    &--left {
      display: flex;
      flex-direction: row;
      align-items: center;
      flex: 1;
      transition: flex 500ms;
      // don't use overflow: hidden, it will cut a part of button back hover effect

      &--back {
        font-size: 16px;
        margin-right: 8px;
        padding: 6px;
        margin-left: -4px;
      }

      h4 {
        font-weight: 500;
        font-size: 20px;
        line-height: 23.44px;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        line-clear: 1;
        text-align: left;
      }

      h4 + &--rename {
        margin-left: 10px;
      }

      &--rename {
        font-size: 16px;
        margin-right: 16px;
        padding: 6px;
        //margin-left: -4px;
      }
    }

    &--right {
    }
  }

  &--filter {
  }

  &.embedded-dashboard-header {
    padding: 0 16px;

    .dashboard-header--bar--left {
      margin: 0;
    }
  }

  @media screen and (max-width: 768px) {
    padding: 0 16px;

    &--bar {
      align-items: flex-start;
      flex-wrap: wrap;

      &--left {
        flex: unset;
        align-self: center;
        max-width: calc(100% - 60px);
      }

      &--right {
        flex: 1;
      }
    }
  }
}
</style>
