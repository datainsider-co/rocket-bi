<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import LayoutHeader from '@/shared/components/layout-wrapper/LayoutHeader.vue';
import SearchInput from '@/shared/components/SearchInput.vue';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import BreadcrumbComponent from '@/screens/directory/components/BreadcrumbComponent.vue';
import { Breadcrumbs, CalendarData } from '@/shared/models';
import { DateRange, DateTimeConstants, Routers } from '@/shared';
import DiCalendar from '@filter/main-date-filter-v2/DiCalendar.vue';
import { MainDateMode, UserProfile } from '@core/common/domain';
import { DateUtils, ResourceType, StringUtils } from '@/utils';
import moment, { isDate } from 'moment';
import { Log } from '@core/utils';
import FilterButton from '@/screens/organization-settings/views/system-monitor/components/user-usage/FilterButton.vue';
import { ActivityActionType } from '@core/organization/domain/user-activity/ActivityActionType';
import { compact, isArray, isString } from 'lodash';
import { ActivityActionPicker } from '@/screens/organization-settings/views/system-monitor/helper/ActivityActionPicker';
import { ActivityResourceType } from '@core/organization';
import { ActivityResourcePicker } from '@/screens/organization-settings/views/system-monitor/helper/ActivityResourcePicker';
import { MainDateModePicker } from '@/screens/organization-settings/views/system-monitor/helper/MainDateModePicker';
import EventBus from '@/screens/organization-settings/views/sso-config/helper/EventBus';

@Component({
  components: { FilterButton, DiCalendar, BreadcrumbComponent, DiIconTextButton, SearchInput, LayoutHeader }
})
export default class SystemMonitorHeader extends Vue {
  readonly MainDateModeOptions = DateTimeConstants.DATE_RANGE_MODE_OPTION_LIST;
  static readonly HeaderBreadcrumbs: Map<Routers, Breadcrumbs> = new Map([
    [
      Routers.QueryUsage,
      new Breadcrumbs({
        text: 'Query Usage',
        disabled: true
      })
    ],
    [
      Routers.UserUsage,
      new Breadcrumbs({
        text: 'User Usage',
        disabled: true
      })
    ]
  ]);

  get breadcrumbs(): Breadcrumbs[] {
    return [SystemMonitorHeader.HeaderBreadcrumbs.get(this.$route.name as Routers)!];
  }

  handleRefresh() {
    EventBus.$emit('refresh');
  }

  getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  get mainDateFilterMode(): MainDateMode | null {
    return new MainDateModePicker().pick(this.$route);
  }

  created() {
    this.setDateRangeIfNotExist(MainDateMode.last7Days);
  }

  private isRouterDateRangeValid(): boolean {
    if (!this.$route.query.s?.toString() || isNaN(+this.$route.query.s.toString())) {
      return false;
    }

    if (!this.$route.query.e?.toString() || isNaN(+this.$route.query.s.toString())) {
      return false;
    }
    const start = new Date(+this.$route.query.s.toString() * 1000);
    const end = new Date(+this.$route.query.e.toString() * 1000);
    return isDate(start) && isDate(end);
  }

  private setDateRangeIfNotExist(mode: MainDateMode) {
    ///Not have mode but have start and end date
    if (!this.$route.query.dateRange?.toString() && this.isRouterDateRangeValid()) {
      Log.debug('Not have mode but have start and end date');
      EventBus.$emit('set-path-param', { dateRange: MainDateMode.custom });
      return;
    }
    ///Not have date range mode in router
    if (!this.$route.query.dateRange?.toString()) {
      Log.debug('Not have date range mode in router');
      EventBus.$emit('set-path-param', { dateRange: mode });
      return;
    }
    ///Mode have but invalid enum value
    if (!this.mainDateFilterMode) {
      Log.debug('Mode have but invalid enum value');
      EventBus.$emit('set-path-param', { dateRange: mode });
      return;
    }
    ///Mode = custom but not have start and end date
    if (this.$route.query.dateRange?.toString() === MainDateMode.custom && !this.isRouterDateRangeValid()) {
      Log.debug('Mode = custom but not have start and end date');
      EventBus.$emit('set-path-param', { dateRange: mode });
      return;
    }

    Log.debug('Mode ok!');
  }

  onChangeDateRange(calendarData: CalendarData) {
    const params: Record<string, string> = {};
    params['dateRange'] = calendarData.filterMode;
    params['from'] = `0`;
    if (calendarData.filterMode === MainDateMode.custom && calendarData.chosenDateRange) {
      params['s'] = moment(calendarData.chosenDateRange.start).format('X');
      params['e'] = moment(calendarData.chosenDateRange.end).format('X');
    }
    EventBus.$emit('set-path-param', params);
  }

  oResetFilter() {
    EventBus.$emit('remove-path-param', new Set(['search', 'activity', 'resource', `from`]));
  }

  onApplyFilter(filter: { users: UserProfile[]; activity: ActivityActionType | null; resource: ResourceType | null }) {
    const { users, activity, resource } = filter;
    const params: Record<string, string | string[] | null> = {};
    params['search'] = users.filter(user => StringUtils.isNotEmpty(user.email)).map(user => user.email!);
    params['activity'] = activity;
    params['resource'] = resource;
    params['from'] = `0`;
    EventBus.$emit('set-path-param', params);
  }

  get activity(): ActivityActionType | null {
    return new ActivityActionPicker().pick(this.$route);
  }

  get resource(): ActivityResourceType | null {
    return new ActivityResourcePicker().pick(this.$route);
  }

  get users(): string[] {
    if (isArray(this.$route.query.search)) {
      return compact(this.$route.query.search);
    }

    if (isString(this.$route.query.search)) {
      return [this.$route.query.search];
    }
    return [];
  }

  get disableActivity(): boolean {
    return this.$route.name === Routers.QueryUsage;
  }

  get disableResource(): boolean {
    return this.$route.name === Routers.QueryUsage;
  }
}
</script>

<template>
  <LayoutHeader title="System Monitor" icon="di-icon-users">
    <BreadcrumbComponent :breadcrumbs="breadcrumbs"></BreadcrumbComponent>
    <div class="ml-auto d-flex align-items-center">
      <DiCalendar
        :main-date-filter-mode="mainDateFilterMode"
        :get-date-range-by-mode="getDateRangeByMode"
        :mode-options="MainDateModeOptions"
        @onCalendarSelected="onChangeDateRange"
      />
      <FilterButton
        :activity="activity"
        :resource="resource"
        :users="users"
        :is-disabled-apply-filter="false"
        :disable-activity="disableActivity"
        :disable-resource="disableResource"
        @onReset="oResetFilter"
        @onApply="onApplyFilter"
      />
      <DiIconTextButton id="refresh" class="ml-1 my-auto" title="Refresh" @click="handleRefresh">
        <i class="di-icon-reset" />
      </DiIconTextButton>
    </div>
  </LayoutHeader>
</template>

<style scoped lang="scss"></style>
