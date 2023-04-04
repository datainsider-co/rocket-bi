<template>
  <div class="user-management-details-deletion" v-if="userActivities">
    <div class="user-management-details-deletion-header">
      <span>Activity</span>
      <div class="filter">
        <div class="date">
          <DiCalendar
            @onCalendarSelected="handleCalendarSelected"
            :defaultDateRange="defaultDateRange"
            :mainDateFilterMode="mainDateFilterMode"
            :placement="'bottomRight'"
            :isHiddenCompareToSection="true"
            :mode-options="MainDateModeOptions"
            :isShowAllTime="false"
            :isShowResetFilterButton="false"
          />
        </div>
        <div class="event">
          <span>Events:</span>
          <v-select multiple placeholder="Choose an event" :options="eventsToFilters" v-model="selectedEvents" :reduce="event => event.code"></v-select>
        </div>
      </div>
    </div>

    <DynamicScroller v-if="isHasData" ref="scroller" class="scroll-area" :items="data" :min-item-size="20" key-field="key">
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :data-active="active" :data-index="index">
          <div class="user-profile-details-activity-listing">
            <span class="listing-time">{{ item.key }}</span>
            <!-- Begin: Activites Per Month -->
            <DynamicScroller class="scroll-area-sub" :items="item.value" :min-item-size="20" key-field="id" v-on:scroll.native="handleSubScroll">
              <template v-slot="{ item, index, active }">
                <DynamicScrollerItem :item="item" :active="active" :data-active="active" :data-index="index">
                  <div class="listing-content" :key="index">
                    <PageView v-if="isDiSessionEvent(item.eventName)" backgroundColor="#202f3e" :data="item" />
                    <ActivityCard v-else backgroundColor="#202f3e" :data="item" />
                  </div>
                </DynamicScrollerItem>
              </template>
            </DynamicScroller>
            <!-- End: Activites Per Month -->
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
    <div v-else class="user-profile-details-activity-listing">
      <span class="mt-5">There are no records to show</span>
    </div>
  </div>
  <div class="user-profile-details-activity-loading" v-else>
    <DiLoading></DiLoading>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { mapGetters, mapState } from 'vuex';
import NProgress from 'nprogress';
import moment from 'moment';
import * as _ from 'lodash';
import vuescroll, { Config } from 'vuescroll';
import ActivityCard from '@/screens/tracking-profile/components/tracking-profile-detail/ActivityCard.vue';
import SessionActivityCard from '@/screens/tracking-profile/components/tracking-profile-detail/SessionActivityCard.vue';
import { ProfileActivityModule } from '@/screens/tracking-profile/store/ProfileActivityStore';
import { ActivityGroup, DateRange } from '@/shared/interfaces';
import { DateTimeConstants, DefaultPaging, DefaultScrollConfig, Stores } from '@/shared';
import { UserActivity } from '@core/common/domain/response';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { MainDateMode } from '@core/common/domain/model';
import { CalendarData } from '@/shared/models';
import { Log } from '@core/utils';

NProgress.configure({ easing: 'ease', speed: 500, showSpinner: false });

@Component({
  components: {
    ActivityCard,
    PageView: SessionActivityCard,
    vuescroll,
    DiCalendar
  },
  computed: {
    ...mapState(Stores.profileActivityStore, ['userActivities', 'currentPage', 'from']),
    ...mapGetters(Stores.profileActivityStore, ['eventsToFilters'])
  }
})
export default class Activity extends Vue {
  userActivities!: any;
  currentPage!: number;
  from!: number;

  dateRange: DateRange;
  scrollOption: Config = DefaultScrollConfig;

  data: ActivityGroup[];
  selectedEvents: any;
  currentTotalItems: UserActivity[];
  isPaging: boolean;
  defaultDateRange: DateRange;
  mainDateFilterMode = MainDateMode.custom;

  private readonly MainDateModeOptions = DateTimeConstants.ListDateRangeModeOptions;

  @Ref()
  scroller!: any;

  constructor() {
    super();
    this.data = [];
    this.selectedEvents = [];
    this.isPaging = false;
    this.currentTotalItems = [];
    this.dateRange = this.initDefaultDateRange();
    this.defaultDateRange = this.dateRange;
  }

  created() {
    ProfileActivityModule.setFromTime({ fromTime: (this.dateRange.start as Date).getTime() });
    ProfileActivityModule.setToTime({ toTime: (this.dateRange.end as Date).getTime() });
    ProfileActivityModule.setFrom({ from: 0 });
    ProfileActivityModule.setCurrentPage({ currentPage: 1 });
  }

  get currentDate() {
    return new Date();
  }

