import { Component, Inject as VueInject, Ref, Vue, Watch } from 'vue-property-decorator';
import CDPMixin from '@/screens/CDP/views/CDP.mixin';
import { Log } from '@core/utils';
import { Inject } from 'typescript-ioc';
import { CohortFilter, CohortInfo, CohortService, QueryCohortResponse, TimeMetric } from '@core/CDP';
import { DateRange, DateTimeConstants, HorizontalScrollConfig, VerticalScrollConfigs } from '@/shared';
import { MainDateMode } from '@core/domain';
import { CalendarData } from '@/shared/models';
import { DateTimeFormatter, DateUtils, ListUtils } from '@/utils';
import DiCalendar from '@filter/MainDateFilterV2/DiCalendar.vue';
import ManageCohort from '@/screens/CDP/components/ManageCohort/ManageCohort.vue';
import Swal from 'sweetalert2';
import ManageEventAnalysis from '@/screens/CDP/components/ManageEventAnalysis/ManageEventAnalysis.vue';
import { RetentionAnalysisResponse } from '@core/CDP/Domain/Cohort/RetentionAnalysisResponse';
import CdpBlock from '@/screens/CDP/components/CdpBlock/CdpBlock.vue';
import PopoverV2 from '@/shared/components/Common/PopoverV2/PopoverV2.vue';
import { toNumber } from 'lodash';
import CohortFilterComponent from '@/screens/CDP/components/CohortFilter/CohortFilterComponent.vue';
import { UICohortFilterUtils } from '@/screens/CDP/components/CohortFilter/Cohort2CohortFilter';
import { ResourceData } from '@/shared/components/Common/DiShareModal/DiShareModal.vue';
import SelectStepPopover, { ANY_EVENT, TabType } from '@/screens/CDP/components/SelectStepPopover/SelectStepPopover.vue';
import { FilterGroup } from '@/screens/CDP/components/CohortFilter/FilterGroup.entity';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

type RawData = {
  time: string;
  value: number;
  items: number[];
};

interface RetentionCellData {
  retainedTime: string;
  time: string;
  total: number;
  percent: number;
}

@Component({
  mixins: [CDPMixin],
  components: {
    ManageCohort,
    DiCalendar,
    ManageEventAnalysis,
    SelectStepPopover,
    CdpBlock,
    PopoverV2,
    CohortFilterComponent
  }
})
export default class RetentionAnalysis extends Vue {
  private readonly verticalScrollConfig = VerticalScrollConfigs;
  private readonly HorizontalScroll = HorizontalScrollConfig;
  @Inject
  private cdpService!: CohortService;
  private loading = false;
  private error = '';
  private queryCohortResponse: QueryCohortResponse | null = null;
  private result: RetentionAnalysisResponse | null = null;
  private readonly DateRangeOptions = DateTimeConstants.ListDateRangeModeOptions;
  private readonly dateMode: MainDateMode = MainDateMode.last7Days;

  private startEvent: string | null = null;
  private returnEvent: string | null = null;
  private readonly filterGroups: FilterGroup[] = [];

  private timeMetric: TimeMetric = TimeMetric.Day;
  private dateRange: DateRange = DateUtils.getLast7Day();
  private dateFilterMode = MainDateMode.last7Days;
  private dateFilterDisplayName = 'Last 7 days';
  private tooltipData: RetentionCellData = { percent: 0, total: 0, retainedTime: '', time: '' };

  @Ref()
  private readonly manageCohort?: ManageCohort;

  @Ref()
  private readonly selectStepPopover!: SelectStepPopover;

  @Ref()
  private readonly tableTooltip!: PopoverV2;

  @VueInject('showShareModal')
  private readonly showShareModal!: (data: ResourceData) => void;

  private get cohortId(): number | null {
    if (this.$route.query.id && /^\d+$/.test(this.$route.query.id.toString())) {
      return parseInt(this.$route.query.id as string);
    }
    return null;
  }

  private get timeMetrics() {
    return [TimeMetric.Day, TimeMetric.Week, TimeMetric.Month, TimeMetric.Quarter, TimeMetric.Year];
  }

  private mounted() {
    this.loadRetentionData();
  }

  private get isNoData(): boolean {
    return this.result != null && ListUtils.isEmpty(this.result.records);
  }

  showTooltip(target: HTMLElement, retentionCellData: RetentionCellData) {
    this.tooltipData = retentionCellData;
    this.tableTooltip.showPopover(target);
  }

  hideTooltip() {
    this.tableTooltip.hidePopover();
  }

