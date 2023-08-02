<template>
  <LayoutContent>
    <LayoutHeader ref="userActivityHeader" title="User Activity" icon="di-icon-log">
      <UserActivityHeader :isDisabledApplyFilter="isLoading" @updateUserActivities="handleUpdateUserActivities" />
    </LayoutHeader>
    <div class="user-activity-log" :style="{ height: `calc(100% - ${headerHeight}px)` }">
      <StatusWidget class="position-relative" :status="status" :error="errorMessage" @retry="handleLoadUserActivities(getCreateUserActivityRequest)">
        <template v-if="isEmptyData">
          <EmptyDirectory class="h-100" title="User activities are empty"></EmptyDirectory>
        </template>
        <div class="h-100" v-else ref="activitiesContainer">
          <vuescroll ref="vuescroll" :ops="verticalScrollConfig" :style="{ height: `${activitiesHeight}px` }">
            <div class="user-activity-log-body">
              <div v-for="group in userActivityGroups" :key="group.groupName" class="user-activity-log-block">
                <div class="user-activity-log-block-name">
                  {{ group.groupName }}
                </div>
                <div class="user-activity-log-block-items">
                  <template v-for="(activityLog, index) in group.activityLogs">
                    <div
                      :key="activityLog.message + '-' + index"
                      class="user-activity-log-block-item"
                      :class="{ expanded: activityLog.isExpanded }"
                      @click="toggleActivityLogDetail(activityLog)"
                    >
                      <div class="user-activity-log-block-item-time">{{ formatAsHM(activityLog.timestamp) }}</div>
                      <i class="resource-icon" :class="getResourceTypeIcon(activityLog.resourceType)"></i>
                      <div class="user-activity-log-block-item-name text-truncate">{{ activityLog.message }}</div>
                      <i v-if="activityLog.isExpanded" class="dropdown-icon di-icon-arrow-down fa-rotate-180"></i>
                      <i v-else class="dropdown-icon di-icon-arrow-down"></i>
                    </div>
                    <div :key="activityLog.message + '-divider-' + index" class="user-activity-log-block-items-divider"></div>
                    <b-collapse :key="activityLog.message + '-detail-' + index" :visible="activityLog.isExpanded">
                      <div class="user-activity-log-details">
                        <div class="user-activity-log-detail">
                          <div class="user-activity-log-detail-key">User</div>
                          <div class="user-activity-log-detail-value">{{ activityLog.username }}</div>
                        </div>
                        <div class="user-activity-log-detail">
                          <div class="user-activity-log-detail-key">Path</div>
                          <div class="user-activity-log-detail-value" :title="activityLog.path">{{ activityLog.path }}</div>
                        </div>
                        <div class="user-activity-log-detail">
                          <div class="user-activity-log-detail-key">Request</div>
                          <div class="user-activity-log-detail-value"></div>
                        </div>
                        <PropertyListing v-if="toJson(activityLog.requestContent)" :properties="toJson(activityLog.requestContent)"></PropertyListing>
                        <div class="user-activity-log-detail">
                          <div class="user-activity-log-detail-key">Response</div>
                          <div class="user-activity-log-detail-value"></div>
                        </div>
                        <PropertyListing v-if="toJson(activityLog.responseContent)" :properties="toJson(activityLog.responseContent)"></PropertyListing>
                      </div>
                    </b-collapse>
                  </template>
                </div>
              </div>
            </div>
          </vuescroll>
          <ListingFooter
            v-if="isEnablePagination"
            ref="footer"
            :default-row-per-page="defaultPageSize"
            :hide-total="true"
            :total-rows="activityPageResult.total"
            class="user-activity-log-footer"
            @onPageChange="handlePageChange"
          ></ListingFooter>
        </div>
      </StatusWidget>
    </div>
  </LayoutContent>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';
import { UserActivity, UserActivityGroup } from '@core/organization/domain/user-activity/UserActivity';
import { DateRange, DefaultPaging, Status, VerticalScrollConfigs } from '@/shared';
import moment from 'moment';
import { ActivityResourceType, GetUserActivityRequest } from '@core/organization';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { DIException, PageResult } from '@core/common/domain';
import { Log } from '@core/utils';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Inject } from 'typescript-ioc';
import { ActivityService } from '@core/organization/service/ActivityService';
import { DateUtils, ListUtils } from '@/utils';
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';
import { Pagination } from '@/shared/models';
import ListingFooter from '@/shared/components/user-listing/ListingFooter.vue';
import JsonPropertyListing from '@/screens/organization-settings/views/user-activity-log/JsonPropertyListing.vue';
import UserActivityHeader from '@/screens/organization-settings/views/user-activity-log/UserActivityHeader.vue';

@Component({
  components: {
    EmptyDirectory,
    LayoutContent,
    LayoutHeader,
    StatusWidget,
    ListingFooter,
    PropertyListing: JsonPropertyListing,
    UserActivityHeader
  }
})
export default class UserActivityLog extends Vue {
  private readonly verticalScrollConfig = VerticalScrollConfigs;
  private readonly defaultPageSize = DefaultPaging.DefaultPageSize;
  private activityPageResult: PageResult<UserActivity> = new PageResult<UserActivity>([], 0);
  private dateRange: DateRange = DateUtils.getLast7Day();

