<template>
  <div>
    <VisualizeSelectionModal
      :all-items="visualizationItems"
      :isShow.sync="showChartTypeSelectionModal"
      :noCloseOnBackdrop="false"
      :noCloseOnEsc="false"
      sub-title="Select a visualization to start. Don’t worry, you could change it later"
      title="Select A Visualization"
      @onItemSelected="onChartTypeChanged"
    ></VisualizeSelectionModal>
    <ChartBuilderModal ref="chartBuilderModal" :visualizationItems="visualizationItems" @onHidden="handleHiddenChartBuilder"></ChartBuilderModal>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import VisualizeSelectionModal from '@/screens/chart-builder/config-builder/chart-selection-panel/VisualizeSelectionModal.vue';
import { DataBuilderConstantsV35, VisualizationItemData } from '@/shared';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import ChartBuilderModal, { TChartBuilderOptions } from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderModal.vue';
import { ChartInfo, DatabaseInfo, Position, ChartControl } from '@core/common/domain';
import { DashboardControllerModule, DashboardModule, FilterModule, QuerySettingModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import { ChartInfoUtils, PositionUtils } from '@/utils';
import { ZoomModule } from '@/store/modules/ZoomStore';
import { Log } from '@core/utils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import { ChartBuilderConfig, DefaultChartBuilderConfig } from '@/screens/dashboard-detail/components/data-builder-modal/ChartBuilderConfig';
import { cloneDeep } from 'lodash';

@Component({
  components: {
    ChartBuilderModal,
    VisualizeSelectionModal
  }
})
export default class ChartBuilderComponent extends Vue {
  protected showChartTypeSelectionModal = false;
  ///Sử dụng khi add một Inner Filter cho 1 Widget
  protected parentChartInfo: ChartInfo | null = null;
  @Ref()
  protected readonly chartBuilderModal?: ChartBuilderModal;

  protected visualizationItems: VisualizationItemData[] = [];

  protected callBack: ((chartInfo: ChartInfo) => Promise<void>) | null = null;

  protected cancelCallBack: (() => void) | null = null;

  protected options: TChartBuilderOptions | null = null;

  protected get filterItems(): VisualizationItemData[] {
    return [...DataBuilderConstantsV35.ALL_INNER_FILTERS].filter(item => !item.isHidden);
  }

  showAddChartModal(): void {
    this.setVisualizationItem(DefaultChartBuilderConfig.builderConfig!.vizItems!);
    this.showChartTypeSelectionModal = true;
  }

  showUpdateChartModal(chartInfo: ChartInfo) {
    this.setVisualizationItem(DefaultChartBuilderConfig.builderConfig!.vizItems!);
    this.chartBuilderModal?.showUpdateChartModal(chartInfo, this.onUpdateChart);
  }

  showAddInnerFilterModal(parentChart: ChartInfo) {
    this.parentChartInfo = parentChart;
    this.setVisualizationItem(this.filterItems);
    _ConfigBuilderStore.setItemSelected(this.filterItems[0]);
    if (this.chartBuilderModal) {
      this.chartBuilderModal?.showAddChartFilterModal(parentChart, this.handleAddInnerFilter);
    }
  }

  showUpdateInnerFilterModal(chartInfo: ChartInfo) {
    this.setVisualizationItem(this.filterItems);
    this.parentChartInfo = chartInfo;
    const filter: ChartInfo = chartInfo.chartFilter!;
    Log.debug('filter', filter.extraData);
    this.chartBuilderModal?.showUpdateChartModal(filter, this.handleUpdateInnerFilter);
  }

  /**
   * Hiển thị Chart builder modal
   * @param options.chart Nếu chart == undefined, Mode = Update, otherwise Mode = Update
   * @param options.database Tự động chọn database khi hiển thị. Nếu không sẽ chọn database đầu tiên
   * @param options.selectedTables Tự động chọn table khi hiển thị. Nếu không có sẽ chọn table đầu tiên
   * @param options.onCompleted Nếu không có callback thì Modal sẽ không hiện
   * @param options.hideSelectDatabase Cho phép chọn database, nếu không sẽ ẩn dropdown select database. default is false
   * @param options.tabControls Danh sách control từ dashboard truyền vào, mặc định là Array rỗng
   */
  showModal(options: {
    chart?: ChartInfo;
    database?: DatabaseInfo | null;
    selectedTables?: string[];
    onCompleted: (chartInfo: ChartInfo) => Promise<void>;
    onCancel?: () => void;
    config?: ChartBuilderConfig;
    chartControls?: ChartControl[];
  }) {
    if (!options.onCompleted) {
      Log.debug('option onCompleted in showModal must be not null');
      return;
    }
    const { chart, database, selectedTables, onCompleted, onCancel, config, chartControls } = options;
    this.callBack = onCompleted || null;
    this.cancelCallBack = onCancel || null;
    this.options = {
      database: database,
      selectedTables: selectedTables,
      config: config,
      chartControls: chartControls
    };
    // Update
    if (chart) {
      this.setVisualizationItem(config?.builderConfig?.vizItems ?? DefaultChartBuilderConfig.builderConfig!.vizItems!);
      ///Phải clone deep và set id = -1 để tránh ref với widget đang có ở dashboard
      const clonedChart = cloneDeep(chart);
      clonedChart.id = -1;
      this.chartBuilderModal?.showUpdateChartModal(
        clonedChart,
        async widget => {
          widget.id = chart.id;
          WidgetModule.handleDeleteSnapWidget();
          ///Execute Call back
          return this.callBack!(widget);
        },
        this.options
      );
    } else {
      this.setVisualizationItem(config?.builderConfig?.vizItems ?? DefaultChartBuilderConfig.builderConfig!.vizItems!);
      this.showChartTypeSelectionModal = true;
    }
  }

  @Track(TrackEvents.SelectChartType, { chart_type: (_: ChartBuilderComponent, args: any) => args[0].type })
  protected onChartTypeChanged(visualizationItemData: VisualizationItemData) {
    this.showChartTypeSelectionModal = false;
    Log.debug('onChartTypeChanged::', visualizationItemData);
    _ConfigBuilderStore.setItemSelected(visualizationItemData);
    const usingChartBuilder = visualizationItemData.useChartBuilder ?? true;
    if (!usingChartBuilder) {
      const querySetting = _ConfigBuilderStore.getQuerySetting();
      const chartInfo = ChartInfo.from(querySetting);
      this.callBack ? this.callBack(chartInfo) : void 0;
    } else if (this.chartBuilderModal) {
      this.chartBuilderModal.showAddChartModal(async widget => {
        WidgetModule.handleDeleteSnapWidget();
        ///Execute Call back
        if (this.callBack) {
          return this.callBack(widget);
        }
      }, this.options);
    }
  }

  // protected async handleAddChart(chartInfo: ChartInfo): Promise<void> {
  //   await DashboardModule.addNewChart({ chartInfo: chartInfo });
  // }

  protected async handleAddInnerFilter(innerFilter: ChartInfo): Promise<void> {
    if (this.parentChartInfo) {
      ///Id hiện tại của Inner Filter = -1 (created)
      this.parentChartInfo.chartFilter = innerFilter;
      this.parentChartInfo.chartFilter.id = ChartInfoUtils.generatedChartFilterId(this.parentChartInfo.id);
      const chartFilter = this.parentChartInfo.chartFilter;
      WidgetModule.handleDeleteSnapWidget();
      QuerySettingModule.setQuerySetting({ id: chartFilter.id, query: chartFilter.setting });
      await DashboardControllerModule.renderChart({ id: chartFilter.id });
      return await this.onUpdateChart(this.parentChartInfo!);
    }
  }

  protected async handleUpdateInnerFilter(innerFilter: ChartInfo): Promise<void> {
    if (this.parentChartInfo) {
      this.parentChartInfo.chartFilter = innerFilter;
      const chartFilter = this.parentChartInfo.chartFilter;
      QuerySettingModule.setQuerySetting({ id: chartFilter.id, query: chartFilter.setting });
      await DashboardControllerModule.renderChart({ id: chartFilter.id });
      return await this.onUpdateChart(this.parentChartInfo!);
    }
  }

  protected async onUpdateChart(chartInfo: ChartInfo) {
    await WidgetModule.handleUpdateWidget(chartInfo);
    WidgetModule.setWidget({ widgetId: chartInfo.id, widget: chartInfo });
    ZoomModule.registerZoomDataById({ id: chartInfo.id, query: chartInfo.setting });
    FilterModule.setAffectFilterWidget(chartInfo);
    QuerySettingModule.setQuerySetting({ id: chartInfo.id, query: chartInfo.setting });
    await FilterModule.addFilterWidget(chartInfo);
    await DashboardControllerModule.renderChart({ id: chartInfo.id });
  }

  protected handleHiddenChartBuilder() {
    this.parentChartInfo = null;
    WidgetModule.handleDeleteSnapWidget();
    this.showChartTypeSelectionModal = false;
    this.setVisualizationItem(DefaultChartBuilderConfig.builderConfig!.vizItems!);
    _ConfigBuilderStore.setItemSelected(DataBuilderConstantsV35.ALL_CHARTS[0]);
    this.cancelCallBack ? this.cancelCallBack() : void 0;
  }

  protected setVisualizationItem(items: VisualizationItemData[]) {
    this.visualizationItems = items;
  }
}
</script>
