<template>
  <BModal
    id="viz-setting-modal"
    v-model="isShowSetting"
    :cancel-disabled="false"
    :hide-footer="true"
    :hide-header="true"
    :no-close-on-backdrop="true"
    :no-close-on-esc="true"
    centered
    class="rounded"
    size="xl"
    @shown="resizeChart"
  >
    <template #default>
      <div class="chart-setting-panel d-flex flex-row h-100">
        <PreviewPanel ref="previewPanel" :is-edit-mode="true" class="visualization"></PreviewPanel>
        <div class="d-flex flex-column setting">
          <div class="setting-header justify-content-between mb-3">
            <DiTitle>Settings</DiTitle>
            <div class="setting-actions d-flex flex-row">
              <DiButton border :id="genBtnId('cancel-setting')" title="Cancel" @click="handleCancelSetting" />
              <DiButton :id="genBtnId('save-setting')" primary title="Save" @click="handleSaveSetting" />
            </div>
          </div>
          <vuescroll :ops="scrollOptions" class="chart-setting-area">
            <StatusWidget :status="status" class="chart-setting-status">
              <!-- Nếu không có setting phù hợp thì render default -->
              <template v-if="toComponent">
                <component :is="toComponent" :chartInfo="currentChartInfo" class="setting-component" @onChartInfoChanged="onChartInfoChanged" />
              </template>
              <template v-else>
                <DefaultSetting />
              </template>
              <template #error>
                <!-- Nếu không có response thì render setting/default -->
                <template v-if="toComponent">
                  <component :is="toComponent" :chartInfo="currentChartInfo" class="setting-component" @onChartInfoChanged="onChartInfoChanged" />
                </template>
                <template v-else>
                  <DefaultSetting />
                </template>
              </template>
            </StatusWidget>
          </vuescroll>
        </div>
      </div>
    </template>
  </BModal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import PreviewPanel from '@/screens/chart-builder/viz-panel/PreviewPanel.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import DiTitle from '@/shared/components/DiTitle.vue';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { Config } from 'vuescroll';
import { ChartType, DefaultScrollConfig, Status, VerticalScrollConfigs } from '@/shared';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { ChartInfo, ChartOptionClassName } from '@core/common/domain';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { ChartDataModule } from '@/screens/dashboard-detail/stores';
import { cloneDeep } from 'lodash';
import DefaultSetting from '@/shared/settings/common/DefaultSetting.vue';

const BellCurveSetting = () => import('@/shared/settings/bell-curve-setting/BellCurveSetting.vue');
const BubbleSetting = () => import('@/shared/settings/bubble-setting/BubbleSetting.vue');
const FunnelSetting = () => import('@/shared/settings/funnel-chart/FunnelSetting.vue');
const GaugeSetting = () => import('@/shared/settings/gauge-setting/GaugeSetting.vue');
const HeatMapSetting = () => import('@/shared/settings/heat-map-setting/HeatMapSetting.vue');
const HistogramSetting = () => import('@/shared/settings/histogram-setting/HistogramSetting.vue');
const MapSetting = () => import('@/shared/settings/map-setting/MapSetting.vue');
const NumberSetting = () => import('@/shared/settings/number-setting/NumberSetting.vue');
const ParetoSetting = () => import('@/shared/settings/pareto-setting/ParetoSetting.vue');
const ParliamentSetting = () => import('@/shared/settings/parliament-setting/ParliamentSetting.vue');
const PieSetting = () => import('@/shared/settings/pie/PieSetting.vue');
const DonutSetting = () => import('@/shared/settings/donut/DonutSetting.vue');
const PivotSetting = () => import('@/shared/settings/pivot-table/PivotSetting.vue');
const PyramidSetting = () => import('@/shared/settings/pyramid-chart/PyramidSetting.vue');
const ScatterSetting = () => import('@/shared/settings/scatter-setting/ScatterSetting.vue');
const SeriesSetting = () => import('@/shared/settings/series-chart/SeriesSetting.vue');
const SpiderSetting = () => import('@/shared/settings/spider-setting/SpiderSetting.vue');
const StackSeriesSetting = () => import('@/shared/settings/stack-chart/StackSeriesSetting.vue');
const CircularBarSetting = () => import('@/shared/settings/stack-chart/CircularBarSetting.vue');
const TabFilterSetting = () => import('@/shared/settings/tab-filter-setting/TabFilterSetting.vue');
const TableSetting = () => import('@/shared/settings/table/TableSetting.vue');
const FlattenTableSetting = () => import('@/shared/settings/table/FlattenTableSetting.vue');
const TreeMapSetting = () => import('@/shared/settings/tree-map-setting/TreeMapSetting.vue');
const WordCloudSetting = () => import('@/shared/settings/word-cloud-setting/WordCloudSetting.vue');
const SankeySetting = () => import('@/shared/settings/sankey-setting/SankeySetting.vue');
const SlicerSetting = () => import('@/shared/settings/slicer-filter-setting/SlicerFilterSetting.vue');
const DateSelectSetting = () => import('@/shared/settings/date-filter-setting/DateFilterSetting.vue');
const TreeFilterSetting = () => import('@/shared/settings/tree-filter-setting/TreeFilterSetting.vue');
const InputFilterSetting = () => import('@/shared/settings/input-filter-setting/InputFilterSetting.vue');
const BulletGraphSetting = () => import('@/shared/settings/bullet-setting/BulletGraphSetting.vue');
const WindRoseSetting = () => import('@/shared/settings/wind-rose-setting/WindRoseSetting.vue');
const SeriesStockSetting = () => import('@/shared/settings/series-stock-setting/SeriesStockSetting.vue');
const VariablepieSetting = () => import('@/shared/settings/variablepie-setting/VariablepieSetting.vue');

