<template>
  <div class="d-flex w-100 h-100">
    <LayoutContent class="w-100">
      <LayoutHeader :route="backRoute" :title="name" icon="di-icon-arrow-left" no-sidebar> </LayoutHeader>
      <Split :gutterSize="16" class="d-flex customer-detail">
        <SplitArea :size="panelSize[0]" :minSize="0">
          <div class="customer-detail-panel h-100 w-100">
            <StatusWidget
              :status="customerInfoStatus"
              :error="customerInfoErrorMessage"
              class="mw240 cdp-body-content-block h-100"
              @retry="handleLoadCustomerInfo"
            >
              <div class="cdp-body-content-block-body h-100" ref="leftPanel">
                <template>
                  <div class="customer-avatar">
                    <img :src="avatarUrl" @error="$event.target.src = defaultAvatar" />
                  </div>
                  <div class="customer-name text-truncate">
                    {{ name }}
                  </div>
                  <div v-if="isHaveSocialInfo" class="customer-social" ref="socialMedia">
                    <template v-if="model.properties.facebook">
                      <SocialIcon social-icon-source="/img/brand/facebook.svg" :social-url="model.properties.facebook" social-name="Facebook" />
                    </template>
                    <template v-if="model.properties.twitter">
                      <SocialIcon social-icon-source="/img/brand/twitter.svg" :social-url="model.properties.twitter" social-name="Twitter" />
                    </template>
                    <template v-if="model.properties.zalo">
                      <SocialIcon social-icon-source="/img/brand/zalo.svg" :social-url="model.properties.zalo" social-name="Zalo" />
                    </template>
                    <template v-if="model.properties.tiktok">
                      <SocialIcon social-icon-source="/img/brand/tiktok.svg" :social-url="model.properties.tiktok" social-name="Tiktok" />
                    </template>
                  </div>
                  <div v-if="model" :style="{ height: `${propertiesContainerHeight}px` }">
                    <div class="customer-block h-100" :class="{ open: showCustomerInfo }">
                      <a @click.prevent="showCustomerInfo = !showCustomerInfo" href="#" class="customer-block-title">
                        <i class="di-icon-arrow-down"></i>
                        About this contact
                      </a>
                      <div :style="{ height: `${propertiesHeight}px` }" style="padding-top: 24px">
                        <template v-if="showCustomerInfo">
                          <vuescroll>
                            <div>
                              <CustomerStringField class="customer-block-item" label="First name" :data="model.firstName" />
                              <CustomerStringField class="customer-block-item" label="Last name" :data="model.lastName" />
                              <CustomerGenderField class="customer-block-item" label="Gender" :data="model.gender" />
                              <CustomerDateField class="customer-block-item" label="Date of birth" :data="model.dob" />
                              <CustomerStringField class="customer-block-item" label="Email" :data="model.email" />
                              <CustomerStringField class="customer-block-item" label="Phone number" :data="model.phoneNumber" />
                              <template v-for="(value, key) in model.properties">
                                <CustomerStringField class="customer-block-item" :key="key" :label="formatKey(key)" :data="value" />
                              </template>
                            </div>
                          </vuescroll>
                        </template>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </StatusWidget>
          </div>
        </SplitArea>
        <SplitArea :size="panelSize[1]" :minSize="0">
          <div class="customer-activity-panel h-100 w-100">
            <div class="cdp-body-content-block h-100">
              <div class="cdp-body-content-block-title align-items-center pt-2">
                <span class="mt-1">ACTIVITY</span>
                <DiCalendar
                  v-if="dateRange"
                  @onCalendarSelected="onChangeDateRange"
                  class="ml-auto date-range-dropdown mt-1 pr-0"
                  id="di-calendar"
                  :isShowResetFilterButton="false"
                  :mainDateFilterMode="dateMode"
                  :modeOptions="dateRangeOptions"
                  :getDateRangeByMode="getDateRangeByMode"
                  :defaultDateRange="dateRange"
                  dateFormatPattern="MMM D, YYYY"
                />
                <div class="filter-event-container mt-1 ml-auto ml-sm-3">
                  <span>Event:</span>
                  <TagsInput
                    id="filter"
                    class="event-filter"
                    placeholder="Select events filter"
                    :avoidDuplicate="true"
                    :is-duplicate="() => false"
                    :addOnlyFromAutocomplete="true"
                    :suggest-tags="events"
                    :default-tags="currentFilter"
                    label-prop="name"
                    @tagsChanged="handleEventFilterChanged"
                  />
                </div>
              </div>
              <vuescroll ref="vuescroll">
                <status-widget
                  :status="customerActivitiesStatus"
                  :error="customerActivitiesErrorMessage"
                  @retry="handleLoadCustomerActivities"
                  class="cdp-body-content-block-body activities"
                >
                  <template v-if="isEmptyActivities && !isEmptyFilterEvents">
                    <EmptyDirectory class="h-100" title="No activities found" />
                  </template>
                  <template v-else-if="isEmptyActivities">
                    <EmptyDirectory class="h-100" title="No activity yet" />
                  </template>
                  <template v-else v-for="key in activitiesAsMap.keys()">
                    <div :key="key" class="customer-event-title">{{ key }}</div>
                    <template v-for="(activity, index) in activitiesAsMap.get(key)">
                      <div :key="index" class="customer-event-item">
                        <div class="customer-event-item-icon">
                          <i class="di-icon-page"></i>
                        </div>
                        <div class="customer-event-item-body">
                          <div class="customer-event-item-title">
                            <span class="d-flex align-items-center">
                              {{ activity.screenName }}
                              <i class="di-icon-click ml-4 mr-2" style="font-size: 24px"></i>
                              <div class="event-name">
                                {{ activity.eventName }}
                              </div>
                            </span>
                            <small>{{ formatDateTime(activity.timestamp) }}</small>
                          </div>
                          <div class="customer-event-item-content">
                            <!--                          Christopher Greer (Christopher Greer@gmail.com) was sent-->
                            <!--                          <a href="#">New Name - New Experience</a>-->
                            Duration: {{ Math.round(activity.duration / 1000) }} s
                          </div>
                          <!--                        <div class="customer-event-item-footer">-->
                          <!--                          <span class="customer-event-item-status">-->
                          <!--                            <i class="bg-success"></i>-->
                          <!--                            Delivered-->
                          <!--                          </span>-->
                          <!--                        </div>-->
                        </div>
                      </div>
                    </template>
                  </template>
                </status-widget>
              </vuescroll>
              <ListingFooter
                v-if="enablePagination"
                ref="footer"
                :total-rows="this.activitiesResponse.total"
                style="bottom: 0"
                total-row-title="row"
                class="di-table-footer cdp-body-content-block-footer"
                @onPageChange="handlePageChange"
              ></ListingFooter>
            </div>
          </div>
        </SplitArea>
      </Split>
    </LayoutContent>
  </div>
