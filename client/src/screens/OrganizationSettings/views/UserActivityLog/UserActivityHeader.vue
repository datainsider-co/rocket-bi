<template>
  <div class="ml-auto d-flex align-items-center">
    <DiCalendar
      @onCalendarSelected="onChangeDateRange"
      class="date-range-dropdown mr-auto"
      id="user-activity-filter-date-range"
      :isShowResetFilterButton="false"
      :mainDateFilterMode="dateMode"
      :modeOptions="DateRangeOptions"
      :getDateRangeByMode="getDateRangeByMode"
      :defaultDateRange="dateRange"
      dateFormatPattern="MMM D, YYYY"
      canEditCalendar
    />
    <DiButton ref="filterButton" :id="genBtnId('activity-filter')" tabindex="-1" title="Filter" @click="toggleActivityFilter">
      <i class="di-icon-filter"></i>
    </DiButton>
    <BPopover
      :id="filterPopoverId"
      ref="filterPopover"
      :show.sync="isShowFilterForm"
      :target="genBtnId('activity-filter')"
      custom-class="filter-form-popover"
      placement="bottom"
      triggers="manual"
    >
      <div v-click-outside="hideFilterConfigForm" class="user-activity-log-filter-form">
        <div class="user-activity-log-filter-form-control">
          <div class="title">User</div>
          <div class="input">
            <BFormInput :id="genInputId('filter-username')" v-model="username" autocomplete="off" autofocus placeholder="User name"></BFormInput>

            <UserItemListing
              popoverId="activity-suggest-user-popover"
              :data="suggestedUsers"
              :error="suggestUserError"
              :is-show-popover.sync="isShowUserSuggestionPopover"
              :status="getSuggestUserStatus"
              :target="genInputId('filter-username')"
              @handleClickUserItem="handleClickUserItem"
            ></UserItemListing>
          </div>
        </div>
        <div v-if="userProfiles.length > 0" class="user-activity-log-filter-form-control">
          <div class="title"></div>
          <div class="input">
            <div class="d-flex flex-wrap">
              <ChipButton
                v-for="(userProfile, index) in userProfiles"
                :key="userProfile.username"
                :title="getUsername(userProfile)"
                class="chip-item"
                @onRemove="handleRemoveUser(index)"
              />
            </div>
          </div>
        </div>

        <div class="user-activity-log-filter-form-control">
          <div class="title">Activity types</div>
          <div class="input">
            <DiDropdown v-model="activityFilterValue" :data="activityTypes" label-props="label" value-props="value"></DiDropdown>
          </div>
        </div>
        <div class="user-activity-log-filter-form-control">
          <div class="title">Resource types</div>
          <div class="input">
            <DiDropdown v-model="resourceFilterValue" :data="resourceTypes" label-props="label" value-props="value"></DiDropdown>
          </div>
        </div>
        <div class="d-flex mt-3 w-100">
          <DiButton border class="flex-fill h-42px mr-3" title="Reset" variant="secondary" @click="handleResetFilter"></DiButton>
          <DiButton :disabled="isDisabledApplyFilter" class="flex-fill h-42px submit-button" title="Apply" primary @click="handleApplyFilter"></DiButton>
        </div>
      </div>
    </BPopover>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { ResourceType } from '@/utils/permission_utils';
import { DateRange, DateTimeConstants, Status } from '@/shared';
import PopoverV2 from '@/shared/components/Common/PopoverV2/PopoverV2.vue';
import { DropdownData } from '@/shared/components/Common/DiDropdown';
import DiDropdown from '@/shared/components/Common/DiDropdown/DiDropdown.vue';
import { ActivityResourceType, GetUserActivityRequest } from '@core/Organization';
import { MainDateMode, UserProfile } from '@core/domain';
import { Log } from '@core/utils';
import ClickOutside from 'vue-click-outside';
import { BPopover } from 'bootstrap-vue';
import DiButton from '@/shared/components/Common/DiButton.vue';
import { DateUtils, ListUtils } from '@/utils';
import { ActivityActionType } from '@core/Organization/Domain/UserActivity/ActivityActionType';
import { CalendarData } from '@/shared/models';
import DiCalendar from '@filter/MainDateFilterV2/DiCalendar.vue';
import ListingFooter from '@/shared/components/user-listing/ListingFooter.vue';
import { ShareModule } from '@/store/modules/share.store';
import ChipButton from '@/shared/components/ChipButton.vue';
import { cloneDeep } from 'lodash';

@Component({
  components: {
    ChipButton,
    PopoverV2,
    DiDropdown,
    DiCalendar
  },
  directives: {
    ClickOutside
  }
})
export default class UserActivityHeader extends Vue {
  private popupItem: Element | null = null;
  private readonly filterPopoverId = 'activity-filter-popover';
  private readonly DateRangeOptions = DateTimeConstants.ListDateRangeModeOptions;

  private username = '';
  private userProfiles: UserProfile[] = [];
  private activityFilterValue: ActivityActionType | null = null;
  private resourceFilterValue: ResourceType | null = null;
  private dateRange: DateRange = DateUtils.getLast7Day();
  private dateMode: MainDateMode = MainDateMode.last7Days;

