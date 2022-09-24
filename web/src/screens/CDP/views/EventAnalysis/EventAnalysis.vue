<template>
  <div class="d-flex w-100 h-100 event-analysis">
    <LayoutSidebar :items="navItems">
      <template v-slot:top>
        <DiShadowButton id="create" title="New" disabled>
          <i class="di-icon-add"></i>
        </DiShadowButton>
      </template>
    </LayoutSidebar>
    <LayoutContent>
      <LayoutHeader title="Event Analysis" icon="di-icon-statistics">
        <div class="d-flex ml-auto">
          <!--          <DiButton id="share" title="Share" @click.prevent="showShareEtl">-->
          <!--            <i class="di-icon-share"></i>-->
          <!--          </DiButton>-->
          <!--          <DiButton id="save" title="Save">-->
          <!--            <i class="di-icon-save"></i>-->
          <!--          </DiButton>-->
        </div>
      </LayoutHeader>
      <vuescroll :ops="VerticalScrollOptions">
        <div class="event-analysis-scroll-area">
          <ManageEventAnalysis
            v-model="model"
            @input="onEventAnalysisChange"
            @collapse:event="this.resizeChart"
            @collapse:filter="this.resizeChart"
            @collapse:cohort="this.resizeChart"
          ></ManageEventAnalysis>
          <div class="cdp-body-content-block flex-grow-1 mb-0 mt-3 pt-1">
            <div class="cdp-body-content-block-title">
              <DiCalendar
                id="di-calendar"
                :defaultDateRange="dateRange"
                :getDateRangeByMode="getDateRangeByMode"
                :isShowResetFilterButton="false"
                :mainDateFilterMode="dateMode"
                :modeOptions="DateRangeOptions"
                class="date-range-dropdown btn-cdp mt-2 mr-auto"
                dateFormatPattern="MMM D, YYYY"
                @onCalendarSelected="onChangeDateRange"
              >
              </DiCalendar>
              <div class="dropdown mt-2 ml-2">
                <DiButton id="interval" :title="timeMetric" class="btn-cdp dropdown-toggle" data-toggle="dropdown"></DiButton>
                <div class="dropdown-menu">
                  <a v-for="item in timeMetrics" :key="item" class="dropdown-item" href="#" @click.prevent="changeTimeMetric(item)">
                    {{ item }}
                  </a>
                </div>
              </div>

              <DiButton id="view-type" :title="isLineChart ? 'Line' : 'Column'" class="btn-cdp mt-2 ml-2" @click.prevent="isLineChart = !isLineChart">
                <img v-if="isLineChart" alt="chart" src="@/assets/icon/charts/ic_line_chart.svg" width="16" />
                <img v-else alt="chart" src="@/assets/icon/charts/ic_column.svg" width="16" />
              </DiButton>
            </div>
            <!--Empty-->
            <div v-if="!model || !model.steps.length" class="cdp-body-content-block-nodata">
              <i class="cdp-body-content-block-nodata-icon di-icon-web-analysis"></i>
              <div class="cdp-body-content-block-nodata-msg text-center">
                Select an Event to get started
              </div>
            </div>
            <!--Have data-->
            <div v-else-if="chartInfo" class="cdp-body-content-block-body justify-content-center align-items-center">
              <ChartHolder
                class="event-analysis-chart"
                ref="chartHolder"
                isEnableFullSize
                isPreview
                :metaData="chartInfo"
                @retry="loadData(model, dateRange, timeMetric, isLineChart)"
              ></ChartHolder>
            </div>
          </div>
        </div>
      </vuescroll>
    </LayoutContent>
  </div>
</template>
<script lang="ts">
import { Component, Inject, Ref, Vue, Watch } from 'vue-property-decorator';
import { Inject as ioc } from 'typescript-ioc';
import CDPMixin from '@/screens/CDP/views/CDP.mixin';
import EventExplorerResult from '@/screens/CDP/components/EventExplorerResult/EventExplorerResult.vue';
import DiCalendar from '@filter/MainDateFilterV2/DiCalendar.vue';
import { EventExplorerService, TimeMetric } from '@core/CDP';
import { ChartType, DateRange, DateTimeConstants, VerticalScrollConfigs } from '@/shared';
import { ChartInfo, Field, MainDateMode, QuerySetting } from '@core/domain';
import { ChartInfoUtils, DateUtils, ListUtils } from '@/utils';
import { CalendarData } from '@/shared/models';
import ManageEventAnalysis from '@/screens/CDP/components/ManageEventAnalysis/ManageEventAnalysis.vue';
import { Log } from '@core/utils';
import ChartComponents from '@/shared/components/charts';
import { EventAnalysisBuilder } from '@/screens/CDP/views/EventAnalysis/EventAnalysisBuilder';
import { EventAnalysisInfo } from '@/screens/CDP/components/ManageEventAnalysis/EventExplorer.entity';
import ChartHolder from '@/screens/DashboardDetail/components/WidgetContainer/charts/ChartHolder.vue';
import ChartHolderController from '@/screens/DashboardDetail/components/WidgetContainer/charts/ChartHolderController';
import { DashboardControllerModule, QuerySettingModule } from '@/screens/DashboardDetail/stores';
import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';
import { ResourceData } from '@/shared/components/Common/DiShareModal/DiShareModal.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

Vue.use(ChartComponents);