</template>
<script lang="ts">
import { Component, Ref, Vue, Mixins } from 'vue-property-decorator';
import CDPMixin from '@/screens/cdp/views/CDPMixin';
import { DateRange, DateTimeConstants, DefaultPaging, Routers, Status } from '@/shared';
import { CustomerEvent, CustomerInfo, CustomerService, EventExplorerService, ExploreType } from '@core/cdp';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { DIException, MainDateMode, PageResult } from '@core/common/domain';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import { Inject } from 'typescript-ioc';
import { Log } from '@core/utils';
import { ListActivitiesRequest } from '@core/cdp/domain/customer';
import { DateTimeFormatter, DateUtils } from '@/utils/DateUtils';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { CalendarData, Pagination } from '@/shared/models';
import ListingFooter from '@/shared/components/user-listing/ListingFooter.vue';
import TagsInput from '@/shared/components/TagsInput.vue';
import { StringUtils } from '@/utils/StringUtils';
import { ListUtils } from '@/utils/ListUtils';
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';
import CustomerGenderField from '@/screens/cdp/views/customer360-view-detail/CustomerGenderField.vue';
import CustomerDateField from '@/screens/cdp/views/customer360-view-detail/CustomerDateField.vue';
import CustomerStringField from '@/screens/cdp/views/customer360-view-detail/CustomerStringField.vue';
import SocialIcon from '@/screens/cdp/views/customer360-view-detail/SocialIcon.vue';
import SplitPanelMixin from '@/shared/components/layout-wrapper/SplitPanelMixin';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({
  components: {
    CustomerGenderField,
    CustomerDateField,
    CustomerStringField,
    SocialIcon,
    EmptyDirectory,
    StatusWidget,
    DiCalendar,
    PopoverV2,
    ListingFooter,
    TagsInput
  }
})
export default class Customer360ViewDetail extends Mixins(SplitPanelMixin, CDPMixin) {
  private model: CustomerInfo | null = null;
  private activitiesResponse: PageResult<CustomerEvent> | null = null;
  private backRoute = { name: Routers.Customer360 };

