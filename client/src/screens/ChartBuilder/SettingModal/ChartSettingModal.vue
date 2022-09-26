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
          <vuescroll :ops="scrollOptions" class="chart-setting-area" style="padding: 15px 0;">
            <StatusWidget :renderWhen="renderWhen" :status="status" class="chart-setting-status">
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
import PreviewPanel from '@/screens/ChartBuilder/VizPanel/PreviewPanel.vue';
import DiButton from '@/shared/components/Common/DiButton.vue';
import DiTitle from '@/shared/components/DiTitle.vue';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';
import { Config } from 'vuescroll';
import { ChartType, DefaultScrollConfig, Status, VerticalScrollConfigs } from '@/shared';
import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';
import { ChartInfo, VizSettingType } from '@core/domain';
import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { _ChartStore } from '@/screens/DashboardDetail/stores';
import { cloneDeep } from 'lodash';
import DefaultSetting from '@/shared/Settings/Common/DefaultSetting.vue';

const BellCurveSetting = () => import('@/shared/Settings/BellCurveSetting/BellCurveSetting.vue');
const BubbleSetting = () => import('@/shared/Settings/BubbleSetting/BubbleSetting.vue');
const FunnelSetting = () => import('@/shared/Settings/FunnelChart/FunnelSetting.vue');
const GaugeSetting = () => import('@/shared/Settings/GaugeSetting/GaugeSetting.vue');
const HeatMapSetting = () => import('@/shared/Settings/HeatMapSetting/HeatMapSetting.vue');
const HistogramSetting = () => import('@/shared/Settings/HistogramSetting/HistogramSetting.vue');
const MapSetting = () => import('@/shared/Settings/MapSetting/MapSetting.vue');
const NumberSetting = () => import('@/shared/Settings/NumberSetting/NumberSetting.vue');
const ParetoSetting = () => import('@/shared/Settings/ParetoSetting/ParetoSetting.vue');
const ParliamentSetting = () => import('@/shared/Settings/ParliamentSetting/ParliamentSetting.vue');
const PieSetting = () => import('@/shared/Settings/Pie/PieSetting.vue');
const PivotSetting = () => import('@/shared/Settings/PivotTable/PivotSetting.vue');
const PyramidSetting = () => import('@/shared/Settings/PyramidChart/PyramidSetting.vue');
const ScatterSetting = () => import('@/shared/Settings/ScatterSetting/ScatterSetting.vue');
const SeriesSetting = () => import('@/shared/Settings/SeriesChart/SeriesSetting.vue');
const SpiderSetting = () => import('@/shared/Settings/SpiderSetting/SpiderSetting.vue');
const StackSeriesSetting = () => import('@/shared/Settings/StackChart/StackSeriesSetting.vue');
const TabFilterSetting = () => import('@/shared/Settings/TabFilterSetting/TabFilterSetting.vue');
const TableSetting = () => import('@/shared/Settings/Table/TableSetting.vue');
const TreeMapSetting = () => import('@/shared/Settings/TreeMapSetting/TreeMapSetting.vue');
const WordCloudSetting = () => import('@/shared/Settings/WordCloudSetting/WordCloudSetting.vue');
const SankeySetting = () => import('@/shared/Settings/SankeySetting/SankeySetting.vue');
const SlicerSetting = () => import('@/shared/Settings/SlicerFilterSetting/SlicerFilterSetting.vue');
const DateSelectSetting = () => import('@/shared/Settings/DateFilterSetting/DateFilterSetting.vue');
const InputFilterSetting = () => import('@/shared/Settings/InputFilterSetting/InputFilterSetting.vue');
const BulletGraphSetting = () => import('@/shared/Settings/BulletSetting/BulletGraphSetting.vue');
const WindRoseSetting = () => import('@/shared/Settings/WindRoseSetting/WindRoseSetting.vue');
const SeriesStockSetting = () => import('@/shared/Settings/SeriesStockSetting/SeriesStockSetting.vue');
const DynamicFunctionSetting = () => import('@/shared/Settings/TabFilterSetting/DynamicFunctionSetting.vue');

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
  static readonly RENDER_WHEN = [Status.Rendering, Status.Rendered, Status.Error];
  static readonly components = new Map<string, Function>([
    [VizSettingType.BellCurve2Setting, BellCurveSetting],
    [VizSettingType.BubbleSetting, BubbleSetting],
    [VizSettingType.FunnelSetting, FunnelSetting],
    [VizSettingType.GaugeSetting, GaugeSetting],
    [VizSettingType.HeatMapSetting, HeatMapSetting],
    [VizSettingType.HistogramSetting, HistogramSetting],
    [VizSettingType.MapSetting, MapSetting],
    [VizSettingType.NumberSetting, NumberSetting],
    [VizSettingType.ParetoSetting, ParetoSetting],
    [VizSettingType.ParliamentSetting, ParliamentSetting],
    [VizSettingType.PieSetting, PieSetting],
    [VizSettingType.PivotTableSetting, PivotSetting],
    [VizSettingType.PyramidSetting, PyramidSetting],
    [VizSettingType.ScatterSetting, ScatterSetting],
    [VizSettingType.SeriesSetting, SeriesSetting],
    [VizSettingType.SpiderWebSetting, SpiderSetting],
    [VizSettingType.StackedSeriesSetting, StackSeriesSetting],
    [VizSettingType.TabFilterSetting, TabFilterSetting],
    [VizSettingType.TableSetting, TableSetting],
    [VizSettingType.TreeMapSetting, TreeMapSetting],
    [VizSettingType.WordCloudSetting, WordCloudSetting],
    [VizSettingType.SankeySetting, SankeySetting],
    [VizSettingType.SlicerFilterSetting, SlicerSetting],
    [VizSettingType.DateSelectFilterSetting, DateSelectSetting],
    [VizSettingType.InputFilterSetting, InputFilterSetting],
    [VizSettingType.BulletSetting, BulletGraphSetting],
    [VizSettingType.WindRoseSetting, WindRoseSetting],
    [VizSettingType.LineStockSetting, SeriesStockSetting],
    [VizSettingType.TabMeasurementSetting, DynamicFunctionSetting]
  ]);
  readonly renderWhen = VizSettingModal.RENDER_WHEN;
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
    const hasResponse: boolean = hasChartInfo ? _ChartStore.chartDataResponses[this.currentChartInfo?.id!] != undefined : false;
    if (hasResponse) {
      return Status.Loaded;
    } else if (hasChartInfo) {
      return _ChartStore.statuses[this.currentChartInfo?.id!];
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
@import '~@/shared/Settings/Common/setting.style';

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
    .status-loading {
      background: transparent;
    }

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

        > .status-loading {
          background: transparent;
        }
      }
    }
  }
}
</style>