  private from = 0;
  private size = this.defaultPageSize;

  private status: Status = Status.Loaded;
  private errorMessage = '';
  private activitiesHeight = 0;
  private headerHeight = 0;

  private getCreateUserActivityRequest = new GetUserActivityRequest(
    [],
    [],
    [],
    this.from,
    this.size,
    this.dateRange?.start ? DateUtils.toStartTime(this.dateRange.start as Date) : undefined,
    this.dateRange?.end ? DateUtils.toEndTime(this.dateRange.end as Date) : undefined
  );

  @Ref()
  private vuescroll?: any;

  @Ref()
  private filterButton!: DiButton;

  @Ref()
  private activitiesContainer?: HTMLDivElement;

  @Ref()
  private userActivityHeader!: LayoutHeader;

  @Ref()
  private footer?: ListingFooter;

  @Inject
  private readonly activityService!: ActivityService;

  private formatAsHM(timeStamp: number) {
    return moment(timeStamp).format('hh:mm A');
  }

  private toJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  private getResourceTypeIcon(resourceType: ActivityResourceType) {
    switch (resourceType) {
      case ActivityResourceType.Directory:
        return 'di-icon-my-data';
      case ActivityResourceType.Source:
        return 'di-icon-datasource';
      case ActivityResourceType.Etl:
        return 'di-icon-etl';
      case ActivityResourceType.Job:
        return 'di-icon-job';
      case ActivityResourceType.Table:
        return 'di-icon-table';
      case ActivityResourceType.Database:
        return 'di-icon-database';
      case ActivityResourceType.Dashboard:
        return 'di-icon-dashboard';
      case ActivityResourceType.Widget:
        return 'di-icon-widget';
      default:
        return 'di-icon-unknown';
    }
  }

  private get userActivityGroups(): UserActivityGroup[] {
    return UserActivityGroup.fromUserActivities(this.activityPageResult.data);
  }

  private get isEnablePagination(): boolean {
    return this.activityPageResult.total > this.size && this.status !== Status.Loading && this.status !== Status.Error;
  }

  private loadActivitiesHeight() {
    this.$nextTick(() => {
      const footerHeight = this.footer?.$el.clientHeight ?? 0;
      const activitiesContainerHeight = this.activitiesContainer?.clientHeight ? this.activitiesContainer.clientHeight : 0;
      Log.debug('footer::', footerHeight, activitiesContainerHeight);

      this.activitiesHeight = activitiesContainerHeight - footerHeight;
    });
  }

  private get isEmptyData() {
    return ListUtils.isEmpty(this.userActivityGroups);
  }

  private get isLoading() {
    return this.status === Status.Loading || this.status === Status.Updating;
  }

  private showLoading() {
    this.status = Status.Loading;
  }

  private showUpdating() {
    this.status = Status.Updating;
  }

  private showLoaded() {
    this.status = Status.Loaded;
  }

  private showError(ex: DIException) {
    this.status = Status.Error;
    this.errorMessage = ex.getPrettyMessage();
    Log.error(`UserActivityLog::showError::error::`, this.errorMessage);
  }

  mounted() {
    window.addEventListener('resize', this.loadActivitiesHeight);
    this.headerHeight = this.userActivityHeader.$el.clientHeight;
    this.handleLoadUserActivities();
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.loadActivitiesHeight);
  }

  private toggleActivityLogDetail(activityLog: UserActivity) {
    activityLog.isExpanded = !activityLog.isExpanded;
  }

  private async handleLoadUserActivities() {
    try {
      this.showLoading();
      this.activityPageResult = await this.activityService.getUserActivities(this.getCreateUserActivityRequest);
      this.loadActivitiesHeight();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception);
    }
  }

  private async handleUpdateUserActivities(getUserActivityRequest: GetUserActivityRequest) {
    try {
      this.showLoading();
      this.from = 0;
      this.getCreateUserActivityRequest = { ...getUserActivityRequest, from: this.from, size: this.size };
      this.activityPageResult = await this.activityService.getUserActivities(this.getCreateUserActivityRequest);
      this.loadActivitiesHeight();
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception);
    }
  }

  private async handlePageChange(pagination: Pagination) {
    try {
      this.showUpdating();
      this.from = (pagination.page - 1) * pagination.size;
      this.size = pagination.size;
      this.getCreateUserActivityRequest = { ...this.getCreateUserActivityRequest, from: this.from, size: this.size };
      this.activityPageResult = await this.activityService.getUserActivities(this.getCreateUserActivityRequest);
      this.loadActivitiesHeight();
      this.toFirstActivity();
      this.showLoaded();
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      this.showError(exception);
    }
  }

  private toFirstActivity() {
    this.vuescroll?.scrollTo(
      {
        y: '0%'
      },
      50
    );
  }
}
</script>
<style lang="scss" src="./UserActivityLog.scss"></style>
