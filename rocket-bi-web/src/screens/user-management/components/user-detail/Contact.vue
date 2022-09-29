<template>
  <div ref="divContactForm" class="user-profile-details-contact">
    <StatusWidget v-if="isLoading || isError" :status="status" :error="errorMessage" @retry="$emit('retry')"></StatusWidget>
    <div v-else-if="isLoaded">
      <div v-if="userFullDetailInfo" class="user-details-contact-header" :class="{ 'show-contact': isShowContactDetailsForm }">
        <div class="user-details-contact-header-info">
          <img class="avatar" :src="userAvatar" alt="Avatar" @error="$event.target.src = getDefaultAvt()" />
          <div class="user-information">
            <span v-b-tooltip="fullName" class="full-name">{{ fullName }}</span>
            <div class="mt-1">
              <span v-if="isActive" class="active"> Active </span>
              <span v-else class="suspended"> Suspended </span>
              <span class="mx-2"> - </span>
              <span v-b-tooltip="userFullDetailInfo.profile.email" class="email"> {{ userFullDetailInfo.profile.email }}</span>
            </div>
            <span class="created-time"> Created: {{ createdAtFormatted }} </span>
          </div>
        </div>
        <div class="user-details-contact-header-actions">
          <!--   todo handle disable if dont have enough permission-->
          <DiIconTextButton :id="genBtnId('delete-user')" title="Delete User" @click="handleDeleteUserButtonClicked">
            <i class="di-icon-delete"></i>
          </DiIconTextButton>
          <template>
            <DiIconTextButton v-if="isActive" :id="genBtnId('suspend-user')" title="Suspend User" @click="handleSuspendUser">
              <i class="di-icon-suspend-user"></i>
            </DiIconTextButton>
            <DiIconTextButton v-else :id="genBtnId('active-user')" title="Unsuspend User" @click="handleActiveUser">
              <i class="di-icon-suspend-user"></i>
            </DiIconTextButton>
          </template>
          <template>
            <DiIconTextButton v-if="isShowContactDetailsForm" :id="genBtnId('view-profile')" title="Hide Profile" @click="toggleContactDetailsFrom">
              <i class="di-icon-user-info"></i>
            </DiIconTextButton>
            <DiIconTextButton v-else :id="genBtnId('view-profile')" title="View Profile" @click="toggleContactDetailsFrom">
              <i class="di-icon-user-info"></i>
            </DiIconTextButton>
          </template>
        </div>
      </div>
      <CollapseTransition>
        <div v-show="isShowContactDetailsForm" class="contact-info">
          <div class="user-details-contact-details">
            <div class="contact-header">
              <span>
                VIEW PROFILE
              </span>
              <DiIconTextButton :id="genBtnId('add-new-field')" title="Add Attribute" @click="handleAddNewField">
                <i class="di-icon-add"></i>
              </DiIconTextButton>
            </div>
            <div class="contact-body">
              <ContactDetailsForm v-if="userFullDetailInfo" :maxSpanWidth="maxSpanWidth" />
            </div>
          </div>
        </div>
      </CollapseTransition>
    </div>

    <AddNewFieldModal ref="addNewFieldModal"></AddNewFieldModal>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { CollapseTransition, FadeTransition } from 'vue2-transitions';
import DiButton from '@/shared/components/common/DiButton.vue';
import AddNewFieldModal from '@/screens/user-management/components/user-detail/AddNewFieldModal.vue';
import moment from 'moment';
import { UserFullDetailInfo, UserProfile } from '@core/common/domain/model';
import ContactDetailsForm from '@/screens/user-management/components/user-detail/ContactDetailsForm.vue';
import { PopupUtils } from '@/utils/PopupUtils';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Status } from '@/shared';
import { Log } from '@core/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { UserDetailModule } from '@/screens/user-management/store/UserDetailStore';
import { UserDetailPanelType } from '@/screens/user-management/store/Enum';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import Contact from '@/screens/tracking-profile/components/tracking-profile-detail/Contact.vue';

@Component({
  components: {
    StatusWidget,
    AddNewFieldModal,
    DiButton,
    CollapseTransition,
    FadeTransition,
    ContactDetailsForm
  }
})
export default class UserContact extends Vue {
  private isShowContactDetailsForm: boolean;
  private maxSpanWidth: number;

  @Prop({ required: true })
  private readonly status!: Status;

  @Prop({ required: false })
  private readonly userFullDetailInfo?: UserFullDetailInfo;

  @Ref()
  private readonly divContactForm!: any;

  @Ref()
  private readonly addNewFieldModal!: AddNewFieldModal;

  @Prop()
  private readonly errorMessage!: string;

  constructor() {
    super();
    this.isShowContactDetailsForm = false;
    this.maxSpanWidth = 200;
  }