  isShowUserSuggestionPopover = false;
  suggestUserError = '';
  getSuggestUserStatus: Status = Status.Loaded;

  private isShowFilterForm = false;

  @Prop({ required: true })
  private readonly isDisabledApplyFilter!: boolean;

  @Ref()
  private vuescroll?: any;

  @Ref()
  private filterButton!: DiButton;

  @Ref()
  private activitiesContainer?: HTMLDivElement;

  @Ref()
  private footer?: ListingFooter;

  private getDateRangeByMode(mode: MainDateMode): DateRange | null {
    return DateUtils.getDateRange(mode);
  }

  private get suggestedUsers(): UserProfile[] {
    return ShareModule.suggestedUsers;
  }

  private getUsername(user: UserProfile) {
    return user.getName;
  }

  private get activityTypes(): DropdownData {
    return [
      { label: 'All types', value: null },
      { label: 'View', value: ActivityActionType.View },
      { label: 'Create', value: ActivityActionType.Create },
      { label: 'Update', value: ActivityActionType.Update },
      { label: 'Delete', value: ActivityActionType.Delete }
    ];
  }

  private get resourceTypes(): DropdownData {
    return [
      { label: 'All types', value: null },
      { label: 'Dashboard', value: ActivityResourceType.Dashboard },
      { label: 'Database', value: ActivityResourceType.Database },
      { label: 'Directory', value: ActivityResourceType.Directory },
      { label: 'Widget', value: ActivityResourceType.Widget },
      { label: 'Etl', value: ActivityResourceType.Etl },
      { label: 'Source', value: ActivityResourceType.Source },
      { label: 'Table', value: ActivityResourceType.Table },
      { label: 'Job', value: ActivityResourceType.Job }
    ];
  }

  private showFilterConfigForm() {
    this.$root.$emit('bv::show::popover', this.filterPopoverId);
  }

  private hideFilterConfigForm() {
    this.$root.$emit('bv::hide::popover', this.filterPopoverId);
  }

  private createGetUserActivityRequest() {
    const startDate: number | undefined = this.dateRange?.start ? cloneDeep(this.dateRange.start as Date).setHours(0, 0, 0, 0) : undefined;
    const endDate: number | undefined = this.dateRange?.end ? cloneDeep(this.dateRange.end as Date).setHours(23, 59, 59, 999) : undefined;
    return new GetUserActivityRequest(
      this.userProfiles.map(user => user.username),
      this.activityFilterValue ? [this.activityFilterValue] : [],
      this.resourceFilterValue ? [this.resourceFilterValue] : [],
      0,
      0,
      startDate,
      endDate
    );
  }

  private toggleActivityFilter() {
    this.popupItem = this.filterButton.$el;
    if (this.isShowFilterForm) {
      this.hideFilterConfigForm();
    } else {
      this.showFilterConfigForm();
    }
  }

  private async handleApplyFilter() {
    this.hideFilterConfigForm();
    this.$emit('updateUserActivities', this.createGetUserActivityRequest());
  }

  private async handleResetFilter() {
    this.username = '';
    this.userProfiles = [];
    this.resourceFilterValue = null;
    this.activityFilterValue = null;
    this.hideFilterConfigForm();
    this.$emit('updateUserActivities', this.createGetUserActivityRequest());
  }

  private onChangeDateRange(calendarData: CalendarData) {
    this.dateRange = calendarData.chosenDateRange ?? DateUtils.getAllTime();
    this.dateMode = calendarData.filterMode;
    this.$emit('updateUserActivities', this.createGetUserActivityRequest());
  }

  @Watch('username')
  handleSearchInputChange(newValue: string) {
    if (newValue.trim() !== '') {
      this.isShowUserSuggestionPopover = true;
      this.handleGetSuggestedUsers();
    } else {
      this.isShowUserSuggestionPopover = false;
    }
  }

  private handleGetSuggestedUsers() {
    this.getSuggestUserStatus = Status.Loading;
    ShareModule.getSuggestedUsers({ keyword: this.username, from: 0, size: 100 })
      .then(() => {
        this.getSuggestUserStatus = Status.Loaded;
      })
      .catch(err => {
        this.getSuggestUserStatus = Status.Error;
        this.suggestUserError = err.message;
        Log.debug('UserActivityHeader::handleGetSuggestedUsers::err::', err);
      });
    Log.debug('UserActivityHeader::handleGetSuggestedUsers::suggestedUsers::', ShareModule.suggestedUsers);
  }

  private handleClickUserItem(userProfile: UserProfile) {
    this.popupItem = document.querySelector('#activity-suggest-user-popover');
    const user = this.userProfiles.find(item => item.username === userProfile.username);
    if (!user) {
      this.userProfiles.push(userProfile);
      this.username = '';
    }
  }

  private handleRemoveUser(index: number) {
    this.userProfiles = ListUtils.removeAt(this.userProfiles, index);
  }
}
</script>
<style lang="scss" src="./user-activity-log.scss"></style>