  handleShowTooltip(e: MouseEvent) {
    const className = (e.target as HTMLElement).className;
    if (className.includes('sankey-td')) {
      const rowIndex = toNumber((e.target as HTMLElement).getAttribute('row-idx'));
      const colIndex = toNumber((e.target as HTMLElement).getAttribute('col-idx'));
      const percent = this.result?.records[rowIndex].percents[colIndex]!;
      const total = this.result?.records[rowIndex].total!;
      const time = this.result?.records[rowIndex].date!;
      const retainedTime = this.result?.headers[colIndex]!;
      this.showTooltip(e.target as HTMLElement, { percent: percent, total: total, time: time, retainedTime: retainedTime });
    } else {
      this.hideTooltip();
    }
  }

  @Track(TrackEvents.RetentionAnalysisSelectDateFilter, {
    start_date: (_: RetentionAnalysis, args: any) => ((args[0] as CalendarData).chosenDateRange?.start as Date)?.getTime(),
    end_date: (_: RetentionAnalysis, args: any) => ((args[0] as CalendarData).chosenDateRange?.end as Date)?.getTime()
  })
  private onChangeDateRange(e: CalendarData) {
    this.dateRange = e.chosenDateRange ?? this.dateRange;
    this.dateFilterMode = e.filterMode;
  }

  private renderRetentionTitle(dateFilterMode: MainDateMode) {
    const defaultTitle = DateTimeFormatter.formatASMMMDDYYYY(this.dateRange?.start) + ' - ' + DateTimeFormatter.formatASMMMDDYYYY(this.dateRange?.end);
    if (this.dateFilterMode === MainDateMode.custom) {
      this.dateFilterDisplayName = defaultTitle;
    } else {
      const option = DateTimeConstants.ListDateRangeModeOptions.find(op => op.value === dateFilterMode);
      this.dateFilterDisplayName = option?.label ?? defaultTitle;
    }
  }

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  private saveCurrentFilter() {
    // todo: save current filter
  }

  private onCreatedCohort(cohortFilter: CohortInfo) {
    Swal.fire({
      icon: 'success',
      title: 'Create cohort success!'
    });
  }

  @Track(TrackEvents.RetentionAnalysisSelectTimeMetric, {
    type: (_: RetentionAnalysis, args: any) => args[0]
  })
  private changeTimeMetric(timeMetric: TimeMetric) {
    if (this.timeMetric !== timeMetric) {
      this.timeMetric = timeMetric;
      this.loadRetentionData();
    }
  }

  addStartEvent(e: Event) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event], {
      isShowAnyEvent: true,
      callback: eventName => {
        this.startEvent = eventName;
        if (!this.returnEvent) {
          this.returnEvent = ANY_EVENT;
        }
        Log.debug('addStartEvent::', eventName, this.startEvent);
        this.loadRetentionData();
        TrackingUtils.track(TrackEvents.RetentionAnalysisSelectStartEvent, {
          name: eventName
        });
      }
    });
  }

  addReturnEvent(e: Event) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event], {
      isShowAnyEvent: true,
      callback: eventName => {
        this.returnEvent = eventName;
        if (!this.startEvent) {
          this.startEvent = ANY_EVENT;
        }
        Log.debug('addReturnEvent::', eventName, this.startEvent);
        this.loadRetentionData();
        TrackingUtils.track(TrackEvents.RetentionAnalysisSelectEndEvent, {
          name: eventName
        });
      }
    });
  }

  async loadRetentionData() {
    try {
      this.renderRetentionTitle(this.dateFilterMode);
      if (this.startEvent && this.returnEvent) {
        this.loading = true;
        const startEvent = this.isAnyEvent(this.startEvent) ? null : this.startEvent;
        const returnEvent = this.isAnyEvent(this.returnEvent) ? null : this.returnEvent;
        const cohortFilter: CohortFilter | null = UICohortFilterUtils.toCohortFilter(this.filterGroups);
        this.result = await this.cdpService.analyze(startEvent, returnEvent, cohortFilter, this.dateRange, this.timeMetric);
        this.error = '';
        this.loading = false;
      }
    } catch (ex) {
      this.loading = false;
      this.error = ex.message;
      this.result = null;
    }
  }

  @Watch('dateRange', { deep: true })
  private onChangeDateRangeCohort() {
    this.loadRetentionData();
  }

  @Track(TrackEvents.RetentionAnalysisChangeFilter, {
    filters: (_: RetentionAnalysis, args: any) => JSON.stringify(UICohortFilterUtils.toCohortFilter(_.filterGroups))
  })
  @Watch('filterGroups', { deep: true })
  private onChangeFilterGroups() {
    this.loadRetentionData();
  }

  private isAnyEvent(event: string) {
    return event === ANY_EVENT;
  }

  private getDisplayName(eventName: string): string {
    if (this.isAnyEvent(eventName)) {
      return 'Any Event';
    } else {
      return eventName;
    }
  }
}