  get totalRows() {
    return this.userActivities?.total;
  }

  get totalPages() {
    return Math.ceil(this.totalRows / DefaultPaging.defaultForVirtualScroller);
  }

  get isHasData() {
    return this.userActivities?.data?.length > 0;
  }

  isDiSessionEvent(event: string) {
    if (event.startsWith('di_session')) {
      return true;
    }
    return false;
  }

  @Watch('userActivities', { immediate: true, deep: true })
  onUserActivitiesChanged() {
    if (this.userActivities) {
      if (this.isPaging) {
        this.currentTotalItems = [...this.currentTotalItems, ...this.userActivities.data];
      } else {
        this.currentTotalItems = this.userActivities.data;
      }
      this.handleRenderUserActivities();
      if (!this.isPaging) {
        this.scroller?.scrollToItem(0);
      }
    }
  }

  @Watch('dateRange')
  onDateRangeChanged() {
    if (!this.dateRange) {
      this.dateRange = this.initDefaultDateRange();
    }
    ProfileActivityModule.setFromTime({ fromTime: (this.dateRange.start as Date).getTime() });
    ProfileActivityModule.setToTime({ toTime: (this.dateRange.end as Date).getTime() });
    ProfileActivityModule.setFrom({ from: 0 });
    ProfileActivityModule.setCurrentPage({ currentPage: 1 });
    this.isPaging = false;
    this.fetchUserActivities();
  }

  handleCalendarSelected(data: CalendarData) {
    this.dateRange = data.chosenDateRange!;
  }

  initDefaultDateRange() {
    const currentDate = new Date();
    const priorDate = new Date().setDate(currentDate.getDate() - 7);
    return {
      start: new Date(priorDate),
      end: currentDate
    };
  }

  @Watch('selectedEvents')
  onSelectedEventsChanged() {
    ProfileActivityModule.setIncludeEvents({ includeEvents: this.selectedEvents });
    ProfileActivityModule.setFrom({ from: 0 });
    ProfileActivityModule.setCurrentPage({ currentPage: 1 });
    this.isPaging = false;
    this.fetchUserActivities();
  }

  handleSubScroll(event: any) {
    const { scrollTop, clientHeight, scrollHeight } = event?.target;
    if (scrollTop + clientHeight >= scrollHeight) {
      this.handlePaging();
    }
  }

  private handlePaging() {
    if (this.currentPage < this.totalPages) {
      const newFrom = this.currentPage * DefaultPaging.defaultForVirtualScroller;
      const newPage = this.currentPage + 1;
      ProfileActivityModule.setCurrentPage({ currentPage: newPage });
      ProfileActivityModule.setFrom({ from: newFrom });
      this.isPaging = true;
      this.fetchUserActivities();
    }
  }

  private async fetchUserActivities() {
    try {
      NProgress.start();
      ProfileActivityModule.clearUserActivitiesByEventId();
      await ProfileActivityModule.getUserActivities();
    } catch (e) {
      Log.error(`Get activies error: ${e?.message}`);
    } finally {
      NProgress.done();
    }
  }

  private handleRenderUserActivities() {
    const mapped = [];
    const groupedData = this.groupedUserActivities();
    if (groupedData) {
      for (const [key, value] of Object.entries(groupedData)) {
        const shortKey = moment(key)
          .format('MMMM YYYY')
          .toUpperCase();
        // @ts-ignore
        const data = value.map((x, index) => {
          return {
            id: index,
            eventId: x.eventId,
            eventName: x.eventName,
            title: x.title,
            time: moment(x.time).format('ddd, MMM DD, YYYY HH:mm:ss A'),
            username: x.username,
            event: x.event,
            subActivities: x.subActivities,
            userDetail: x.userDetail
          };
        });
        mapped.push({ key: shortKey, value: data });
      }
    }
    this.data = mapped;
  }

  private groupedUserActivities() {
    if (this.currentTotalItems) {
      // @ts-ignore
      return _.groupBy(this.currentTotalItems, x => moment(x['time']).startOf('month'));
    }
    return null;
  }
}
</script>
<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.user-profile-details-activity-loading {
  display: flex;
  flex-direction: row;
  background-color: var(--user-profile-background-color);
  border-radius: 4px;
  margin-left: 24px;
  flex-grow: 2;
  padding: 24px;
  height: 100%;
  justify-content: center;
  align-items: center;

  @media all and (max-width: 880px) {
    margin-left: 0px;
    margin-top: 24px;
  }
}