@Component({
  mixins: [CDPMixin],
  components: {
    ManageEventAnalysis,
    EventExplorerResult,
    DiCalendar,
    ChartHolder
  }
})
export default class EventAnalysis extends Vue {
  private readonly VerticalScrollOptions = VerticalScrollConfigs;
  model: EventAnalysisInfo | null = null;
  private timeMetric: TimeMetric = TimeMetric.Day;
  private dateRange: DateRange = DateUtils.getLast7Day();
  private readonly DateRangeOptions = DateTimeConstants.ListDateRangeModeOptions;
  private dateMode: MainDateMode = MainDateMode.last7Days;
  private readonly timeMetrics = [TimeMetric.Day, TimeMetric.Week, TimeMetric.Month, TimeMetric.Quarter, TimeMetric.Year];
  private isLineChart = true;
  private fields: Map<string, Field> = new Map<string, Field>();

  private chartInfo: ChartInfo | null = null;
  @Ref()
  private readonly chartHolder!: ChartHolderController;

  @Inject('showShareModal')
  private readonly showShareModal!: (data: ResourceData) => void;

  @ioc
  private readonly eventService!: EventExplorerService;

  async mounted() {
    this.initData();
  }

  private async initData() {
    try {
      this.fields = await this.eventService.getFields();
      window.addEventListener('resize', this.resizeChart);
    } catch (ex) {
      Log.error('EventAnalysis::mounted::initBuilder', ex);
    }
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.resizeChart);
  }

  resizeChart() {
    this.$root.$emit(DashboardEvents.ResizeWidget, this.chartInfo?.id);
  }

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  @Track(TrackEvents.EventAnalysisSelectDateFilter, {
    start_date: (_: EventAnalysis, args: any) => ((args[0] as CalendarData).chosenDateRange?.start as Date)?.getTime(),
    end_date: (_: EventAnalysis, args: any) => ((args[0] as CalendarData).chosenDateRange?.end as Date)?.getTime()
  })
  private onChangeDateRange(calendarData: CalendarData) {
    this.dateRange = calendarData.chosenDateRange ?? DateUtils.getAllTime();
    this.dateMode = calendarData.filterMode;
  }

  private changeTimeMetric(timeMetric: TimeMetric) {
    if (this.timeMetric !== timeMetric) {
      this.timeMetric = timeMetric;
      // this.getData();
    }
  }

  private async onEventAnalysisChange(model: EventAnalysisInfo | null) {
    if (model && ListUtils.isNotEmpty(model.steps)) {
      Log.info('onEventAnalysisChange::', model);
      this.model = model;
      await this.loadData(model, this.dateRange, this.timeMetric, this.isLineChart);
    } else {
      Log.info('EventAnalysis::onEventAnalysisChange::model is empty', model);
      this.model = null;
    }
  }

  private async loadData(eventAnalysisInfo: EventAnalysisInfo, dateRange: DateRange, timeMetric: TimeMetric, isLineChart: boolean) {
    try {
      Log.info('EventAnalysis::onEventAnalysisChange::', eventAnalysisInfo);
      const chartType = isLineChart ? ChartType.Line : ChartType.Column;
      const query = EventAnalysisBuilder.builder(this.fields)
        .initDateTime(dateRange, timeMetric)
        .withSteps(eventAnalysisInfo.steps, eventAnalysisInfo.aggregationType)
        .withFilters(eventAnalysisInfo.filters)
        .withBreakdowns(eventAnalysisInfo.breakdowns)
        .withChartType(chartType)
        .getResult();
      Log.debug('EventAnalysis::onEventAnalysisChange::build query:', query);
      await this.renderChart(query);
    } catch (ex) {
      //
      Log.error('render error, try again');
    }
  }

  @Track(TrackEvents.EventAnalysisSelectTimeMetric, {
    type: (_: EventAnalysis, args: any) => args[0]
  })
  @Watch('timeMetric')
  async onTimeMetricChanged(timeMetric: TimeMetric) {
    Log.info('onTimeMetricChanged::', timeMetric);
    if (this.model && ListUtils.isNotEmpty(this.model.steps)) {
      this.loadData(this.model, this.dateRange, timeMetric, this.isLineChart);
    }
  }

  @Watch('dateRange', { deep: true })
  async onDateRangeChanged(dateRange: DateRange) {
    Log.info('onDateRangeChanged::', dateRange);
    if (this.model && ListUtils.isNotEmpty(this.model.steps)) {
      this.loadData(this.model, dateRange, this.timeMetric, this.isLineChart);
    }
  }

  @Track(TrackEvents.EventAnalysisSelectDisplayType, {
    type: (_: EventAnalysis, args: any) => ((args[0] as boolean) ? 'line' : 'column')
  })
  @Watch('isLineChart')
  async onChartTypeChanged(isLineChart: boolean) {
    Log.info('onChartTypeChanged::', isLineChart);
    if (this.model && ListUtils.isNotEmpty(this.model.steps)) {
      this.loadData(this.model, this.dateRange, this.timeMetric, isLineChart);
    }
  }

  private async renderChart(query: QuerySetting, forceFetch?: boolean) {
    if (query) {
      const currentId = this.chartInfo?.id || ChartInfoUtils.getNextId();
      this.chartInfo = ChartInfo.fromQuerySetting(query).copyWithId(currentId);
      QuerySettingModule.setQuerySetting({ id: this.chartInfo.id, query: this.chartInfo.setting });
      await DashboardControllerModule.renderChart({ id: this.chartInfo.id, forceFetch: forceFetch ?? true });
    }
  }
}
</script>

<style lang="scss">
.event-analysis {
  overflow: auto;

  .event-analysis-scroll-area {
    flex: 1;
    display: flex;
    flex-direction: column;

    .event-analysis-chart {
      flex: 1;
      display: flex;
      flex-direction: column;

      .chart-widget-container,
      .status-loading,
      .empty-widget,
      .chart-error {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
      }
    }
  }

  .__view {
    display: flex;
    flex-direction: column;
  }
}
</style>