  private get fullName(): string {
    return this.userFullDetailInfo?.profile?.getName ?? 'Unknown';
  }

  private getDefaultAvt(): string {
    return HtmlElementRenderUtils.renderAvatarAsDataUrl(this.fullName) || '';
  }

  private get userAvatar(): string {
    return this.userFullDetailInfo?.profile?.avatar || this.getDefaultAvt();
  }

  private get isLoaded() {
    return this.status === Status.Loaded;
  }

  private get isError() {
    return this.status === Status.Error;
  }

  private get isLoading() {
    Log.debug('isLoading::', this.status);
    return this.status === Status.Loading;
  }

  private get isActive(): boolean {
    // TODO: get active
    return this.userFullDetailInfo?.user?.isActive ?? false;
  }

  private get timeActiveAgo(): string {
    // TODO: get time active as Ago
    return 'A minute ago';
  }

  private get createdAtFormatted(): string {
    // TODO: get time created
    const format = 'MMM, DD YYYY HH:mm:ss';
    return moment(this.userFullDetailInfo?.profile?.createdTime).format(format);
  }

  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
      this.onResize();
    });
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  toggleContactDetailsFrom() {
    this.isShowContactDetailsForm = !this.isShowContactDetailsForm;
  }

  private onResize() {
    const { width } = this.divContactForm.getBoundingClientRect();
    this.maxSpanWidth = width - 100;
  }

  @Track(TrackEvents.AddExtraUserInfo, {
    user_id: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.username,
    user_email: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.email,
    user_full_name: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.fullName
  })
  private handleAddNewField() {
    Log.debug('Contact::handleAddNewField::click');
    this.addNewFieldModal.show();
  }

  @Track(TrackEvents.SuspendUser, {
    user_id: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.username,
    user_email: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.email,
    user_full_name: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.fullName
  })
  private async handleSuspendUser() {
    //Todo SuspendUser
    await UserDetailModule.deactivateUser().catch(err => {
      PopupUtils.showError(err.message);
      Log.debug('UserManagementProfileStore::activeUser::err::', err.message);
    });
  }

  @Track(TrackEvents.ActiveUser, {
    user_id: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.username,
    user_email: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.email,
    user_full_name: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.fullName
  })
  private async handleActiveUser() {
    await UserDetailModule.activateUser().catch(err => {
      PopupUtils.showError(err.message);
      Log.debug('Contact::activeUser::err::', err.message);
    });
  }

  @Track(TrackEvents.DeleteUser, {
    user_id: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.username,
    user_email: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.email,
    user_full_name: (_: UserContact, args: any) => _.userFullDetailInfo?.profile?.fullName
  })
  private async handleDeleteUserButtonClicked() {
    const panelType = UserDetailModule.currentDetailPanelType;
    if (panelType !== UserDetailPanelType.UserDeletion) await UserDetailModule.switchDetailPanelType(UserDetailPanelType.UserDeletion);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';

.user-profile-details-contact {
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .user-details-contact-header {
    background-color: var(--secondary-2);
    border-radius: 4px;
    order: 0;
    padding: 16px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    @media screen and (max-width: 400px) {
      flex-direction: column;
      &-actions {
        margin-left: auto;
      }
    }

    &.show-contact {
      border-radius: 4px 4px 0 0;
    }

    &-info {
      display: flex;
      align-items: center;
    }

    &-actions {
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;

      > div + div {
        margin-left: 8px;
      }
    }

    img.avatar {
      height: 80px;
      width: 80px;
      border-radius: 50%;
      box-sizing: content-box;
      object-fit: cover;
    }

    .user-information {
      margin-left: 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: left;

      span {
        margin-left: 0;
        padding: 0;
        text-overflow: ellipsis;
        @include regular-text();
        font-size: 16px;

        &.full-name {
          @include medium-text(24px, 0.2px, 1.17);
        }

        &.active {
          color: var(--success);
        }

        &.suspended {
          color: var(--danger);
        }

        &.email {
          color: var(--secondary-text-color);
        }
        &.created-time {
          color: var(--secondary-text-color);
          opacity: 0.5;
        }
      }
    }
  }

  .contact-info {
    background-color: var(--secondary-2);
    padding: 16px;
    border-bottom-right-radius: 4px;
    border-bottom-left-radius: 4px;

    .user-details-contact-details {
      background: var(--secondary);
      display: flex;
      flex-direction: column;
      border-radius: 4px;
      padding: 16px;

      .contact-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        > span {
          @include medium-text();
        }
      }

      .contact-body {
        .profile-details-form {
          max-width: 40%;
        }
      }
    }
  }

  .delete-form {
    background-color: var(--secondary-2);
    padding: 16px;
    border-bottom-right-radius: 4px;
    border-bottom-left-radius: 4px;
  }
}
</style>
