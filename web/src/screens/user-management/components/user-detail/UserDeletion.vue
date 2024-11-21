<template>
  <div class="user-management-details-deletion text-left">
    <div class="user-management-details-deletion-header ">
      <span>DELETE USER</span>
      <div class="ml-auto d-flex">
        <DiButton title="Cancel" @click="handleCancel"></DiButton>
        <DiButton title="Delete" primary @click="handleDeleteUser">
          <div v-if="isDeleteBtnLoading" class="spinner-container">
            <BSpinner small></BSpinner>
          </div>
        </DiButton>
      </div>
    </div>
    <div class="user-privileges-title">Before deleting this user, you may want to transfer their data to another owner, just in case.</div>
    <div class="user-deletion overflow-hidden">
      <div class="group-deletion">
        <b-form-radio class="radio unselectable" type="radio" id="one" :value="TransferOption.TransferToEmail" v-model="selectedOption">
          <div class="cursor-pointer">Transfer ownership of {{ fullName }}’s data to another user (for example, a manager)</div>
        </b-form-radio>
        <div :class="{ disabled: isTransferDataDisabled }" class="deletion-content pb-4">
          <SearchUserInput class="col-md-6 col-lg-5 col-11 p-0" placeholder="New owner's email" @select="handleClickUserItem" ref="searchUserInput" />
        </div>
      </div>
      <div class="group-deletion">
        <b-form-radio
          :id="genCheckboxId('not-transfer-data')"
          class="radio unselectable"
          type="radio"
          :value="TransferOption.NotTransfer"
          v-model="selectedOption"
        >
          <div class="cursor-pointer">Dont’t transfer data</div>
        </b-form-radio>
        <div class="deletion-content opacity-0dot5 pb-4">
          Brand Accounts and their data will be transferred to a new owner.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { UserDetailModule } from '@/screens/user-management/store/UserDetailStore';
import { UserDetailPanelType } from '@/screens/user-management/store/Enum';
import { Log } from '@core/utils';
import { Status } from '@/shared';
import { ShareModule } from '@/store/modules/ShareStore';
import { UserProfile } from '@core/common/domain';
import UserItemListing from '@/shared/components/UserItemListing.vue';
import { Modals, PopupUtils } from '@/utils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import SearchUserInput from '@/shared/components/common/di-share-modal/components/share-user/SearchUserInput.vue';

enum TransferOption {
  TransferToEmail = 0,
  NotTransfer = 1
}

@Component({
  components: {
    UserItemListing,
    SearchUserInput
  }
})
export default class UserDeletion extends Vue {
  private readonly TransferOption = TransferOption;
  private selectedOption = TransferOption.TransferToEmail;
  private isDeleteBtnLoading = false;

  @Ref()
  private searchUserInput!: SearchUserInput;

  @Prop()
  fullName!: string;

  get isTransferDataDisabled() {
    return this.selectedOption == TransferOption.NotTransfer;
  }

  private handleDeleteUser(): void {
    Modals.showConfirmationModal('Are you sure you want to delete this user?', {
      onOk: async () => {
        try {
          Log.debug('Privileges::handleSavePrivilege::selectedCheckboxItem', this.selectedOption);
          const transferToEmail: string | undefined = this.getTransferEmail();
          this.isDeleteBtnLoading = true;
          const result: boolean = await UserDetailModule.deleteCurrentUser(transferToEmail);
          // PopupUtils.showSuccess(`User ${this.fullName} is deleted successfully`);
          TrackingUtils.track(TrackEvents.SubmitDeleteUser, {
            user_id: UserDetailModule.userFullDetailInfo?.profile?.username,
            user_email: UserDetailModule.userFullDetailInfo?.profile?.email,
            user_full_name: UserDetailModule.userFullDetailInfo?.profile?.fullName,
            result: result ? 'success' : 'failed',
            transfer_to_email: transferToEmail
          });
          UserDetailModule.reset();
          this.back();
        } catch (ex) {
          Log.error('UserDeletion::handleDeleteUser::ex', ex);
          PopupUtils.showError(ex.message);
        } finally {
          this.isDeleteBtnLoading = false;
        }
      }
    });
  }