  private customerInfoErrorMessage = '';
  private customerActivitiesErrorMessage = '';
  private customerInfoStatus = Status.Loading;
  private customerActivitiesStatus = Status.Loading;

  private readonly dateMode = MainDateMode.custom;
  private dateRange: DateRange | null = null;
  private events: { name: string }[] = [];
  private filterEvents: string[] = [];
  private readonly dateRangeOptions = DateTimeConstants.ListDateRangeModeOptions;
  private activityPageFrom = 0;
  private activityPageSize = DefaultPaging.DefaultPageSize;
  private showCustomerInfo = true;

  @Ref()
  private readonly tableContainer!: HTMLElement;

  @Ref()
  private readonly leftPanel!: HTMLElement;

  @Ref()
  private readonly socialMedia?: HTMLElement;

  @Ref()
  private readonly vuescroll!: any;

  @Inject
  private readonly customerService!: CustomerService;

  @Inject
  private readonly eventExplorerService!: EventExplorerService;

  private get panelSize() {
    return this.getPanelSizeHorizontal();
  }

  async mounted() {
    await this.initData();
    this.loadPropertiesContainerHeight();
    this.loadCustomerPropertiesHeight();
    window.addEventListener('resize', this.loadPropertiesContainerHeight);
    window.addEventListener('resize', this.loadCustomerPropertiesHeight);
  }

  private async handleLoadEvent() {
    try {
      this.events = (await this.eventExplorerService.list(ExploreType.Event)).map((event: string) => {
        return { name: event };
      });
    } catch (e) {
      Log.error('handleLoadEvent::error::', e);
    }
  }

  private get currentFilter() {
    return this.filterEvents.map(item => {
      return { name: item };
    });
  }

  private get isHaveSocialInfo() {
    return (
      this.model &&
      this.model.properties &&
      (this.model.properties.zalo || this.model.properties.twitter || this.model.properties.zalo || this.model.properties.tiktok)
    );
  }

  private get activitiesAsMap(): Map<string, CustomerEvent[]> {
    const result: Map<string, CustomerEvent[]> = new Map<string, CustomerEvent[]>();
    this.activities.map(activity => {
      const key = this.formatMonthYear(activity.timestamp);
      if (result.has(key)) {
        const groupActivity: CustomerEvent[] = result.get(key)!.concat([activity]);
        result.set(key, groupActivity);
      } else {
        result.set(key, [activity]);
      }
    });
    return result;
  }

  formatDateTime(date: any): string {
    return DateTimeFormatter.formatAsMMMDDYYYHHmmss(date);
  }

  formatMonthYear(date: any): string {
    return DateTimeFormatter.formatASMonthYYYY(date).toUpperCase();
  }

  formatKey(key: string): string {
    return StringUtils.camelToCapitalizedStr(key);
  }

  get defaultDateRange(): DateRange {
    return {
      start: new Date(0),
      end: new Date()
    };
  }

  get name(): string {
    if (this.model) {
      return `${this.model?.firstName ?? ''} ${this.model.lastName ?? ''}`.trim();
    } else {
      return 'Unknown';
    }
  }

  private get enablePagination() {
    return (
      this.activitiesResponse &&
      this.activitiesResponse.total > 20 &&
      this.customerActivitiesStatus !== Status.Loading &&
      this.customerActivitiesStatus !== Status.Error
    );
  }

  private propertiesContainerHeight = 0;
  private propertiesHeight = 0;
  loadPropertiesContainerHeight() {
    const socialMediaHeight = this.socialMedia?.clientHeight ? this.socialMedia.clientHeight : 0;
    this.propertiesContainerHeight = this.leftPanel?.clientHeight ? this.leftPanel?.clientHeight - 36 - 120 - socialMediaHeight - 32 : 0;
  }