@Component({
  components: {
    PanelHeader,
    DiButton,
    PreviewPanel,
    DiTitle,
    StatusWidget,
    DefaultSetting
  }
})
export default class VizSettingModal extends Vue {
  static readonly components = new Map<string, Function>([
    [ChartOptionClassName.BellCurve2Setting, BellCurveSetting],
    [ChartOptionClassName.BubbleSetting, BubbleSetting],
    [ChartOptionClassName.FunnelSetting, FunnelSetting],
    [ChartOptionClassName.GaugeSetting, GaugeSetting],
    [ChartOptionClassName.HeatMapSetting, HeatMapSetting],
    [ChartOptionClassName.HistogramSetting, HistogramSetting],
    [ChartOptionClassName.MapSetting, MapSetting],
    [ChartOptionClassName.NumberSetting, NumberSetting],
    [ChartOptionClassName.ParetoSetting, ParetoSetting],
    [ChartOptionClassName.ParliamentSetting, ParliamentSetting],
    [ChartOptionClassName.PieSetting, PieSetting],
    [ChartOptionClassName.PivotTableSetting, PivotSetting],
    [ChartOptionClassName.PyramidSetting, PyramidSetting],
    [ChartOptionClassName.ScatterSetting, ScatterSetting],
    [ChartOptionClassName.SeriesSetting, SeriesSetting],
    [ChartOptionClassName.SpiderWebSetting, SpiderSetting],
    [ChartOptionClassName.StackedSeriesSetting, StackSeriesSetting],
    [ChartOptionClassName.CircularBarSetting, CircularBarSetting],
    [ChartOptionClassName.TabFilterSetting, TabFilterSetting],
    [ChartOptionClassName.TableSetting, TableSetting],
    [ChartOptionClassName.FlattenTableSetting, FlattenTableSetting],
    [ChartOptionClassName.TreeMapSetting, TreeMapSetting],
    [ChartOptionClassName.WordCloudSetting, WordCloudSetting],
    [ChartOptionClassName.SankeySetting, SankeySetting],
    [ChartOptionClassName.SlicerFilterSetting, SlicerSetting],
    [ChartOptionClassName.DateSelectFilterSetting, DateSelectSetting],
    [ChartOptionClassName.InputFilterSetting, InputFilterSetting],
    [ChartOptionClassName.BulletSetting, BulletGraphSetting],
    [ChartOptionClassName.WindRoseSetting, WindRoseSetting],
    [ChartOptionClassName.LineStockSetting, SeriesStockSetting],
    [ChartOptionClassName.TreeFilterSetting, TreeFilterSetting],
    [ChartOptionClassName.DonutSetting, DonutSetting],
    [ChartOptionClassName.VariablePieSetting, VariablepieSetting]
  ]);
  private readonly scrollOptions = VerticalScrollConfigs;
  private readonly SETTING_CHART_ID = -2;
  private isShowSetting = false;