  private getTransferEmail(): string | undefined {
    if (this.selectedOption == TransferOption.TransferToEmail) {
      return this.searchUserInput.inputValue || void 0;
    } else {
      return void 0;
    }
  }

  private back() {
    this.$router.back();
  }

  private async handleCancel() {
    await UserDetailModule.switchDetailPanelType(UserDetailPanelType.UserPrivilege); // back to privilege
  }

  private handleClickUserItem(userProfile: UserProfile) {
    userProfile?.email ? this.searchUserInput.setInputValue(userProfile.email) : PopupUtils.showError(`${userProfile.getName}'s email does not exist.`);
    this.$nextTick(() => {
      this.searchUserInput.unFocus();
    });
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.opa-0-5 {
  opacity: 0.5;
}

.opa-0-8 {
  opacity: 0.8;
}

.user-management-details-deletion {
  background: var(--secondary-2);
  border-radius: 4px;
  padding: 16px;

  display: flex;
  flex-direction: column;

  .user-management-details-deletion-header {
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

    .di-button + .di-button {
      margin-left: 8px;
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

  .user-deletion {
    @include regular-text();
    font-size: 16px;

    .group-deletion {
      background-color: var(--secondary);
      border-radius: 4px;
      padding-left: 16px;

      & + .group-deletion {
        margin-top: 16px;
      }

      .radio {
        padding-top: 24px;
        padding-bottom: 24px;

        ::v-deep {
          background: none;

          .custom-control-label::after {
            //background-image: url('~@/assets/icon/ic-16-radio.svg');
            cursor: pointer;
            background: var(--primary);
            border: 1px var(--gray) solid;
            border-radius: 50%;
          }

          .custom-control-input:checked ~ .custom-control-label::after {
            background-image: url('~@/assets/icon/ic-16-radio-active.svg');
            background-size: cover;
            background-color: var(--primary);
            border: 0;
          }

          .custom-control-label {
            font-weight: bold;
            padding-left: 4px;
            letter-spacing: 0.27px;
          }
        }
      }

      .deletion-content {
        padding-left: 28px;

        .transferred-account {
          height: 40px;
          @include regular-text(0.18px, var(--secondary-text-color));
          background-color: var(--primary);

          &::placeholder {
            @include regular-text(0.18px, var(--secondary-text-color));
          }

          cursor: text;
        }

        .text {
          padding-top: 16px;
          padding-bottom: 8px;
        }

        .group-checkbox {
          display: flex;
          flex-direction: column;

          .checkbox {
            padding-top: 8px;
            padding-bottom: 8px;

            ::v-deep {
              .custom-control {
                margin: 16px 0px;
              }

              input[type='checkbox'],
              input[type='checkbox'] + label {
                cursor: pointer;
              }

              .custom-control:last-child {
                margin-bottom: 20px;
              }

              .custom-control-label::before {
                background-color: var(--primary) !important;
                border: 1px solid var(--neutral) !important;
                border-radius: 2px;
                box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
              }

              .custom-control-input:checked ~ .custom-control-label::after {
                border: 1px solid var(--accent) !important;
                border-radius: 2px;
                background-image: url('~@/assets/icon/ic-16-check.svg');
                background-size: cover;
              }

              .custom-control-input:checked ~ .custom-control-label::before {
                border: none !important;
              }

              .custom-control-label {
                letter-spacing: 0.27px !important;
              }
            }

            &:last-child {
              padding-bottom: 24px;
            }
          }

          .checkbox-sub {
            padding-left: 48px;
            padding-bottom: 16px;
          }
        }

        &.disabled {
          pointer-events: none;
          opacity: 0.5;
        }
      }
    }
  }
}
</style>
