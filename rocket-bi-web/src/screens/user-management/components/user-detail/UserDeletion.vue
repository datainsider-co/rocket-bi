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
        <b-form-radio class="radio unselectable" type="radio" id="one" :value="0" v-model="selectedOption">
          <div class="cursor-pointer">Transfer ownership of {{ fullName }}’s data to another user (for example, a manager)</div>
        </b-form-radio>
        <div :class="{ disabled: isTransferDataDisabled }" class="deletion-content">
          <b-input
            :id="genInputId('transfer-email')"
            class="transferred-account col-md-6 col-lg-5 col-11"
            v-model="newOwnerEmail"
            placeholder="New owner’s email"
          />
          <div class="text">Select data to transfer:</div>
          <b-form-checkbox-group v-model="selectedOptionDetail" class="group-checkbox">
            <b-form-checkbox :id="genCheckboxId('transfer-data')" value="directory_dashboard_data" class="checkbox checkbox-parent" type="checkbox">
              <div class="opa-0-8">Directory & Dashboard Data</div>
            </b-form-checkbox>
          </b-form-checkbox-group>
        </div>
      </div>
      <div class="group-deletion">
        <b-form-radio :id="genCheckboxId('not-transfer-data')" class="radio unselectable" type="radio" :value="1" v-model="selectedOption">
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
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import GroupListCheckbox from '@/screens/user-management/components/user-detail/GroupListCheckbox.vue';
import { UserDetailModule } from '@/screens/user-management/store/UserDetailStore';
import { TransferUserDataConfig } from '@core/admin/domain/request/TransferUserDataConfig';
import { UserDetailPanelType } from '@/screens/user-management/store/Enum';
import { PopupUtils } from '@/utils/PopupUtils';
import { Log } from '@core/utils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: {
    GroupListCheckbox
  }
})
export default class UserDeletion extends Vue {
  private newOwnerEmail = '';
  private selectedOption = 0;
  private selectedOptionDetail: string[] = ['directory_dashboard_data'];
  private isDeleteBtnLoading = false;

  @Prop()
  fullName!: string;

  get isTransferDataDisabled() {
    return this.selectedOption == 1;
  }

  @Watch('selectedOptionDetail')
  handleSelectSubOption(newSelectedOptionDetail: string[]) {
    Log.debug('UserDeletion::handleSelectSubOption::newSelectedOptionDetail', newSelectedOptionDetail);
    this.selectedOptionDetail = newSelectedOptionDetail;
  }

  private handleDeleteUser() {
    Log.debug('Privileges::handleSavePrivilege::selectedCheckboxItem', this.selectedOption);
    const transferUserDataConfig = this.buildTransferUserDataConfig();
    this.isDeleteBtnLoading = true;
    UserDetailModule.deleteCurrentUser(transferUserDataConfig)
      .then(deleteStatus => {
        if (deleteStatus) {
          PopupUtils.showSuccess(`User ${this.fullName} is deleted successfully`);
          this.isDeleteBtnLoading = false;
          UserDetailModule.reset();
          this.back();

          TrackingUtils.track(TrackEvents.SubmitDeleteUser, {
            user_id: UserDetailModule.userFullDetailInfo?.profile?.username,
            user_email: UserDetailModule.userFullDetailInfo?.profile?.email,
            user_full_name: UserDetailModule.userFullDetailInfo?.profile?.fullName
          });
        }
      })
      .catch(ex => {
        PopupUtils.showError(ex.message);
        this.isDeleteBtnLoading = false;
        return Promise.resolve(false);
      });
  }

  private buildTransferUserDataConfig(): TransferUserDataConfig | undefined {
    if (this.selectedOption == 0) {
      return new TransferUserDataConfig(this.newOwnerEmail, this.selectedOptionDetail.includes('directory_dashboard_data'));
    } else {
      return undefined;
    }
  }

  private back() {
    this.$router.back();
  }

  private async handleCancel() {
    await UserDetailModule.switchDetailPanelType(UserDetailPanelType.UserPrivilege); // back to privilege
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

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
