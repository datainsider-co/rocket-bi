<template>
  <div class="d-flex w-100 h-100">
    <LayoutSidebar :items="navItems">
      <template v-slot:top>
        <DiShadowButton id="create" title="New" disabled>
          <i class="di-icon-add"></i>
        </DiShadowButton>
      </template>
    </LayoutSidebar>
    <LayoutContent>
      <LayoutHeader title="Path Explorer" icon="di-icon-direction">
        <div class="d-flex ml-auto">
          <!--          <DiButton @click.prevent="showShareEtl" id="share" title="Share">-->
          <!--            <i class="di-icon-share"></i>-->
          <!--          </DiButton>-->
          <!--          <DiButton id="save" title="Save">-->
          <!--            <i class="di-icon-save"></i>-->
          <!--          </DiButton>-->
        </div>
      </LayoutHeader>
      <vuescroll>
        <div class="d-flex flex-column" style="min-height: calc(100vh - 170px)">
          <ManagePathExplorer v-model="model"></ManagePathExplorer>
          <div class="cdp-body-content-block mb-0 w-100 flex-grow-1 mt-3 pt-1">
            <div class="cdp-body-content-block-title">
              <DiCalendar
                @onCalendarSelected="onChangeDateRange"
                class="date-range-dropdown btn-cdp mt-2 mr-auto"
                id="di-calendar"
                :isShowResetFilterButton="false"
                :mainDateFilterMode="dateMode"
                :modeOptions="DateRangeOptions"
                :getDateRangeByMode="getDateRangeByMode"
                :defaultDateRange="dateRange"
                dateFormatPattern="MMM D, YYYY"
                canEditCalendar
              >
              </DiCalendar>
              <DiButton id="view-type" title="Sankey" class="btn-cdp ml-2 mt-2">
                <img src="@/assets/icon/charts/ic_sankey.svg" alt="chart" width="16" />
              </DiButton>
            </div>
            <div class="cdp-body-content-block-body">
              <EventExplorerResult :info="model" :dateRange="dateRange"></EventExplorerResult>
            </div>
          </div>
        </div>
      </vuescroll>
    </LayoutContent>
  </div>
</template>
<script lang="ts">
import { Component, Inject, Vue, Watch } from 'vue-property-decorator';
import CDPMixin from '@/screens/CDP/views/CDP.mixin';
import ManagePathExplorer from '@/screens/CDP/components/ManagePathExplorer/ManagePathExplorer.vue';
import { DateRange, DateTimeConstants } from '@/shared';
import { MainDateMode } from '@core/domain';
import DiCalendar from '@filter/MainDateFilterV2/DiCalendar.vue';
import { DateUtils } from '@/utils';
import { CalendarData } from '@/shared/models';
import EventExplorerResult from '@/screens/CDP/components/EventExplorerResult/EventExplorerResult.vue';
import { PathExplorerInfo } from '@/screens/CDP/components/ManagePathExplorer/PathExplorer.entity';
import { ResourceData } from '@/shared/components/Common/DiShareModal/DiShareModal.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  mixins: [CDPMixin],
  components: {
    ManagePathExplorer,
    EventExplorerResult,
    DiCalendar
  }
})
export default class PathExplorer extends Vue {
  private dateRange: DateRange = DateUtils.getLast7Day();
  private readonly DateRangeOptions = DateTimeConstants.ListDateRangeModeOptions;
  private dateMode: MainDateMode = MainDateMode.last7Days;
  private readonly model: PathExplorerInfo | null = null;

  @Inject('showShareModal')
  private readonly showShareModal!: (data: ResourceData) => void;

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  @Track(TrackEvents.PathExplorerSelectDateFilter, {
    start_date: (_: PathExplorer, args: any) => ((args[0] as CalendarData).chosenDateRange?.start as Date)?.getTime(),
    end_date: (_: PathExplorer, args: any) => ((args[0] as CalendarData).chosenDateRange?.end as Date)?.getTime()
  })
  private onChangeDateRange(calendarData: CalendarData) {
    this.dateRange = calendarData.chosenDateRange ?? DateUtils.getAllTime();
    this.dateMode = calendarData.filterMode;
  }
}
</script>
<style lang="scss">
.cdp-path-explorer {
  .cdp-body-content-body {
    flex: unset;
    height: calc(100vh - 170px);
    .cdp-body-content-block-body {
      flex: unset;
    }
  }
}
</style>