  loadCustomerPropertiesHeight() {
    const socialMediaHeight = this.socialMedia?.clientHeight ? this.socialMedia.clientHeight : 0;
    this.propertiesHeight = this.leftPanel?.clientHeight ? this.leftPanel?.clientHeight - 36 - 120 - socialMediaHeight - 32 - 17 - 20 : 0;
  }

  get avatarUrl() {
    return this.model?.properties.diCustomerAvatarUrl ?? '';
  }

  private get activities(): CustomerEvent[] {
    if (this.activitiesResponse) {
      return this.activitiesResponse.data;
    } else {
      return [];
    }
  }

  private get isEmptyActivities() {
    return ListUtils.isEmpty(this.activities);
  }

  private get isEmptyFilterEvents() {
    return ListUtils.isEmpty(this.filterEvents);
  }

  get defaultAvatar() {
    Log.debug('Name::');
    return HtmlElementRenderUtils.renderAvatarAsDataUrl(this.name);
  }

  routeId() {
    return (this.$route.params.id as any) as string;
  }

  private showCustomerInfoLoading() {
    this.customerInfoStatus = Status.Loading;
  }

  private showCustomerInfoLoaded() {
    this.customerInfoStatus = Status.Loaded;
  }

  private showCustomerActivitiesLoading() {
    this.customerActivitiesStatus = Status.Loading;
  }

  private showCustomerActivitiesLoaded() {
    this.customerActivitiesStatus = Status.Loaded;
  }

  private showCustomerActivitiesUpdating() {
    this.customerActivitiesStatus = Status.Updating;
  }

  private showCustomerInfoError(message: string) {
    Log.error('CustomerDetail::showCustomerInfoError::error::', message);
    this.customerInfoErrorMessage = message;
    this.customerInfoStatus = Status.Error;
  }

  private showCustomerActivitiesError(message: string) {
    Log.error('CustomerDetail::showCustomerInfoError::error::', message);
    this.customerActivitiesErrorMessage = message;
    this.customerActivitiesStatus = Status.Error;
  }

  private async initData() {
    try {
      const current = new Date();
      this.dateRange = {
        start: new Date(current.getTime() - 30 * 864e5),
        end: current
      };
      await this.handleLoadCustomerInfo();
      await this.handleLoadCustomerActivities();
      await this.handleLoadEvent();
    } catch (e) {
      this.showCustomerInfoError(e.message);
    }
  }

  private async handleLoadCustomerInfo() {
    try {
      this.showCustomerInfoLoading();
      const id = this.routeId();
      this.model = await this.customerService.get(id);
      this.showCustomerInfoLoaded();
    } catch (e) {
      this.showCustomerInfoError(e.message);
    }
  }

  private async handlePageChange(pagination: Pagination) {
    try {
      this.showCustomerActivitiesUpdating();
      this.activityPageFrom = (pagination.page - 1) * pagination.size;
      await this.loadCustomerActivities();
      this.toFirstActivity();
      this.showCustomerActivitiesLoaded();
    } catch (ex) {
      Log.error('handlePageChange::', ex);
      this.showCustomerActivitiesError(ex.message);
    }
  }

  toFirstActivity() {
    this.vuescroll.scrollTo(
      {
        y: '0%'
      },
      50
    );
  }

  private async loadCustomerActivities() {
    if (this.model) {
      const rangeValues = this.dateRange ? DateUtils.toTimestampRange(this.dateRange) : DateUtils.toTimestampRange(this.defaultDateRange);
      const request = new ListActivitiesRequest(this.model.id, this.filterEvents, rangeValues, this.activityPageSize, this.activityPageFrom);
      this.activitiesResponse = await this.customerService.listActivities(request);
    } else {
      throw new DIException('Customer info not valid.');
    }
  }

  private async handleLoadCustomerActivities() {
    try {
      this.showCustomerActivitiesLoading();
      await this.loadCustomerActivities();
      this.showCustomerActivitiesLoaded();
    } catch (e) {
      this.showCustomerActivitiesError(e.message);
    }
  }

  @Track(TrackEvents.CustomerDetailSelectDateFilter, {
    start_date: (_: Customer360ViewDetail, args: any) => ((args[0] as CalendarData).chosenDateRange?.start as Date)?.getTime(),
    end_date: (_: Customer360ViewDetail, args: any) => ((args[0] as CalendarData).chosenDateRange?.end as Date)?.getTime()
  })
  private onChangeDateRange(calendarData: CalendarData) {
    this.dateRange = calendarData.chosenDateRange;
    this.handleLoadCustomerActivities();
  }