.user-management-details-deletion {
  display: flex;
  flex-direction: column;
  background-color: var(--user-profile-background-color);
  border-radius: 4px;
  margin-left: 24px;
  flex-grow: 2;
  padding: 24px;
  height: 100%;

  @media all and (max-width: 880px) {
    margin-left: 0px;
    margin-top: 24px;
  }

  .user-management-details-deletion-header {
    order: 0;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;

    span {
      order: 0;
      @include regular-text;
      font-size: 24px;
      line-height: 1.4;
      letter-spacing: 0.2px;
    }

    .filter {
      order: 1;
      margin-left: auto;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      height: 37px;

      .date {
        order: 0;
        display: flex;
        flex-direction: row;
        @media screen and (max-width: 658px) {
          margin-left: auto;
        }
        @media screen and (min-width: 881px) and (max-width: 1024px) {
          margin-left: auto;
        }

        span {
          order: 0;
          @include regular-text;
          font-size: 14px;
          line-height: 1.4;
          letter-spacing: 0.2px;
          margin-right: 8px;
          align-self: center;
        }
      }

      .event {
        order: 1;
        display: flex;
        flex-direction: row;
        margin-left: 16px;
        @media screen and (max-width: 658px) {
          margin-left: auto;
        }
        @media screen and (min-width: 881px) and (max-width: 1024px) {
          margin-left: auto;
        }

        span {
          order: 0;
          @include regular-text;
          font-size: 14px;
          line-height: 1.4;
          letter-spacing: 0.2px;
          margin-right: 8px;
          align-self: center;
        }
      }
    }
  }

  .user-profile-details-activity-listing {
    order: 1;
    padding: 8px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    width: 100%;

    .listing-time {
      order: 0;
      @include regular-text;
      opacity: 0.5;
      font-size: 12px;
      letter-spacing: 0.2px;
      align-self: flex-start;
    }

    .listing-content {
      order: 1;
      padding: 4px;
    }
  }
}

.input-calendar {
  @include regular-text;
  width: 100%;
  letter-spacing: 0.2px;
  color: var(--text-color);
  height: 32px;
  width: 180px;
  background-color: transparent;
  font-size: 12px;
  border: transparent;
  padding-left: 16px;
  border-radius: 4px;
}

//::v-deep {
//@import '~@/themes/scss/calendar/new-custom-vcalendar.scss';
//
//  .col-4 {
//    padding-right: 0px !important;
//  }
//
//  .vc-bg-white {
//    background-color: var(--secondary) !important;
//  }
//
//  .vc-rounded-lg {
//    border-radius: 8px !important;
//  }
//
//  .vc-header {
//    padding: 5px 10px !important;
//  }
//
//  .vc-arrows-container {
//    padding: 10px !important;
//  }
//
//  .vc-pane {
//    padding-top: 10px !important;
//  }
//
//  .vc-weeks {
//    padding: 8px !important;
//  }
//
//  .vc-reset [role='button'],
//  .vc-reset button {
//    margin-right: 6px !important;
//  }
//
//  .vs--searchable .vs__dropdown-toggle {
//    width: 200px;
//    background-color: var(--primary);
//    min-height: 32px;
//    padding: 0;
//
//    input {
//      height: 32px;
//    }
//  }
//
//  .vs__search,
//  .vs__search:focus {
//    margin: 0;
//  }
//
//  .vs__search::placeholder {
//    @include regular-text;
//    opacity: 0.8;
//    font-size: 12px;
//    font-family: Barlow !important;
//    color: var(--text-color) !important;
//  }
//
//  .vs__dropdown-toggle::placeholder {
//    color: var(--text-color) !important;
//  }
//
//  .vs__selected {
//    background-color: var(--accent) !important;
//    border: 1px solid rgba(60, 60, 60, 0.26);
//    color: var(--text-color) !important;
//  }
//
//  .vs__dropdown-menu {
//    background-color: var(--secondary);
//
//    li {
//      @include regular-text;
//      opacity: 0.8;
//      font-size: 14px;
//      letter-spacing: 0.2px;
//      font-family: Barlow !important;
//    }
//
//    li:hover {
//      background-color: var(--primary);
//    }
//
//    li:active {
//      background-color: var(--primary);
//    }
//  }
//
//  .vs__open-indicator,
//  .vs__deselect {
//    fill: rgba(255, 255, 255, 0.5);
//  }
//
//  .di-calendar-input-container .input-calendar {
//    //background-color: var(--user-profile-background-color);
//    opacity: 0.8;
//  }
//}

.scroll-area {
  height: calc(100vh - 250px) !important;
  margin-top: 8px;
}

.scroll-area-sub {
  height: calc(100vh - 300px);
  margin-top: 12px;
}
</style>