  private currentChartInfo: ChartInfo | null = null;

  private onSave?: (chartInfo: ChartInfo) => void;
  private onCancel?: () => void;

  //todo resolve lock scroll
  private configOps: Config = DefaultScrollConfig;

  @Ref()
  private readonly previewPanel!: PreviewPanel;

  get status(): Status {
    const hasChartInfo: boolean = this.currentChartInfo?.id != undefined;
    const hasResponse: boolean = hasChartInfo ? ChartDataModule.chartDataResponses[this.currentChartInfo?.id!] != undefined : false;
    if (hasResponse) {
      return Status.Loaded;
    } else if (hasChartInfo) {
      return ChartDataModule.statuses[this.currentChartInfo?.id!];
    } else {
      return Status.Error;
    }
  }

  private get currentChartType(): ChartType {
    return _ConfigBuilderStore.chartType;
  }

  private get toComponent(): Function | undefined {
    const setting = this.currentChartInfo?.setting?.getChartOption();
    if (setting) {
      return VizSettingModal.components.get(setting.className);
    }
    return void 0;
  }

  show(chartInfo: ChartInfo, onSave: (chartInfo: ChartInfo) => void, onCancel?: () => void) {
    this.isShowSetting = true;
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.currentChartInfo = chartInfo.copyWithId(this.SETTING_CHART_ID);
    this.renderPreviewChart(this.currentChartInfo);
  }

  hide() {
    this.isShowSetting = false;
  }

  private resizeChart() {
    this.$nextTick(() => {
      this.$root.$emit(DashboardEvents.ResizeWidget, this.currentChartInfo?.id);
    });
  }

  private handleCancelSetting() {
    this.hide();
    if (this.onCancel) {
      this.onCancel();
    }
  }

  private handleSaveSetting() {
    this.hide();
    if (this.onSave) {
      this.onSave(this.currentChartInfo!);
    }
  }

  private renderPreviewChart(currentChartInfo: ChartInfo) {
    this.$nextTick(() => this.previewPanel.renderChart(currentChartInfo));
  }

  private onChartInfoChanged(chartInfo: ChartInfo, reRender = false) {
    this.currentChartInfo = cloneDeep(chartInfo);
    if (reRender) {
      this.previewPanel.renderChart(chartInfo);
    } else {
      this.previewPanel.updateChart(chartInfo);
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .modal-dialog {
    border-radius: 4px;
    height: 80vh !important;
    max-width: unset !important;
    padding: 0;
    min-width: calc(60vh / 0.5625) !important;
    width: 85% !important;
  }

  .modal-body {
    height: 88vh !important;
    padding: 0;
    width: 100%;
  }

  .visualization {
    flex-grow: 1;
    overflow: hidden;
    //padding: 0;
  }

  .setting {
    flex: 1;
    max-width: 363px;
    min-width: 363px;
    padding: 16px 16px 16px 0;
    width: 35%;
  }
}

.setting-header {
  align-items: end;
  display: flex;
  flex-direction: row;
  @media (max-width: 1100px) {
    flex-direction: row;
    justify-content: start;
  }
}
</style>

<style lang="scss">
@import '~@/shared/settings/common/setting-style';

#viz-setting-modal {
  .modal-content {
    background-color: var(--primary--root) !important;
  }
}

.chart-setting-panel {
  > .visualization {
    border-radius: 4px;
    margin: 16px;
  }

  .setting-header {
    > .setting-actions {
      > div {
        height: 26px;
        min-width: 64px;
      }

      > div + div {
        margin-left: 16px;
      }
    }
  }

  > .visualize-preview-area {
    // fixme: check css
    //.status-loading {
    //  background: transparent;
    //}

    .chart-error {
      background: var(--hover-color);
    }
  }

  .chart-setting-area {
    flex: 1;
    background: var(--builder-panel-bg, var(--secondary));
    border-radius: 4px;

    .__view {
      height: 100%;

      .chart-setting-status {
        padding: 0 16px;

        > .setting-component {
          overflow-x: hidden;

          > div {
            &:first-child > .panel-header-divider {
              display: none;
            }

            .panel-header-divider {
              height: 1px;
            }
          }
        }

        // fixme: check css
        //> .status-loading {
        //  background: transparent;
        //}
      }
    }
  }
}
</style>
