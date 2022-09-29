<template>
  <div class="d-flex w-100 h-100 funnel-analysis">
    <LayoutSidebar :items="navItems">
      <template v-slot:top>
        <DiShadowButton id="create" title="New" disabled>
          <i class="di-icon-add"></i>
        </DiShadowButton>
      </template>
    </LayoutSidebar>
    <LayoutContent>
      <LayoutHeader title="Funnel Analysis" icon="di-icon-funnel-analysis"> </LayoutHeader>
      <vuescroll :ops="VerticalScrollOptions" ref="scroller">
        <div class="funnel-analysis-scroll-area">
          <ManageFunnelAnalysis v-model="model" class="mb-3"></ManageFunnelAnalysis>
          <div class="cdp-body-content-block flex-grow-1 mb-0 pt-1">
            <div class="cdp-body-content-block-title">
              <DiCalendar
                id="di-calendar"
                :defaultDateRange="dateRange"
                :getDateRangeByMode="getDateRangeByMode"
                :isShowResetFilterButton="false"
                :mainDateFilterMode="dateMode"
                :modeOptions="DateRangeOptions"
                class="date-range-dropdown btn-cdp mr-auto mt-2"
                dateFormatPattern="MMM D, YYYY"
                @onCalendarSelected="onChangeDateRange"
              >
              </DiCalendar>
              <div class="ml-auto d-flex mt-2 ml-2">
                <div class="mr-3 font-weight-normal d-flex align-items-center">Metrics</div>
                <div class="dropdown">
                  <DiButton id="funnel-metrics" :title="metric" class="mr-2 btn-cdp dropdown-toggle" data-toggle="dropdown"></DiButton>
                  <div class="dropdown-menu">
                    <a v-for="metric in FunnelMetrics" :key="metric" class="dropdown-item" href="#" @click.prevent="changeFunnelMetric(metric)">
                      {{ metric }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <!--Empty-->
            <div v-if="isEmpty" class="cdp-body-content-block-nodata">
              <i class="cdp-body-content-block-nodata-icon di-icon-web-analysis"></i>
              <div class="cdp-body-content-block-nodata-msg text-center">
                Select an Event to get started
              </div>
            </div>
            <!--Have data-->
            <div v-else class="cdp-body-content-block-body" id="funnel-result-container">
              <FunnelChart v-if="result" :value="result" :isLoading="isLoading"></FunnelChart>
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
import CDPMixin from '@/screens/cdp/views/CDPMixin';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { EventDetail, EventExplorerService, FunnelAnalysisRequest, FunnelAnalysisResponse } from '@core/cdp';
import { DateRange, DateTimeConstants, VerticalScrollConfigs } from '@/shared';
import { MainDateMode } from '@core/common/domain';
import { DateUtils } from '@/utils';
import { CalendarData } from '@/shared/models';
import { ResourceData } from '@/shared/components/common/di-share-modal/DiShareModal.vue';
import FunnelChart from '../../components/funnel-chart/FunnelChart.vue';
import ManageFunnelAnalysis from '@/screens/cdp/components/manage-funnel-analysis/ManageFunnelAnalysis.vue';
import { FunnelAnalysisInfo } from '@/screens/cdp/components/manage-funnel-analysis/FunnelAnalysisInfo';
import LoadingComponent from '@/shared/components/LoadingComponent.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

enum FunnelMetric {
  Session = 'Sessions',
  Unique = 'Uniques'
}

@Component({
  mixins: [CDPMixin],
  components: {
    LoadingComponent,
    ManageFunnelAnalysis,
    DiCalendar,
    FunnelChart
  }
})
export default class FunnelAnalysis extends Vue {
  private readonly VerticalScrollOptions = VerticalScrollConfigs;
  private model: FunnelAnalysisInfo = FunnelAnalysisInfo.default();
  private dateRange: DateRange = DateUtils.getLast7Day();
  private readonly DateRangeOptions = DateTimeConstants.ListDateRangeModeOptions;
  private dateMode: MainDateMode = MainDateMode.last7Days;
  private readonly FunnelMetrics = [FunnelMetric.Session, FunnelMetric.Unique];
  private metric: FunnelMetric = FunnelMetric.Session;

  private isLoading = false;
  private errorMsg = '';
  private result: FunnelAnalysisResponse | null = null;

  @Inject('showShareModal')
  private readonly showShareModal!: (data: ResourceData) => void;

  @ioc
  private readonly eventService!: EventExplorerService;

  @Ref()
  private readonly scroller!: any;

  private get isEmpty(): boolean {
    return this.model.isEmpty() || (!this.result && !this.isLoading);
  }

  async mounted() {
    this.loadFunnelData(this.model, this.dateRange);
  }

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  @Track(TrackEvents.FunnelAnalysisSelectDateFilter, {
    start_date: (_: FunnelAnalysis, args: any) => ((args[0] as CalendarData).chosenDateRange?.start as Date)?.getTime(),
    end_date: (_: FunnelAnalysis, args: any) => ((args[0] as CalendarData).chosenDateRange?.end as Date)?.getTime()
  })
  private onChangeDateRange(calendarData: CalendarData) {
    this.dateRange = calendarData.chosenDateRange ?? DateUtils.getAllTime();
    this.dateMode = calendarData.filterMode;
  }

  private changeFunnelMetric(metric: FunnelMetric) {
    if (this.metric !== metric) {
      this.metric = metric;
    }
  }

  @Watch('model', { deep: true })
  private async onEventAnalysisChange(model: FunnelAnalysisInfo) {
    this.loadFunnelData(model, this.dateRange);
  }

  @Watch('dateRange', { deep: true })
  async onDateRangeChanged(dateRange: DateRange) {
    this.loadFunnelData(this.model, dateRange);
  }

  private async loadFunnelData(model: FunnelAnalysisInfo, dateRange: DateRange) {
    if (model.isEmpty()) {
      this.result = null;
      return;
    } else {
      try {
        this.isLoading = true;
        this.result = this.generateLoadingResponse(model);
        const eventNames = model.steps.map(step => step.eventName);
        const request = new FunnelAnalysisRequest(eventNames, DateUtils.toTimestampRange(dateRange), model.explorerType, [], []);
        this.result = await this.eventService.analyzeFunnel(request);
        this.scrollToBottom();
        this.isLoading = false;
      } catch (ex) {
        this.isLoading = false;
        this.errorMsg = ex.message;
        this.result = null;
      }
    }
  }

  private scrollToBottom() {
    this.$nextTick(() => {
      this.scroller.scrollIntoView('#funnel-result-container', 500);
    });
  }

  private generateLoadingResponse(model: FunnelAnalysisInfo): FunnelAnalysisResponse {
    const listFakeEvents = model.steps.map(step => EventDetail.default());
    return new FunnelAnalysisResponse(listFakeEvents);
  }
}
</script>

<style lang="scss">
.funnel-analysis {
  overflow: auto;
  .__view {
    display: flex;
    flex-direction: column;
  }
  .funnel-analysis-scroll-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    //
    //.event-analysis-chart {
    //  .chart-container {
    //    .status-loading {
    //      position: absolute;
    //      top: 0;
    //      left: 0;
    //      width: 100%;
    //      height: 100%;
    //    }
    //  }
    //}
  }
}
</style>
