<template>
  <div class="user-management-details-privilege text-left">
    <StatusWidget v-if="isLoading" :status="status" :error="errorMessage"></StatusWidget>
    <MessageContainer :message="errorMessage"></MessageContainer>
    <div class="user-management-details-privilege-header-container">
      <div v-if="isLoaded" class="user-management-details-privilege-header ">
        <span>Privileges</span>
        <DiButton title="Save" primary @click="handleSavePrivilege">
          <div v-if="isSaveBtnLoading" class="spinner-container">
            <BSpinner small></BSpinner>
          </div>
        </DiButton>
      </div>
      <div v-if="isLoaded" class="user-privileges-title">Here are the admin privileges assigned to {{ fullName }}</div>
    </div>

    <div v-if="isLoaded" class="user-privilege overflow-hidden">
      <div v-for="(group, index) in permissionGroups" :key="index">
        <div class="group-privilege mb-3">
          <GroupListCheckbox
            :id="genMultiSelectionId('group-list-checkbox', index)"
            :selected-items="permissions"
            :group="group"
            :is-show-all-checkbox="true"
            @handleChangeListCheckbox="handleChangeListCheckbox"
          ></GroupListCheckbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import MultiSelection from '@/shared/components/MultiSelection.vue';
import GroupListCheckbox from '@/screens/UserManagement/components/UserDetail/GroupListCheckbox.vue';
import { UserDetailModule } from '@/screens/UserManagement/store/UserDetailStore';
import MessageContainer from '@/shared/components/MessageContainer.vue';
import { PopupUtils } from '@/utils/popup.utils';
import { DIException } from '@core/domain/Exception';
import { Status } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import DiButton from '@/shared/components/Common/DiButton.vue';
import { Log } from '@core/utils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({
  components: {
    DiButton,
    StatusWidget,
    MessageContainer,
    GroupListCheckbox,
    MultiSelection
  },
  computed: {}
})
export default class UserPrivilege extends Vue {
  isSaveBtnLoading = false;

  @Prop()
  status!: Status;

  @Prop()
  fullName!: string;

  @Prop()
  permissionGroups!: {};

  @Prop()
  permissions!: string[];

  @Prop()
  errorMessage!: string;

  private get isLoaded() {
    return this.status === Status.Loaded;
  }

  private get isLoading() {
    Log.debug('isLoading::', this.status);
    return this.status === Status.Loading;
  }

  /**
   * TODO: User Management
   * TODO: - Rename this method to a a better name. Eg: handleCheckBoxItemChanged
   * TODO: - Handle logic: toggle between permission 'All' and others
   * @param selectedItems
   * @private
   */
  private handleChangeListCheckbox(selectedItems: string[]) {
    UserDetailModule.updateSelectedPermissions(selectedItems);
  }

  private handleSavePrivilege() {
    //todo update store and call api to save new Privilege
    this.isSaveBtnLoading = true;
    UserDetailModule.savePermissions()
      .then(async () => {
        this.isSaveBtnLoading = false;
        const permissions = await UserDetailModule.getIncludedPermissions();
        TrackingUtils.track(TrackEvents.SubmitSaveUserPrivilege, {
          permissions: permissions.join(','),
          user_id: UserDetailModule.userFullDetailInfo?.profile?.username,
          user_email: UserDetailModule.userFullDetailInfo?.profile?.email,
          user_full_name: UserDetailModule.userFullDetailInfo?.profile?.fullName
        });
      })
      .catch(err => {
        const exError = DIException.fromObject(err);
        PopupUtils.showError(exError.message);
        this.isSaveBtnLoading = false;
        Log.debug('UserManagementProfileStore::savePermissions::error::', exError.message);
      });
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.user-management-details-privilege {
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  //padding-bottom: 16px;
  background: var(--secondary-2);

  .user-management-details-privilege-header-container {
    z-index: 5;
    border-radius: 4px;
    position: sticky;
    background: var(--secondary-2);
    top: 0;
    padding: 16px 16px 0;
    .user-management-details-privilege-header {
      order: 0;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: space-between;

      span {
        order: 0;
        @include medium-text(24px, 0.2px, 1.17);
      }

      .di-button {
        height: 26px;
        min-width: 80px;
        .spinner-container span {
          font-size: 14px;
          color: var(--accent-text-color);
        }
      }
    }
  }
}

.user-privileges-title {
  @include regular-text();
  font-size: 16px;
  padding-top: 12px;
  padding-bottom: 24px;
  text-align: left;
  color: var(--secondary-text-color);
}

.error {
  padding-top: 10px;
}

.user-privilege {
  padding: 0 16px;

  .group-privilege {
    background-color: var(--secondary);
    border-radius: 4px;
    height: 100%;
  }
  $spacing: 12px;
  .row {
    margin-left: -$spacing;
    margin-right: -$spacing;
    .col,
    [class^='col-'] {
      padding-left: $spacing;
      padding-right: $spacing;
      margin: $spacing 0;
    }
  }
}
</style>