  private getDateRangeByMode() {
    //
  }

  private handleEventFilterChanged(events: { name: string }[]) {
    this.filterEvents = events.map(event => event.name);
    this.activityPageFrom = 0;
    this.handleLoadCustomerActivities();
    TrackingUtils.track(TrackEvents.CustomerDetailChangeFilter, {
      event_names: this.filterEvents.join(',')
    });
  }
}
</script>
<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.cdp-body-content-header-icon {
  &:hover {
    text-decoration: none;
  }
  opacity: 1;
  font-size: 14px;
}
.customer-detail {
  text-align: left;
}
.customer-detail ::v-deep {
  .mw240 {
    min-width: 240px;
  }
  .cdp-body-content-block {
    min-height: calc(100vh - 170px) !important;
    overflow: hidden;
    padding: 0;
    margin: 0;

    .cdp-body-content-block-body {
      padding: 16px;
    }

    .cdp-body-content-block-title {
      background: #fff;
      padding: 16px;
      margin: 0;
      display: flex;
      flex-wrap: wrap;

      > span {
        margin-top: 9px;
      }

      & + .cdp-body-content-block-body {
        padding: 0 16px 16px 16px;
      }

      .filter-event-container {
        display: flex;
        margin-left: 16px;
        align-items: start;
        font-weight: normal;
        > span {
          margin-top: 9px;
          margin-right: 16px;
        }
        .event-filter {
          min-width: 177px;
          max-width: 300px;
          min-height: 34px;
        }
      }

      .date-range-dropdown {
        height: 30px;
      }
    }

    .cdp-body-content-block-footer {
      bottom: 0;
      width: 100%;
      background: #fff;
      padding: 16px;
      margin: 0;
    }

    .activities {
      position: absolute;
    }
  }

  .customer-avatar {
    margin: 10px auto;

    img {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 50%;
      overflow: hidden;
    }
  }

  .customer-name {
    font-size: 24px;
    font-weight: 500;
    text-align: center;
  }

  .customer-social {
    display: flex;
    margin: 20px auto;
  }

  .customer-block {
    padding: 20px 0;

    .customer-block-title .di-icon-arrow-down {
      transform: rotate(-90deg);
      transition: transform 100ms linear;
      display: inline-block;
    }
    &.open {
      .customer-block-title .di-icon-arrow-down {
        transform: rotate(0deg);
      }
    }

    .customer-block-title {
      text-decoration: none;
      color: var(--text-color);
      font-weight: 500;
      //padding-bottom: 24px;
    }

    .customer-block-item {
      display: flex;
      flex-direction: column;
      //padding-top: 24px;
      padding: 0 12px;

      & > label {
        font-size: 12px;
        margin-bottom: 12px;
        color: var(--secondary-text-color);
      }

      & > span:not(.no-data) {
        font-weight: 500;
      }

      & > span.no-data {
        color: var(--neutral);
      }
    }
    .customer-block-item + .customer-block-item {
      padding-top: 24px;
    }
  }

  .btn-filters {
    background: #f2f2f7;
    color: var(--secondary-text-color);
  }

  .customer-event-title {
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-bottom: 12px;
    background: #fff;
  }

  .customer-event-item {
    color: var(--secondary-text-color);
    border-radius: 4px;
    background-color: #8383950a;
    padding: 20px;
    display: flex;
    margin-bottom: 12px;

    .customer-event-item-icon {
      width: 24px;
      margin-right: 24px;
      color: var(--text-color);
      font-size: 24px;
      line-height: 1;
    }

    .customer-event-item-body {
      flex: 1;
    }

    &-title {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;

      span {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-color);

        //.event-name{
        //  @include regular-text-14();
        //}
      }

      small {
        font-size: 14px;
      }
    }

    &-content {
      font-size: 14px;
      margin-bottom: 10px;

      a {
        color: var(--secondary-text-color);
        text-decoration: underline;
      }
    }

    &-footer {
      .customer-event-item-status {
        font-size: 12px;

        i {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-right: 4px;
          border-radius: 50%;
        }
      }
    }
  }
}
</style>
