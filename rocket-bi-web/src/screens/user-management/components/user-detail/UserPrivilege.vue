<template>
  <div class="user-management-details-privilege text-left">
    <StatusWidget v-if="isLoading" :status="status" :error="errorMessage"></StatusWidget>
    <MessageContainer :message="errorMessage"></MessageContainer>
    <div v-if="isLoaded" class="user-management-details-privilege-header">
      <div class="user-management-details-privilege-header-container">
        <div class="user-management-details-privilege-header-container-header ">
          <span>Privileges</span>
          <DiButton title="Save" primary @click="handleSavePrivilege">
            <div v-if="isSaveBtnLoading" class="spinner-container">
              <BSpinner small></BSpinner>
            </div>
          </DiButton>
        </div>
        <div v-if="isLoaded" class="user-privileges-title">Here are the admin privileges assigned to {{ fullName }}</div>
      </div>
    </div>

    <div v-if="isLoaded" class="user-privilege overflow-hidden">
      <div v-for="(group, index) in permissionGroups" :key="index">
        <div class="group-privilege mb-3">
          <GroupListCheckbox
            :id="genMultiSelectionId('group-list-checkbox', index)"
            :selected-items="selectedPermissions"
            :group="group"
            :is-show-all-checkbox="true"
            @change="handleChangeListCheckbox"
          ></GroupListCheckbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import MultiSelection from '@/shared/components/MultiSelection.vue';
import GroupListCheckbox from '@/screens/user-management/components/user-detail/GroupListCheckbox.vue';
import { UserDetailModule } from '@/screens/user-management/store/UserDetailStore';
import MessageContainer from '@/shared/components/MessageContainer.vue';
import { PopupUtils } from '@/utils/PopupUtils';
import { DIException } from '@core/common/domain/exception';
import { Status } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Log } from '@core/utils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { PermissionGroup } from '@core/admin/domain/permissions/PermissionGroup';

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
  private isSaveBtnLoading = false;

  @Prop({ type: String, required: true })
  private readonly status!: Status;

  @Prop({ type: String, default: '' })
  private readonly fullName!: string;

  @Prop({ type: Array, required: true })
  private readonly permissionGroups!: PermissionGroup[];

  @Prop({ type: Array, required: true })
  private readonly selectedPermissions!: string[];

  @Prop({ type: String, default: '' })
  private readonly errorMessage!: string;

  //todo rename and move to new file
  // transformData(permissionGroups: PermissionGroup[]): GroupCheckboxOption[] {
  //   const result = permissionGroups.map(group => {
  //     return {
  //       ...group,
  //       permissions: this.toCheckboxGroupOption(group.permissions)
  //     };
  //   });
  //   return result;
  // }
  //
  // toCheckboxGroupOption(permissions: PermissionInfo[]): CheckboxGroupOption[] {
  //   return permissions.map(per => {
  //     return {
  //       text: per.name,
  //       value: per.permission
  //     };
  //   });
  // }

  private get isLoaded() {
    return this.status === Status.Loaded;
  }

  private get isLoading() {
    Log.debug('isLoading::', this.status);
    return this.status === Status.Loading;
  }

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

  .user-management-details-privilege-header {
    position: sticky;
    top: 0px;
    background: #fff;
    z-index: 6;

    .user-management-details-privilege-header-container {
      z-index: 5;
      border-radius: 4px;

      background: var(--secondary-2);
      margin-top: 16px;
      padding: 16px 16px 0;
      &-header {
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
