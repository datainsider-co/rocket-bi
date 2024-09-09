<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import ChipButton from '@/shared/components/ChipButton.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import UserItemListing from '@/shared/components/UserItemListing.vue';
import { UserProfile } from '@core/common/domain';
import { ShareModule } from '@/store/modules/ShareStore';
import { Status } from '@/shared';
import { ActivityActionType } from '@core/organization/domain/user-activity/ActivityActionType';
import { ListUtils } from '@/utils';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { ActivityResourceType } from '@core/organization';
import ClickOutside from 'vue-click-outside';
import { Log } from '@core/utils';

@Component({
  components: { UserItemListing, DiButton, DiDropdown, ChipButton },
  directives: {
    ClickOutside
  }
})
export default class FilterButton extends Vue {
  @Prop({ required: true })
  private readonly isDisabledApplyFilter!: boolean;

  @Prop({ required: false })
  private readonly activity?: ActivityActionType;

  @Prop({ required: false })
  private readonly resource?: ActivityResourceType;

  @Prop({ required: false, default: false })
  readonly disableActivity!: boolean;

  @Prop({ required: false, default: false })
  readonly disableResource!: boolean;

  @Prop({ required: false, default: () => [] })
  private readonly users!: string[];

  readonly filterPopoverId = 'activity-filter-popover';
  private popupItem: Element | null = null;
  userProfiles: UserProfile[] = [];
  activityFilterValue: ActivityActionType | null = null;
  resourceFilterValue: ActivityResourceType | null = null;
  @Ref()
  private filterButton!: DiButton;

  isShowFilterForm = false;
  username = '';
  suggestUserError = '';
  getSuggestUserStatus: Status = Status.Loaded;
  isShowUserSuggestionPopover = false;

  mounted() {
    this.init();
  }

  init() {
    this.userProfiles = this.users.map(user => new UserProfile({ username: '', email: user }));
    this.activityFilterValue = this.activity ?? null;
    this.resourceFilterValue = this.resource ?? null;
  }

  reset() {
    this.username = '';
    this.userProfiles = [];
    this.resourceFilterValue = null;
    this.activityFilterValue = null;
  }

  @Watch('activity', { immediate: true })
  onActivityChanged() {
    this.activityFilterValue = this.activity ?? null;
  }

  @Watch('resource', { immediate: true })
  onResourceChanged() {
    this.activityFilterValue = this.activity ?? null;
  }

  private toggleActivityFilter() {
    this.popupItem = this.filterButton.$el;
    if (this.isShowFilterForm) {
      this.hideFilterConfigForm();
    } else {
      this.showFilterConfigForm();
    }
  }

  showFilterConfigForm() {
    this.init();
    this.$root.$emit('bv::show::popover', this.filterPopoverId);
  }

  hideFilterConfigForm() {
    this.reset();
    this.$root.$emit('bv::hide::popover', this.filterPopoverId);
  }

  get suggestedUsers(): UserProfile[] {
    return ShareModule.suggestedUsers;
  }

  handleClickUserItem(userProfile: UserProfile) {
    this.popupItem = document.querySelector('#activity-suggest-user-popover');
    const user = this.userProfiles.find(item => item.email === userProfile.email);
    if (!user) {
      this.userProfiles.push(userProfile);
      this.username = '';
    }
  }

  get activityTypes(): DropdownData {
    return [
      { label: 'All types', value: null },
      { label: 'View', value: ActivityActionType.View },
      { label: 'Create', value: ActivityActionType.Create },
      { label: 'Update', value: ActivityActionType.Update },
      { label: 'Delete', value: ActivityActionType.Delete }
    ];
  }

  get resourceTypes(): DropdownData {
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

  private async handleResetFilter() {
    this.$emit('onReset');
    this.hideFilterConfigForm();
  }

  private async handleApplyFilter() {
    this.$emit('onApply', {
      users: this.userProfiles,
      activity: this.activityFilterValue,
      resource: this.resourceFilterValue
    });
    this.hideFilterConfigForm();
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
    ShareModule.loadSuggestedUsers({ keyword: this.username, from: 0, size: 100 })
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

  handleRemoveUser(index: number) {
    this.userProfiles = ListUtils.removeAt(this.userProfiles, index);
  }
}
</script>

<template>
  <div>
    <DiButton ref="filterButton" id="activity-filter" tabindex="-1" title="Filter" @click="toggleActivityFilter">
      <i class="di-icon-filter"></i>
    </DiButton>
    <BPopover
      :id="filterPopoverId"
      ref="filterPopover"
      :show.sync="isShowFilterForm"
      target="activity-filter"
      custom-class="filter-form-popover"
      placement="bottom"
      triggers="manual"
    >
      <div v-click-outside="hideFilterConfigForm" class="user-activity-log-filter-form">
        <div class="user-activity-log-filter-form-control">
          <div class="title">Email</div>
          <div class="input">
            <BFormInput id="filter-username" v-model="username" autocomplete="off" :debounce="300" autofocus placeholder="demo@gmail.com..."></BFormInput>

            <UserItemListing
              popoverId="activity-suggest-user-popover"
              :data="suggestedUsers"
              :error="suggestUserError"
              :is-show-popover.sync="isShowUserSuggestionPopover"
              :status="getSuggestUserStatus"
              target="filter-username"
              @handleClickUserItem="handleClickUserItem"
            />
          </div>
        </div>
        <div v-if="userProfiles.length > 0" class="user-activity-log-filter-form-control">
          <div class="title"></div>
          <div class="input">
            <div class="d-flex flex-wrap">
              <ChipButton
                v-for="(userProfile, index) in userProfiles"
                :key="userProfile.email"
                :title="userProfile.email"
                class="chip-item"
                @onRemove="handleRemoveUser(index)"
              />
            </div>
          </div>
        </div>

        <div class="user-activity-log-filter-form-control" v-if="!disableResource">
          <div class="title">Activity types</div>
          <div class="input">
            <DiDropdown v-model="activityFilterValue" :data="activityTypes" label-props="label" value-props="value"></DiDropdown>
          </div>
        </div>
        <div class="user-activity-log-filter-form-control" v-if="!disableActivity">
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

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import '~@/themes/scss/di-variables';

.filter-form-popover {
  background: none;
  max-width: unset;
  border: none;

  .arrow {
    display: none;
  }

  .user-activity-log-filter-form {
    background: var(--secondary);
    box-shadow: var(--menu-shadow);
    border-radius: 4px;
    padding: 16px;

    &-control {
      display: flex;
      align-items: center;

      .title {
        @include regular-text(0.2px, var(--secondary-text-color));
        width: 103px;
      }

      .input {
        input {
          padding: 0 8px;
        }

        width: 277px;

        .select-container {
          margin-top: 0;

          button {
            height: 34px;
          }
        }

        .di-date-picker {
          .input-calendar {
            height: 34px;
            width: 261px !important;
          }
        }

        .chip-item {
          width: fit-content;
          margin-bottom: 4px;
          margin-right: 4px;
        }
      }

      &:not(:last-child) {
        margin-bottom: 8px;
      }
    }
  }
}

#activity-suggest-user-popover {
  width: 310px;
}
</style>
